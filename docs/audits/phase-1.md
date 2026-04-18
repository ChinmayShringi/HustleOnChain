# Phase 1 Audit — Contracts

**Date:** 2026-04-18
**Auditor:** Phase 1 Auditor (independent pass after Builder report)
**Scope:** `contracts/src/JobFactory.sol`, `contracts/src/GraderEvaluator.sol`, interfaces, tests, deploy script.

## Summary

**Verdict: PASS WITH NOTES.** All 10 Builder tests plus 7 new adversarial tests pass (17/17). Core lifecycle, access control, CEI ordering, and replay guards are correct. Two blueprint divergences and one cross-chain signature-replay limitation are flagged for follow-up but do not block Scribe from committing Phase 1.

---

## 1. File Inventory

| Expected | Status |
|---|---|
| `contracts/src/JobFactory.sol` | Present |
| `contracts/src/GraderEvaluator.sol` | Present |
| `contracts/src/interfaces/IERC8183.sol` | Present |
| `contracts/test/JobFactory.t.sol` | Present |
| `contracts/test/GraderEvaluator.t.sol` | Present |
| `contracts/test/helpers/MockERC20.sol` | Present |
| `contracts/script/Deploy.s.sol` | Present |
| `contracts/remappings.txt` | Present, maps `@openzeppelin/` → `lib/openzeppelin-contracts/` and `forge-std/` → `lib/forge-std/src/` |
| Counter.sol / Counter.t.sol residue | None (no `src/` or `test/` at repo root; no Counter files under `contracts/`) |

## 2. Forge Test Re-run

```
Ran 3 test suites in 97.74ms: 17 tests passed, 0 failed, 0 skipped (17 total tests)
  - test/JobFactory.t.sol:JobFactoryTest ............ 6/6 PASS
  - test/GraderEvaluator.t.sol:GraderEvaluatorTest .. 4/4 PASS
  - test/adversarial/Adversarial.t.sol:Adversarial .. 7/7 PASS
```

Builder's 10/10 baseline confirmed. Adversarial suite adds 7 tests, all green.

## 3. Blueprint Parity (CLAUDE_BACKEND.md §Task 1.1)

| Bullet | Status | Evidence |
|---|---|---|
| `createJob(provider, evaluator, expiresAt, taskHash, hook) returns (jobId)` signature | MATCH | `JobFactory.sol:33-39` |
| `fund(jobId, token, amount)` pulls via `transferFrom` | MATCH | `JobFactory.sol:68` |
| `submit(jobId, deliverableHash)` provider-only | MATCH | `JobFactory.sol:74` |
| `complete(jobId)` evaluator-only, pays provider | MATCH with divergence (see below) | `JobFactory.sol:82-92` |
| `reject(jobId)` evaluator-only, refunds client | MATCH with divergence (see below) | `JobFactory.sol:94-104` |
| `claimRefund(jobId)` client, after `expiresAt` | MATCH | `JobFactory.sol:106-117` |
| All 6 events | DIVERGE (see F-2) | blueprint expects `JobRefunded`; impl emits `JobExpired` + `Refunded` |
| Hook accepted but ignored | MATCH | Stored and exposed via `jobHook(jobId)`; never invoked |

### Divergences

- **D-1 (LOW):** `complete(jobId)` and `reject(jobId)` in the blueprint take only `jobId`, but the implementation also takes a `string memory reason`. This is strictly additive and serves logging (grader encodes `"grader pass"` / `"grader fail"`); ABI consumers must know about the extra param.
- **D-2 (LOW):** Blueprint lists a single `JobRefunded` event; implementation emits both `JobExpired(jobId)` and `Refunded(jobId, token, amount)` from `claimRefund`. All information required by the frontend is still emitted; only the event name differs. Pick one naming convention and document.

## 4. Adversarial Tests Added

File: `/Users/chinmay_shringi/Desktop/hustleonchain/contracts/test/adversarial/Adversarial.t.sol`

| # | Scenario | Result |
|---|---|---|
| 1 | Cross-evaluator signature replay (sig for evalA rejected at evalB) | PASS — digest binds `address(this)` |
| 2 | Zero-budget fund | PASS — reverts with `amount=0` |
| 3 | Double-fund | PASS — reverts with `bad state` |
| 4 | Submit after expiry | PASS — reverts with `expired` |
| 5 | `complete` on Rejected state | PASS — reverts with `bad state` |
| 6 | CEI ordering on complete (state written before external transfer) | PASS — re-entry into `complete` blocked by state |
| 7 | `testChainIdNotBoundInDigest_AUDIT_FINDING` | PASS — documents F-1 below |

