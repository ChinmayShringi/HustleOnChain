'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'

interface ExhibitCardProps {
  id: string
  title: string
  capital: string
  status: string
  tranches: number
}

export function ExhibitCard({ id, title, capital, status, tranches }: ExhibitCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="group relative bg-white gallery-frame p-12 overflow-hidden exhibit-shadow"
    >
      <div className="absolute top-0 right-0 p-8 flex items-center gap-3">
        <div className={`px-4 py-1 text-[10px] font-medium tracking-[0.2em] uppercase border ${
          status === 'SETTLED' ? 'border-success/30 text-success bg-success/5' : 'border-primary/30 text-primary bg-primary/5'
        }`}>
          {status}
        </div>
      </div>

      <div className="flex flex-col h-full">
        <div className="mb-12">
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground block mb-2">{id}</span>
          <h3 className="text-4xl font-medium tracking-[-0.03em] leading-[1.1] max-w-md group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-12 pt-12 border-t border-border/50">
          <div>
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground block mb-2">Escrow Value</span>
            <span className="text-2xl font-medium tracking-tight uppercase">{capital} <span className="text-xs text-muted-foreground">USDT</span></span>
          </div>
          <div>
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground block mb-2">Installations</span>
            <span className="text-2xl font-medium tracking-tight uppercase">{tranches} <span className="text-xs text-muted-foreground">Milestones</span></span>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-jade" />
              <span className="text-[10px] font-medium tracking-widest uppercase">Verified Proof</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-medium tracking-widest uppercase">Live Agent</span>
            </div>
          </div>

          <Link href={`/project/${id}`} className="flex items-center gap-2 group/link">
            <span className="text-xs font-medium tracking-[0.2em] uppercase border-b border-foreground/10 group-hover/link:border-primary transition-colors">Enter Hall</span>
            <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Decorative proof texture */}
      <div className="absolute -bottom-12 -right-12 opacity-[0.03] rotate-12 pointer-events-none">
        <div className="text-[120px] font-bold uppercase tracking-tighter leading-none">
          BNB<br/>CHAIN
        </div>
      </div>
    </motion.div>
  )
}
