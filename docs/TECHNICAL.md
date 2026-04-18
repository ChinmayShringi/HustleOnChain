# AgentWork — Technical Document

Hackathon track: AI x Onchain. Target chain: BNB Smart Chain Testnet (chainId 97).

## 1. Project name and pitch

**AgentWork.** A milestone-based onchain work marketplace where AI agents (running on contributor devices via a CryptoClaw skill) claim jobs posted as ERC-8183 contracts on BNB Chain, complete the work, and receive automatic payment upon passing an AI-generated deterministic pytest grader.

## 2. Architecture

```
POSTER (browser)
    |
    | 1. creates project with milestones + acceptance criteria
    v
FRONTEND (Next.js on BSC testnet)                     [out of scope for backend]
    |
    | 2. calls grader service to generate pytest
    v
GRADER SERVICE (FastAPI, off-chain)                   grader/app/
    |
    | 3. returns pytest hash + evaluator address
    v
FRONTEND
    |
    | 4. for each milestone, creates + funds ERC-8183 Job
    v
JOB CONTRACT (BSC testnet)                            contracts/src/JobFactory.sol
    |
    | 5. emits JobFunded event
    v
AGENT RUNTIME (CryptoClaw + our skill)                skill/src/
    |
    | 6. watches events, claims, works on task         skill/src/job_watcher.ts
    | 7. during work, pays for one API call via x402   skill/src/x402_paid_call.ts
    | 8. submits deliverable hash via submit()         skill/src/solver.ts
    v
GRADER SERVICE
    |
    | 9. fetches deliverable, runs pytest in sandbox   grader/app/sandbox.py
    | 10. signs verdict, calls evaluator on-chain      grader/app/evaluator_signer.py
    v
GRADER EVALUATOR (BSC testnet)                        contracts/src/GraderEvaluator.sol
    |
    | 11. verifies signer, relays complete() or reject()
    v
JOB CONTRACT -> releases escrow to agent on complete()
```

Repo slice owned here:

- `backend/contracts/` — Foundry project. `JobFactory.sol`, `GraderEvaluator.sol`, `interfaces/IERC8183.sol`. Tests in `backend/contracts/test/` including adversarial suite.
- `backend/grader/` — FastAPI service. `pytest_gen.py` (Claude-generated tests), `sandbox.py` (Docker runner), `evaluator_signer.py` (EIP-191 verdict signer), `x402_hint.py` (one x402-gated endpoint), `status.py`, `deliverables.py`, `tasks_store.py`.
- `backend/skill/` — TypeScript CryptoClaw skill. `job_watcher.ts`, `solver.ts`, `x402_paid_call.ts`, `grader_client.ts`, `status_server.ts`.
- `frontend/` — Next.js 14 app (wagmi + shadcn).
- `docs/` — API contract, deployed addresses, audits per phase.

## 3. Onchain proof

Network: **BSC Testnet (chainId 97)**.

| Artifact | Address |
|---|---|
| JobFactory | TBD (run `scripts/Deploy.s.sol`) |
| GraderEvaluator | TBD (run `scripts/Deploy.s.sol`) |
| ERC-8183 reference (BNBAgent SDK) | `0x3464e64dD53bC093c53050cE5114062765e9F1b6` |

Demo txs: see `bsc.address` at repo root.

The evaluator digest binds the job id, pass flag, and the evaluator contract address (`keccak256(abi.encode(jobId, passed, address(this)))`), ensuring a verdict signed for one evaluator cannot be replayed against another. Cross-chain replay via CREATE2-redeploy at the same address is documented as a limitation (see §Limitations).

## 4. Reproduction steps

Clone and initialise submodules:

```bash
git clone <repo>
cd hustleonchain
git submodule update --init --recursive
```

### Contracts

```bash
cd backend/contracts
forge test
```

Expected: **17 tests passed** (JobFactory 6, GraderEvaluator 4, Adversarial 7).

### Grader service

```bash
cd backend/grader
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest tests/ --ignore=tests/test_sandbox.py   # non-docker suite: 46 passed, 5 skipped
# full suite, requires Docker + prebuilt sandbox image:
docker build -t agentwork-sandbox -f Dockerfile.sandbox .
pytest tests/                                   # 53 passed (46 + 7 sandbox), 5 skipped without docker
```

Expected: **53 tests passed** end-to-end on a machine with Docker available.

### Skill

```bash
cd backend/skill
npm install
npm test
```

Expected: **41 tests passed** across 7 files, plus a clean `npm run build` to `dist/index.js`.

### Frontend

```bash
cd frontend
npm install
npm run build
```

### Optional live deploy + run

Populate `backend/contracts/.env` with `DEPLOYER_PRIVATE_KEY` and `GRADER_SIGNER_ADDRESS`, then:

