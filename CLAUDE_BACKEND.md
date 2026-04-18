# CLAUDE.md — Backend Engineer (Contracts + Grader + Agent Skill)

You own: Solidity contracts, the grader service, the CryptoClaw skill, x402 integration.
You do NOT own: the poster/agent frontend UI. That's the other engineer.

**Read `BLUEPRINT.md` first.** All locked decisions live there. Do not change them unilaterally.

## Ground rules

- No em dashes in commit messages or docs.
- Before coding any contract: read ERC-8183 spec at https://eips.ethereum.org/EIPS/eip-8183 end to end.
- Ask before introducing new deps. Do not pull in UMA, OpenZeppelin Upgradeable, Foundry templates, etc., without a reason that's written down.
- Every phase ends with a working demo path. If the end-of-phase demo does not run, do not start the next phase.
- `research/` is read-only. All output goes in `contracts/`, `grader/`, `skill/`, `docs/`.

## Repo layout (your slice)

```
/contracts/
  src/
    JobFactory.sol
    GraderEvaluator.sol
    interfaces/
      IERC8183.sol
  test/
  script/
  foundry.toml
/grader/
  app/
    main.py              # FastAPI entrypoint
    pytest_gen.py        # LLM -> pytest generator
    sandbox.py           # Firecracker or Docker-based runner
    evaluator_signer.py  # Signs verdicts + calls complete/reject
    x402_client.py       # Optional: grader pays for its own LLM calls via x402
  tests/
/skill/
  src/
    index.ts             # CryptoClaw skill entrypoint
    job_watcher.ts       # Polls JobFunded events
    solver.ts            # Runs the agent loop
    x402_paid_call.ts    # The one visible x402 demo call
  package.json
/docs/
  api.md                 # Grader API contract (mirrors BLUEPRINT.md)
  addresses.md           # Deployed contract addresses
```

---

## Phase 0 — Setup (Day 1, ~4 hours)

Goal: repo exists, toolchain works, testnet wallet funded.

- [ ] Init repo with the layout above. Commit empty `README.md` that links to `BLUEPRINT.md`.
- [ ] `foundry init contracts`. Confirm `forge test` runs on the default Counter.
- [ ] `cd grader && python -m venv .venv && pip install fastapi uvicorn anthropic web3 pytest eth-account`. Confirm `uvicorn app.main:app` serves `/healthz`.
- [ ] Install CryptoClaw locally: `npm i -g @termix-it/cryptoclaw && cryptoclaw onboard`. Confirm it boots and responds to a test prompt.
- [ ] Create a BSC testnet wallet. Fund it from https://testnet.bnbchain.org/faucet-smart. Record the address in `docs/addresses.md` under `DEPLOYER_ADDRESS`.
- [ ] Get a testnet USDT contract address (or deploy a mock ERC-20 for the demo). Record in `docs/addresses.md`.
- [ ] Write a one-paragraph `docs/dev-setup.md` that another engineer could follow to replicate your environment.

**End of Phase 0 demo:** you can run `forge test`, hit `GET /healthz`, and execute `cryptoclaw agent --message "hello"`.

---

## Phase 1 — Contracts (Days 2 to 5)

Goal: ERC-8183 job lifecycle working on BSC testnet, with a grader address as evaluator.

### Task 1.1 — `JobFactory.sol`

A thin factory that deploys ERC-8183 jobs. For the hackathon, one contract can hold multiple jobs mapped by ID. Do not overengineer.

Must have:
- `createJob(address provider, address evaluator, uint256 expiresAt, bytes32 taskHash, address hook) returns (uint256 jobId)`
- `fund(uint256 jobId, address token, uint256 amount)` — pulls ERC-20 via `transferFrom`. Poster must have approved.
- `submit(uint256 jobId, bytes32 deliverableHash)` — callable only by provider.
- `complete(uint256 jobId)` — callable only by evaluator. Releases escrow to provider.
- `reject(uint256 jobId)` — callable only by evaluator. Refunds escrow to client.
- `claimRefund(uint256 jobId)` — callable by client after `expiresAt` if job never completed.
- Events: `JobCreated`, `JobFunded`, `JobSubmitted`, `JobCompleted`, `JobRejected`, `JobRefunded`. Frontend needs all of these.

