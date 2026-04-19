'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { CinematicBackground } from '@/components/layout/CinematicBackground'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, Coins, Wallet, ShieldCheck, ArrowRight, Activity, Zap } from 'lucide-react'
import Link from 'next/link'

const steps = [
  { id: 'AUTH', label: 'Approve USDT Expenditure', desc: 'Authorizing the exchange contract to handle capital.' },
  { id: 'DEPLOY', label: 'Deploy Tranche Contracts', desc: 'Initializing on-chain escrow for T-01.' },
  { id: 'FUND', label: 'Energize Capital Pool', desc: 'Transferring 500 USDT to secure the execution.' },
]

export default function FundingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setIsComplete(true)
    }
  }, [currentStep])

  return (
    <main className="min-h-screen bg-white text-black relative">
      <CinematicBackground />
      <FloatingHeader />
      
      <div className="pt-40 pb-48 container mx-auto px-10 max-w-4xl relative z-10">
        <div className="flex items-center gap-6 mb-20">
          <div className="w-16 h-16 bg-primary/5 border border-primary/10 flex items-center justify-center rounded-sm shadow-sm">
            <Activity className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-tighter font-mono leading-none text-black">Funding_Sequence</h1>
            <p className="text-[10px] text-black/40 uppercase font-bold tracking-[0.4em] mt-3 italic opacity-60">Onchain Capital Commitment</p>
          </div>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isDone = index < currentStep
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`p-10 slab-glass transition-all duration-700 ${
                  isActive ? 'border-primary/40 bg-primary/5 scale-[1.03] z-20 shadow-xl shadow-primary/5' : 
                  isDone ? 'border-black/5 opacity-60 scale-100' : 
                  'border-black/5 opacity-20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-8">
                    <div className={`w-16 h-16 flex items-center justify-center rounded-sm transition-colors duration-700 ${
                      isDone ? 'bg-primary' : isActive ? 'bg-black/5' : 'bg-black/[0.02]'
                    }`}>
                      {isDone ? <Check className="w-8 h-8 text-white" /> : 
                       isActive ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : 
                       <Wallet className="w-8 h-8 text-black/20" />}
                    </div>
                    <div>
                      <h3 className={`text-2xl font-bold uppercase tracking-tighter font-mono mb-3 italic ${isActive ? 'text-black' : 'text-black/40'}`}>
                        {step.label}
                      </h3>
                      <p className="text-lg font-medium text-black/40 italic">{step.desc}</p>
                    </div>
                  </div>
                  {isDone && (
                    <div className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[10px] tracking-widest italic">
                      SETTLED
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-20 p-16 slab-glass border-primary/20 bg-white flex flex-col items-center text-center shadow-2xl shadow-primary/10"
            >
              <div className="w-24 h-24 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-full mb-10 shadow-lg shadow-primary/5">
                <ShieldCheck className="w-14 h-14 text-primary" />
              </div>
              <h2 className="text-5xl font-bold uppercase tracking-tighter font-mono mb-6 text-black italic">Capital_Secured</h2>
              <p className="text-black/60 max-w-lg mb-12 text-xl italic font-medium">
                The issuance sequence for <span className="text-primary">DB Exchange</span> is complete. Your tranches are now live in the primary market.
              </p>
              <Button size="lg" className="h-20 px-16 rounded-none bg-primary hover:bg-primary/90 text-white transition-all uppercase font-bold tracking-[0.3em] gap-5 border-none text-base shadow-xl shadow-primary/20" asChild>
                <Link href="/project/1">
                  Enter Settlement Floor <ArrowRight className="w-6 h-6" />
                </Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
