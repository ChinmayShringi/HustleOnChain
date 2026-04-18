# Phase 0 Audit

Auditor: Phase 0 Auditor (independent)
Date: 2026-04-18
Scope: verify Phase 0 Builder's scaffold against `CLAUDE_BACKEND.md` §Phase 0 and the plan at `~/.claude/plans/yes-someone-is-working-jolly-candy.md`.

## Summary

**PASS WITH NOTES.** The Phase 0 demo gate is met: `forge test` is green, `GET /healthz` returns `{"ok": true}`, and the skill workspace installs cleanly with `viem` and `@anthropic-ai/sdk` on disk. No secrets are committed and no em dashes appear in owned text. Minor gaps are listed under Gaps; none block starting Phase 1, but several should be addressed before the Scribe commits the scaffold.

## Checklist results

### 1. File inventory

Verdict: **PASS WITH NOTES.**

Present:
- `/Users/chinmay_shringi/Desktop/hustleonchain/README.md`
- `/Users/chinmay_shringi/Desktop/hustleonchain/bsc.address`
- `/Users/chinmay_shringi/Desktop/hustleonchain/contracts/` (foundry.toml, foundry.lock, src/Counter.sol, test/Counter.t.sol, script/Counter.s.sol, lib/forge-std, .gitignore, README.md, .github/)
- `/Users/chinmay_shringi/Desktop/hustleonchain/grader/` (app/main.py, app/__init__.py, requirements.txt, .env.example, .gitignore, .venv/)
- `/Users/chinmay_shringi/Desktop/hustleonchain/skill/` (package.json, package-lock.json, tsconfig.json, src/index.ts, .env.example, .gitignore, node_modules/)
- `/Users/chinmay_shringi/Desktop/hustleonchain/docs/` (api.md, addresses.md, dev-setup.md)

Note: the default Foundry `Counter.sol/.t.sol/.s.sol` are still present. Phase 0 in `CLAUDE_BACKEND.md` says "Confirm `forge test` runs on the default Counter" which implies keeping is fine for now, but the plan also says "then remove". Not a blocker — Phase 1 Builder will replace them.

### 2. Blueprint parity

Verdict: **PASS WITH NOTES.**

- `contracts/src/interfaces/IERC8183.sol`, `contracts/src/GraderEvaluator.sol`, `contracts/src/JobFactory.sol` — **not yet present.** Expected, these are Phase 1 work per the plan.
- `grader/app/` is missing the files the plan lists (pytest_gen.py, sandbox.py, evaluator_signer.py, tasks_store.py, deliverables.py, x402_hint.py, status.py) and `Dockerfile.sandbox`. Expected, Phase 2 work.
- `skill/src/` is missing `job_watcher.ts`, `solver.ts`, `x402_paid_call.ts`, `status_server.ts`. Expected, Phase 3 work.
- `docs/TECHNICAL.md` and `docs/AI_BUILD_LOG.md` — missing. These are Phase 4 deliverables; not required for Phase 0.

The scaffold matches `CLAUDE_BACKEND.md` §Repo layout at the directory level. Divergences are all forward-dated.

### 3. Secrets hygiene

Verdict: **PASS.**

- `grep -r "PRIVATE_KEY=0x" grader/ skill/` returns no matches.
- No `.env` files exist anywhere under the repo (checked `find -maxdepth 4 -name .env`).
- `grader/.env.example` leaves `EVALUATOR_PRIVATE_KEY=`, `ANTHROPIC_API_KEY=`, `GRADER_EVALUATOR_ADDRESS=` blank (placeholders only).
- `skill/.env.example` leaves `AGENT_PRIVATE_KEY=` and `GRADER_EVALUATOR_ADDRESS=` blank.
- Both `.env.example` files are committed only as templates; real `.env` names are covered by per-workspace `.gitignore`.

### 4. Contracts

Verdict: **PASS.**

Command: `cd contracts && forge test -vv`

Last 15 lines of output:
```
No files changed, compilation skipped

Ran 2 tests for test/Counter.t.sol:CounterTest
[PASS] testFuzz_SetNumber(uint256) (runs: 256, μ: 27059, ~: 29314)
[PASS] test_Increment() (gas: 28800)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 5.48ms (4.01ms CPU time)

Ran 1 test suite in 99.35ms (5.48ms CPU time): 2 tests passed, 0 failed, 0 skipped (2 total tests)
```

### 5. Grader healthz

Verdict: **PASS.**

Command: `grader/.venv/bin/uvicorn grader.app.main:app --port 8766` (background), then `curl http://127.0.0.1:8766/healthz`.

Result: HTTP 200, body `{"ok":true}`. Uvicorn logs confirm `"GET /healthz HTTP/1.1" 200 OK`. Server killed cleanly.

### 6. Skill install

Verdict: **PASS WITH NOTES.**

- `cd skill && npm run --silent` printed no output (this invocation lists runnable scripts on some npm versions and is silent on others; `package.json` defines `build`, `dev`, `start`).
- `skill/node_modules/viem/` exists.
- `skill/node_modules/@anthropic-ai/sdk/` exists.

Note: the plan calls for pinning the CryptoClaw version in `skill/package.json` on day 1. `@termix-it/cryptoclaw` is not listed as a dependency yet (deferred to Phase 3 Task 3.1). Flag for Phase 3 Builder.

### 7. Style (em dashes)

Verdict: **PASS.**

`grep -rn "—"` across `README.md`, `docs/`, `grader/app/`, `skill/src/` returned zero matches.

### 8. Gitignore correctness

Verdict: **PASS WITH NOTES.**

