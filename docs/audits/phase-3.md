# Phase 3 Audit — AgentWork Skill

Auditor: Phase 3 Auditor
Date: 2026-04-18
Scope: `/skill/**`, cross-module parity with `contracts/src/JobFactory.sol` and `grader/app/**`.

## Summary

Verdict: **Conditional PASS**. Skill is internally sound (37/37 vitest green, clean build, solid x402 + ABI code). One **HIGH** cross-module drift in the status push route, two **MEDIUM** doc inconsistencies, and three **LOW** polish items. No CRITICAL security or correctness issues. Scribe may commit **after** the HIGH finding is fixed (or explicitly deferred), since it silently breaks the frontend status polling story that the demo narrative relies on.

## Checklist Results

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | ABI parity (jobs, submit, JobFunded, JobCompleted, JobRejected) | PASS | Tuple ordering, types, and indexed flags all match `JobFactory.sol`. See `abi_parity` audit tests. |
| 2 | Grader API parity (routes + payloads) | PARTIAL | `getTask`, `uploadDeliverable`, `fetchHint402` correct. `pushStatus` DRIFTS from grader endpoint. |
| 3 | taskHash hex encoding | PASS | `GraderClient.getTask` interpolates the `0x<64hex>` bytes32 straight from the `jobs()[4]` read; viem returns canonical 0x-prefixed lowercase hex. Covered by `getTask` audit test. |
| 4 | x402 flow integrity | PASS | Skill pays USDT to the `recipient` returned by the 402 body, retries `GET /x402/hint` with the JSON `X-PAYMENT` header, and reverts on non-200. BigInt used, no decimal mis-scaling. |
| 5 | Private key hygiene | PASS | `AGENT_PRIVATE_KEY` only flows through `privateKeyToAccount`; no `console.log` or error-message concatenation anywhere in `skill/src/`. |
| 6 | Error handling / watcher resilience | PASS | `watchAndHandle` wraps each `handleJob` in try/catch and logs via `console.error`, loop keeps running (confirmed by reading `job_watcher.ts` and the new audit test). |
| 7 | Status server CORS + port collision | PASS | `startStatusServer` rejects the promise with `EADDRINUSE` on bind failure instead of crashing the process; CORS allows `http://localhost:3000`. |
| 8 | CryptoClaw manifest | PASS (provisional) | `cryptoclaw-skill.json` entrypoint `dist/index.js` exists after build. README §"CryptoClaw integration status" explicitly calls the manifest provisional. |
| 9 | Full test suite | PASS | 37/37 vitest tests green after audit additions. `npm run build` clean, no tsc errors. |
| 10 | E2E dry-run | PARTIAL | Full live E2E not executed (grader requires Anthropic + web3 creds not available in audit env). Component-level lifecycle is proven by `job_watcher.test.ts > runs the full pipeline end-to-end`, which scripts `JobFunded -> readJob -> getTask -> solveTask -> payForHint -> uploadDeliverable -> submit` with mocks. See E2E section below. |

## Added Tests

Path: `skill/test/audit/api_parity.test.ts` (12 new cases, all green)

Coverage:
- `getTask` URL shape and method
- `uploadDeliverable` URL + method + not-JSON content-type
- `fetchHint402` URL + `X-PAYMENT` JSON body shape
- `pushStatus` drift assertion (documents current broken URL)
- `jobs()` ABI tuple ordering + types
- `submit(uint256,bytes32)` shape
- `JobFunded` / `JobCompleted` / `JobRejected` indexed fields
- `payForHint` sends to USDT contract with calldata containing recipient + amount
- `payForHint` throws on missing recipient
- Watcher pipeline error propagation shape
- Status server `EADDRINUSE` surfaces cleanly

No files in `skill/src/` were modified.

## Findings

