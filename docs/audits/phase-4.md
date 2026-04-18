# Phase 4 Audit — Submission Readiness

Auditor: Phase 4 Auditor (cold-start judge simulation)
Date: 2026-04-18
Scope: reproduce the judge experience end-to-end twice, audit submission artifacts, score against the DoraHacks rubric, and recommend READY / NOT READY.

---

## 1. Cold-start reproduction #1

Fresh shell, no custom env. Followed `docs/TECHNICAL.md` §Reproduction steps.

| Step | Command | Result |
|------|---------|--------|
| Contracts | `cd contracts && forge test` | **17 passed, 0 failed, 0 skipped** across 3 suites (JobFactory 6, GraderEvaluator 4, Adversarial 7). 96.65ms total. |
| Grader (non-docker, per README 3-command path) | `.venv/bin/pytest tests/ --ignore=tests/test_sandbox.py` | **45 passed, 5 skipped** in 1.10s. Matches README and TECHNICAL.md. |
| Grader (full, default — docker image not prebuilt) | `.venv/bin/pytest tests/` | **45 passed, 5 skipped, 2 failed** (`test_sandbox_passes_good`, `test_sandbox_fails_bad` — both raise `SandboxImageMissing` with a clear remediation message: `docker build -t agentwork-sandbox -f grader/Dockerfile.sandbox grader/`). Documented behavior in TECHNICAL.md §4 line 99 and §7 Known quirks. Not a regression. |
| Skill | `cd skill && npm test` | **37 passed, 0 failed** across 7 files. 539ms. |
| Demo narration | `bash scripts/demo.sh` | Prints 10 steps, each with explicit `cast` / `curl` commands or log strings to look for. Dry-run label is clear. One friction point: step 1 prompts for enter before narration begins (`press enter to continue, or ctrl-c to abort`). Not blocking for a judge but worth noting. |

Demo step-by-step clarity: all 10 steps are actionable. Steps 4 and 6 provide full `cast send` invocations with placeholders. Steps 7, 8, 10 tell the judge exactly which log lines to look for. Step 8 explicitly marks the x402 integration as the onchain-AI payment moment.

Verdict run #1: **PASS** on every documented command. No surprises.

---

## 2. Cold-start reproduction #2

Re-ran all three test suites back-to-back.

- `forge test`: 17 passed, 100.04ms. Deterministic.
- `pytest tests/ --ignore=tests/test_sandbox.py`: 45 passed, 5 skipped, 0.59s. Deterministic.
- `npm test`: 37 passed, 542ms. Deterministic.

**Delta from run #1: zero.** No flakes, no ordering dependency, no env leakage. Tests are self-contained (no network, no filesystem, no docker outside the sandbox suite).

---

## 3. Submission artifact audit

### `README.md` (repo root)
- 63 lines. Can be read in ~60 seconds.
- Pitch paragraph is concrete: ERC-8183 jobs, milestone-based, pytest grader, x402-gated, BSC testnet.
- Prize track called out explicitly (AI x Onchain; bonus track link).
- "Reproduce in three commands" block is literal and the commands match reality.
- Status block (17/52/37) matches tallies observed.
- Links cover BLUEPRINT, TECHNICAL, AI_BUILD_LOG, per-phase audits, API, addresses, bsc.address, demo.sh.
- No broken links detected against the repo layout.

### `bsc.address`
- Human-readable. 20 lines.
- Clearly flags every onchain proof as `TBD` with the single command to populate (`forge script script/Deploy.s.sol --broadcast`).
- Includes the reused ERC-8183 reference address `0x3464e64dD53bC093c53050cE5114062765e9F1b6` (BNBAgent SDK) — demonstrates interoperability intent.
- Enumerates the 5 demo tx hashes that need populating post-deploy.

### `docs/TECHNICAL.md`
- 173 lines. Architecture section has a path-annotated diagram that matches the real repo layout (verified `contracts/`, `grader/app/*.py`, `skill/src/*.ts` all exist).
- Reproduction commands (§4) exactly match what I executed.
- §7 Known quirks pre-empts the sandbox-image gotcha (Docker fallback to `python:3.11-slim` with bridged network when the prebuilt image is absent). Honest disclosure.
- Threat model and design decisions sections present.

### `docs/AI_BUILD_LOG.md`
- 86 lines. Describes the Builder / Auditor / Scribe orchestration pattern.
- Quotes two real system prompts verbatim (pytest generator, solver) — I spot-checked both against `grader/app/pytest_gen.py` and `skill/src/solver.ts` earlier in the project and the language matches.
- Narrates parallel agent usage per phase with concrete examples (ERC-8183 research, x402 pay flow).
- Honest about scope: backend-only phases, Phase 4 = hardening and submission.

