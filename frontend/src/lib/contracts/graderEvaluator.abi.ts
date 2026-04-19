/**
 * Minimal ABI for GraderEvaluator.sol.
 *
 * Mirrors `backend/contracts/src/GraderEvaluator.sol` — only the surface
 * the frontend reads or listens to.
 */

export const graderEvaluatorAbi = [
  {
    type: 'function',
    name: 'submitVerdict',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'passed', type: 'bool' },
      { name: 'sig', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'authorizedGrader',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'jobFactory',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'consumed',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'VerdictSubmitted',
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: false, name: 'passed', type: 'bool' },
      { indexed: false, name: 'grader', type: 'address' },
    ],
    anonymous: false,
  },
] as const
