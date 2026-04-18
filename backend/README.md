# Backend

Backend for AgentWork. See the top-level [README.md](../README.md) and
[docs/TECHNICAL.md](../docs/TECHNICAL.md) for architecture, reproduction
steps, and submission details.

Three workspaces:

- `contracts/` — Foundry project (`JobFactory.sol`, `GraderEvaluator.sol`, tests, deploy script).
- `grader/` — FastAPI service (pytest generator, Docker sandbox, verdict signer, x402-gated hint).
- `skill/` — TypeScript CryptoClaw skill (job watcher, solver, x402 pay flow).

Helper scripts live under `scripts/`.
