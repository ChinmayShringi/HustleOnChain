# CLAUDE.md — Frontend Engineer (Poster UI + Agent Observer)

You own: the web app. Poster creates projects, funds them, watches agents work, sees payouts.
You do NOT own: Solidity, the grader, the CryptoClaw skill. That's the other engineer.

**Read `BLUEPRINT.md` first.** All locked decisions live there. Do not change them unilaterally.

## Ground rules

- No em dashes in commit messages, docs, or UI copy.
- Don't wait for contracts to be finalized to start. Use the ABIs and event schemas in `BLUEPRINT.md` and stub a local mock.
- Every phase ends with a working demo path. If the end-of-phase demo does not run, do not start the next phase.
- `research/` is read-only. All output goes in `frontend/` and `docs/`.

## Repo layout (your slice)

```
/frontend/
  app/                     # Next.js 14 app router
    page.tsx               # Home: list of projects
    create/page.tsx        # Create a project
    project/[id]/page.tsx  # Project detail with milestones
  components/
    MilestoneCard.tsx
    CreateMilestoneForm.tsx
    AgentStatusBadge.tsx
    PytestPreview.tsx      # Shows LLM-generated tests to poster before funding
    EventFeed.tsx          # Live feed of on-chain events
  lib/
    wagmi.ts               # Wagmi + viem config for BSC testnet
    abi/
      JobFactory.ts
      GraderEvaluator.ts
    grader.ts              # Typed wrapper for grader API
  public/
  package.json
  next.config.js
/docs/
  ui-notes.md              # Design decisions
```

## Stack

- Next.js 14 (app router) + TypeScript
- wagmi v2 + viem for wallet + contracts
- RainbowKit for wallet connect
- Tailwind + shadcn/ui for components
- React Query (already bundled with wagmi)

No Redux, no Zustand, no extra state libs. React Query handles it.

---

## Phase 0 — Setup (Day 1, ~3 hours)

Goal: app skeleton on localhost, wallet connects to BSC testnet.

- [ ] `npx create-next-app@latest frontend --typescript --tailwind --app`.
- [ ] Install: `wagmi viem @rainbow-me/rainbowkit @tanstack/react-query`.
- [ ] Configure wagmi for BSC testnet (chainId 97, RPC `https://data-seed-prebsc-1-s1.binance.org:8545/`).
- [ ] Add RainbowKit wallet connect button to the home page.
- [ ] Set up shadcn/ui: `npx shadcn@latest init`, add `button`, `card`, `input`, `textarea`, `toast`.
- [ ] Write a one-paragraph `docs/dev-setup.md`.

**End of Phase 0 demo:** `npm run dev`, home page loads, "Connect Wallet" works with MetaMask on BSC testnet.

---

## Phase 1 — Project Creation Flow (Days 2 to 5)

Goal: poster can create a project with multiple milestones, see LLM-generated tests, approve, and fund.

You can start this before contracts are deployed. Use mock ABIs and a local MSW (Mock Service Worker) handler for the grader API.

### Task 1.1 — Home page (project list)

- [ ] `app/page.tsx`: shows a list of projects the connected wallet has created.
- [ ] For v1, store project-to-milestone mapping in localStorage keyed by wallet address. (We don't want to build a backend just for project grouping. The grader service's DB is authoritative for grading; localStorage is enough for UI.)
- [ ] Empty state: "No projects yet. Create one."
- [ ] "New Project" button.

### Task 1.2 — Create project page

- [ ] `app/create/page.tsx`: form with project title (string) + list of milestones.
- [ ] Each milestone has: function signature (textarea), acceptance criteria (textarea), bounty amount (number, USDT), assigned agent address (string, for demo we pick the agent manually).
- [ ] "Add milestone" button adds another row.
- [ ] "Generate Tests" button calls `POST /api/v1/grader/generate` for each milestone.

### Task 1.3 — Pytest preview

- [ ] `components/PytestPreview.tsx`: shows the generated pytest file in a syntax-highlighted code block. Use `shiki` or `prism-react-renderer`.
- [ ] Show the list of test names as chips above the code.
- [ ] "Looks good" / "Regenerate" buttons. Regenerate calls the grader API again with the same inputs.
- [ ] Only when poster approves all previews does the "Fund Project" button enable.

### Task 1.4 — Funding flow

- [ ] "Fund Project" button kicks off a multi-transaction flow:
  1. Approve USDT to `JobFactory` for the total amount.
  2. For each milestone, call `JobFactory.createJob(provider, evaluator, expiresAt, taskHash, address(0))`.
  3. For each milestone, call `JobFactory.fund(jobId, usdt, amount)`.
- [ ] Show a step-by-step progress UI so poster sees what's happening. (MetaMask will pop N+1 times, total. Warn them.)
- [ ] On success, redirect to `/project/<id>`.
- [ ] Store the project-to-jobIds mapping in localStorage.

**End of Phase 1 demo:** poster connects wallet, goes to `/create`, types a FizzBuzz project with 2 milestones, sees pytest previews, approves, funds. Redirects to `/project/<id>` showing 2 funded milestones in "awaiting claim" state. Confirm on BscScan testnet that 2 jobs were created and funded.

---

## Phase 2 — Project Detail + Event Feed (Days 6 to 9)

Goal: watch jobs progress through their lifecycle in real time.

### Task 2.1 — Project detail page

- [ ] `app/project/[id]/page.tsx`: header with project title, total escrow, status summary (e.g., "1 of 2 milestones complete").
- [ ] Grid of `MilestoneCard` components, one per milestone.

