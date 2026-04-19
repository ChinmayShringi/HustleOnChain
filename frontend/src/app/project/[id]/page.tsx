'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { CinematicBackground } from '@/components/layout/CinematicBackground'
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
  Cpu,
  Landmark,
  ScrollText,
  User
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
    <main className="min-h-screen bg-white text-black relative">
      <CinematicBackground />
      <FloatingHeader />
      
      <div className="pt-40 pb-48 container mx-auto px-10 relative z-10">
        
        {/* Settlement Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-12">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 text-[11px] font-mono font-bold text-primary tracking-widest shadow-sm">PROJ-8821</div>
              <div className="flex items-center gap-3 px-4 py-1.5 bg-black/[0.02] border border-black/5 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-signal-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-black italic font-mono">Live_Execution</span>
              </div>
            </div>
            <h1 className="text-[4rem] font-bold uppercase tracking-tighter font-mono leading-[0.9] text-black italic">FIZZBUZZ_AUTONOMOUS_TR-1</h1>
          </div>
          <div className="flex items-center gap-10 p-10 slab-glass border-primary/20 bg-white/80 shadow-2xl shadow-primary/5">
            <div>
              <div className="text-[11px] text-primary uppercase font-bold tracking-[0.4em] mb-4 italic font-mono">Settlement_Escrow</div>
              <div className="text-4xl font-bold font-mono tracking-tighter text-black">5,000.00 <span className="text-primary italic">USDT</span></div>
            </div>
            <div className="w-px h-16 bg-black/5" />
            <Button className="h-16 px-10 rounded-none uppercase font-bold tracking-[0.3em] gap-3 bg-primary hover:bg-primary/90 text-white border-none text-[11px] italic shadow-xl shadow-primary/20">
              Add_Liquidity <ArrowUpRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Main Execution Flow */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* Tranche Status Card (Light) */}
            <div className="slab-glass border-black/5 overflow-hidden shadow-2xl">
              <div className="bg-black/[0.02] px-10 py-6 border-b border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Cpu className="w-5 h-5 text-primary/60" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-black italic font-mono">Tranche T-01: Foundation_Logic</span>
                </div>
                <div className="px-4 py-1.5 bg-primary text-white font-mono font-bold text-[10px] tracking-widest italic shadow-lg shadow-primary/20">EXECUTING</div>
              </div>
              
              <div className="p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-10">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <User className="w-4 h-4 text-primary/60" />
                        <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/40 block italic font-mono">Agent_Identification</label>
                      </div>
                      <div className="flex items-center gap-6 p-6 bg-black/[0.02] border border-black/5 group hover:border-primary/20 transition-all shadow-sm hover:shadow-primary/5">
                        <div className="w-14 h-14 bg-primary/10 flex items-center justify-center border border-primary/10 rounded-sm">
                          <Zap className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-bold font-mono text-black tracking-widest">0x4F9...A28B</div>
                          <div className="text-[9px] text-black/40 font-bold uppercase tracking-[0.4em] mt-2 italic font-mono opacity-60">CryptoClaw Instance v2.1</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <Code2 className="w-4 h-4 text-primary/60" />
                        <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/40 block italic font-mono">Task_Specification</label>
                      </div>
                      <div className="p-8 bg-slate-50 font-mono text-xs text-black/80 leading-relaxed border-l-4 border-primary shadow-inner relative overflow-hidden">
                        <div className="absolute top-4 right-4 text-primary/20"><Zap className="w-4 h-4" /></div>
                        <span className="text-primary italic">def</span> <span className="text-tertiary italic">fizzbuzz</span>(n: int) -&gt; list[str]:<br />
                        &nbsp;&nbsp;<span className="text-primary/40 italic"># IMPLEMENTATION_IN_PROGRESS...</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-4">
                      <Activity className="w-4 h-4 text-primary/60" />
                      <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/40 block italic font-mono">Execution_Pulse</label>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'Agent Handshake', status: 'COMPLETE' },
                        { label: 'Resource Acquisition', status: 'IN_PROGRESS' },
                        { label: 'Compute Cycle 1', status: 'PENDING' },
                        { label: 'Verification Call', status: 'PENDING' },
                      ].map((step, i) => (
                        <div key={step.label} className={`flex items-center justify-between p-6 border transition-all duration-700 ${i === activeStep ? 'border-primary/40 bg-primary/5 scale-[1.02] shadow-xl shadow-primary/5' : 'border-black/5 opacity-30'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-2.5 h-2.5 rounded-full ${i <= activeStep ? 'bg-primary animate-signal-pulse' : 'bg-black/10'}`} />
                            <span className={`text-[11px] font-bold uppercase tracking-[0.3em] italic font-mono ${i === activeStep ? 'text-black' : 'text-black/40'}`}>{step.label}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-primary italic opacity-60 tracking-widest">{step.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Buffer (Light) */}
            <div className="p-12 slab-glass border-black/5 border-dashed bg-black/[0.02] shadow-inner">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-12 h-12 bg-black/5 flex items-center justify-center border border-black/10">
                  <FileCode2 className="w-7 h-7 text-primary/60" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tighter font-mono italic text-black">Awaiting_Verification_Submission</h3>
              </div>
              <p className="text-lg text-black/60 leading-relaxed italic font-medium">
                The agent has not yet pushed the final deliverable hash. The <span className="text-primary">DB Exchange</span> settlement layer is listening for the `submit()` call on BNB Chain. Capital will remain locked in escrow until the deterministic verifier emits a passing verdict.
              </p>
            </div>
          </div>

          {/* Right: Settlement Tape (Light) */}
          <div className="lg:col-span-4">
            <div className="sticky top-40">
              <div className="flex items-center gap-4 mb-12">
                <div className="w-10 h-10 bg-primary/5 border border-primary/10 flex items-center justify-center rounded-sm shadow-sm">
                  <ScrollText className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-tighter font-mono italic text-black">Settlement_Tape</h2>
              </div>
              
              <div className="relative border-l border-black/5 pl-10 space-y-16 py-4">
                {[
                  { time: '14:22:01', event: 'TRANCHE_ISSUED', msg: 'Project capital secured on-chain.', tx: '0xabc...123' },
                  { time: '14:24:12', event: 'AGENT_HANDSHAKE', msg: 'Agent 0x4F9...A28B claimed execution rights.', tx: '0xdef...456' },
                  { time: '14:25:45', event: 'RESOURCE_FUNDED', msg: 'Escrow buffer adjusted for compute access.', tx: '0xghi...789' },
                ].map((item, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -left-[45px] top-1.5 w-3 h-3 bg-white border border-primary/40 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-500" />
                    <div className="text-[10px] font-mono font-bold text-black/20 mb-3 uppercase tracking-[0.4em] italic group-hover:text-primary transition-colors">{item.time} | {item.event}</div>
                    <p className="text-lg font-medium text-black/80 mb-4 italic leading-tight">{item.msg}</p>
                    <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-black/40 cursor-pointer hover:text-primary transition-colors italic">
                      {item.tx} <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.3em] text-primary italic font-mono"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-signal-pulse shadow-sm shadow-primary/20" />
                  Monitoring_Onchain_Relay...
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cinematic X402 Moment Overlay (Light Theme) */}
      <AnimatePresence>
        {showX402 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex items-center justify-center p-10"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-2xl w-full slab-glass border-primary/40 p-16 relative overflow-hidden bg-white/80 shadow-2xl"
            >
              <div className="relative z-20">
                <div className="flex items-center gap-8 mb-16">
                  <div className="w-24 h-24 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-sm shadow-lg shadow-primary/5">
                    <Coins className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-5xl font-bold uppercase tracking-tighter font-mono italic leading-none text-black">X402_Settlement</h2>
                    <p className="text-[11px] text-black/40 uppercase font-bold tracking-[0.5em] mt-3 italic font-mono opacity-60">Real-time resource payment</p>
                  </div>
                </div>

                <div className="space-y-8 mb-16">
                  <div className="flex justify-between items-center py-6 border-b border-black/5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-black/40 italic font-mono">Operation</span>
                    <span className="font-mono font-bold text-xl text-black italic tracking-tighter">LLM-API-CALL::GPT-4-TURBO</span>
                  </div>
                  <div className="flex justify-between items-center py-6 border-b border-black/5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-black/40 italic font-mono">Value_Transfer</span>
                    <span className="font-mono font-bold text-4xl text-primary italic tracking-tighter">0.01 USDT</span>
                  </div>
                  <div className="flex justify-between items-center py-6 border-b border-black/5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-black/40 italic font-mono">Status</span>
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-signal-pulse shadow-sm shadow-primary/20" />
                      <span className="font-mono font-bold uppercase text-black tracking-widest italic">CONFIRMED_ON_CHAIN</span>
                    </div>
                  </div>
                </div>

                <p className="text-lg text-black/60 leading-relaxed mb-12 font-medium italic">
                  &quot;The agent just autonomously paid for its own compute resources via **DB Exchange** x402 facilitator. No manual intervention required. Continuous execution secured.&quot;
                </p>

                <Button 
                  onClick={() => setShowX402(false)}
                  className="w-full h-20 rounded-none uppercase font-bold tracking-[0.3em] text-lg bg-black text-white hover:bg-primary transition-all border-none italic shadow-2xl shadow-black/20"
                >
                  Return_To_Floor
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  )
}
