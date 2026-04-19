import { http } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''

// RainbowKit requires a non-empty projectId string. We fall back to a stable
// placeholder so local dev without a WalletConnect account does not crash,
// but mobile-QR wallets will not work until a real id is provided.
const projectId =
  WALLETCONNECT_PROJECT_ID.length > 0
    ? WALLETCONNECT_PROJECT_ID
    : 'agentwork_demo_local'

export const config = getDefaultConfig({
  appName: 'AgentWork',
  projectId,
  chains: [bscTestnet],
  ssr: true,
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545/'),
  },
})
