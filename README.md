# AgentWork

Onchain agent job market built on ERC-8183 for BNB Smart Chain.

## Pitch

AgentWork is a milestone-based onchain work marketplace where AI agents (running on contributor devices via a CryptoClaw skill) claim jobs posted as ERC-8183 contracts on BNB Chain, complete the work, and receive automatic payment upon passing an AI-generated deterministic pytest grader. Posters describe work as a function signature plus acceptance criteria; the grader generates reviewable tests with Claude; the agent solves, pays for one x402-gated API call, submits, and gets paid when the signed grader verdict lands on-chain.

## Prize track

**AI x Onchain.** Target chain: BNB Smart Chain Testnet (chainId 97). Bonus track submission: `docs/AI_BUILD_LOG.md`.

## Architecture (condensed)

```
poster -> frontend -> grader (Claude -> pytest) -> ERC-8183 Job on BSC
                                                       |
                                                       v
agent (CryptoClaw skill) -> x402 pay -> solve -> submit deliverable
                                                       |
                                                       v
grader sandbox (docker) -> sign verdict -> GraderEvaluator -> release escrow
```

Full text diagram with repo-path annotations in `docs/TECHNICAL.md`.

## Reproduce in three commands

```bash
cd contracts && forge test                                   # 17 passed
cd ../grader && pytest tests/ --ignore=tests/test_sandbox.py # 45 passed, 5 skipped (52 w/ docker)
cd ../skill && npm install && npm test                       # 37 passed
```

For the full live reproduction walkthrough (deploy, run grader, run skill, demo txs), see `docs/TECHNICAL.md` §Reproduction steps.

## Status

- contracts: 17/17 passed
- grader:    52/52 passed (requires Docker sandbox image; 45/45 without)
- skill:     37/37 passed
- build:     `npm run build` clean; `forge build` clean

## Links

- [BLUEPRINT.md](./BLUEPRINT.md) — locked architecture and demo script
- [docs/TECHNICAL.md](./docs/TECHNICAL.md) — technical submission document
- [docs/AI_BUILD_LOG.md](./docs/AI_BUILD_LOG.md) — bonus track: how we used Claude Code
- [docs/audits/](./docs/audits/) — per-phase audit reports (0 through 3)
- [docs/api.md](./docs/api.md) — grader API contract
- [docs/addresses.md](./docs/addresses.md) — deployed addresses (BSC testnet)
- [bsc.address](./bsc.address) — judge-readable deployment summary
- [scripts/demo.sh](./scripts/demo.sh) — narrated cold-start demo dry-run
- [CLAUDE_BACKEND.md](./CLAUDE_BACKEND.md) — backend engineer playbook
- [CLAUDE_FRONTEND.md](./CLAUDE_FRONTEND.md) — frontend engineer playbook

## Repo layout

- `contracts/` — Foundry project: `JobFactory.sol`, `GraderEvaluator.sol`, tests, deploy script.
- `grader/` — FastAPI service: pytest generator, Docker sandbox, verdict signer, x402-gated hint route.
- `skill/` — TypeScript CryptoClaw skill: job watcher, solver, x402 pay flow.
- `docs/` — technical doc, audits, API contract, addresses, dev setup.
- `scripts/` — demo helper scripts.
