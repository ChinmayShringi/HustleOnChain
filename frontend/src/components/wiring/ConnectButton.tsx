'use client'

/**
 * Thin, monospace-styled wrapper over RainbowKit's ConnectButton.Custom.
 *
 * Matches the FloatingHeader aesthetic: uppercase, tight tracking,
 * primary-accent on hover. Keep the behaviour faithful to RainbowKit —
 * we only restyle.
 */

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'

export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')

        return (
          <div
            aria-hidden={!ready}
            className={
              !ready
                ? 'pointer-events-none select-none opacity-0'
                : undefined
            }
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="inline-flex h-9 items-center gap-2 rounded-sm border border-primary/40 bg-primary/5 px-4 font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    Connect_Wallet
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    type="button"
                    onClick={openChainModal}
                    className="inline-flex h-9 items-center gap-2 rounded-sm border border-destructive/50 bg-destructive/10 px-4 font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-destructive transition-colors hover:bg-destructive hover:text-white"
                  >
                    Wrong_Network
                  </button>
                )
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openChainModal}
                    className="inline-flex h-9 items-center gap-2 rounded-sm border border-black/10 bg-white px-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-black transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    {chain.hasIcon && chain.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={chain.iconUrl}
                        alt={chain.name ?? 'chain'}
                        className="h-4 w-4 rounded-full"
                      />
                    ) : null}
                    {chain.name ?? 'Chain'}
                  </button>
                  <button
                    type="button"
                    onClick={openAccountModal}
                    className="inline-flex h-9 items-center gap-2 rounded-sm border border-primary/40 bg-primary/5 px-4 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    {account.displayName}
                    {account.displayBalance ? (
                      <span className="text-black/60 group-hover:text-white">
                        · {account.displayBalance}
                      </span>
                    ) : null}
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}
