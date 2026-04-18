'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, ShieldCheck, Zap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface X402MomentProps {
  isOpen: boolean
  onClose: () => void
  agent: string
  amount: string
  asset: string
  tx: string
}

export function X402Moment({ isOpen, onClose, agent, amount, asset, tx }: X402MomentProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-background/90 backdrop-blur-xl"
        >
          {/* Background Aura */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.15 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="absolute w-[800px] h-[800px] bg-primary blur-[160px] rounded-full pointer-events-none"
          />

          <motion.div
            initial={{ scale: 0.95, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="relative w-full max-w-4xl bg-white gallery-frame p-20 text-center overflow-hidden exhibit-shadow"
          >
            {/* Top Illumination Bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-primary animate-shimmer-gold" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-foreground flex items-center justify-center mb-12 shadow-2xl">
                <Coins className="w-12 h-12 text-primary" />
              </div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-px bg-primary" />
                <span className="text-xs font-medium tracking-[0.4em] uppercase text-primary">Autonomous Settlement</span>
                <div className="w-8 h-px bg-primary" />
              </div>

              <h2 className="text-6xl font-medium tracking-[-0.05em] mb-12 uppercase">
                x402 Micro-Clearing
              </h2>
              
              <p className="text-2xl text-muted-foreground font-medium mb-16 max-w-2xl leading-relaxed tracking-tight">
                Agent <span className="text-foreground mono">{agent}</span> has autonomously settled 
                <span className="text-foreground px-2"> {amount} {asset} </span> for gated tool-access authorization.
              </p>
              
              <div className="w-full grid grid-cols-3 gap-12 p-12 bg-stone/30 mb-16 border border-border/50">
                <div className="text-left">
                   <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] mb-2">Asset Class</div>
                   <div className="text-2xl font-medium tracking-tighter uppercase">{asset}</div>
                </div>
                <div className="text-left">
                   <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] mb-2">Quantum</div>
                   <div className="text-2xl font-medium tracking-tighter uppercase">{amount}</div>
                </div>
                <div className="text-left">
                   <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] mb-2">Proof Hash</div>
                   <div className="text-sm font-mono text-primary truncate">{tx}</div>
                </div>
              </div>

              <Button 
                onClick={onClose}
                className="h-24 px-20 rounded-none bg-foreground text-background hover:bg-primary transition-all text-xl font-medium uppercase tracking-widest gap-8 group"
              >
                Acknowledge Provenance <ArrowRight className="w-8 h-8 group-hover:translate-x-4 transition-transform" />
              </Button>
            </div>

            {/* Decorative background proof */}
            <div className="absolute -bottom-20 -left-20 opacity-[0.02] rotate-12 pointer-events-none text-[240px] font-bold uppercase tracking-tighter leading-none select-none">
              PROOF
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