Skip for now: hooks (just accept the address and ignore it in v1), partial releases, reputation writes.

### Task 1.2 — `GraderEvaluator.sol`

This is the evaluator the grader service calls. It wraps `complete` / `reject` with signature verification so the grader is held accountable on-chain.

Must have:
- `constructor(address jobFactory, address authorizedGrader)`
- `submitVerdict(uint256 jobId, bool passed, bytes calldata signature)` — recovers signer from `keccak256(jobId, passed, address(this))`, checks it matches `authorizedGrader`, then calls `JobFactory.complete(jobId)` or `reject(jobId)`.
- Store `authorizedGrader` as immutable for v1.

This is the piece that makes "single grader" cryptographically attributable even though it's centralized.

### Task 1.3 — Tests

Foundry tests for the happy path and each rejection path:
- [ ] Poster creates job, funds it, provider submits, grader passes verdict, provider gets paid.
- [ ] Poster creates job, funds it, provider submits, grader fails verdict, poster gets refund.
- [ ] Poster creates job, funds it, no submission before expiry, poster claims refund.
- [ ] Grader with wrong signature is rejected.
- [ ] Non-provider cannot submit.
- [ ] Non-evaluator cannot complete.

### Task 1.4 — Deploy to BSC testnet

- [ ] Write `script/Deploy.s.sol`.
- [ ] Deploy `JobFactory` and `GraderEvaluator`. The `authorizedGrader` address is your grader service's signing key address (create this key offline, store in `grader/.env` as `EVALUATOR_PRIVATE_KEY`, never commit).
- [ ] Verify on BscScan testnet.
- [ ] Record addresses in `docs/addresses.md` and in `BLUEPRINT.md`'s addresses section.

**End of Phase 1 demo:** from `cast` CLI, walk a job through create → fund → submit → grader signs verdict offline → `submitVerdict` releases escrow. Record the tx hashes in `docs/addresses.md` under "Phase 1 demo txs."

---

## Phase 2 — Grader Service (Days 6 to 9)

Goal: given a function signature and acceptance criteria, generate pytest, run it against a submission, and sign a verdict on-chain.

### Task 2.1 — `POST /api/v1/grader/generate`

- [ ] Implement per `BLUEPRINT.md` API contract.
- [ ] Use Claude API (Anthropic SDK) to generate pytest. Prompt:
  - System: "You write deterministic pytest files for Python function specifications. Output only the pytest file contents, no markdown, no commentary. Include at least 6 test cases covering basic, edge, and error paths."
  - User: function signature + acceptance criteria.
- [ ] Validate the output: it must `import pytest`, must parse as Python (use `ast.parse`), must contain at least 3 `def test_` functions.
- [ ] Store generated tests on disk under `grader/tests-store/<hash>.py`. Return `pytest_hash` (keccak256 of file bytes) and `pytest_uri` (a local HTTP URL is fine for v1, `http://localhost:8000/tests/<hash>`).

### Task 2.2 — Sandbox runner

- [ ] Implement `sandbox.py` that takes a submitted Python file + a pytest file, runs pytest with a 30-second timeout inside a Docker container (image: `python:3.11-slim`, no network, read-only filesystem except `/tmp`).
- [ ] Returns: `{ passed: bool, stdout: str, failed_tests: list[str] }`.
- [ ] Write a unit test that runs a passing solution and a failing solution against a known pytest file.

### Task 2.3 — `POST /api/v1/grader/submit`

- [ ] Implement per `BLUEPRINT.md` API contract.
- [ ] Flow: fetch deliverable from URI, load corresponding pytest by hash, run sandbox, construct verdict message, sign with `EVALUATOR_PRIVATE_KEY`, call `GraderEvaluator.submitVerdict(jobId, passed, signature)` on BSC testnet.
- [ ] Return the chain tx hash.

### Task 2.4 — Grader pays for its own LLM via x402 (optional, Phase 2 stretch)

If the skill's x402 demo isn't enough for the judges, the grader can also pay per-test-generation via x402. Keep this in a branch, not main, until Phase 3 is done.

**End of Phase 2 demo:** `curl` the generate endpoint with FizzBuzz, review the generated pytest, then submit a correct solution and a buggy solution. Correct one results in an on-chain `JobCompleted` event; buggy one results in `JobRejected`.

