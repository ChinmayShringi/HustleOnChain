# Phase 2 Audit — Grader Service

Auditor: Phase 2 Auditor agent
Date: 2026-04-18
Scope: `grader/app/**`, `contracts/src/GraderEvaluator.sol`, BLUEPRINT §Shared interfaces, CLAUDE_BACKEND §Phase 2.

## Summary

Phase 2 is in strong shape. All 45 tests pass (17 existing + 28 newly added under `grader/tests/audit/`). Sandbox security primitives (`--network=none`, `--read-only`, `--tmpfs`, bind-mount `:ro`, 30s timeout, no `--privileged`, no `--cap-add`) are correctly wired. Crypto integrity between `evaluator_signer.sign_verdict` and `GraderEvaluator.submitVerdict` is verified byte-for-byte against the Solidity digest for three vectors. x402 flow correctly enforces 402-first, amount/recipient/token checks, and single-use replay guard. No hardcoded secrets outside widely-published Hardhat test keys used in fixtures.

Two blueprint-contract divergences were identified (non-blocking), both in `/api/v1/grader/submit`, and one documented sandbox limitation when the prebuilt image is absent.

Recommendation: Scribe may commit. The two API divergences should be tracked for Phase 3/4 fix-up but do not block demo.

## Checklist Results

| # | Area | Result |
|---|------|--------|
| 1 | API contract parity | PASS with notes — see Findings F1, F2 |
| 2 | Existing pytest suite | PASS — 17/17 green |
| 3 | Sandbox security audit | PASS — flags present, malicious-input tests green against live docker |
| 4 | Crypto integrity (signer ↔ contract) | PASS — digest + recovery verified against 3 vectors |
| 5 | pytest validator edge cases | PASS — adversarial cases covered |
| 6 | Deliverable URI traversal | PASS — FastAPI path routing + file-per-uuid pattern blocks `..` and `/` |
| 7 | x402 flow audit | PASS — amount, recipient, token, replay, malformed header all 402 |
| 8 | Secrets hygiene | PASS — only published Hardhat key `0x4c08...2318` in tests; no live keys |
| 9 | CORS | PASS — `http://localhost:3000` echoed, other origins not echoed, no `*` |

Full tally after adding audit tests: **45 passed, 0 failed, 0 errors** in 8.17s.

## Added Tests

Under `grader/tests/audit/`:

- `test_api_contract.py` — response field parity, request validation, CORS, deliverable traversal.
- `test_sandbox_malicious.py` — host write escape, infinite loop timeout, network isolation (prebuilt image), read-only root, read-only bind mount. Skipped individually when docker or prebuilt image unavailable.
- `test_signature_parity.py` — byte-for-byte digest match vs Solidity reconstruction and EIP-191 signer recovery for 3 vectors.
- `test_pytest_gen_adversarial.py` — too-few tests triggers retry/raise, fence stripping, non-Python text, missing `import pytest`, prompt-injection string literals documented as accepted (sandbox is the real boundary).
- `test_x402_edge.py` — 402-on-first, amount-below-price, wrong recipient, wrong token, nonexistent tx returns 402 not 500, malformed `X-Payment` header.

No files under `grader/app/` were modified.

## Findings

