'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Beaker, ArrowRight, Dna, Coins, User, Workflow, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Milestone {
  id: string
  signature: string
  criteria: string
  bounty: string
  agent: string
}

export default function CreateProjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', signature: '', criteria: '', bounty: '', agent: '' }
  ])

  const addMilestone = () => {
    setMilestones([...milestones, { 
      id: Math.random().toString(36).substr(2, 9), 
      signature: '', 
      criteria: '', 
      bounty: '', 
      agent: '' 
    }])
  }

  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter(m => m.id !== id))
    }
  }

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  return (
    <main className="relative pt-32 pb-40 min-h-screen">
      <FloatingHeader />
      
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mx-auto mb-8 border border-white/50">
            <Dna className="w-10 h-10 text-primary animate-slow-pulse" />
          </div>
          <h1 className="text-4xl font-bold font-heading mb-4 tracking-tight">Compose Living System</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Define the genetic code of your project. Each milestone is a programmable unit of work with its own lifecycle.
          </p>
        </motion.div>

        <section className="space-y-12">
          {/* Project Title Anchor */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-aqua/10 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000" />
            <input 
              type="text"
              placeholder="System Identity (Project Title)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="relative w-full bg-white/40 backdrop-blur-md border border-white/40 rounded-3xl px-8 py-6 text-2xl font-bold font-heading focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
            />
          </div>

          {/* Milestones Area */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Workflow className="w-4 h-4" /> Growth Cells (Milestones)
              </h2>
              <span className="text-xs font-medium text-muted-foreground bg-white/50 px-3 py-1 rounded-full border border-white/20">
                {milestones.length} Unit{milestones.length !== 1 ? 's' : ''} Defined
              </span>
            </div>

            <AnimatePresence initial={false}>
              {milestones.map((m, index) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel rounded-[2rem] p-8 relative group"
                >
                  <div className="absolute -left-3 top-10 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shadow-lg shadow-primary/20">
                    {index + 1}
                  </div>

                  {milestones.length > 1 && (
                    <button 
                      onClick={() => removeMilestone(m.id)}
                      className="absolute right-6 top-6 p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                          <Dna className="w-3 h-3" /> Function Signature
                        </label>
                        <Textarea 
                          placeholder="e.g. function solve(uint256 x) returns (string memory)"
                          value={m.signature}
                          onChange={(e) => updateMilestone(m.id, 'signature', e.target.value)}
                          className="min-h-[120px] rounded-2xl bg-white/30 border-white/40 focus:bg-white/60 transition-all font-mono text-sm resize-none"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                          <Beaker className="w-3 h-3" /> Acceptance Criteria
                        </label>
                        <Textarea 
                          placeholder="Describe what the agent must achieve..."
                          value={m.criteria}
                          onChange={(e) => updateMilestone(m.id, 'criteria', e.target.value)}
                          className="min-h-[120px] rounded-2xl bg-white/30 border-white/40 focus:bg-white/60 transition-all text-sm resize-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                          <Coins className="w-3 h-3" /> Bounty (USDT)
                        </label>
                        <Input 
                          type="number"
                          placeholder="0.00"
                          value={m.bounty}
                          onChange={(e) => updateMilestone(m.id, 'bounty', e.target.value)}
                          className="h-12 rounded-2xl bg-white/30 border-white/40 focus:bg-white/60 transition-all font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                          <User className="w-3 h-3" /> Target Agent Address
                        </label>
                        <Input 
                          placeholder="0x..."
                          value={m.agent}
                          onChange={(e) => updateMilestone(m.id, 'agent', e.target.value)}
                          className="h-12 rounded-2xl bg-white/30 border-white/40 focus:bg-white/60 transition-all font-mono text-sm"
                        />
                      </div>

                      <div className="pt-4 p-6 rounded-2xl bg-sage/20 border border-sage/30 mt-auto">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Genetic Integrity</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                          Once seeded, these parameters will be used to generate autonomous Pytest verifiers. Ensure signatures are valid Solidity syntax.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <Button 
              onClick={addMilestone}
              variant="outline" 
              className="w-full h-16 rounded-[2rem] border-dashed border-2 hover:bg-white/50 hover:border-primary transition-all text-muted-foreground gap-2"
            >
              <Plus className="w-5 h-5" /> Add Growth Cell
            </Button>
          </div>

          {/* Action Footer */}
          <div className="pt-10 flex items-center justify-between border-t border-white/30">
            <div className="hidden md:block">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total System Escrow</div>
              <div className="text-3xl font-bold font-heading">
                {milestones.reduce((acc, m) => acc + (parseFloat(m.bounty) || 0), 0).toLocaleString()} <span className="text-sm font-medium text-muted-foreground">USDT</span>
              </div>
            </div>

            <Button size="lg" className="h-14 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 gap-3" onClick={() => router.push('/create/preview')}>
              Generate Verifiers <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </section>
      </div>

      {/* Background blobs */}
      <div className="fixed top-0 left-0 -z-10 w-full h-full pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-mint blur-[100px] rounded-full animate-slow-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-aqua blur-[100px] rounded-full animate-slow-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </main>
  )
}
