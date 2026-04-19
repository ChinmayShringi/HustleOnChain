'use client'

/**
 * Two-step funding flow:
 *   1. If allowance < amount, call `tUSDT.approve(jobFactory, amount)`.
 *   2. Call `JobFactory.fund(jobId, tUSDT, amount)`.
 *
 * The hook owns its own state machine so the UI can render
 * per-step spinners and tx hashes without orchestrating wagmi
 * directly.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Hash } from 'viem'
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { BSC_TESTNET_CHAIN_ID, getContracts } from '@/lib/contracts/addresses'
import { erc20Abi } from '@/lib/contracts/erc20.abi'
import { jobFactoryAbi } from '@/lib/contracts/jobFactory.abi'

export type FundStep = 'idle' | 'approving' | 'funding' | 'done' | 'error'

export type FundJobParams = {
  readonly jobId: bigint
  readonly amountWei: bigint
}

export type FundJobState = {
  readonly step: FundStep
  readonly approveHash?: Hash
  readonly fundHash?: Hash
  readonly error: Error | null
  readonly allowance: bigint | undefined
  readonly needsApproval: boolean
  readonly isBusy: boolean
}

export function useFundJob(amountWei: bigint | undefined) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  const contracts = useMemo(() => {
    try {
      return getContracts(chainId)
    } catch {
      return null
    }
  }, [chainId])

  const allowanceQuery = useReadContract({
    abi: erc20Abi,
    address: contracts?.tUSDT,
    functionName: 'allowance',
    args:
      address && contracts
        ? [address, contracts.jobFactory]
        : undefined,
    query: { enabled: Boolean(address && contracts) },
  })

  const allowance = allowanceQuery.data as bigint | undefined
  const needsApproval =
    amountWei !== undefined &&
    (allowance === undefined || allowance < amountWei)

  const [step, setStep] = useState<FundStep>('idle')
  const [approveHash, setApproveHash] = useState<Hash | undefined>()
  const [fundHash, setFundHash] = useState<Hash | undefined>()
  const [error, setError] = useState<Error | null>(null)
  const runningRef = useRef(false)

  const { writeContractAsync } = useWriteContract()

  const { data: approveReceipt } = useWaitForTransactionReceipt({
    hash: approveHash,
    query: { enabled: Boolean(approveHash) },
  })
  const { data: fundReceipt } = useWaitForTransactionReceipt({
    hash: fundHash,
    query: { enabled: Boolean(fundHash) },
  })

  useEffect(() => {
    if (approveReceipt?.status === 'success') {
      allowanceQuery.refetch().catch(() => undefined)
    }
  }, [approveReceipt, allowanceQuery])

  useEffect(() => {
    if (fundReceipt?.status === 'success') {
      setStep('done')
      runningRef.current = false
    }
  }, [fundReceipt])

  const run = useCallback(
    async (params: FundJobParams) => {
      if (runningRef.current) return
      if (!isConnected || !address) {
        setError(new Error('Wallet not connected'))
        setStep('error')
        return
      }
      if (chainId !== BSC_TESTNET_CHAIN_ID) {
        setError(
          new Error(
            `Wrong chain: expected BSC testnet (${BSC_TESTNET_CHAIN_ID}), got ${chainId}`,
          ),
        )
        setStep('error')
        return
      }
      if (!contracts) {
        setError(new Error(`Unsupported chain: ${chainId}`))
        setStep('error')
        return
      }
      if (!publicClient) {
        setError(new Error('Public client unavailable'))
        setStep('error')
        return
      }

      runningRef.current = true
      setError(null)

      try {
        // Re-read allowance fresh before deciding.
        const currentAllowance = (await publicClient.readContract({
          abi: erc20Abi,
          address: contracts.tUSDT,
          functionName: 'allowance',
          args: [address, contracts.jobFactory],
        })) as bigint

        if (currentAllowance < params.amountWei) {
          setStep('approving')
          const approveTx = await writeContractAsync({
            abi: erc20Abi,
            address: contracts.tUSDT,
            functionName: 'approve',
            args: [contracts.jobFactory, params.amountWei],
          })
          setApproveHash(approveTx)
          const approveRcpt = await publicClient.waitForTransactionReceipt({
            hash: approveTx,
          })
          if (approveRcpt.status !== 'success') {
            throw new Error('Approve transaction reverted')
          }
        }

        setStep('funding')
        const fundTx = await writeContractAsync({
          abi: jobFactoryAbi,
          address: contracts.jobFactory,
          functionName: 'fund',
          args: [params.jobId, contracts.tUSDT, params.amountWei],
        })
        setFundHash(fundTx)
        const fundRcpt = await publicClient.waitForTransactionReceipt({
          hash: fundTx,
        })
        if (fundRcpt.status !== 'success') {
          throw new Error('Fund transaction reverted')
        }
        setStep('done')
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setStep('error')
      } finally {
        runningRef.current = false
      }
    },
    [
      address,
      chainId,
      contracts,
      isConnected,
      publicClient,
      writeContractAsync,
    ],
  )

  const reset = useCallback(() => {
    setStep('idle')
    setApproveHash(undefined)
    setFundHash(undefined)
    setError(null)
    runningRef.current = false
  }, [])

  const state: FundJobState = {
    step,
    approveHash,
    fundHash,
    error,
    allowance,
    needsApproval,
    isBusy: step === 'approving' || step === 'funding',
  }

  return { run, reset, state }
}
