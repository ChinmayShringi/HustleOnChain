/**
 * On-chain address book for AgentWork.
 *
 * Keyed by EIP-155 chainId so the same module serves future networks
 * without breaking existing call sites.
 */

export type AgentWorkContractAddresses = {
  readonly jobFactory: `0x${string}`
  readonly graderEvaluator: `0x${string}`
  readonly tUSDT: `0x${string}`
}

export const BSC_TESTNET_CHAIN_ID = 97 as const

export const bscTestnet = {
  chainId: BSC_TESTNET_CHAIN_ID,
  name: 'BSC Testnet',
  explorer: 'https://testnet.bscscan.com',
} as const

export const CONTRACTS: Readonly<Record<number, AgentWorkContractAddresses>> = {
  [BSC_TESTNET_CHAIN_ID]: {
    jobFactory: '0x2B1260F32F7bce71E648D5Ac0C937A95F01b1AEB',
    graderEvaluator: '0x169c268DAd2e782da52B6c73A5ca553724205868',
    tUSDT: '0x31E63bAE223e048ce4114fD8a2bF7f39Ff422882',
  },
}

export function getContracts(chainId: number): AgentWorkContractAddresses {
  const entry = CONTRACTS[chainId]
  if (!entry) {
    throw new Error(`No AgentWork contracts deployed on chainId ${chainId}`)
  }
  return entry
}
