'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Coins
} from 'lucide-react'

const MOCK_PROJECT = {
  id: '1',
  title: 'FizzBuzz Autonomous',
  escrow: '500 USDT',
  progress: 1,
  total: 2,
  vitality: 'HIGH',
  agent: {
    address: '0x71C...49A',
    status: 'SOLVING',
    message: 'Analyzing edge cases for Milestone #2'
  }
}

const MILESTONES = [
  { 
    id: '1', 
    title: 'Basic Logic', 
    state: 'PASSED', 
    bounty: '200', 
    agent: '0x71C...49A', 
    sig: 'function solve(uint256 x) returns (string memory)',
    pos: { top: '20%', left: '15%' }
  },
  { 
    id: '2', 
    title: 'Edge Cases', 
    state: 'IN_PROGRESS', 
    bounty: '300', 
    agent: '0x71C...49A', 
    sig: 'function validate(int256 y) returns (bool)',
    pos: { top: '45%', left: '40%' }
  },
  { 
    id: '3', 
    title: 'Optimization', 
    state: 'AWAITING_CLAIM', 
    bounty: '400', 
    agent: 'unassigned', 
    sig: 'function optimize() returns (uint256)',
    pos: { top: '30%', left: '70%' }
  }
]

const EVENTS = [
  { id: '1', type: 'COMPLETED', msg: 'Milestone #1 passed verification', time: '12m ago', tx: '0xabc...123' },
  { id: '2', type: 'PAYMENT', msg: 'Agent paid 0.01 USDT via x402', time: '15m ago', tx: '0xdef...456' },
  { id: '3', type: 'CLAIM', msg: 'Agent 0x71C claimed Milestone #2', time: '45m ago', tx: '0xghi...789' },
  { id: '4', type: 'FUNDED', msg: 'Project seeded with 900 USDT', time: '1h ago', tx: '0xjkl...012' },
]

