/**
 * JobFactory.JobState enum — must stay in lockstep with
 * `backend/contracts/src/JobFactory.sol`.
 */

export const JobState = {
  Open: 0,
  Funded: 1,
  Submitted: 2,
  Completed: 3,
  Rejected: 4,
  Expired: 5,
} as const

export type JobStateValue = (typeof JobState)[keyof typeof JobState]

const STATE_LABELS: Readonly<Record<JobStateValue, string>> = {
  [JobState.Open]: 'Open',
  [JobState.Funded]: 'Funded',
  [JobState.Submitted]: 'Submitted',
  [JobState.Completed]: 'Completed',
  [JobState.Rejected]: 'Rejected',
  [JobState.Expired]: 'Expired',
}

export function jobStateLabel(state: number): string {
  return STATE_LABELS[state as JobStateValue] ?? 'Unknown'
}

export function isTerminalState(state: number): boolean {
  return (
    state === JobState.Completed ||
    state === JobState.Rejected ||
    state === JobState.Expired
  )
}
