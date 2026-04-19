'use client'

/**
 * Pulls every on-chain event related to a single job and returns them
 * as a chronological timeline.
 *
 * RPC strategy:
 *   Public BSC testnet RPCs frequently reject `getLogs` when
 *   `fromBlock = 'earliest'` with a "range too wide" or timeout error.
 *   Instead we first locate the `JobCreated` event for this jobId by
 *   scanning from the most recent block backwards in fixed-width
 *   windows. Once found, every subsequent lookup uses that block as
 *   the lower bound. This keeps the window bounded regardless of how
 *   old the chain gets.
 *
 *   The backward scan caps at BACKSCAN_MAX_BLOCKS so we never walk the
 *   entire chain. With JobFactory deployed in April 2026 that covers
 *   several months of history at BSC's 3s block time.
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Address, Hash, PublicClient } from 'viem'
import { useChainId, usePublicClient } from 'wagmi'
import { getContracts } from '@/lib/contracts/addresses'
import { graderEvaluatorAbi } from '@/lib/contracts/graderEvaluator.abi'
import { jobFactoryAbi } from '@/lib/contracts/jobFactory.abi'
import { isTerminalState } from '@/lib/contracts/jobState'

const JOB_FACTORY_EVENTS = [
  'JobCreated',
  'JobFunded',
  'JobSubmitted',
  'JobCompleted',
  'JobRejected',
  'JobExpired',
  'Refunded',
] as const
export type JobFactoryEventName = (typeof JOB_FACTORY_EVENTS)[number]

export type GraderEventName = 'VerdictSubmitted'

export type TimelineEventType = JobFactoryEventName | GraderEventName

export type TimelineEvent = {
  readonly type: TimelineEventType
  readonly source: 'jobFactory' | 'graderEvaluator'
  readonly blockNumber: bigint
  readonly txHash: Hash
  readonly logIndex: number
  readonly timestamp: number | null
  readonly args: Record<string, unknown>
}

export type UseJobEventsResult = {
  readonly data: readonly TimelineEvent[]
  readonly isLoading: boolean
  readonly error: Error | null
  readonly refetch: () => void
}

const BACKSCAN_WINDOW = BigInt(9000)
const BACKSCAN_MAX_BLOCKS = BigInt(5000000)
const FORWARD_WINDOW = BigInt(9000)
const POLL_INTERVAL_MS = 10000

export function useJobEvents(
  jobId: bigint | null,
  jobState?: number,
): UseJobEventsResult {
  const chainId = useChainId()
  const publicClient = usePublicClient({ chainId })
  const contracts = useMemo(() => tryGetContracts(chainId), [chainId])

  const enabled = Boolean(publicClient) && Boolean(contracts) && jobId !== null

  const query = useQuery({
    queryKey: ['jobEvents', chainId, jobId?.toString() ?? null],
    enabled,
    queryFn: async (): Promise<readonly TimelineEvent[]> => {
      if (!publicClient || !contracts || jobId === null) return []
      return loadTimeline(publicClient, contracts.jobFactory,
        contracts.graderEvaluator, jobId)
    },
    refetchInterval:
      jobState !== undefined && isTerminalState(jobState)
        ? false
        : POLL_INTERVAL_MS,
    refetchOnWindowFocus: false,
    staleTime: 4_000,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: normalizeError(query.error),
    refetch: () => {
      void query.refetch()
    },
  }
}

async function loadTimeline(
  publicClient: PublicClient,
  jobFactory: Address,
  graderEvaluator: Address,
  jobId: bigint,
): Promise<readonly TimelineEvent[]> {
  const latest = await publicClient.getBlockNumber()
  const createdBlock = await findJobCreatedBlock(
    publicClient,
    jobFactory,
    jobId,
    latest,
  )
  const fromBlock = createdBlock ?? (latest > BACKSCAN_MAX_BLOCKS
    ? latest - BACKSCAN_MAX_BLOCKS
    : 0n)

  const factoryAbi = jobFactoryAbi
  const factoryEventAbis = factoryAbi.filter(
    (entry): entry is Extract<typeof factoryAbi[number], { type: 'event' }> =>
      entry.type === 'event' &&
      (JOB_FACTORY_EVENTS as readonly string[]).includes(entry.name),
  )
  const verdictAbi = graderEvaluatorAbi.find(
    (entry) => entry.type === 'event' && entry.name === 'VerdictSubmitted',
  )

  const factoryPromises = factoryEventAbis.map((eventAbi) =>
    getLogsWindowed(publicClient, {
      address: jobFactory,
      event: eventAbi,
      args: { jobId },
      fromBlock,
      toBlock: latest,
    }).then((logs) =>
      logs.map((log) => toTimelineEvent(log, 'jobFactory')),
    ),
  )

  const verdictPromise = verdictAbi
    ? getLogsWindowed(publicClient, {
        address: graderEvaluator,
        event: verdictAbi,
        args: { jobId },
        fromBlock,
        toBlock: latest,
      }).then((logs) =>
        logs.map((log) => toTimelineEvent(log, 'graderEvaluator')),
      )
    : Promise.resolve<TimelineEvent[]>([])

  const buckets = await Promise.all([...factoryPromises, verdictPromise])
  const flat = buckets.flat()

  const withTimestamps = await attachTimestamps(publicClient, flat)
  return sortChronological(withTimestamps)
}

async function findJobCreatedBlock(
  publicClient: PublicClient,
  jobFactory: Address,
  jobId: bigint,
  latest: bigint,
): Promise<bigint | null> {
  const createdAbi = jobFactoryAbi.find(
    (entry) => entry.type === 'event' && entry.name === 'JobCreated',
  )
  if (!createdAbi) return null

  const floor =
    latest > BACKSCAN_MAX_BLOCKS ? latest - BACKSCAN_MAX_BLOCKS : 0n

  let toBlock = latest
  while (toBlock >= floor) {
    const fromBlock =
      toBlock > BACKSCAN_WINDOW ? toBlock - BACKSCAN_WINDOW + 1n : 0n
    try {
      const logs = await publicClient.getLogs({
        address: jobFactory,
        event: createdAbi,
        args: { jobId },
        fromBlock,
        toBlock,
      })
      if (logs.length > 0 && typeof logs[0].blockNumber === 'bigint') {
        return logs[0].blockNumber
      }
    } catch {
      // Narrow the window on RPC errors and keep scanning.
    }
    if (fromBlock === 0n) break
    toBlock = fromBlock - 1n
  }
  return null
}

type WindowedLogsOpts = {
  readonly address: Address
  readonly event: Parameters<PublicClient['getLogs']>[0] extends infer _T
    ? Extract<Parameters<PublicClient['getLogs']>[0], { event: unknown }>['event']
    : never
  readonly args: Record<string, unknown>
  readonly fromBlock: bigint
  readonly toBlock: bigint
}

async function getLogsWindowed(
  publicClient: PublicClient,
  opts: WindowedLogsOpts,
) {
  const all: Awaited<ReturnType<PublicClient['getLogs']>> = []
  let cursor = opts.fromBlock
  while (cursor <= opts.toBlock) {
    const end =
      cursor + FORWARD_WINDOW - 1n > opts.toBlock
        ? opts.toBlock
        : cursor + FORWARD_WINDOW - 1n
    try {
      const logs = await publicClient.getLogs({
        address: opts.address,
        event: opts.event,
        args: opts.args,
        fromBlock: cursor,
        toBlock: end,
      })
      all.push(...logs)
    } catch {
      // Ignore window errors; continue to next window. A single failed
      // window should not wipe out the rest of the timeline.
    }
    if (end === opts.toBlock) break
    cursor = end + 1n
  }
  return all
}

function toTimelineEvent(
  log: {
    eventName?: string
    blockNumber?: bigint | null
    transactionHash?: Hash | null
    logIndex?: number | null
    args?: Record<string, unknown> | readonly unknown[]
  },
  source: 'jobFactory' | 'graderEvaluator',
): TimelineEvent {
  return {
    type: (log.eventName ?? 'Unknown') as TimelineEventType,
    source,
    blockNumber: log.blockNumber ?? 0n,
    txHash: (log.transactionHash ?? '0x') as Hash,
    logIndex: log.logIndex ?? 0,
    timestamp: null,
    args: (log.args && !Array.isArray(log.args)
      ? (log.args as Record<string, unknown>)
      : {}),
  }
}

async function attachTimestamps(
  publicClient: PublicClient,
  events: readonly TimelineEvent[],
): Promise<readonly TimelineEvent[]> {
  const unique = Array.from(
    new Set(events.map((e) => e.blockNumber.toString())),
  )
  const entries = await Promise.all(
    unique.map(async (bn) => {
      try {
        const block = await publicClient.getBlock({ blockNumber: BigInt(bn) })
        return [bn, Number(block.timestamp)] as const
      } catch {
        return [bn, null] as const
      }
    }),
  )
  const byBlock = new Map<string, number | null>(entries)
  return events.map((e) => ({
    ...e,
    timestamp: byBlock.get(e.blockNumber.toString()) ?? null,
  }))
}

function sortChronological(
  events: readonly TimelineEvent[],
): readonly TimelineEvent[] {
  return [...events].sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber < b.blockNumber ? -1 : 1
    }
    return a.logIndex - b.logIndex
  })
}

function tryGetContracts(chainId: number) {
  try {
    return getContracts(chainId)
  } catch {
    return null
  }
}

function normalizeError(err: unknown): Error | null {
  if (!err) return null
  return err instanceof Error ? err : new Error(String(err))
}
