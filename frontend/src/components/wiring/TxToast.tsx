'use client'

/**
 * Helper that wraps `sonner.toast.promise` with standard on-chain
 * transaction states (pending → confirming → confirmed/reverted).
 *
 * Usage:
 *   await trackTx({
 *     hash,
 *     publicClient,
 *     explorer: bscTestnet.explorer,
 *     label: 'Fund job',
 *   })
 */

import { toast } from 'sonner'
import type { Hash, PublicClient, TransactionReceipt } from 'viem'
import { bscTestnet } from '@/lib/contracts/addresses'

export type TrackTxOptions = {
  readonly hash: Hash
  readonly publicClient: PublicClient
  readonly label?: string
  readonly explorer?: string
  readonly confirmations?: number
}

export type TrackTxResult = {
  readonly hash: Hash
  readonly receipt: TransactionReceipt
  readonly explorerUrl: string
}

function buildExplorerUrl(explorer: string, hash: Hash): string {
  return `${explorer.replace(/\/+$/, '')}/tx/${hash}`
}

export async function trackTx(opts: TrackTxOptions): Promise<TrackTxResult> {
  const {
    hash,
    publicClient,
    label = 'Transaction',
    explorer = bscTestnet.explorer,
    confirmations = 1,
  } = opts
  const explorerUrl = buildExplorerUrl(explorer, hash)

  const promise = publicClient
    .waitForTransactionReceipt({ hash, confirmations })
    .then((receipt) => {
      if (receipt.status !== 'success') {
        throw new Error('Transaction reverted')
      }
      return receipt
    })

  toast.promise(promise, {
    loading: `${label}: confirming on-chain…`,
    success: () => `${label}: confirmed`,
    error: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : 'Transaction reverted'
      return `${label}: ${msg}`
    },
    description: `tx ${hash.slice(0, 10)}…${hash.slice(-8)}`,
    action: {
      label: 'View',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.open(explorerUrl, '_blank', 'noopener,noreferrer')
        }
      },
    },
  })

  const receipt = await promise
  return { hash, receipt, explorerUrl }
}

export function txExplorerUrl(hash: Hash, explorer?: string): string {
  return buildExplorerUrl(explorer ?? bscTestnet.explorer, hash)
}
