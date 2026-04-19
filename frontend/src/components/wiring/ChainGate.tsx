'use client'

/**
 * Full-width sticky banner shown when the connected wallet is on a
 * chain other than BSC Testnet. Calls `useSwitchChain` on click.
 *
 * Renders nothing when disconnected or already on the right chain, so
 * it is safe to mount at the top of the root layout.
 */

import { useAccount, useSwitchChain } from 'wagmi'
import { BSC_TESTNET_CHAIN_ID, bscTestnet } from '@/lib/contracts/addresses'

export function ChainGate() {
  const { isConnected, chainId } = useAccount()
  const { switchChain, isPending } = useSwitchChain()

  if (!isConnected) return null
  if (chainId === BSC_TESTNET_CHAIN_ID) return null

  return (
    <div className="sticky top-20 z-[90] w-full border-b border-destructive/30 bg-destructive/10 backdrop-blur-xl">
      <div className="container mx-auto flex h-12 items-center justify-between gap-4 px-10">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-destructive">
          Wrong_Network · Switch to {bscTestnet.name}
        </span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => switchChain({ chainId: BSC_TESTNET_CHAIN_ID })}
          className="inline-flex h-8 items-center gap-2 rounded-sm border border-destructive/50 bg-white px-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-60"
        >
          {isPending ? 'Switching…' : `Switch_To_${BSC_TESTNET_CHAIN_ID}`}
        </button>
      </div>
    </div>
  )
}
