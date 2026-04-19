# Pre-Submission Checklist (AgentWork, DoraHacks)

## Deploy & record

- [x] Fund the BSC testnet deployer wallet. Deployer `0xB50F397d52f9E19ec60130aE11967bd0bB03275b` seeded 2026-04-18: 0.0025 BNB on mainnet (to bypass faucet sybil check) + 0.3 tBNB from the official faucet.
- [x] Set `DEPLOYER_PRIVATE_KEY` and `GRADER_SIGNER_ADDRESS` in `backend/.env.testnet` (gitignored).
- [x] `cd backend/contracts && forge script script/DeployAll.s.sol --rpc-url $BSC_RPC_URL --broadcast`. Deployed JobFactory, GraderEvaluator, and a MockERC20 tUSDT in a single broadcast.
- [x] Record `JobFactory`, `GraderEvaluator`, and `tUSDT` in `bsc.address`.

## Bring up off-chain services

- [x] Build sandbox image: `docker build -t agentwork-sandbox -f backend/grader/Dockerfile.sandbox backend/grader/`.
- [x] Start grader with testnet env.
- [x] Start skill with testnet env; ran in `once --job-id 1` mode.

## Coordinate end-to-end flow

- [x] Seeded FizzBuzz task in grader (hand-injected pytest because Qwen's first output had a logical bug; `task_hash` preserved).
- [x] Created + funded ERC-8183 job (jobId=1) for 1 tUSDT.
- [x] Agent picked up, solved via LMStudio Qwen, paid x402, submitted deliverable.
- [x] Grader ran sandbox, signed verdict (pass), called `submitVerdict` on-chain. Job state = 3 Completed.
- [x] 6 demo tx hashes recorded in `bsc.address`.

## Package the submission

- [x] Push to public GitHub repo `ChinmayShringi/HustleOnChain` (PRs #1 + #2 merged; backend + frontend live on `main`).
- [ ] Record 3-minute demo video (cold-start + one full milestone cycle). **Operator action.**
- [ ] Submit on DoraHacks with repo link + video link before 2026-04-19 23:59 EST. **Operator action.**

## Proof

End-to-end demo tx (submitVerdict): https://testnet.bscscan.com/tx/0xade1197d74f195c3d371dee541270c71a4b55c04a4e5278267c68dea2e933421

## Post-submission

- [ ] Sweep mainnet BNB from throwaway deployer `0xB50F...` back to the user's funding wallet `0x7E9eFCd8...`. See memory note `project_refund_reminder.md`.