## 5. Static Review — GraderEvaluator.sol

- **CEI:** `consumed[jobId] = true` is set on line 32 **before** the external call to `JobFactory.complete/reject`. Safe against re-entrant replay.
- **Digest binds `address(this)`:** Yes (`abi.encode(jobId, passed, address(this))`). Cross-evaluator replay is prevented.
- **`block.chainid` absent:** Signature portable across chains — see F-1.
- **Nonzero sig length:** Not explicitly enforced, but OZ `ECDSA.recover` reverts on malformed signatures. Acceptable.
- **Open `submitVerdict`:** Anyone can relay a grader-signed verdict; this is by design (relayer-agnostic). Document in README.

## 6. Deploy.s.sol Sanity

- `DEPLOYER_PRIVATE_KEY` and `GRADER_SIGNER_ADDRESS` sourced via `vm.envUint` / `vm.envAddress`. Good.
- No hardcoded addresses, chain ids, or fee values.
- No explicit dry-run path (user must run `forge script` without `--broadcast`). Sufficient for v1.
- Suggestion (non-blocking): log `block.chainid` for audit trail.

## 7. Remappings + Deps

`contracts/remappings.txt` — correct. `forge build` and `forge test` compile cleanly with Solc 0.8.33.

---

## Findings Table

| Severity | Area | Finding | Recommendation |
|---|---|---|---|
| **MEDIUM** (F-1) | GraderEvaluator digest | `block.chainid` is not part of the signed digest. If the evaluator is redeployed at the same address on another chain (CREATE2 or identical-nonce deployer), a verdict signature is replayable cross-chain. | Add `block.chainid` to the digest: `keccak256(abi.encode(jobId, passed, address(this), block.chainid))`. Ideally migrate to EIP-712 for typed, domain-separated signatures. |
| **LOW** (F-2) | IERC8183 events | Blueprint specifies `JobRefunded`; impl emits `JobExpired` + `Refunded`. | Rename `Refunded` → `JobRefunded` OR update blueprint. Either is acceptable; pick one before frontend indexers are wired. |
| **LOW** (F-3) | complete/reject ABI | Blueprint ABI is `complete(uint256)` / `reject(uint256)`; impl adds `string reason`. | Document the additional parameter in IERC8183 and in API docs so off-chain clients (grader, frontend) do not break on migration. |
| **LOW** (F-4) | GraderEvaluator access | `submitVerdict` is intentionally open so any relayer can post the verdict. | Add an inline comment stating this is by design and reference the replay guard. |
| **INFO** (F-5) | JobFactory public API | `IERC8183` interface declares `jobs(...)` but implementation adds `jobHook` and `jobDeliverable` view helpers not in the interface. | Add them to `IERC8183` if they are part of the external contract, or mark them internal if not. |
| **INFO** (F-6) | Return values from ERC-20 | `transfer` / `transferFrom` return values are checked via `require(..., "transfer failed")`. Some non-standard tokens return no value; this is fine with OpenZeppelin-compliant ERC-20 and with the MockERC20 used in tests. If USDT-like tokens are ever supported, migrate to `SafeERC20`. | Use `SafeERC20.safeTransfer` / `safeTransferFrom` before mainnet. |
| **INFO** (F-7) | Deploy.s.sol | No chainid assertion / no dry-run flag. | Add `require(block.chainid == expected, ...)` in prod deploy script to prevent wrong-chain broadcasts. |

No CRITICAL or HIGH findings.

---

## Sign-off

- All required files present, no Counter residue.
- Builder's 10/10 tests reproduced, plus 7 new adversarial tests, total **17/17 passing**.
- Access control, CEI ordering, replay guard, and blueprint functional requirements are satisfied.
- Two blueprint-vs-impl divergences (F-2, F-3) are cosmetic/additive and do not block Scribe.
- F-1 (chainid not in digest) is the only finding worth fixing before mainnet; on BSC testnet for the hackathon demo it is acceptable as a documented limitation.

**Scribe may safely commit Phase 1.** Open follow-up tickets for F-1, F-2, F-3 before any mainnet deployment.

— Phase 1 Auditor
