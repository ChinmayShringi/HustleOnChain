'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, ShieldCheck, Zap, Clock, Lock } from 'lucide-react'

interface ArtifactFrameProps {
  id: string
  title: string
  state: string
  bounty: string
  agent: string
  time: string
}

export function ArtifactFrame({ id, title, state, bounty, agent, time }: ArtifactFrameProps) {
  const isSettled = state === 'SETTLED'
  const isActive = state === 'ACTIVE'
  const isListed = state === 'LISTED'

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`relative bg-white gallery-frame p-10 transition-all duration-500 overflow-hidden ${
        isActive ? 'illumination-gold border-primary/50' : ''
      }`}
    >
      {/* State Illumination */}
      <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 pointer-events-none transition-colors duration-1000 ${
        isSettled ? 'bg-jade' : isActive ? 'bg-primary' : 'bg-stone'
      }`} />

      <div className="flex justify-between items-start mb-12">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-muted-foreground mb-1">{id}</span>
          <div className="h-px w-8 bg-border" />
        </div>
        <div className={`px-4 py-1 text-[9px] font-medium tracking-[0.2em] uppercase border ${
          isSettled ? 'border-jade/30 text-jade bg-jade/5' : 
          isActive ? 'border-primary/30 text-primary bg-primary/5' : 
          'border-border text-muted-foreground'
        }`}>
          {state}
        </div>
      </div>

      <h3 className={`text-2xl font-medium tracking-tight uppercase mb-2 ${isActive ? 'text-foreground' : 'text-muted-foreground/60'}`}>
        {title}
      </h3>
      
      <div className="flex items-baseline gap-2 mb-12">
        <span className="text-3xl font-medium tracking-tighter">{bounty}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest">USDT</span>
      </div>

      <div className="space-y-6 pt-8 border-t border-border/50">
        <div className="flex justify-between items-center text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> Agent</span>
          <span className="text-foreground mono">{agent}</span>
        </div>
        <div className="flex justify-between items-center text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> Provenance</span>
          <span className="text-foreground italic uppercase tracking-widest">{time}</span>
        </div>
      </div>

      {isActive && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary animate-shimmer-gold" />
      )}
      
      {isSettled && (
        <div className="absolute top-4 left-4">
          <ShieldCheck className="w-4 h-4 text-jade" />
        </div>
      )}
    </motion.div>
  )
}
