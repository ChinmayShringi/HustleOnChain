import { http, createConfig } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
  appName: 'HustleOnChain',
  projectId: 'YOUR_PROJECT_ID', // Placeholder
  chains: [bscTestnet],
  ssr: true,
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545/'),
  },
})