export default function ProjectDetailPage() {
  const [selectedMilestone, setSelectedMilestone] = useState<typeof MILESTONES[0] | null>(null)
  const [showX402, setShowX402] = useState(false)

  // Simulation: Trigger x402 moment after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => setShowX402(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="relative h-screen overflow-hidden flex flex-col pt-24">
      <FloatingHeader />
      
      {/* Project Header Banner */}
      <div className="container mx-auto px-4 mb-8">
        <div className="glass-panel rounded-3xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
              <Workflow className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold font-heading">{MOCK_PROJECT.title}</h1>
                <Badge variant="outline" className="bg-sage/10 text-sage-foreground border-sage/20 font-bold uppercase tracking-tighter text-[10px]">
                  ID: {MOCK_PROJECT.id}
                </Badge>
              </div>
              <div className="flex items-center gap-6 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> {MOCK_PROJECT.escrow} ESCROW</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> {MOCK_PROJECT.progress}/{MOCK_PROJECT.total} MATURED</span>
                <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-primary" /> {MOCK_PROJECT.vitality} VITALITY</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-2xl h-12 px-6 gap-2">
              <Code2 className="w-4 h-4" /> View Verifiers
            </Button>
            <Button className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/20">
              Manage System
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 grid grid-cols-12 gap-8 pb-8 overflow-hidden">
        {/* Main Garden Canvas */}
        <div className="col-span-12 lg:col-span-9 relative glass-panel rounded-[3rem] overflow-hidden garden-gradient border-white/40 shadow-inner">
          {/* Agent Status Pulse Banner */}
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-lg"
          >
            <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Operator Pulse</span>
                  <span className="text-[10px] font-bold text-primary">{MOCK_PROJECT.agent.status}</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate">{MOCK_PROJECT.agent.message}</p>
              </div>
            </div>
          </motion.div>

          {/* Spatial Milestone Arrangement */}
          <div className="relative w-full h-full p-20">
            {MILESTONES.map((m) => (
              <motion.div
                key={m.id}
                style={{ top: m.pos.top, left: m.pos.left }}
                className="absolute group"
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedMilestone(m)}
              >
                <div className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-700 ${
                  m.state === 'PASSED' 
                    ? 'bg-primary/10 border-2 border-primary shadow-2xl shadow-primary/20' 
                    : m.state === 'IN_PROGRESS'
                      ? 'bg-white/80 border-2 border-primary border-dashed animate-slow-pulse shadow-xl'
                      : 'bg-white/40 border border-white/60'
                }`}>
                  {m.state === 'PASSED' && <ShieldCheck className="w-8 h-8 text-primary mb-2" />}
                  {m.state === 'IN_PROGRESS' && <Zap className="w-8 h-8 text-primary mb-2 animate-pulse" />}
                  {m.state === 'AWAITING_CLAIM' && <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />}
                  
                  <span className="text-xs font-bold leading-tight line-clamp-2">{m.title}</span>
                  <span className="mt-2 text-[10px] font-black text-primary uppercase tracking-tighter">{m.bounty} USDT</span>
                  
                  {/* Maturity Level */}
                  <div className="absolute -bottom-2 w-24 h-1 bg-white/50 rounded-full overflow-hidden">
                    <div className={`h-full bg-primary ${m.state === 'PASSED' ? 'w-full' : m.state === 'IN_PROGRESS' ? 'w-1/2' : 'w-0'}`} />
                  </div>
                </div>
                
                {/* Connection Lines (Visual only for now) */}
                {m.id === '1' && (
                  <svg className="absolute top-1/2 left-full w-40 h-20 pointer-events-none overflow-visible">
                    <path d="M 0 0 C 40 0, 40 40, 80 40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/30" />
                  </svg>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Live Event Current Rail */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 overflow-hidden">
          <div className="glass-panel rounded-[2.5rem] flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Environmental Current</h2>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8 relative">
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-sage/40 to-transparent" />
                
                {EVENTS.map((event) => (
                  <div key={event.id} className="relative pl-8 group">
                    <div className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10 transition-colors ${
                      event.type === 'COMPLETED' ? 'bg-primary' : 'bg-white'
                    }`}>
                      {event.type === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3 text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground/60">{event.time}</span>
                        <a href="#" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </a>
                      </div>
                      <p className="text-xs font-semibold leading-relaxed text-foreground/80">{event.msg}</p>
                      <span className="text-[9px] font-mono text-muted-foreground/40">{event.tx}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Quick Stats / Detail Island */}
          <div className="glass-panel rounded-[2rem] p-6 bg-white/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-sage/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Protocol Escrow</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-heading">900.00</span>
              <span className="text-xs font-bold text-muted-foreground">USDT</span>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-[10px] font-bold text-muted-foreground">
              <span>EST. SETTLEMENT</span>
              <span>~4.2 HOURS</span>
            </div>
          </div>
        </div>
      </div>

      {/* x402 Payment Moment Overlay */}
      <AnimatePresence>
        {showX402 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/20 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, rotateX: 20 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              className="w-full max-w-lg glass-panel rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl border-primary/20 ring-4 ring-primary/5"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-gold animate-shimmer" />
              
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8 relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-3xl border border-primary/30 border-dashed"
                  />
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                
                <h2 className="text-3xl font-bold font-heading mb-4 text-balance">x402 Nutrient Injection</h2>
                <p className="text-muted-foreground mb-10 text-balance">
                  Agent <span className="text-foreground font-bold">0x71C</span> has paid <span className="text-primary font-bold">0.01 USDT</span> for specialized API access to solve Milestone #2.
                </p>
                
                <div className="bg-white/60 rounded-2xl p-6 flex flex-col gap-4 mb-10 border border-white/40">
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                    <span>ASSET TRANSFERRED</span>
                    <span className="text-primary">BNB CHAIN TESTNET</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold font-mono">0xabc...def</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    <span className="text-lg font-bold font-mono">0x402...pay</span>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowX402(false)}
                  className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 gap-3"
                >
                  Confirm Awareness <ArrowUpRight className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[400px] h-[400px] bg-primary/20 blur-[100px] rounded-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Garden Elements */}
      <div className="fixed bottom-0 right-0 -z-10 w-[600px] h-[600px] bg-sage/10 blur-[100px] rounded-full translate-x-1/3 translate-y-1/3" />
      <div className="fixed top-0 left-0 -z-10 w-[400px] h-[400px] bg-aqua/10 blur-[80px] rounded-full -translate-x-1/4 -translate-y-1/4" />
    </main>
  )
}

function CheckCircle2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