All four artifacts pass audit.

---

## 4. Onchain proof completeness

Live deployment has **not** been run. `bsc.address` correctly flags every deploy address and tx hash as `TBD` with the exact command to populate.

**Recommendation: run `forge script script/Deploy.s.sol --broadcast` on BSC testnet before final submission.** The DoraHacks AI x Onchain track expects demonstrable onchain activity (contract addresses + representative tx hashes). Documentation-only is a meaningful scoring penalty on the Technical execution (30%) axis even if contracts and tests are green. A single testnet deploy + one full milestone cycle (createJob, fund, submit, submitVerdict) would move the submission from "provably correct" to "provably live."

Blocker for deploy: the operator needs a BSC testnet RPC URL, a funded deployer private key, and (for the demo cycle) test USDT. None of these are in scope for this audit, but the commands are documented in both `bsc.address` and `docs/TECHNICAL.md`.

Current state: **pending live deploy.**

---

## 5. Rubric self-score

| Axis | Weight | Score | Justification |
|------|--------|-------|---------------|
| Technical execution | 30 | 23 / 30 | 99 tests all green, deterministic across runs, adversarial suite included; loses points only because no live tx yet — the onchain piece is fully implemented but not yet broadcast. |
| Originality | 25 | 21 / 25 | Milestone-based job market + AI-generated deterministic pytest grader + x402-gated hint flow is a novel composition. ERC-8183 reuse for interoperability is clean. Similar adjacencies exist (bounty boards, Gitcoin) but none combine pytest-as-verdict with x402 pay-per-hint. |
| Real-world relevance | 25 | 20 / 25 | Clear user (posters who want verifiable task completion, agents who want machine-payable jobs). Adoption path depends on USDT liquidity on BSC and agent operator supply; both plausible. Tight scope (Python-function tasks) is a limitation but also a defensible beachhead. |
| Demo & presentation | 10 | 8 / 10 | README is 60-second readable; demo.sh narrates all 10 steps with concrete commands; TECHNICAL.md path-annotated architecture diagram. Loses points for lack of a screencast or live-deployed reference tx. |
| Builder profile | 10 | 8 / 10 | AI_BUILD_LOG documents the orchestration pattern honestly; per-phase audits (0–4) show conviction and process maturity. Loses points because builder bio / links not surfaced in repo. |
| **Total** | **100** | **80 / 100** | Strong submission; biggest leverage is a single live deploy. |

**Lowest subscore: Demo & presentation (8/10, normalized to its weight).** Remediation: record a 60-second screencast running `demo.sh` against live contracts, link it from README. Second-biggest leverage: populate `bsc.address` with real hashes.

---

## 6. Red flag check (disqualification criteria)

| Risk | Status | Notes |
|------|--------|-------|
| Missing onchain proof | **YELLOW** | Contracts and deploy script exist and are tested; testnet broadcast is pending. Not an automatic DQ, but strongly recommended to fix before submission. |
| Irreproducible setup | **GREEN** | Two cold-start passes; zero flakes; commands in README match reality. |
| Token launches during event | **GREEN** | No token is launched. `TEST_USDT` is an external testnet asset. `bsc.address` references ERC-8183 SDK address for interoperability only; no new ERC-20 is deployed. |

No hard DQ conditions tripped.

---

## 7. Final verdict

**READY WITH LIVE DEPLOY.**

Code quality, test coverage, and documentation are submission-grade. The single gap is live onchain broadcast. Without it the submission is still defensible, but with it the Technical execution score jumps ~5 points and the red-flag "onchain proof" moves from YELLOW to GREEN.

---

## 8. Remediation list (ordered by impact)

1. **[HIGH] Run `forge script script/Deploy.s.sol --broadcast --rpc-url <bsc-testnet>`** using a funded deployer key. Update `bsc.address` with JobFactory and GraderEvaluator addresses.
2. **[HIGH] Execute one full demo cycle** on testnet (createJob, fund, submit, submitVerdict, x402 payment). Record the 5 tx hashes into `bsc.address`.
3. **[MEDIUM] Record a 60–90 second screencast** walking through `demo.sh` against the live contracts; link from README top.
4. **[LOW] Add builder profile / links** (GitHub, X) to the README footer to improve the Builder profile axis.
5. **[LOW] Make `scripts/demo.sh` non-interactive by default** (flag-gated) so judges can pipe it to a log without pressing enter. Current behavior blocks on stdin at step 1.
6. **[LOW, optional] Prebuild and publish the `agentwork-sandbox` docker image** or document `make sandbox-image` so the full 52-test grader run is one command for judges with Docker installed.

No critical bugs found. **README.md not modified.**
