# Frontend Integration Plan — AgentWork

**Goal:** wire the Next.js frontend (`frontend/`) to the live backend (BSC testnet contracts + Railway-hosted grader) so a non-technical judge can click through the entire job lifecycle in a browser on a public URL.

**Deadline context:** DoraHacks submission 2026-04-19 23:59 EST. CLI-based submission is already live; this plan upgrades the demo to a wired browser flow.

## Target end-to-end flow

1. Judge lands on Vercel-deployed frontend.
2. Clicks **Connect Wallet** (RainbowKit → MetaMask on BSC testnet, chainId 97).
3. `/create` wizard: enters function signature + acceptance criteria → clicks **Generate Tests** → grader returns pytest preview + `pytest_hash`.
4. `/create/preview`: reviews preview tests → clicks **Proceed**.
5. `/create/funding`: approves `tUSDT` → calls `JobFactory.createJob` → `JobFactory.fund` — on-chain tx hashes shown live.
6. Redirect to `/project/[jobId]`: reads `JobFactory.jobs(jobId)` + `JobSubmitted` events, polls `/api/status` for agent state, displays x402 payment tx, final `JobCompleted` tx.
7. `/markets` + home: reads live `JobCreated/Funded/Completed` events from BSC testnet RPC.

## Architecture

```
Browser (Vercel)
  │
  ├── wagmi + viem → BSC testnet RPC (reads + writes to JobFactory/GraderEvaluator/tUSDT)
  │
  └── NEXT_PUBLIC_GRADER_URL → Railway-hosted grader (FastAPI)
         │
         └── Evaluator signer → BSC testnet (submitVerdict on JobCompleted)

Agent (local or Railway-hosted skill)
  │
  ├── viem.watchContractEvent → JobFunded
  ├── solver → deliverable upload → JobFactory.submit
  └── POST /api/status/push → grader (frontend polls)
```

## Folder structure (frontend)

```
frontend/src/
├── app/                         # routes (existing)
├── components/                  # existing + new transaction-aware UI
│   └── wiring/                  # NEW — ConnectButton, ChainGate, TxToast
├── lib/
│   ├── wagmi.ts                 # existing — extend with chain + contracts
│   ├── contracts/               # NEW — address book + ABIs
│   │   ├── addresses.ts
│   │   ├── jobFactory.abi.ts
│   │   ├── graderEvaluator.abi.ts
│   │   └── erc20.abi.ts
│   ├── grader/                  # NEW — REST client
│   │   ├── client.ts
│   │   └── types.ts
│   ├── hooks/                   # NEW — domain hooks
│   │   ├── useCreateJob.ts
│   │   ├── useFundJob.ts
│   │   ├── useJob.ts            # reads a single job
│   │   ├── useJobEvents.ts      # reads JobCreated/Funded/Completed via getLogs
│   │   └── useAgentStatus.ts    # polls grader /api/status
│   └── utils.ts                 # existing
└── types/                        # NEW — shared TS types for JobState enum
```

## Phases

Each phase uses the **3-agent-per-task pattern**:
- **Builder** — writes the code.
- **Auditor** — writes test cases + reviews Builder output vs requirements.
- **Scribe** — updates docs, commits with conventional message, updates memory.

### Phase F0 — Foundations (sequential, blocks everything else)

**Builder**
- Deploy grader to Railway (Dockerfile in `backend/grader/`). Env: `GRADER_EVALUATOR_PRIVATE_KEY`, `JOB_FACTORY_ADDRESS`, `GRADER_EVALUATOR_ADDRESS`, `BSC_RPC_URL`, `ANTHROPIC_API_KEY`, `CORS_ALLOW_ORIGINS`.
- Enable CORS for `https://*.vercel.app` + localhost.
- Add `frontend/.env.local.example` + `frontend/src/lib/contracts/*` ABIs + address book.
- Add RainbowKit `<ConnectButton />` to `FloatingHeader`.
- Add `ChainGate` HOC that shows "Switch to BSC Testnet" banner when connected to wrong chain.
- Add `useToast` wiring via sonner.

**Auditor**
- Verify: grader `/healthz` returns 200 from public URL; CORS headers correct via `curl -H "Origin: https://...vercel.app"`.
- Verify: wallet connect on BSC testnet does not revert; chain switch prompt fires on mainnet.
- Verify: ABIs match `backend/contracts/out/*.json` (regression lock).

**Scribe**
- `docs/DEPLOY_GRADER.md` (Railway steps).
- Commit: `feat(f0): foundation — grader on Railway, wallet connect, ABI lib`.
- Update `memory/reference_repo_layout.md` with new `frontend/src/lib/` subdirs.

### Phase F1 — Create flow (`/create` → `/preview` → `/funding`)