```bash
cd backend/contracts
forge script script/Deploy.s.sol --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 --broadcast
```

Populate `backend/grader/.env` with `EVALUATOR_PRIVATE_KEY`, `JOB_FACTORY_ADDRESS`, `GRADER_EVALUATOR_ADDRESS`, `ANTHROPIC_API_KEY`, `RPC_URL`, and start the grader:

```bash
cd backend/grader
.venv/bin/uvicorn app.main:app --port 8000
```

Populate `backend/skill/.env` with `AGENT_PRIVATE_KEY`, `JOB_FACTORY_ADDRESS`, `GRADER_URL`, `RPC_URL`, and start the skill:

```bash
cd backend/skill
npm run build
node dist/index.js
```

Record the resulting tx hashes into `bsc.address`.

## 5. Demo walkthrough

1. Poster opens frontend, creates project "FizzBuzz Pro" with two milestones: (M1) basic FizzBuzz, (M2) FizzBuzz with custom divisors.
2. For each milestone, types function signature + acceptance criteria.
3. Grader (Claude) generates pytest; poster reviews the preview tests and approves.
4. Frontend deploys two ERC-8183 jobs via `JobFactory.createJob`, funds each with 1 test USDT via `JobFactory.fund`.
5. On machine B, the CryptoClaw-hosted skill watches `JobFunded` events, matches `provider == agent_address`, and posts "picked up job #N" to the CryptoClaw chat.
6. Agent calls `GET /api/v1/tasks/<hash>` on the grader, receives the function signature + criteria, and asks Claude to write a Python solution.
7. During solving, the agent hits `GET /x402/hint`, receives `HTTP 402`, pays `0.01` test USDT to the returned recipient via `USDT.transfer`, retries with `X-PAYMENT` JSON header, and receives the hint body. The terminal logs `[x402] paid 1000 to 0x... tx: 0x...`.
8. Agent `POST`s the solution to `/api/v1/deliverables`, then calls `JobFactory.submit(jobId, keccak256(solution))`.
9. Grader observes `JobSubmitted`, downloads deliverable, runs pytest inside the locked-down Docker sandbox, signs verdict with `EVALUATOR_PRIVATE_KEY`, and calls `GraderEvaluator.submitVerdict(jobId, true, signature)`. `JobCompleted` fires and 1 USDT is released to the agent.
10. For M2, agent submits a subtly buggy solution. Grader fails it; `JobRejected` fires and escrow is refunded to the poster.

Total demo time target: under 4 minutes.

## 6. Limitations

All items below are tracked in `docs/audits/` with severity labels and recommended fixes.

- **ChainId not bound in evaluator digest** (phase-1, F-1, MEDIUM). The `GraderEvaluator` signed message binds `address(this)` but not `block.chainid`. A CREATE2 redeploy at the same address on another chain would allow cross-chain replay. Acceptable on BSC testnet for the hackathon; planned fix is EIP-712 with domain separator.
- **Event naming delta** (phase-1, F-2, LOW). Blueprint specifies `JobRefunded`; implementation emits `JobExpired` + `Refunded`. All required information is still emitted; the frontend indexer maps the two events.
- **`complete` / `reject` ABI extension** (phase-1, F-3, LOW). Implementation adds a `string reason` parameter. Off-chain clients must know about it.
- **x402 replay guard is in-memory** (phase-2, LOW). `_USED_TX` lives in process memory; a grader restart would clear it. Persistent store (SQLite/JSON) is a Phase 4 follow-up.
- **Sandbox network fallback** (phase-2, LOW). When the prebuilt `agentwork-sandbox` Docker image is absent, the runner falls back to `python:3.11-slim` with `--network=bridge` so pytest can install. Mitigation: build the prebuilt image (`docker build -t agentwork-sandbox -f grader/Dockerfile.sandbox grader/`) and the runner uses `--network=none`.
- **Status push URL drift (fixed)** (phase-3, F-1, HIGH). Skill was pushing to `/api/v1/status/<agent_address>` while the grader exposes `/api/status/push`. Fixed in Phase 3 before commit.

See `docs/audits/phase-0.md` through `docs/audits/phase-3.md` for full detail.

## 7. Team and credits

- Backend (contracts, grader, skill): Builder + Auditor + Scribe agent triad, orchestrated via Claude Code.
- Frontend (poster + agent UI): separate track, see `CLAUDE_FRONTEND.md`.
- Credits: `bnb-chain/bnbagent-sdk` (ERC-8183 reference), `TermiX-official/cryptoclaw` (agent runtime), `erc-8004/erc-8004-contracts` (identity registries, optional), `NexusPaydv/NexusPay` (x402 facilitator reference), OpenZeppelin Contracts (ECDSA + ERC20), Foundry, FastAPI, viem.
