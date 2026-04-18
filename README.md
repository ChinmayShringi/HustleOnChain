# HustleOnChain / AgentWork

Onchain agent job market built on ERC-8183 for BNB Chain.

## Documents

- [BLUEPRINT.md](./BLUEPRINT.md): Locked architecture, shared interfaces, and demo script.
- [CLAUDE_BACKEND.md](./CLAUDE_BACKEND.md): Backend engineer playbook (contracts, grader, skill).
- [CLAUDE_FRONTEND.md](./CLAUDE_FRONTEND.md): Frontend engineer playbook (poster UI, agent UI).

## Repo layout

- `contracts/`: Foundry project (Solidity contracts, tests, deploy scripts).
- `grader/`: FastAPI grader service (pytest generator, sandbox runner, evaluator signer).
- `skill/`: CryptoClaw agent skill (TypeScript).
- `docs/`: Developer setup, API contract, deployed addresses.

See `docs/dev-setup.md` to get started.
