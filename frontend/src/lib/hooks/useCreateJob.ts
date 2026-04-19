'use client'

/**
 * Writes `JobFactory.createJob` and extracts the on-chain `jobId` from
 * the receipt's `JobCreated` event. Callers get a typed `jobId` back as
 * soon as the transaction is mined.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Hash } from 'viem'
import { parseEventLogs } from 'viem'
import {
  useAccount,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { getContracts } from '@/lib/contracts/addresses'
import { jobFactoryAbi } from '@/lib/contracts/jobFactory.abi'

export type CreateJobArgs = {
  readonly provider: `0x${string}`
  readonly evaluator: `0x${string}`
  readonly expiresAt: number
  readonly taskHash: `0x${string}`
  readonly hook?: `0x${string}`
}

const ZERO_ADDRESS: `0x${string}` =
  '0x0000000000000000000000000000000000000000'

export function useCreateJob() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const {
    writeContractAsync,
    reset: resetWrite,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract()

  const [hash, setHash] = useState<Hash | undefined>(undefined)
  const [jobId, setJobId] = useState<bigint | undefined>(undefined)
  const [settleError, setSettleError] = useState<Error | null>(null)

  const { data: receipt, isLoading: isMining } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: Boolean(hash) },
  })

  useEffect(() => {
    if (!receipt) return
    try {
      const events = parseEventLogs({
        abi: jobFactoryAbi,
        eventName: 'JobCreated',
        logs: receipt.logs,
      })
      const decoded = events[0]
      if (!decoded) {
        setSettleError(new Error('JobCreated event not found in receipt'))
        return
      }
      setJobId(decoded.args.jobId)
      setSettleError(null)
    } catch (err) {
      setSettleError(
        err instanceof Error ? err : new Error('Failed to decode JobCreated'),
      )
    }
  }, [receipt])

  const submit = useCallback(
    async (args: CreateJobArgs): Promise<Hash> => {
      if (!isConnected) throw new Error('Wallet not connected')
      const contracts = getContracts(chainId)
      setSettleError(null)
      setJobId(undefined)
      const txHash = await writeContractAsync({
        abi: jobFactoryAbi,
        address: contracts.jobFactory,
        functionName: 'createJob',
        args: [
          args.provider,
          args.evaluator,
          BigInt(args.expiresAt),
          args.taskHash,
          args.hook ?? ZERO_ADDRESS,
        ],
      })
      setHash(txHash)
      return txHash
    },
    [chainId, isConnected, writeContractAsync],
  )

  const reset = useCallback(() => {
    setHash(undefined)
    setJobId(undefined)
    setSettleError(null)
    resetWrite()
  }, [resetWrite])

  const error = useMemo<Error | null>(() => {
    if (writeError) {
      return writeError instanceof Error
        ? writeError
        : new Error(String(writeError))
    }
    return settleError
  }, [writeError, settleError])

  return {
    submit,
    reset,
    hash,
    jobId,
    receipt,
    isPending: isWriting || isMining,
    isWriting,
    isMining,
    error,
  }
}
