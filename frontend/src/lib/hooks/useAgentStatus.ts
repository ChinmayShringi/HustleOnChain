'use client'

/**
 * Polls the grader `/api/status` endpoint every 3s while the job is
 * still in flight. Stops polling once the passed-in job state is
 * terminal (Completed / Rejected / Expired).
 */

import { useQuery } from '@tanstack/react-query'
import { graderClient } from '@/lib/grader/client'
import type { StatusResponse } from '@/lib/grader/types'
import { isTerminalState } from '@/lib/contracts/jobState'

const POLL_INTERVAL_MS = 3_000

export type UseAgentStatusResult = {
  readonly status: StatusResponse | null
  readonly isPolling: boolean
  readonly error: Error | null
}

export function useAgentStatus(
  jobState: number | undefined,
  jobId?: bigint | null,
): UseAgentStatusResult {
  // Do not start polling until the job read resolves. Polling an undefined
  // jobState forever would keep hitting the grader for a job we don't know
  // the on-chain state of yet.
  const polling = jobState !== undefined && !isTerminalState(jobState)

  const query = useQuery<StatusResponse>({
    queryKey: ['agentStatus', jobId?.toString() ?? 'none'],
    queryFn: () => graderClient().getStatus(),
    enabled: polling,
    refetchInterval: polling ? POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: false,
    staleTime: 1_000,
    retry: 1,
  })

  return {
    status: query.data ?? null,
    isPolling: polling && query.fetchStatus !== 'idle',
    error: query.error instanceof Error ? query.error : null,
  }
}
