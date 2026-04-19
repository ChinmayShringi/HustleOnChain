'use client'

/**
 * Writes `JobFactory.claimRefund(jobId)`.
 *
 * Gated by the UI to state=Expired and `account == job.client`. This
 * hook does not re-check those invariants on chain; revert handling is
 * surfaced via `error`.
 */

import { useCallback, useMemo, useState } from 'react'
import type { Hash } from 'viem'
import {
  useAccount,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { getContracts } from '@/lib/contracts/addresses'
import { jobFactoryAbi } from '@/lib/contracts/jobFactory.abi'

export function useClaimRefund() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const {
    writeContractAsync,
    reset: resetWrite,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract()

  const [hash, setHash] = useState<Hash | undefined>(undefined)

  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: Boolean(hash) },
  })

  const submit = useCallback(
    async (jobId: bigint): Promise<Hash> => {
      if (!isConnected) throw new Error('Wallet not connected')
      const contracts = getContracts(chainId)
      const txHash = await writeContractAsync({
        abi: jobFactoryAbi,
        address: contracts.jobFactory,
        functionName: 'claimRefund',
        args: [jobId],
      })
      setHash(txHash)
      return txHash
    },
    [chainId, isConnected, writeContractAsync],
  )

  const reset = useCallback(() => {
    setHash(undefined)
    resetWrite()
  }, [resetWrite])

  const error = useMemo<Error | null>(() => {
    if (!writeError) return null
    return writeError instanceof Error
      ? writeError
      : new Error(String(writeError))
  }, [writeError])

  return {
    submit,
    reset,
    hash,
    receipt,
    isPending: isWriting || isMining,
    isWriting,
    isMining,
    error,
  }
}
