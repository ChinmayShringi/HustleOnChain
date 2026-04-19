'use client'

/**
 * Aggregates live on-chain data into the six KPIs rendered on `/` and
 * `/markets`. All numbers are derived from `useAllJobs` + a small
 * VerdictSubmitted log query; no grader HTTP calls happen here.
 */

import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { formatUnits, getAbiItem, type PublicClient } from 'viem'
import { graderEvaluatorAbi } from '@/lib/contracts/graderEvaluator.abi'
import {
  BSC_TESTNET_CHAIN_ID,
  getContracts,
} from '@/lib/contracts/addresses'
import { JobState } from '@/lib/contracts/jobState'
import { useAllJobs, type Job } from './useAllJobs'

/** tUSDT mirrors USDT's 18 decimals on BSC (not 6 like Ethereum mainnet USDT). */
const TUSDT_DECIMALS = 18

export type MarketStats = {
  readonly totalEscrow: string
  readonly activeTranches: number
  readonly settledValue: string
  readonly agentsExecuting: number
  readonly verifierLoad: string
  readonly x402Spend: string
}

function formatUsdt(amount: bigint): string {
  const value = Number(formatUnits(amount, TUSDT_DECIMALS))
  if (!Number.isFinite(value)) return '0 USDT'
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} USDT`
}

function computeJobDerivedStats(jobs: readonly Job[]) {
  let totalEscrow = BigInt(0)
  let settledValue = BigInt(0)
  let activeTranches = 0
  const executingProviders = new Set<string>()

  for (const job of jobs) {
    const s = job.state
    if (s === JobState.Funded || s === JobState.Submitted) {
      totalEscrow += job.amount
      activeTranches += 1
    }
    if (s === JobState.Completed || s === JobState.Rejected) {
      settledValue += job.amount
    }
    if (s === JobState.Submitted) {
      executingProviders.add(job.provider.toLowerCase())
    }
  }

  return {
    totalEscrow,
    settledValue,
    activeTranches,
    agentsExecuting: executingProviders.size,
  }
}

const verdictEvent = getAbiItem({
  abi: graderEvaluatorAbi,
  name: 'VerdictSubmitted',
})

/** Average blocks per second on BSC (~3s block time → 0.33). Used to convert
 *  "last hour" into a block range. Slightly overshoot to be safe. */
const BSC_SECONDS_PER_BLOCK = 3

async function fetchVerifierLoad(
  client: PublicClient,
  graderEvaluator: `0x${string}`,
): Promise<string> {
  try {
    const latest = await client.getBlockNumber()
    const blocksPerHour = BigInt(Math.ceil(3600 / BSC_SECONDS_PER_BLOCK))
    const fromBlock = latest > blocksPerHour ? latest - blocksPerHour : BigInt(0)
    const logs = await client.getLogs({
      address: graderEvaluator,
      event: verdictEvent,
      fromBlock,
      toBlock: 'latest',
    })
    const perMinute = logs.length / 60
    return `${perMinute.toFixed(2)} vpm`
  } catch {
    return '0.00 vpm'
  }
}

export function useMarketStats() {
  const client = usePublicClient({ chainId: BSC_TESTNET_CHAIN_ID })
  const { jobs, isLoading: jobsLoading } = useAllJobs()

  const verifierQuery = useQuery({
    queryKey: ['agentwork', 'verifierLoad', BSC_TESTNET_CHAIN_ID],
    enabled: Boolean(client),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<string> => {
      if (!client) return '0.00 vpm'
      const { graderEvaluator } = getContracts(BSC_TESTNET_CHAIN_ID)
      return fetchVerifierLoad(
        client as unknown as PublicClient,
        graderEvaluator,
      )
    },
  })

  const derived = computeJobDerivedStats(jobs)

  const stats: MarketStats = {
    totalEscrow: formatUsdt(derived.totalEscrow),
    activeTranches: derived.activeTranches,
    settledValue: formatUsdt(derived.settledValue),
    agentsExecuting: derived.agentsExecuting,
    verifierLoad: verifierQuery.data ?? '0.00 vpm',
    // Grader signer address is not currently surfaced to the frontend,
    // so x402 spend is shown as a deterministic placeholder to avoid
    // fabricating data. Revisit once NEXT_PUBLIC_GRADER_SIGNER is wired.
    x402Spend: '0 USDT',
  }

  return {
    stats,
    isLoading: jobsLoading || verifierQuery.isLoading,
  }
}
