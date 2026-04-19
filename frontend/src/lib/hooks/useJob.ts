'use client'

/**
 * Reads a single job's on-chain state from JobFactory.
 *
 * - `jobs(jobId)` returns the tuple (client, provider, evaluator,
 *   expiresAt, taskHash, token, budget, state) — see
 *   `frontend/src/lib/contracts/jobFactory.abi.ts`.
 * - `jobDeliverable(jobId)` is a separate view returning the deliverable
 *   hash once submitted (bytes32(0) before submission).
 *
 * Polls every 8s while the state is non-terminal. Stops once the job
 * reaches Completed, Rejected, or Expired.
 */

import { useEffect, useRef } from 'react'
import { useChainId, useReadContracts } from 'wagmi'
import { getContracts } from '@/lib/contracts/addresses'
import { jobFactoryAbi } from '@/lib/contracts/jobFactory.abi'
import { isTerminalState, JobState } from '@/lib/contracts/jobState'

const POLL_INTERVAL_MS = 8_000
const ZERO_BYTES32: `0x${string}` =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

export type Job = {
  readonly jobId: bigint
  readonly client: `0x${string}`
  readonly provider: `0x${string}`
  readonly evaluator: `0x${string}`
  readonly expiresAt: bigint
  readonly taskHash: `0x${string}`
  readonly token: `0x${string}`
  readonly budget: bigint
  readonly state: number
  readonly deliverableHash: `0x${string}` | null
}

export type UseJobResult = {
  readonly data: Job | null
  readonly isLoading: boolean
  readonly isPropagating: boolean
  readonly error: Error | null
  readonly refetch: () => void
}

const PROPAGATION_MAX_POLLS = 5

export function useJob(jobId: bigint | null): UseJobResult {
  const chainId = useChainId()
  const contracts =
    chainId && jobId !== null ? tryGetContracts(chainId) : null

  const enabled = Boolean(contracts) && jobId !== null

  const query = useReadContracts({
    allowFailure: false,
    contracts: contracts && jobId !== null
      ? [
          {
            abi: jobFactoryAbi,
            address: contracts.jobFactory,
            functionName: 'jobs',
            args: [jobId],
          },
          {
            abi: jobFactoryAbi,
            address: contracts.jobFactory,
            functionName: 'jobDeliverable',
            args: [jobId],
          },
        ]
      : undefined,
    query: {
      enabled,
      refetchInterval: (q) => {
        const results = q.state.data as
          | readonly [JobsTuple, `0x${string}`]
          | undefined
        if (!results) return POLL_INTERVAL_MS
        const state = Number(results[0][7])
        return isTerminalState(state) ? false : POLL_INTERVAL_MS
      },
      refetchOnWindowFocus: false,
    },
  })

  const tuple = query.data as
    | readonly [JobsTuple, `0x${string}`]
    | undefined
  const job = buildJob(jobId, tuple)

  // Track number of completed polls that returned the zero tuple so we can
  // surface an "on-chain propagating" state right after funding, before the
  // RPC has indexed the just-mined tx. We reset whenever the jobId changes.
  const pollsRef = useRef(0)
  const lastJobIdRef = useRef<string | null>(null)

  useEffect(() => {
    const key = jobId === null ? null : jobId.toString()
    if (lastJobIdRef.current !== key) {
      lastJobIdRef.current = key
      pollsRef.current = 0
    }
  }, [jobId])

  useEffect(() => {
    if (tuple === undefined) return
    if (job === null) {
      pollsRef.current += 1
    }
  }, [tuple, job])

  const isPropagating =
    jobId !== null &&
    job === null &&
    tuple !== undefined &&
    pollsRef.current < PROPAGATION_MAX_POLLS

  return {
    data: job,
    isLoading: query.isLoading,
    isPropagating,
    error: normalizeError(query.error),
    refetch: () => {
      void query.refetch()
    },
  }
}

type JobsTuple = readonly [
  `0x${string}`, // client
  `0x${string}`, // provider
  `0x${string}`, // evaluator
  bigint, // expiresAt
  `0x${string}`, // taskHash
  `0x${string}`, // token
  bigint, // budget
  number, // state (uint8)
]

function buildJob(
  jobId: bigint | null,
  data: readonly [JobsTuple, `0x${string}`] | undefined,
): Job | null {
  if (jobId === null || !data) return null
  const [tuple, deliverable] = data
  // A non-existent job returns the zero tuple. Treat that as null.
  const allZero =
    tuple[0] === '0x0000000000000000000000000000000000000000' &&
    tuple[1] === '0x0000000000000000000000000000000000000000' &&
    Number(tuple[7]) === JobState.Open &&
    tuple[6] === 0n
  if (allZero) return null

  return {
    jobId,
    client: tuple[0],
    provider: tuple[1],
    evaluator: tuple[2],
    expiresAt: tuple[3],
    taskHash: tuple[4],
    token: tuple[5],
    budget: tuple[6],
    state: Number(tuple[7]),
    deliverableHash: deliverable === ZERO_BYTES32 ? null : deliverable,
  }
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