---

## Phase 3 — CryptoClaw Skill (Days 10 to 13)

Goal: agent running CryptoClaw on a second machine watches BSC, claims jobs, writes solutions, submits, and makes one x402-paid call during execution.

### Task 3.1 — Skill scaffold

- [ ] Read CryptoClaw skill docs at https://github.com/TermiX-official/cryptoclaw/tree/main (check `/skills` directory for examples).
- [ ] Create a skill in `skill/` that registers a tool named `agentwork_run`.
- [ ] Load it into CryptoClaw locally and confirm the tool shows up in `cryptoclaw skills list`.

### Task 3.2 — Job watcher

- [ ] On skill start, subscribe to `JobFunded` events on `JobFactory` where `provider == wallet.address`. (Poster must target this specific agent — for the demo, frontend lets poster pick an agent address.)
- [ ] On event, fetch the task description from `taskHash` (grader service exposes `GET /api/v1/tasks/<hash>` that returns the original function signature + criteria).
- [ ] Post a message in CryptoClaw chat: "Picked up job #123: implement `fizzbuzz(n: int)`. Starting work."

### Task 3.3 — Solver

- [ ] Ask Claude (or the CryptoClaw-configured model) to write the Python solution given the signature + criteria.
- [ ] Save solution to a deliverable URI (grader service has `POST /api/v1/deliverables` that accepts a file, returns a URI).
- [ ] Call `JobFactory.submit(jobId, keccak256(solution))`.

### Task 3.4 — The x402-paid call (the visible one)

During solving, before writing the final answer, agent hits an x402-gated endpoint. Options:
- Spin up your own x402-gated "hint" endpoint in the grader service that returns nothing useful but costs 0.01 test USDT. Agent must pay via NexusPay facilitator to access it.
- Or use a public x402 endpoint on BSC testnet if one exists by week 3.

Either way: the terminal output should clearly show "paid 0.01 USDT via x402 to access tool." Log this prominently.

**End of Phase 3 demo:** on machine A, run frontend + create + fund job. On machine B, CryptoClaw auto-picks up, solves, makes x402 call (visible in terminal), submits. Grader passes it. Poster sees payment.

---

## Phase 4 — Hardening + Submission (Days 14 to 17)

- [ ] Run through the full demo script from `BLUEPRINT.md` end to end, twice, from cold start.
- [ ] Fix anything that flakes.
- [ ] Record 3-minute demo video.
- [ ] Fill in `docs/TECHNICAL.md` per hackathon starter kit format, covering: architecture, how to reproduce, contract addresses, demo walkthrough.
- [ ] Fill in `bsc.address` file at repo root with all deployed contracts.
- [ ] Write the AI Build Log in `docs/AI_BUILD_LOG.md`: how you used Claude, which prompts worked, failed attempts, prompt-engineering learnings. This is the bonus track.
- [ ] Submit to DoraHacks by April 19, 11:59 PM.

## Known risks and mitigations

- **Risk:** BNBAgent SDK is immature. **Mitigation:** we're using it as reference only. Core flow is our own ERC-8183 implementation.
- **Risk:** CryptoClaw skill API changes. **Mitigation:** pin the CryptoClaw version in `skill/package.json` on day 1 and do not upgrade.
- **Risk:** LLM-generated pytest is flaky. **Mitigation:** Poster reviews the generated tests before funding. If tests are wrong, poster regenerates.
- **Risk:** Sandbox security. **Mitigation:** Docker with `--network=none --read-only`, 30-second timeout. Judges aren't attacking it, but document the limitation.
- **Risk:** x402 facilitator on BSC testnet is flaky. **Mitigation:** have a fallback where the agent just makes a regular transferWithAuthorization-style payment and call it "x402-compatible."

## Coordination with frontend engineer

Ping the frontend engineer the moment these happen:
- Contract addresses are finalized (end of Phase 1).
- Grader API is stable (end of Phase 2).
- Event schemas change (any time they change).

Block on them for: nothing. Their work doesn't gate yours.

## Daily sync checklist

Each morning, answer in one line each in a shared doc:
1. What I shipped yesterday.
2. What I'm shipping today.
3. What I need from frontend engineer.
