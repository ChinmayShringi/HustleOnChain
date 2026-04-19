"""AgentWork grader service FastAPI entrypoint."""

from __future__ import annotations

from typing import Optional, Union

import httpx
from eth_utils import keccak
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, field_validator

from . import tasks_store
from .chain import read_task_hash, submit_verdict_tx
from .config import get_settings
from .deliverables import router as deliverables_router
from .evaluator_signer import sign_verdict
from .pytest_gen import generate_pytest
from .sandbox import run_sandbox
from .status import router as status_router
from .x402_hint import build_x402_router


def get_anthropic():
    s = get_settings()
    if s.LLM_PROVIDER.lower() == "openai":
        from .llm_openai import OpenAICompatClient
        base = s.OPENAI_BASE_URL or "http://127.0.0.1:1234/v1"
        return OpenAICompatClient(base_url=base, api_key=s.OPENAI_API_KEY or "lm-studio")
    from anthropic import Anthropic
    if not s.ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY not configured")
    return Anthropic(api_key=s.ANTHROPIC_API_KEY)


def get_web3():
    from web3 import Web3
    s = get_settings()
    if not s.BSC_RPC_URL:
        raise RuntimeError("BSC_RPC_URL not configured")
    w3 = Web3(Web3.HTTPProvider(s.BSC_RPC_URL))
    # BSC is PoA; extraData is >32 bytes and web3.py >=6 needs the
    # ExtraDataToPOAMiddleware (a.k.a. geth_poa_middleware) injected so it can
    # decode blocks when fetching receipts. Fall back silently on web3 versions
    # that don't expose the middleware (tests use mocks).
    try:
        try:
            from web3.middleware import ExtraDataToPOAMiddleware as _poa
        except ImportError:
            from web3.middleware import geth_poa_middleware as _poa
        w3.middleware_onion.inject(_poa, layer=0)
    except Exception:
        pass
    return w3


app = FastAPI(title="AgentWork Grader", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency injection shims; tests override these.
app.state.get_anthropic = get_anthropic
app.state.get_web3 = get_web3

app.include_router(deliverables_router)
app.include_router(status_router)
app.include_router(build_x402_router(lambda: app.state.get_web3()))


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True}


class GenerateRequest(BaseModel):
    function_signature: str
    acceptance_criteria: str


class SubmitRequest(BaseModel):
    # job_id accepts int, decimal string, or hex string ("0x..."). This
    # aligns with BLUEPRINT.md which shows uint256 on-chain IDs: callers may
    # send them as JSON numbers, decimal strings, or 0x-prefixed hex.
    job_id: Union[int, str]
    deliverable_uri: str
    agent_address: Optional[str] = None
    task_hash: Optional[str] = None

    @field_validator("job_id", mode="before")
    @classmethod
    def _coerce_job_id(cls, v):
        if isinstance(v, bool):
            raise ValueError("job_id must be int or string, not bool")
        if isinstance(v, int):
            if v < 0:
                raise ValueError("job_id must be non-negative")
            return v
        if isinstance(v, str):
            s = v.strip()
            if not s:
                raise ValueError("job_id must not be empty")
            try:
                n = int(s, 16) if s.lower().startswith("0x") else int(s, 10)
            except ValueError as e:
                raise ValueError(f"job_id not a valid int/hex: {v!r}") from e
            if n < 0:
                raise ValueError("job_id must be non-negative")
            return n
        raise ValueError("job_id must be int or string")


def _task_hash_for(signature: str, criteria: str) -> str:
    payload = f"{signature}||{criteria}".encode("utf-8")
    return "0x" + keccak(payload).hex()


@app.post("/api/v1/grader/generate")
def generate(req: GenerateRequest) -> dict:
    s = get_settings()
    client = app.state.get_anthropic()
    model = s.OPENAI_MODEL if s.LLM_PROVIDER.lower() == "openai" else s.ANTHROPIC_MODEL
    file_bytes, test_names = generate_pytest(
        req.function_signature, req.acceptance_criteria, client, model=model,
    )
    pytest_hash = "0x" + keccak(file_bytes).hex()
    task_hash = _task_hash_for(req.function_signature, req.acceptance_criteria)
    tasks_store.put_pytest(pytest_hash, file_bytes)
    tasks_store.put(task_hash, {
        "function_signature": req.function_signature,
        "acceptance_criteria": req.acceptance_criteria,
        "pytest_hash": pytest_hash,
    })
    base = s.GRADER_PUBLIC_BASE_URL.rstrip("/")
    from eth_account import Account
    evaluator_address = ""
    if s.EVALUATOR_PRIVATE_KEY:
        evaluator_address = Account.from_key(s.EVALUATOR_PRIVATE_KEY).address
    return {
        "pytest_hash": pytest_hash,
        "pytest_uri": f"{base}/tests/{pytest_hash}",
        "task_hash": task_hash,
        "evaluator_address": evaluator_address,
        "preview_tests": test_names,
    }


@app.post("/api/v1/grader/submit")
def submit(req: SubmitRequest) -> dict:
    s = get_settings()
    try:
        with httpx.Client(timeout=30.0) as c:
            resp = c.get(req.deliverable_uri)
            resp.raise_for_status()
            solution_bytes = resp.content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"failed to fetch deliverable: {e}")

    task_hash = req.task_hash
    if not task_hash:
        try:
            w3 = app.state.get_web3()
            th = read_task_hash(w3, s.ERC8183_ADDRESS, req.job_id)
            task_hash = th if th.startswith("0x") else "0x" + th
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"task_hash lookup failed: {e}")

    task = tasks_store.get(task_hash)
    if not task:
        raise HTTPException(status_code=404, detail="task not found for hash")
    pytest_bytes = tasks_store.get_pytest(task["pytest_hash"])
    if not pytest_bytes:
        raise HTTPException(status_code=404, detail="pytest file missing")

    result = run_sandbox(solution_bytes, pytest_bytes)
    passed = bool(result["passed"])

    tx_hash = ""
    if s.EVALUATOR_PRIVATE_KEY and s.GRADER_EVALUATOR_ADDRESS:
        try:
            sig = sign_verdict(req.job_id, passed, s.GRADER_EVALUATOR_ADDRESS, s.EVALUATOR_PRIVATE_KEY)
            relayer_key = s.DEPLOYER_PRIVATE_KEY or s.EVALUATOR_PRIVATE_KEY
            w3 = app.state.get_web3()
            tx_hash = submit_verdict_tx(
                w3, s.GRADER_EVALUATOR_ADDRESS, req.job_id, passed, sig, relayer_key,
            )
        except Exception as e:
            return {
                "verdict": "pass" if passed else "fail",
                "tx_hash": "",
                "test_output": result.get("stdout", ""),
                "failed_tests": result.get("failed_tests", []),
                "chain_error": str(e),
            }

    return {
        "verdict": "pass" if passed else "fail",
        "tx_hash": tx_hash,
        "test_output": result.get("stdout", ""),
        "failed_tests": result.get("failed_tests", []),
    }


@app.get("/api/v1/tasks/{task_hash}")
def get_task(task_hash: str) -> dict:
    task = tasks_store.get(task_hash)
    if not task:
        raise HTTPException(status_code=404, detail="not found")
    return {
        "function_signature": task["function_signature"],
        "acceptance_criteria": task["acceptance_criteria"],
    }


@app.get("/tests/{pytest_hash}")
def get_tests(pytest_hash: str) -> Response:
    data = tasks_store.get_pytest(pytest_hash)
    if not data:
        raise HTTPException(status_code=404, detail="not found")
    return Response(content=data, media_type="text/x-python")
