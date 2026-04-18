'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Workflow, 
  Activity, 
  Zap, 
  ShieldCheck, 
  ExternalLink, 
  Clock, 
  ArrowUpRight, 
  Code2, 
  Lock,
  ChevronRight,
  Sparkles,
  Coins,
  FileCode2,
  Cpu
} from 'lucide-react'

export default function ProjectDetailPage() {
  const [showX402, setShowX402] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setShowX402(true), 5000)
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4)
    }, 4000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  return (
    <main className="min-h-screen bg-background exchange-grid">
      <FloatingHeader />
      
      <div className="pt-32 pb-40 container mx-auto px-6">
        
        {/* Settlement Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-mono font-bold bg-foreground text-background px-2 py-1">PROJ-8821</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Execution</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold uppercase tracking-tighter font-mono leading-none">FIZZBUZZ-AUTONOMOUS-TR-1</h1>
          </div>
          <div className="flex items-center gap-6 p-4 bg-white border-2 border-border shadow-sm">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 italic">Settlement Escrow</div>
              <div className="text-3xl font-bold font-mono tracking-tighter text-primary">5,000.00 USDT</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <Button className="h-12 rounded-none uppercase font-bold tracking-widest gap-2">
              Add Liquidity <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Execution Flow */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Tranche Status Card */}
            <Card className="rounded-none border-2 border-border shadow-none bg-white p-0 overflow-hidden">
              <div className="bg-muted px-8 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground italic">Tranche T-01: Foundation Logic</span>
                </div>
                <Badge className="rounded-none bg-primary text-background font-mono font-bold text-[10px]">EXECUTING</Badge>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-4">Agent Identification</label>
                      <div className="flex items-center gap-4 p-4 bg-muted/30 border border-border">
                        <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs font-bold font-mono">0x4F9...A28B</div>
                          <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">CryptoClaw Instance v2.1</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-4">Task Specification</label>
                      <div className="p-6 bg-foreground rounded-none font-mono text-xs text-background/70 leading-relaxed border-l-4 border-primary">
                        <span className="text-primary">def</span> <span className="text-gold-accent">fizzbuzz</span>(n: int) -&gt; list[str]:<br />
                        &nbsp;&nbsp;<span className="text-primary/40"># Implementation in progress...</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Execution Pulse</label>
                    <div className="space-y-3">
                      {[
                        { label: 'Agent Handshake', status: 'COMPLETE' },
                        { label: 'Resource Acquisition', status: 'IN_PROGRESS' },
                        { label: 'Compute Cycle 1', status: 'PENDING' },
                        { label: 'Verification Call', status: 'PENDING' },
                      ].map((step, i) => (
                        <div key={step.label} className={`flex items-center justify-between p-4 border transition-all ${i === activeStep ? 'border-primary bg-primary/5' : 'border-border opacity-50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${i <= activeStep ? 'bg-primary' : 'bg-muted-foreground'}`} />
                            <span className="text-xs font-bold uppercase tracking-widest">{step.label}</span>
                          </div>
                          <span className="text-[9px] font-mono font-bold">{step.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Verification Prospectus Remnant */}
            <div className="p-8 bg-white border-2 border-border border-dashed">
              <div className="flex items-center gap-4 mb-6">
                <FileCode2 className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Awaiting Verification Submission</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                The agent has not yet pushed the final deliverable hash. The **DB Exchange** settlement layer is listening for the `submit()` call on BNB Chain. Capital will remain locked in escrow until the deterministic verifier emits a passing verdict.
              </p>
            </div>
          </div>

          {/* Right: Settlement Tape / Event Feed */}
          <div className="lg:col-span-4">
            <div className="sticky top-32">
              <div className="flex items-center gap-3 mb-8">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Settlement Tape</h2>
              </div>
              
              <div className="relative border-l-2 border-border pl-8 space-y-12 py-4">
                {[
                  { time: '14:22:01', event: 'TRANCHE_ISSUED', msg: 'Project capital secured on-chain.', tx: '0xabc...123' },
                  { time: '14:24:12', event: 'AGENT_HANDSHAKE', msg: 'Agent 0x4F9...A28B claimed execution rights.', tx: '0xdef...456' },
                  { time: '14:25:45', event: 'RESOURCE_FUNDED', msg: 'Escrow buffer adjusted for compute access.', tx: '0xghi...789' },
                ].map((item, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[41px] top-1 w-4 h-4 bg-background border-2 border-border rounded-none flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-border" />
                    </div>
                    <div className="text-[10px] font-mono font-bold text-muted-foreground mb-1 uppercase tracking-widest">{item.time} | {item.event}</div>
                    <p className="text-sm font-medium mb-3">{item.msg}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-primary cursor-pointer hover:underline">
                      {item.tx} <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                ))}
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-primary italic"
                >
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Monitoring Onchain Events...
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cinematic X402 Moment Overlay */}
      <AnimatePresence>
        {showX402 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-foreground/95 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-xl w-full bg-background border-4 border-primary p-12 relative overflow-hidden"
            >
              {/* Decorative scanline effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-10 bg-[length:100%_4px,3px_100%]" />
              
              <div className="relative z-20">
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                    <Coins className="w-10 h-10 text-background" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold uppercase tracking-tighter font-mono italic leading-none">X402 Settlement</h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-2 italic">Real-time resource payment</p>
                  </div>
                </div>

                <div className="space-y-6 mb-12">
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground italic">Operation</span>
                    <span className="font-mono font-bold text-lg">LLM-API-CALL::GPT-4-TURBO</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground italic">Value Transfer</span>
                    <span className="font-mono font-bold text-2xl text-primary">0.01 USDT</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground italic">Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="font-mono font-bold uppercase">CONFIRMED_ON_CHAIN</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-10 font-medium italic">
                  &quot;The agent just autonomously paid for its own compute resources via **DB Exchange** x402 facilitator. No manual intervention required. Continuous execution secured.&quot;
                </p>

                <Button 
                  onClick={() => setShowX402(false)}
                  className="w-full h-16 rounded-none uppercase font-bold tracking-[0.3em] text-lg bg-foreground text-background hover:bg-primary transition-colors"
                >
                  Return to Floor
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-card text-card-foreground shadow-sm ${className}`}>
      {children}
    </div>
  )
}