### Task 2.2 — MilestoneCard

States to handle, each with its own visual:
- **Awaiting claim** (funded, no submission yet)
- **In progress** (some off-chain signal from agent, see Task 2.3)
- **Submitted** (provider called `submit`, awaiting grader)
- **Passed** (grader called `complete`, funds released)
- **Failed** (grader called `reject`, funds refunded to poster)
- **Expired** (expiresAt passed with no submission, poster can refund)

Each card shows: function signature (truncated), bounty, assigned agent (truncated address with copy button), current state, BscScan link.

### Task 2.3 — Event watching

- [ ] Use wagmi's `useWatchContractEvent` for each of: `JobFunded`, `JobSubmitted`, `JobCompleted`, `JobRejected`, `JobRefunded`.
- [ ] Filter events to only the jobIds belonging to this project (from localStorage).
- [ ] When an event matches, invalidate the React Query cache for the milestone and re-fetch state.
- [ ] Fire a toast on state transition.

### Task 2.4 — Event feed component

- [ ] `components/EventFeed.tsx`: a vertical timeline of events for this project. Right-side sidebar.
- [ ] Each entry: timestamp, event name, tx hash (BscScan link), human-readable description.
- [ ] Example: "2:34pm — Agent 0xabc...def claimed milestone 'fizzbuzz basic' — view tx".

### Task 2.5 — Refund flow

- [ ] If a milestone is in "expired" or "failed" state and poster is connected, show "Reclaim funds" button.
- [ ] Calls `JobFactory.claimRefund(jobId)` (or automatically released on reject; check contract behavior with backend engineer).

**End of Phase 2 demo:** poster funds a project. On a second machine, backend engineer manually pokes the contracts through the lifecycle using `cast`. Frontend updates live with each event.

---

## Phase 3 — Agent Status + x402 Display (Days 10 to 13)

Goal: make the agent's activity visible in the UI so the demo feels alive.

### Task 3.1 — Agent status polling

The CryptoClaw skill exposes a local HTTP endpoint (backend engineer owns this) that reports what the agent is currently doing. For the demo, poll it from the frontend.

- [ ] `GET http://<agent-host>:<port>/api/status` returns `{ job_id, state: "idle" | "claiming" | "solving" | "paying_x402" | "submitting", message }`.
- [ ] For the demo, hardcode the agent host in localStorage. (Multi-agent is future work.)
- [ ] Show agent status as a banner on the project detail page.

### Task 3.2 — x402 payment toast

- [ ] When agent status is `paying_x402`, show a distinct toast: "Agent paid 0.01 USDT via x402 for API access" with a BscScan link to the payment tx.
- [ ] This is the money shot of the demo. Make it visually clear that this is an agent paying for its own tools mid-task.

### Task 3.3 — Pytest run output

- [ ] When grader returns a verdict, show the pytest stdout in a collapsible panel on the milestone card.
- [ ] On fail: highlight which tests failed.
- [ ] On pass: show "All 6 tests passed" with a green check.

**End of Phase 3 demo:** run the full demo script from `BLUEPRINT.md` end to end. Frontend must show: project creation, pytest preview, funding, agent claim, x402 payment toast, submission, grader verdict, payout. All without manual intervention after funding.

---

## Phase 4 — Polish + Submission (Days 14 to 17)

- [ ] Run the demo script cold 3 times, fix jank.
- [ ] Add a 30-second "how it works" explainer on the landing page. Three cards: Post, Work, Verify.
- [ ] Make it look good on a projector (large text, high contrast, no tiny gray on white).
- [ ] Add copy that says what's real and what's future work.
- [ ] Deploy the frontend somewhere public (Vercel is fine).
- [ ] Record demo video (you + backend engineer together, one take if possible).
- [ ] Contribute to `docs/TECHNICAL.md` with a frontend section: stack, how to run, env vars.
- [ ] Contribute to `docs/AI_BUILD_LOG.md` with frontend prompts that worked.

## Known risks and mitigations

- **Risk:** Contract ABIs change late. **Mitigation:** generate TypeScript types from ABIs via `wagmi cli` so the compiler catches drift immediately.
- **Risk:** Event watching misses events on reconnect. **Mitigation:** on mount, also fetch past events via `useQuery` + `getLogs` from a reasonable fromBlock.
- **Risk:** localStorage loss kills project data. **Mitigation:** add a "restore from chain" button that reads all JobCreated events where the connected wallet is the client, and reconstructs project groups using an on-chain "projectId" field (coordinate with backend: ask them to add `bytes32 projectId` as a param to `createJob`, which gets emitted in the event).
- **Risk:** Mobile responsiveness eats into time. **Mitigation:** demo is desktop-only. Design for 1920x1080. Don't waste time on mobile.

## Coordination with backend engineer

You block on them for:
- Contract ABIs (needed for typed wagmi calls).
- Deployed contract addresses (blocks Phase 1 Task 1.4).
- Grader API being live (blocks Phase 1 Task 1.3, but you can mock it with MSW until then).
- Agent status endpoint (blocks Phase 3 Task 3.1).

Things they need from you:
- Feedback on which events they need to emit (if any additional indexed params would help UI filtering, ask on day 1).
- Feedback on whether `bytes32 projectId` should be part of `createJob` so the UI can group from chain state.

## Daily sync checklist

Each morning, answer in one line each in a shared doc:
1. What I shipped yesterday.
2. What I'm shipping today.
3. What I need from backend engineer.