Per-workspace rules verified via `git check-ignore -v`:
- `grader/.env` → ignored by `grader/.gitignore:2`.
- `grader/.venv` → ignored by `grader/.gitignore:1`.
- `grader/tests-store/` → ignored by `grader/.gitignore:3`.
- `grader/deliverables/` → ignored by `grader/.gitignore:4`.
- `skill/node_modules` → ignored by `skill/.gitignore:1`.
- `contracts/.gitignore` covers `cache/`, `out/`, `.env`, `/broadcast/*/31337/`.

Note: there is **no root `.gitignore`**. Per-workspace files cover everything the plan lists, so this is functionally sufficient, but a root `.gitignore` would be safer (e.g., to catch stray `.DS_Store`, `.env` at the root, editor files). Low priority.

Separately: `git ls-files` shows only 5 tracked files — `BLUEPRINT.md`, `CLAUDE_BACKEND.md`, `CLAUDE_FRONTEND.md`, `.gitmodules`, and the `forge-std` submodule pointer. The entire Phase 0 scaffold is still untracked (`git status` shows `??` for all of it). The Scribe will need to `git add` it.

### 9. Hackathon files

Verdict: **PASS.**

- `/Users/chinmay_shringi/Desktop/hustleonchain/bsc.address` exists. Content is a placeholder (`TBD`, with format comment). Addresses are filled in at end of Phase 1 per the plan.
- `/Users/chinmay_shringi/Desktop/hustleonchain/README.md` exists and links to `BLUEPRINT.md`, `CLAUDE_BACKEND.md`, `CLAUDE_FRONTEND.md`, and `docs/dev-setup.md`.

### 10. `docs/dev-setup.md` reproducibility

Verdict: **PASS WITH NOTES.**

The 11 numbered steps cover: clone, Foundry install, `forge build && forge test`, venv creation, grader pip install, copying `.env.example`, starting uvicorn on port 8765, `npm install` in `skill/`, copying skill `.env.example`, installing CryptoClaw globally, and recording addresses.

Reproducibility gaps:
- Does not name a required Python version (`python3 -m venv` assumes >=3.11 is default; grader pytest sandbox image is `python:3.11-slim`, so the runtime should match).
- Does not name a required Node version (`viem@^2.21` and `@anthropic-ai/sdk@^0.30` require Node >=18). Add a one-liner.
- Port mismatch: dev-setup says port `8765`; the auditor health check used `8766` per instructions. Either is fine; note the canonical port (likely 8765 per `skill/.env.example`).
- Does not mention `forge install foundry-rs/forge-std` / submodule init (`git submodule update --init --recursive`) — the `lib/forge-std` submodule is required for `forge test` to work on a fresh clone.

All of the above are small; the doc is reproducible with minor guessing.

## Gaps (what the Builder missed)

1. **Root `.gitignore` absent.** Per-workspace gitignores cover the required paths, but a root file is still best practice. Add at minimum: `.DS_Store`, `.env`, `.env.local`, editor dirs.
2. **Nothing committed.** The scaffold is entirely untracked (`git status` shows `??` for all Phase 0 files). The Scribe must stage and commit; flag anything sensitive before commit (none found by the auditor).
3. **`docs/dev-setup.md` missing prerequisites.** No Python/Node version requirement, no `git submodule update --init --recursive` step. Add these so another engineer can reproduce on a fresh checkout.
4. **Default Foundry Counter still in the tree.** `CLAUDE_BACKEND.md` §Phase 0 treats this as acceptable (demo gate is "`forge test` runs"), but the build plan says "then remove." Phase 1 Builder will overwrite; no action required from the Scribe.
5. **`grader/app/__pycache__/` is tracked-candidate.** Not currently in `.gitignore`. Add `__pycache__/` to `grader/.gitignore` to prevent the Scribe from accidentally committing it.
6. **No `docs/TECHNICAL.md` / `docs/AI_BUILD_LOG.md` stubs.** These are Phase 4 but a stub now would avoid a last-minute scramble. Optional.
7. **`bsc.address` content is one comment line.** The hackathon starter kit expects key=value entries; acceptable to leave `TBD` until Phase 1 but make sure Phase 1 Builder populates it.

## Recommendations for Phase 1 Builder

1. Remove `contracts/src/Counter.sol`, `contracts/test/Counter.t.sol`, `contracts/script/Counter.s.sol` once real contracts replace them. Keep `lib/forge-std`.
2. Add `contracts/src/interfaces/IERC8183.sol` verbatim from the BNBAgent SDK. Drop `JobFactory.sol` if SDK event signatures match the blueprint (per the plan's Task 1.1 parity check); otherwise ship the thin facade.
3. Implement `GraderEvaluator.sol` with immutable `authorizedGrader` and EIP-191 `toEthSignedMessageHash` verification.
4. Write Foundry tests for the 6 cases listed in Task 1.3 before deploy. Use a `MockERC8183` harness.
5. After deployment, populate `docs/addresses.md`, the `Contract addresses` section in `BLUEPRINT.md`, and `bsc.address` at the repo root. Record Phase 1 demo tx hashes.
6. Patch `docs/dev-setup.md` with the Python/Node version prereqs and the submodule init step as you touch it.
7. Add `__pycache__/` to `grader/.gitignore`.
8. Coordinate with the frontend engineer per `CLAUDE_BACKEND.md` §Coordination — ping as soon as contract addresses are finalized.

## Sign-off

Phase 0 is **accepted with notes**. All three demo-gate checks (`forge test`, `GET /healthz`, skill install) pass. Documented gaps are non-blocking for Phase 1 kickoff. Auditor clears the Scribe to stage and commit the scaffold; see the Gaps section for the one-line patches (`__pycache__/` in grader gitignore, optional root `.gitignore`) that would be worth adding to the same commit.

— Phase 0 Auditor, 2026-04-18
