# Dev setup

This repo has three backend workspaces under `backend/`: `backend/contracts/` (Foundry), `backend/grader/` (Python FastAPI), and `backend/skill/` (TypeScript CryptoClaw skill). The Next.js app lives under `frontend/`. Follow the numbered steps below to replicate a working local environment.

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
4. Build contracts: `cd backend/contracts && forge build && forge test`. Return to repo root with `cd ../..`.
5. Create the grader virtualenv: `python3 -m venv backend/grader/.venv`.
6. Install grader dependencies: `backend/grader/.venv/bin/pip install -r backend/grader/requirements.txt`.
7. Copy env template: `cp backend/grader/.env.example backend/grader/.env`, then fill in `EVALUATOR_PRIVATE_KEY`, `ANTHROPIC_API_KEY`, and `GRADER_EVALUATOR_ADDRESS`. Never commit `backend/grader/.env`.
8. Start the grader locally: `cd backend/grader && .venv/bin/uvicorn app.main:app --reload --port 8765`. Confirm with `curl http://127.0.0.1:8765/healthz`.
9. Install skill dependencies: `cd backend/skill && npm install`.
10. Copy skill env template: `cp .env.example .env`, then fill in `AGENT_PRIVATE_KEY`, `GRADER_URL`, `ERC8183_ADDRESS`, and `GRADER_EVALUATOR_ADDRESS`.
11. Install CryptoClaw manually on the machine that will run the agent: `npm i -g @termix-it/cryptoclaw && cryptoclaw onboard`. Do not run this as part of automated setup.
12. Install frontend dependencies: `cd frontend && npm install`, then `npm run dev` to start the Next.js app.
13. Record any new deployed addresses in `docs/addresses.md`.
