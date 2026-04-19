/**
 * Minimal hand-crafted ABI for JobFactory.sol.
 *
 * Mirrors `backend/contracts/src/JobFactory.sol` — update both in lockstep
 * when the Solidity source changes.
 */

export const jobFactoryAbi = [
  // --- writes ---
  {
    type: 'function',
    name: 'createJob',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'provider', type: 'address' },
      { name: 'evaluator', type: 'address' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'taskHash', type: 'bytes32' },
      { name: 'hook', type: 'address' },
    ],
    outputs: [{ name: 'jobId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'fund',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'submit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'deliverableHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'complete',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'reject',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimRefund',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [],
  },
  // --- views ---
  {
    type: 'function',
    name: 'jobs',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [
      { name: 'client', type: 'address' },
      { name: 'provider', type: 'address' },
      { name: 'evaluator', type: 'address' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'taskHash', type: 'bytes32' },
      { name: 'token', type: 'address' },
      { name: 'budget', type: 'uint256' },
      { name: 'state', type: 'uint8' },
    ],
  },
  {
    type: 'function',
    name: 'nextJobId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'jobHook',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'jobDeliverable',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  // --- events ---
  {
    type: 'event',
    name: 'JobCreated',
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: true, name: 'client', type: 'address' },
      { indexed: true, name: 'provider', type: 'address' },
      { indexed: false, name: 'evaluator', type: 'address' },
      { indexed: false, name: 'expiresAt', type: 'uint256' },
      { indexed: false, name: 'taskHash', type: 'bytes32' },
      { indexed: false, name: 'hook', type: 'address' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'JobFunded',
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: false, name: 'token', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'JobSubmitted',
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: false, name: 'deliverableHash', type: 'bytes32' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'JobCompleted',
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: false, name: 'reason', type: 'string' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'JobRejected',
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: false, name: 'reason', type: 'string' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'JobExpired',
    inputs: [{ indexed: true, name: 'jobId', type: 'uint256' }],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Refunded',
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: false, name: 'token', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    anonymous: false,
  },
] as const
