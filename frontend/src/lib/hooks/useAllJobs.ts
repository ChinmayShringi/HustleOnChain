'use client'

/**
 * Reads every job ever created on the configured JobFactory by scanning
 * JobCreated logs from the known deploy block forward, then merging in
 * state-transition events to derive the current lifecycle state.
 *
 * React Query caches the aggregate for 3 minutes to keep the home/markets
 * pages light while still feeling live.
 */

import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { getAbiItem, type Log, type PublicClient } from 'viem'
import { jobFactoryAbi } from '@/lib/contracts/jobFactory.abi'
import {
  BSC_TESTNET_CHAIN_ID,
  getContracts,
} from '@/lib/contracts/addresses'
import { JobState, type JobStateValue } from '@/lib/contracts/jobState'

/**
 * Lower-bound block for log scans on BSC testnet. Picked from the
 * `DeployAll` broadcast artifact (backend/contracts/broadcast/...)
 * so `fromBlock: 'earliest'` never has to be sent to a public RPC
 * that would time out.
 */
export const JOB_FACTORY_DEPLOY_BLOCK_BSC_TESTNET = BigInt(102595591)

export type Job = {
  readonly jobId: bigint
  readonly client: `0x${string}`
  readonly provider: `0x${string}`
  readonly evaluator: `0x${string}`
  readonly taskHash: `0x${string}`
  readonly token: `0x${string}`
  readonly amount: bigint
  readonly state: JobStateValue
  readonly expiresAt: bigint
  readonly createdBlock: bigint
  readonly createdTxHash: `0x${string}`
  readonly deliverableHash: `0x${string}` | null
  readonly completionReason: string | null
}

type CreatedArgs = {
  jobId: bigint
  client: `0x${string}`
  provider: `0x${string}`
  evaluator: `0x${string}`
  expiresAt: bigint
  taskHash: `0x${string}`
  hook: `0x${string}`
}

const jobCreatedEvent = getAbiItem({ abi: jobFactoryAbi, name: 'JobCreated' })
const jobFundedEvent = getAbiItem({ abi: jobFactoryAbi, name: 'JobFunded' })
const jobSubmittedEvent = getAbiItem({ abi: jobFactoryAbi, name: 'JobSubmitted' })
const jobCompletedEvent = getAbiItem({ abi: jobFactoryAbi, name: 'JobCompleted' })
const jobRejectedEvent = getAbiItem({ abi: jobFactoryAbi, name: 'JobRejected' })
const jobExpiredEvent = getAbiItem({ abi: jobFactoryAbi, name: 'JobExpired' })

type LogWithArgs<A> = Log & { args: A; blockNumber: bigint | null; transactionHash: `0x${string}` | null }

async function fetchAllJobs(
  client: PublicClient,
  jobFactory: `0x${string}`,
  fromBlock: bigint,
): Promise<Job[]> {
  const [createdLogs, fundedLogs, submittedLogs, completedLogs, rejectedLogs, expiredLogs] =
    await Promise.all([
      client.getLogs({ address: jobFactory, event: jobCreatedEvent, fromBlock, toBlock: 'latest' }),
      client.getLogs({ address: jobFactory, event: jobFundedEvent, fromBlock, toBlock: 'latest' }),
      client.getLogs({ address: jobFactory, event: jobSubmittedEvent, fromBlock, toBlock: 'latest' }),
      client.getLogs({ address: jobFactory, event: jobCompletedEvent, fromBlock, toBlock: 'latest' }),
      client.getLogs({ address: jobFactory, event: jobRejectedEvent, fromBlock, toBlock: 'latest' }),
      client.getLogs({ address: jobFactory, event: jobExpiredEvent, fromBlock, toBlock: 'latest' }),
    ])

  if (createdLogs.length === 0) return []

  const fundedIds = new Set<string>(
    (fundedLogs as LogWithArgs<{ jobId: bigint }>[]).map((l) => l.args.jobId.toString()),
  )
  const submittedByJob = new Map<string, { deliverableHash: `0x${string}` }>()
  for (const l of submittedLogs as LogWithArgs<{ jobId: bigint; deliverableHash: `0x${string}` }>[]) {
    submittedByJob.set(l.args.jobId.toString(), { deliverableHash: l.args.deliverableHash })
  }
  const completedByJob = new Map<string, { reason: string }>()
  for (const l of completedLogs as LogWithArgs<{ jobId: bigint; reason: string }>[]) {
    completedByJob.set(l.args.jobId.toString(), { reason: l.args.reason })
  }
  const rejectedByJob = new Map<string, { reason: string }>()
  for (const l of rejectedLogs as LogWithArgs<{ jobId: bigint; reason: string }>[]) {
    rejectedByJob.set(l.args.jobId.toString(), { reason: l.args.reason })
  }
  const expiredIds = new Set<string>(
    (expiredLogs as LogWithArgs<{ jobId: bigint }>[]).map((l) => l.args.jobId.toString()),
  )

  const typedCreatedLogs = createdLogs as LogWithArgs<CreatedArgs>[]

  const jobs = await Promise.all(
    typedCreatedLogs.map(async (log) => {
      const jobId = log.args.jobId
      const idKey = jobId.toString()
      const onchain = await client.readContract({
        address: jobFactory,
        abi: jobFactoryAbi,
        functionName: 'jobs',
        args: [jobId],
      })
      // Solidity returns a tuple/struct as array-like
      const [clientAddr, providerAddr, evaluatorAddr, expiresAt, taskHash, token, budget, state] =
        onchain as unknown as [
          `0x${string}`,
          `0x${string}`,
          `0x${string}`,
          bigint,
          `0x${string}`,
          `0x${string}`,
          bigint,
          number,
        ]

      // Trust the on-chain state as the source of truth; events fill in reason/deliverable.
      const completion = completedByJob.get(idKey) ?? null
      const rejection = rejectedByJob.get(idKey) ?? null
      const submission = submittedByJob.get(idKey) ?? null

      // Sanity: if on-chain state is Open but we see a Funded log, prefer on-chain.
      void fundedIds
      void expiredIds

      return {
        jobId,
        client: clientAddr,
        provider: providerAddr,
        evaluator: evaluatorAddr,
        taskHash,
        token,
        amount: budget,
        state: state as JobStateValue,
        expiresAt,
        createdBlock: log.blockNumber ?? BigInt(0),
        createdTxHash: (log.transactionHash ?? '0x') as `0x${string}`,
        deliverableHash: submission?.deliverableHash ?? null,
        completionReason: completion?.reason ?? rejection?.reason ?? null,
      } satisfies Job
    }),
  )

  // blockNumber desc
  return [...jobs].sort((a, b) => {
    if (a.createdBlock === b.createdBlock) return 0
    return a.createdBlock > b.createdBlock ? -1 : 1
  })
}

export function useAllJobs() {
  const client = usePublicClient({ chainId: BSC_TESTNET_CHAIN_ID })

  const query = useQuery({
    queryKey: ['agentwork', 'allJobs', BSC_TESTNET_CHAIN_ID],
    enabled: Boolean(client),
    staleTime: 3 * 60 * 1000, // 3 min — home/markets feel live but spare the RPC.
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 10_000),
    queryFn: async (): Promise<Job[]> => {
      if (!client) return []
      const { jobFactory } = getContracts(BSC_TESTNET_CHAIN_ID)
      return fetchAllJobs(
        client as unknown as PublicClient,
        jobFactory,
        JOB_FACTORY_DEPLOY_BLOCK_BSC_TESTNET,
      )
    },
  })

  return {
    jobs: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  }
}