| Severity | Area | Finding | Recommendation |
|---|---|---|---|
| MEDIUM | API contract | `SubmitRequest.job_id` is typed `int` in `grader/app/main.py`, but BLUEPRINT §Shared interfaces shows `"0x..."` (hex string). Sending the blueprint's example string form yields HTTP 422. | Decide canonical form; easiest is to update BLUEPRINT example to integer form since ERC-8183 jobIds are `uint256` and Pydantic accepts both int and numeric string. Either widen type to `int | str` with coercion, or amend BLUEPRINT. |
| LOW | API contract | `SubmitRequest.agent_address` is `Optional[str]` in impl but required in BLUEPRINT. Current impl never uses `agent_address` so making it optional is safe; still a contract drift. | Either remove the field from BLUEPRINT, or mark it required and validate EIP-55 checksum on input. |
| LOW | Sandbox | When the prebuilt `agentwork-sandbox` image is absent, `sandbox.py` falls back to `python:3.11-slim` with `--network=bridge` so it can `pip install pytest`. This relaxes the `--network=none` guarantee in the fallback path. It is documented by a code comment but is a live safety gap. | Bake pytest into the prebuilt image and hard-fail (or error) when the image is missing, rather than silently falling back to networked mode. Or run `pip install` in a preflight step and then re-exec with `--network=none`. |
| LOW | x402 | Replay guard `_USED_TX` is in-memory only. A process restart clears it. | Persist used tx hashes to `DATA_DIR` (a simple JSON/SQLite store) and reload at startup. |
| LOW | x402 | No cap on `X-Payment` header size; a huge JSON blob is parsed. | Validate `len(x_payment) < 8192` before `json.loads`. |
| INFO | Crypto | Malformed signature lengths (wrong bytes, truncated) are handled at the Solidity layer by `ECDSA.recover` reverting, not in Python. The Python API path just forwards bytes. Test coverage at the contract level is assumed from Phase 1; audit did not re-verify. | Add a Foundry unit test asserting `submitVerdict` reverts on sig lengths != 65. |
| INFO | Secrets | `0x4c08...2318` appears in two test files as a private key; this is a canonical Hardhat/Foundry test key (publicly published). No action needed beyond noting it is test-only. | None. |
| INFO | Generator | `pytest_gen._validate` only enforces structural properties (`ast.parse`, `import pytest`, ≥3 `test_` defs). A generated file containing a malicious-looking string literal is accepted. This is by design; the sandbox is the security boundary. | Keep current behavior. Do not add content-based filters (false sense of safety). |

## Sandbox flag audit (verbatim)

From `grader/app/sandbox.py`:

- `--network=none` — present when prebuilt image is used.
- `--read-only` — present.
- `--tmpfs /tmp:exec` — present (required for pytest write + exec).
- `-v {workdir}:/work:ro` — bind mount is read-only.
- `timeout=30` (configurable `timeout_s`) — enforced via `subprocess.run(..., timeout=...)`.
- No `--privileged`, no `--cap-add`, no `--pid=host`, no `--ipc=host`.

Live malicious-input tests (`test_sandbox_malicious.py`) pass against the running daemon, confirming:

- `subprocess.call(['sh','-c','touch /tmp/pwn_...'])` from inside container does not create the file on the host.
- Infinite loop is killed by the timeout and returned as non-passing.
- Writes to `/etc/hosts` fail (read-only root).
- Writes to `/work` fail (bind mount is `:ro`).

## API Contract Snapshot

Implemented response of `POST /api/v1/grader/generate`:

```json
{
  "pytest_hash": "0x...",
  "pytest_uri": "http://.../tests/0x...",
  "task_hash": "0x...",             // EXTRA vs blueprint (additive, harmless)
  "evaluator_address": "0x... or ''",
  "preview_tests": ["test_a", "test_b", "test_c"]
}
```

All blueprint-required fields are present. `task_hash` is an additive extension used by the skill-side flow; recommend updating BLUEPRINT to document it.

Implemented `POST /api/v1/grader/submit` response:

```json
{
  "verdict": "pass" | "fail",
  "tx_hash": "0x... or ''",
  "test_output": "...",
  "failed_tests": [...]
}
```

Matches BLUEPRINT exactly.

## Sign-off

- Tests green: 45/45.
- No CRITICAL or HIGH findings.
- MEDIUM finding on `job_id` type must be resolved before frontend wiring or BLUEPRINT must be amended; this is a trivial edit.
- Sandbox fallback network gap (LOW) should be closed in Phase 4 hardening.

**Verdict: approved for commit.** Scribe may commit Phase 2.
