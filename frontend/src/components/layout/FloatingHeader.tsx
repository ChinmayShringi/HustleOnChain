'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function FloatingHeader() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4"
    >
      <div className="glass-panel rounded-2xl px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">H</span>
          </div>
          <span className="font-heading font-bold text-lg tracking-tight">HustleOnChain</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
          <Link href="/create" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Create</Link>
          <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
        </nav>

        <div className="flex items-center gap-4">
          <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
        </div>
      </div>
    </motion.header>
  )
}
