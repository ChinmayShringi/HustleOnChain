'use client'

import { ConnectButton } from '@/components/wiring/ConnectButton'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Landmark } from 'lucide-react'

export function FloatingHeader() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 w-full z-[100] bg-white/70 backdrop-blur-xl border-b border-black/5"
    >
      <div className="container mx-auto px-10 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-sm transition-all duration-500 group-hover:bg-primary group-hover:scale-105 shadow-sm group-hover:shadow-primary/20">
            < Landmark className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
          </div>
          <span className="text-2xl font-bold tracking-tighter uppercase font-mono text-black group-hover:text-primary transition-colors">DB_EXCH</span>
        </Link>

        <nav className="hidden md:flex items-center gap-12">
          <Link href="/create" className="text-[11px] font-bold uppercase tracking-[0.4em] text-black hover:text-primary transition-colors italic">
            Issue_Tranche
          </Link>
          <Link href="/markets" className="text-[11px] font-bold uppercase tracking-[0.4em] text-black hover:text-primary transition-colors italic">
            Market_Mesh
          </Link>
          <div className="w-px h-6 bg-black/5" />
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-signal-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary italic">BNB_TESTNET_ACTIVE</span>
          </div>
        </nav>

        <div className="flex items-center gap-6">
          <div className="connect-wrapper scale-90 md:scale-100">
            <ConnectButton />
          </div>
        </div>
      </div>
    </motion.header>
  )
}
