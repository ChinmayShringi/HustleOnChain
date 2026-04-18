# Dev setup

This repo has three workspaces: `contracts/` (Foundry), `grader/` (Python FastAPI), and `skill/` (TypeScript CryptoClaw skill). Follow the numbered steps below to replicate a working local environment.

## Prerequisites

Install these before running the steps below:

- Python >= 3.11
- Node >= 20
- Foundry (forge, cast, anvil)
- Docker

## Steps

1. Clone the repo and `cd hustleonchain`.
2. Initialize git submodules: `git submodule update --init --recursive`.
3. Install Foundry: `curl -L https://foundry.paradigm.xyz | bash && foundryup`. Verify with `forge --version`.
4. Build contracts: `cd contracts && forge build && forge test`. Return to repo root with `cd ..`.
5. Create the grader virtualenv: `python3 -m venv grader/.venv`.
6. Install grader dependencies: `grader/.venv/bin/pip install -r grader/requirements.txt`.
7. Copy env template: `cp grader/.env.example grader/.env`, then fill in `EVALUATOR_PRIVATE_KEY`, `ANTHROPIC_API_KEY`, and `GRADER_EVALUATOR_ADDRESS`. Never commit `grader/.env`.
8. Start the grader locally: `grader/.venv/bin/uvicorn grader.app.main:app --reload --port 8765`. Confirm with `curl http://127.0.0.1:8765/healthz`.
9. Install skill dependencies: `cd skill && npm install`.
10. Copy skill env template: `cp .env.example .env`, then fill in `AGENT_PRIVATE_KEY`, `GRADER_URL`, `ERC8183_ADDRESS`, and `GRADER_EVALUATOR_ADDRESS`.
11. Install CryptoClaw manually on the machine that will run the agent: `npm i -g @termix-it/cryptoclaw && cryptoclaw onboard`. Do not run this as part of automated setup.
12. Record any new deployed addresses in `docs/addresses.md`.
