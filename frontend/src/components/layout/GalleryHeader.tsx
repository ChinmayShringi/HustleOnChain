'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Hexagon } from 'lucide-react'

export function GalleryHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-24 flex items-center px-12 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between w-full max-w-[1920px] mx-auto">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative">
            <Hexagon className="w-8 h-8 text-foreground fill-primary/10 group-hover:fill-primary/20 transition-colors" />
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-primary/20 blur-xl rounded-full"
            />
          </div>
          <span className="text-xl font-medium tracking-[-0.04em] uppercase">Nexus Gallery</span>
        </Link>

        <nav className="flex items-center gap-12">
          <Link href="/create" className="text-sm font-medium tracking-widest uppercase hover:text-primary transition-colors">
            Curate Project
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-jade animate-pulse" />
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">BNB Testnet Active</span>
          </div>
          <div className="px-6 py-2 border border-foreground/10 hover:border-foreground/30 transition-colors cursor-pointer">
            <span className="text-xs font-medium tracking-widest uppercase">Connect Vault</span>
          </div>
        </nav>
      </div>
    </header>
  )
}
