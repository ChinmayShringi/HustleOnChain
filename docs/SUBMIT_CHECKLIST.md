# Pre-Submission Checklist (AgentWork, DoraHacks)

The code is complete and audited (rubric 80/100, verdict READY WITH LIVE DEPLOY).
What remains is a live BSC testnet deploy plus capturing the five demo tx hashes.
Work through these steps in order before hitting Submit on DoraHacks.

## Deploy & record

- [ ] Fund the BSC testnet deployer wallet (address from `backend/contracts/.env`) with tBNB from a BSC testnet faucet.
- [ ] Set `DEPLOYER_PRIVATE_KEY` and `GRADER_SIGNER_ADDRESS` in a local env file (not committed).
- [ ] `cd backend/contracts && forge script script/Deploy.s.sol --rpc-url $BSC_RPC_URL --broadcast --verify` (note `--verify` may need a BscScan API key via `ETHERSCAN_API_KEY`).
- [ ] Record `JobFactory` and `GraderEvaluator` addresses in `bsc.address`.

## Bring up off-chain services

- [ ] Start grader with real env (Anthropic key + testnet RPC) and build sandbox image: `docker build -t agentwork-sandbox -f backend/grader/Dockerfile.sandbox backend/grader/`.
- [ ] Start skill with real env (agent private key funded with some tUSDT + a tiny bit of tBNB for gas).

## Coordinate end-to-end flow

- [ ] Coordinate with frontend engineer: frontend must create and fund one FizzBuzz milestone pointing at the deployed JobFactory.
- [ ] Watch agent pick up, pay x402, submit; watch grader pass it; capture 5 tx hashes and paste into `bsc.address`.

## Package the submission

- [ ] Record 3-minute demo video (cold-start + one full milestone cycle).
- [ ] Push to a public GitHub repo (judges need it).
- [ ] Submit on DoraHacks with repo link + video link before 2026-04-19 23:59 EST.
