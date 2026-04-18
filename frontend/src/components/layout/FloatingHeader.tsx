'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Landmark } from 'lucide-react'

export function FloatingHeader() {
  return (
    <motion.header 
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 w-full z-50 bg-background border-b border-border"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-foreground flex items-center justify-center">
            <Landmark className="w-5 h-5 text-background" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase font-mono">DB Exchange</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/create" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
            Issue Tranche
          </Link>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">BNB Testnet Active</span>
          </div>
        </nav>

        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </div>
    </motion.header>
  )
}
