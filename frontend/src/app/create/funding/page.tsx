'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, Coins, Wallet, ShieldCheck, ArrowRight, Activity } from 'lucide-react'
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
    <main className="min-h-screen bg-background exchange-grid">
      <FloatingHeader />
      
      <div className="pt-32 pb-40 container mx-auto px-6 max-w-3xl">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-12 h-12 bg-foreground flex items-center justify-center">
            <Activity className="w-6 h-6 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tighter font-mono leading-none">Funding Sequence</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Onchain Capital Commitment</p>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isDone = index < currentStep
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`p-8 border-2 transition-all duration-500 ${
                  isActive ? 'border-primary bg-white shadow-xl scale-[1.02]' : 
                  isDone ? 'border-border bg-muted/50 opacity-60' : 
                  'border-border/30 bg-transparent opacity-30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-6">
                    <div className={`w-12 h-12 flex items-center justify-center ${
                      isDone ? 'bg-primary' : isActive ? 'bg-foreground' : 'bg-muted'
                    }`}>
                      {isDone ? <Check className="w-6 h-6 text-background" /> : 
                       isActive ? <Loader2 className="w-6 h-6 text-background animate-spin" /> : 
                       <Wallet className="w-6 h-6 text-muted-foreground" />}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold uppercase tracking-tighter font-mono mb-2 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </h3>
                      <p className="text-sm font-medium text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                  {isDone && (
                    <Badge variant="outline" className="rounded-none border-2 font-mono font-bold text-[10px] bg-background text-primary border-primary">
                      SETTLED
                    </Badge>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16 p-10 bg-foreground text-background flex flex-col items-center text-center"
            >
              <ShieldCheck className="w-16 h-16 text-primary mb-6" />
              <h2 className="text-3xl font-bold uppercase tracking-tighter font-mono mb-4">Capital Secured</h2>
              <p className="text-background/60 max-w-md mb-10 font-medium">
                The issuance sequence for **DB Exchange** is complete. Your tranches are now live in the primary market.
              </p>
              <Button size="lg" className="h-16 px-12 rounded-none bg-background text-foreground hover:bg-primary hover:text-background transition-colors uppercase font-bold tracking-[0.2em] gap-4" asChild>
                <Link href="/project/1">
                  Enter Settlement Floor <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
