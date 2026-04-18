# Blueprint — AgentWork (working title)

Shared source of truth. Both backend and frontend engineers read this before starting.

## One-line pitch

A milestone-based onchain work marketplace where AI agents (running on contributor devices via CryptoClaw) claim jobs posted as ERC-8183 contracts on BNB Chain, complete work, and receive automatic payment on passing an AI-generated deterministic pytest grader.

## Locked decisions (do not re-litigate without the other engineer)

1. **Agent runtime.** CryptoClaw as plugin/skill base. We ship a CryptoClaw skill, not a fork.
2. **Protocol.** ERC-8183 Agentic Commerce for jobs + escrow. ERC-8004 for agent identity (optional if time tight).
3. **Milestones.** One ERC-8183 Job per milestone. Frontend groups them visually as a single "project." Multi-milestone-in-one-job is future work.
4. **Task type for demo.** Python function matching a given type signature. Poster provides signature + natural-language acceptance criteria. Grader generates pytest cases at job-creation time.
5. **Verifier trust model.** Single off-chain grader service signs verdicts with a known key. Evaluator contract accepts signed messages from that key. Document this as v1 limitation; v2 migrates to UMA Optimistic Oracle per BNBAgent SDK pattern.
6. **Chain.** BSC testnet for all demo work. Mainnet only if everything works by week 4.
7. **Storage.** Deliverables stored off-chain (simple S3-compatible or local). Greenfield only if time allows.
8. **x402.** Exactly one visible integration: during task execution, the agent pays for one gated API call via x402 on BSC (use NexusPay facilitator).

## What we are NOT building

- Full DePIN worker/device network
- Staking / slashing
- Bidding / auction markets
- Multi-grader consensus
- Dispute UI (UMA is documented, not built)
- Multiple task types
- Mainnet deployment (unless week 4 permits)

## Repos we depend on

| Repo | Purpose | Status |
|------|---------|--------|
| `bnb-chain/bnbagent-sdk` | Reference for ERC-8183 on BNB, Python patterns | Live, not a hard dependency |
| `TermiX-official/cryptoclaw` | Agent runtime, we build a skill on top | Active, 280+ stars |
| `erc-8004/erc-8004-contracts` | Identity + reputation registries | Stable, deployed on 20+ chains |
| `NexusPaydv/NexusPay` | x402 facilitator for BSC | Reference for x402 demo call |

## System diagram (text)

```
POSTER (browser)
    |
    | 1. creates project with milestones + acceptance criteria
    v
FRONTEND (Next.js on BSC testnet)
    |
    | 2. calls grader service to generate pytest
    v
GRADER SERVICE (FastAPI, off-chain)
    |
    | 3. returns pytest hash + evaluator address
    v
FRONTEND
    |
    | 4. for each milestone, creates + funds ERC-8183 Job
    v
JOB CONTRACT (BSC testnet)
    |
    | 5. emits JobFunded event
    v
AGENT RUNTIME (CryptoClaw + our skill, on contributor device)
    |
    | 6. watches events, claims via updateBudget, works on task
    | 7. during work, pays for one API call via x402 (NexusPay)
    | 8. submits deliverable hash via submit()
    v
GRADER SERVICE
    |
    | 9. fetches deliverable, runs pytest in sandbox
    | 10. signs verdict, calls complete() or reject() on-chain
    v
JOB CONTRACT
    |
    | 11. releases escrow to agent on complete()
```

## Contract addresses (fill in as deployed)

```
BSC Testnet (chainId 97):
  JobFactory:        0x____
  GraderEvaluator:   0x____
  IdentityRegistry:  0x____ (from erc-8004-contracts)
  USDT (test):       0x____
  NexusPay x402:     0x____
```

## Shared interfaces (both engineers must agree on these)

### Grader service API (backend owns, frontend calls)

**`POST /api/v1/grader/generate`**
```json
// Request
{
  "function_signature": "def fizzbuzz(n: int) -> list[str]:",
  "acceptance_criteria": "Return the classic FizzBuzz list up to n inclusive. Multiples of 3 -> 'Fizz', multiples of 5 -> 'Buzz', both -> 'FizzBuzz', else the number as string."
}
// Response
{
  "pytest_hash": "0xabc...",          // keccak256 of generated pytest file
  "pytest_uri": "ipfs://... or https://grader.example/tests/abc",
  "evaluator_address": "0x...",       // GraderEvaluator contract address
  "preview_tests": ["test_fizzbuzz_basic", "test_edge_zero", "..."]
}
```

**`POST /api/v1/grader/submit`** (called by agent after doing the work)
```json
// Request
{
  "job_id": "0x...",
  "deliverable_uri": "https://... or ipfs://...",
  "agent_address": "0x..."
}
// Response
{
  "verdict": "pass" | "fail",
  "tx_hash": "0x...",                 // grader's on-chain complete/reject tx
  "test_output": "...",               // pytest stdout for debugging
  "failed_tests": []                  // empty on pass
}
```

### Event contract (frontend watches, backend emits on-chain)

All events are standard ERC-8183 events. Frontend filters by project ID (we store project grouping off-chain in grader DB).

## Demo script (rehearse this)

1. Poster opens frontend, creates project "FizzBuzz Pro" with 2 milestones: (M1) basic fizzbuzz, (M2) fizzbuzz with custom divisors.
2. For each milestone, types function signature + acceptance criteria.
3. Grader generates pytest, poster reviews, approves.
4. Frontend deploys 2 ERC-8183 Jobs, funds each with 1 USDT test token.
5. Agent running CryptoClaw on a second machine picks up M1 event, shows "claimed job" toast.
6. Agent writes Python solution, during work makes one x402-paid call to an API (show the payment in terminal).
7. Agent submits deliverable. Grader runs pytest, shows pass.
8. Frontend shows M1 complete, 1 USDT moved to agent wallet. Explorer link proves it.
9. Repeat for M2 with a subtle bug. Grader fails it, shows which test failed.
10. Agent re-submits, passes.

Total demo time target: under 4 minutes.
