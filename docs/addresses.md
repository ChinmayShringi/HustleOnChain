# Deployed addresses

BNB Smart Chain testnet (chain id 97). Values marked `TBD` are filled in during Phase 1 deployment.

| Label | Address | Notes |
|-------|---------|-------|
| DEPLOYER_ADDRESS | TBD | Wallet used to run `script/Deploy.s.sol`. Funded from the BSC testnet faucet. |
| GRADER_SIGNER_ADDRESS | TBD | Derived from `EVALUATOR_PRIVATE_KEY` in `backend/grader/.env`. Also the `authorizedGrader` passed to `GraderEvaluator`. |
| ERC8183 (reused) | 0x3464e64dD53bC093c53050cE5114062765e9F1b6 | Existing ERC-8183 deployment on BSC testnet. Reused for the hackathon. |
| JOB_FACTORY | 0x2B1260F32F7bce71E648D5Ac0C937A95F01b1AEB | Phase 1 deployment of `JobFactory.sol`. Live. |
| GRADER_EVALUATOR | 0x169c268DAd2e782da52B6c73A5ca553724205868 | Phase 1 deployment of `GraderEvaluator.sol`. Live. |
| TEST_USDT | 0x31E63bAE223e048ce4114fD8a2bF7f39Ff422882 | Demo ERC-20 used for escrow. Live. |

## Phase 1 demo txs

Populated after the end-of-Phase-1 cast walkthrough.

## Local test deployment

Phase 1 builder status: `backend/contracts/` artifacts are built and all Foundry tests pass
locally (`forge test -vv` -> 10/10 passing). Nothing has been broadcast to BSC
testnet yet. `script/Deploy.s.sol` is ready and expects env vars
`DEPLOYER_PRIVATE_KEY` and `GRADER_SIGNER_ADDRESS`. Run
`forge script script/Deploy.s.sol --rpc-url <bsc-testnet> --broadcast` once the
deployer wallet is funded to populate the TBD rows above.
