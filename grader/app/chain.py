"""On-chain relayer for GraderEvaluator.submitVerdict."""

from __future__ import annotations

import time
from typing import Optional

from eth_account import Account

GRADER_EVALUATOR_ABI = [
    {
        "type": "function",
        "name": "submitVerdict",
        "inputs": [
            {"name": "jobId", "type": "uint256"},
            {"name": "passed", "type": "bool"},
            {"name": "sig", "type": "bytes"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    }
]

JOB_FACTORY_ABI = [
    {
        "type": "function",
        "name": "jobs",
        "inputs": [{"name": "jobId", "type": "uint256"}],
        "outputs": [
            {"name": "client", "type": "address"},
            {"name": "provider", "type": "address"},
            {"name": "evaluator", "type": "address"},
            {"name": "expiresAt", "type": "uint256"},
            {"name": "taskHash", "type": "bytes32"},
            {"name": "token", "type": "address"},
            {"name": "budget", "type": "uint256"},
            {"name": "state", "type": "uint8"},
        ],
        "stateMutability": "view",
    }
]


def submit_verdict_tx(
    w3,
    contract_address: str,
    job_id: int,
    passed: bool,
    sig: bytes,
    signer_private_key: str,
    max_attempts: int = 3,
) -> str:
    acct = Account.from_key(signer_private_key)
    contract = w3.eth.contract(address=contract_address, abi=GRADER_EVALUATOR_ABI)
    fn = contract.functions.submitVerdict(int(job_id), bool(passed), sig)

    last_err: Optional[Exception] = None
    for attempt in range(max_attempts):
        try:
            nonce = w3.eth.get_transaction_count(acct.address)
            tx = fn.build_transaction({
                "from": acct.address,
                "nonce": nonce,
                "chainId": w3.eth.chain_id,
            })
            # Gas estimation can fail transiently; retry with backoff.
            try:
                tx["gas"] = w3.eth.estimate_gas(tx)
            except Exception as e:
                last_err = e
                time.sleep(2 ** attempt)
                continue
            signed = acct.sign_transaction(tx)
            raw = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction")
            tx_hash = w3.eth.send_raw_transaction(raw)
            w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            return tx_hash.hex()
        except Exception as e:
            last_err = e
            time.sleep(2 ** attempt)
    raise RuntimeError(f"submit_verdict_tx failed after {max_attempts}: {last_err}")


def read_task_hash(w3, job_factory_address: str, job_id: int) -> str:
    contract = w3.eth.contract(address=job_factory_address, abi=JOB_FACTORY_ABI)
    result = contract.functions.jobs(int(job_id)).call()
    task_hash = result[4]
    return task_hash.hex() if isinstance(task_hash, (bytes, bytearray)) else str(task_hash)