| ID | Severity | Area | Finding | Recommended fix |
|---|---|---|---|---|
| F-1 | HIGH | Grader API parity | `GraderClient.pushStatus` POSTs to `${baseUrl}/api/v1/status/${agent_address}`. Grader only serves `POST /api/status/push` (see `grader/app/status.py:25`). The skill swallows non-2xx responses, so the frontend never receives pushed status updates; the local status HTTP server still works. | Change the URL in `skill/src/grader_client.ts` to `${baseUrl}/api/status/push` and move `agent_address` into the JSON body. Matches the grader's `StatusPush` model. |
| F-2 | MEDIUM | Docs drift | `docs/api.md` advertises `GET /api/v1/x402/hint/<task_hash>` but the grader mounts `GET /x402/hint` with no path param and no `v1` prefix. Skill matches grader, docs are wrong. | Update `docs/api.md` to reflect the real route, or add an alias router on the grader if the versioned URL is desired. |
| F-3 | MEDIUM | Docs drift | `docs/api.md` describes `POST /api/v1/status/<agent_address>`; the real endpoint is `/api/status/push` (see F-1). Both skill and frontend integrators are being misled. | Rewrite the Status section of `docs/api.md` to match `grader/app/status.py`. |
| F-4 | LOW | x402 body fields | `payForHint` accepts both `recipient`/`pay_to` and `amount_wei`/`amount`. Grader always returns `recipient` + `amount_wei` + `pay_to` (USDT addr). The `pay_to` fallback is dead for this grader. Benign. | Consider removing the `pay_to` fallback or at least documenting that `pay_to` in x402 semantics is the **token** contract, not the recipient — easy to confuse. |
| F-5 | LOW | Header case | Skill sends `X-PAYMENT`; grader reads `X-Payment` via FastAPI alias. HTTP headers are case-insensitive so fetch normalises, but keeping identical casing on both sides avoids confusion for anyone reading wire traces. | Align casing to `X-PAYMENT` in `grader/app/x402_hint.py` alias or to `X-Payment` in the skill. |
| F-6 | LOW | Manifest | `cryptoclaw-skill.json` exposes zero parameters for `agentwork_run`. Acceptable per README but a `dry_run` boolean would let CryptoClaw hosts smoke-test the skill without claiming real jobs. | Optional: add a `dry_run` parameter or defer to a v0.2 manifest. |

No CRITICAL findings. No hardcoded secrets. No `console.log` of private keys. No ABI divergence.

## E2E Dry-run Results

Full live dry-run was not executed in this audit environment because:
- Grader requires `ANTHROPIC_API_KEY` and a web3 provider to serve `/api/v1/grader/generate` and `/x402/hint`.
- Skill's `handleJob` ultimately calls a real RPC and an Anthropic endpoint.

Instead, the lifecycle is proven by composition of existing + new tests, which together cover every step:

1. `JobFunded` event fan-out → `test/job_watcher.test.ts` uses a scripted `watchContractEvent` and confirms `handleJob` is dispatched only when `job.provider` matches the agent.
2. `jobs()` read + tuple decode → `test/job_watcher.test.ts` + `test/audit/api_parity.test.ts > JobFactory ABI parity`.
3. `getTask(taskHash)` URL and response parse → `test/grader_client.test.ts` + `test/audit/api_parity.test.ts > getTask`.
4. `solveTask` Claude stub → `test/solver.test.ts` (retry on invalid Python, strict system prompt).
5. x402 pay → `test/x402_paid_call.test.ts` (402 → tx → 200 happy path; reverted tx; still-402 after payment) + `test/audit/api_parity.test.ts > x402 recipient + amount integrity`.
6. `uploadDeliverable` multipart → `test/grader_client.test.ts` + audit test.
7. `submit(jobId, solutionHash)` on-chain call → `test/job_watcher.test.ts` end-to-end pipeline test asserts the submit tx was sent with the keccak256 of the solution bytes.
8. Status tracking → `test/status_server.test.ts` + audit `EADDRINUSE` test.

Tally after audit additions: **7 test files, 37 tests passed, 0 failed, ~580ms** (`npm test`). Build: `npm run build` produces `skill/dist/index.js` (required by `cryptoclaw-skill.json` entrypoint).

A true live E2E should be run in Phase 4 once a funded test key + deployed contracts are available; the script should be:

```
cd grader && .venv/bin/uvicorn grader.app.main:app --port 8000 &
cd skill && npm run once -- --job-id <funded-job>
```

and observe `status=claiming → solving → paying_x402 → submitting → idle` both in the grader's `GET /api/status` and the skill's `GET http://localhost:8765/api/status`.

## Sign-off

- **Blocker for Scribe to commit:** F-1 (status push URL drift). Cheap one-line fix; tests already in place will catch any regression.
- **Non-blockers:** F-2..F-6 can ship as follow-ups in the same PR or a doc-cleanup PR.
- **Everything else:** green.

Once F-1 is fixed and the drift test in `skill/test/audit/api_parity.test.ts` is flipped to assert the correct URL (`/api/status/push`), Phase 3 is ready to merge.