**Builder**
- Wire `/create/page.tsx` form to `POST ${GRADER_URL}/api/v1/grader/generate`. Persist response to sessionStorage (`pytest_hash`, `pytest_uri`, `preview_tests`, `evaluator_address`).
- `/create/preview/page.tsx`: fetch `${GRADER_URL}/tests/{hash}` + syntax-highlight via shiki. Regenerate button reruns F1 step 1.
- `/create/funding/page.tsx`: multi-step tx UI:
  1. `tUSDT.approve(jobFactory, amount)` via `useWriteContract`.
  2. `JobFactory.createJob({provider, taskHash, paymentToken, amount, expiresAt, hook:0, hookParams:'0x'})` — parse `JobCreated` event for `jobId` from receipt logs.
  3. `JobFactory.fund(jobId)`.
  4. Redirect to `/project/[jobId]`.
- All steps show tx hash, block explorer link, spinner, and sonner toast on success/revert.

**Auditor**
- Playwright test (against Vercel preview): fill form → generate tests → approve → create → fund → land on `/project/1` (uses a throwaway wallet).
- Verify `taskHash` sent on-chain matches `pytest_hash` returned by grader (critical integrity link).
- Verify form validation: empty signature rejected, negative amount rejected.

**Scribe**
- Update `docs/api.md` with frontend→grader request/response examples.
- Commit: `feat(f1): wire create→preview→funding wizard to grader + on-chain`.
- Update `memory/feedback_api_drift.md` if any drift caught.

### Phase F2 — Project page (`/project/[id]`)

**Builder**
- `useJob(jobId)` — reads `JobFactory.jobs(jobId)` (client, provider, paymentToken, amount, taskHash, state, expiresAt).
- `useAgentStatus(jobId)` — polls `${GRADER_URL}/api/status` every 3s.
- `useJobEvents(jobId)` — `viem.getLogs` for `JobFunded/Submitted/Completed/Rejected` filtered by `jobId`, plus grader-signed `VerdictSubmitted`.
- Page renders: current state badge, agent status pill, escrow amount, timeline of on-chain events with tx hash + timestamp + explorer link, x402 payment card if agent pushed `paying_x402` status.
- Client-only poster controls: `claimRefund` button visible when state=Expired.

**Auditor**
- Playwright: seed a funded job via helper script, assert page shows Funded → Submitted → Completed transitions when agent runs.
- Verify no state desync: refresh page mid-lifecycle, all events re-hydrate from chain.
- Verify polling stops when `state=Completed|Rejected` (no runaway fetch).

**Scribe**
- Update `docs/TECHNICAL.md` §5 demo walkthrough with new browser UI.
- Commit: `feat(f2): /project/[id] live chain + agent status view`.

### Phase F3 — Markets + home (read-only live data)

**Builder**
- `useMarketStats()` — aggregates `getLogs` over last N blocks for totals: escrow, active jobs, settled value, verifier load (verdict count / time window), x402 spend (Transfer events to grader signer).
- Replace static arrays in `src/app/page.tsx` and `src/app/markets/page.tsx` with the hook.
- Each tranche card links to `/project/[id]`.
- Skeleton loading states; empty state when 0 jobs on testnet.

**Auditor**
- Unit tests for log aggregation (fixture blocks → expected stats).
- Visual check: home page KPIs match BscScan for test jobs.

**Scribe**
- Commit: `feat(f3): live markets + home from chain events`.

### Phase F4 — Polish

**Builder**
- x402 viewer inside `/project/[id]` — pretty panel showing the 0.01 tUSDT payment tx with decoded `X-PAYMENT` header.
- `MarketMesh` node hover pulls real job data.
- Error boundaries on every page with sonner toast fallback.
- Favicon + OG meta (DoraHacks thumbnail).

**Auditor**
- Lighthouse run; a11y ≥ 90.
- Regression: full F1+F2+F3 Playwright run on Vercel production URL.

**Scribe**
- Update Obsidian `/Projects/hustleonchain/README.md` with the browser flow URL.
- Commit: `feat(f4): polish — x402 viewer, mesh wiring, error boundaries`.
- Final DoraHacks submission text draft in `docs/SUBMISSION_TEXT.md`.

## Execution order

```
F0 (sequential, ~45min)
 ↓
F1 ∥ F2 ∥ F3 (parallel Builder dispatch — each followed by its own Auditor, then Scribe)
 ↓
F4 (sequential polish + Auditor regression)
 ↓
Vercel prod deploy + demo video re-record
```

## Assumptions

1. User funds the deployer wallet with 0.1+ tBNB so demo jobs can be created on Vercel.
2. Railway free tier is acceptable for grader (24h demo window).
3. One throwaway "demo wallet" private key will be surfaced via `NEXT_PUBLIC_DEMO_AGENT_ADDRESS` for judges who don't want to install MetaMask — they'll just watch the agent side on a screen.
4. No IPFS — deliverables stay on grader HTTP storage (already working).

## Verification (end-to-end)

A judge, with nothing but MetaMask + tBNB, should be able to:
1. Open Vercel URL.
2. Connect wallet.
3. Create + fund a FizzBuzz job in under 90 seconds.
4. Watch agent (running on our demo box) complete it on-screen via the `/project` page.
5. See tUSDT arrive in their wallet (if they picked themselves as provider) or in the demo-agent wallet.
