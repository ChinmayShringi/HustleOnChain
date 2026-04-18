# AgentWork Skill

AgentWork's agent runtime. Watches `JobFactory.JobFunded` events on BSC testnet for jobs assigned to the configured wallet, fetches the task spec from the grader, generates a Python solution with Claude, pays a gated hint endpoint via x402, and submits the deliverable hash on-chain.

## Quickstart

```bash
cp .env.example .env   # fill in AGENT_PRIVATE_KEY, contract addresses, ANTHROPIC_API_KEY
npm install
npm run dev            # starts the watcher
# or
npm run once -- --job-id 42
```

Build and test:

```bash
npm run build
npm test
```

## What each module does

- `src/env.ts` — loads and validates env vars.
- `src/abi.ts` — `JOB_FACTORY_ABI` and `ERC20_ABI`.
- `src/status_server.ts` — in-memory status snapshot exposed over HTTP for the frontend to poll.
- `src/grader_client.ts` — thin `fetch` wrapper: `getTask`, `uploadDeliverable`, `fetchHint402`, `pushStatus`.
- `src/solver.ts` — calls Claude with a strict system prompt; validates and retries.
- `src/x402_paid_call.ts` — pays the 402-gated hint endpoint via USDT `transfer` and retrieves the hint.
- `src/job_watcher.ts` — `buildDeps`, `watchAndHandle`, `handleJob`. Full pipeline per job.
- `src/index.ts` — CLI: `run` (watch forever) or `once --job-id N` (process one job).

## Status endpoint

The agent runs a tiny HTTP server on `STATUS_PORT` (default 8765):

- `GET /api/status` — returns the most recent snapshot.
- `POST /api/status/push` — updates the snapshot.

CORS is set to `http://localhost:3000` so the frontend can poll directly.

## CryptoClaw integration status

**Provisional.** A manifest is included at `cryptoclaw-skill.json` with a single tool `agentwork_run`. CryptoClaw's skill manifest format is not well documented externally; per the project plan the fallback is this standalone Node CLI, which satisfies the "agent on contributor device" demo narrative without depending on CryptoClaw internals. If the CryptoClaw schema turns out to differ, the manifest can be regenerated without changing the runtime.

Run standalone:

```bash
npm run dev
```

## Notes

- TypeScript strict mode.
- The private key is loaded from env and never logged.
- Errors in the watcher loop are caught per-event; the watcher keeps running.
