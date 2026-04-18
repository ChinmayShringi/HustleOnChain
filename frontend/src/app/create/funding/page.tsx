'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, Coins, Wallet, ShieldCheck, ArrowRight, Droplets } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { id: 'approve', title: 'Irrigate USDT', desc: 'Allow JobFactory to utilize escrow funds' },
  { id: 'create', title: 'Initialize Cells', desc: 'Deploying milestone contracts on BNB Chain' },
  { id: 'fund', title: 'Energize System', desc: 'Transferring bounty to secure escrow' }
]

const MILESTONES = [
  { id: '1', title: 'Basic Logic', amount: '200' },
  { id: '2', title: 'Edge Cases', amount: '300' }
]

export default function FundingFlowPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  // Simulation
  useEffect(() => {
    if (currentStep < STEPS.length) {
      const timer = setTimeout(() => {
        if (currentStep === 1 || currentStep === 2) {
          // Milestone specific steps
          if (activeMilestone === null) {
            setActiveMilestone(0)
          } else if (activeMilestone < MILESTONES.length - 1) {
            setActiveMilestone(activeMilestone + 1)
          } else {
            setActiveMilestone(null)
            setCurrentStep(currentStep + 1)
          }
        } else {
          setCurrentStep(currentStep + 1)
        }
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      setIsCompleted(true)
    }
  }, [currentStep, activeMilestone])

  return (
    <main className="relative pt-32 pb-40 min-h-screen overflow-hidden">
      <FloatingHeader />
      
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 relative"
          >
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
            <Droplets className="w-10 h-10 text-primary animate-bounce" />
          </motion.div>
          <h1 className="text-4xl font-bold font-heading mb-4">Energizing Protocol Garden</h1>
          <p className="text-muted-foreground">Choreographing onchain settlement for your project.</p>
        </div>

        {/* Step Visualization */}
        <div className="flex justify-between mb-20 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-sage/20 -translate-y-1/2 -z-10" />
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex flex-col items-center">
              <div 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 ${
                  i < currentStep 
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                    : i === currentStep 
                      ? 'bg-white border-primary text-primary animate-pulse shadow-xl' 
                      : 'bg-white border-sage/30 text-muted-foreground'
                }`}
              >
                {i < currentStep ? <Check className="w-6 h-6" /> : i === currentStep ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="font-bold">{i + 1}</span>}
              </div>
              <div className="mt-4 text-center">
                <div className={`text-sm font-bold tracking-tight ${i <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground/50 mt-1 tracking-widest">{step.id}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Milestone Irrigation View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {MILESTONES.map((m, i) => {
            const isEnergized = currentStep > 2 || (currentStep === 2 && activeMilestone !== null && i < activeMilestone)
            const isEnergizing = currentStep === 2 && activeMilestone === i
            const isInitialized = currentStep > 1 || (currentStep === 1 && activeMilestone !== null && i < activeMilestone)
            const isInitializing = currentStep === 1 && activeMilestone === i

            return (
              <motion.div
                key={m.id}
                className={`glass-panel rounded-[2.5rem] p-10 relative overflow-hidden transition-all duration-700 ${
                  isEnergized ? 'border-primary shadow-2xl shadow-primary/10' : ''
                }`}
              >
                {isEnergized && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.05 }}
                    className="absolute inset-0 bg-primary"
                  />
                )}
                
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                    {isEnergized ? <ShieldCheck className="w-8 h-8 text-primary" /> : <Coins className="w-8 h-8 text-muted-foreground/30" />}
                  </div>
                  <Badge variant="outline" className={`px-3 py-1 rounded-full ${isEnergized ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground border-white/20'}`}>
                    {isEnergized ? 'ACTIVE' : isInitializing || isEnergizing ? 'TRANSITIONING' : 'DORMANT'}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold mb-1">{m.title}</h3>
                <p className="text-2xl font-black font-heading text-primary">{m.amount} <span className="text-xs font-bold text-muted-foreground/50">USDT</span></p>

                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Cell Integrity</span>
                    <span>{isEnergized ? '100%' : isEnergizing ? '65%' : isInitialized ? '40%' : '0%'}</span>
                  </div>
                  <div className="w-full h-1.5 bg-sage/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ 
                        width: isEnergized ? '100%' : isEnergizing ? '65%' : isInitialized ? '40%' : '0%' 
                      }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>

                {/* Growth Ring Animation */}
                {isEnergizing && (
                  <div className="absolute inset-0 growth-ring pointer-events-none" />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Completion Action */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <Button 
                size="lg" 
                className="h-16 px-12 rounded-2xl text-lg font-bold gap-3 shadow-2xl shadow-primary/20"
                onClick={() => router.push('/project/1')} // Redirect to project detail
              >
                Enter Garden View <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Capital Flow Animation Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -100, x: Math.random() * 2000 - 1000, opacity: 0 }}
            animate={{ y: 2000, opacity: [0, 0.2, 0] }}
            transition={{ 
              duration: 5 + Math.random() * 5, 
              repeat: Infinity, 
              delay: Math.random() * 5,
              ease: "linear"
            }}
            className="absolute w-1 h-20 bg-gradient-to-b from-primary/40 to-transparent blur-[1px]"
          />
        ))}
      </div>
    </main>
  )
}
