'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { CinematicBackground } from '@/components/layout/CinematicBackground'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Landmark, ArrowRight, Dna, Coins, User, FileText, LayoutGrid, Shield, Zap, ScrollText, Cpu } from 'lucide-react'
import Link from 'next/link'

interface Milestone {
  id: string
  title: string
  signature: string
  criteria: string
  bounty: string
}

export default function CreateProjectPage() {
  const [projectTitle, setProjectTitle] = useState('')
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 'T-01', title: 'Phase 1 Core Implementation', signature: 'def fizzbuzz(n: int) -> list[str]:', criteria: 'Classic FizzBuzz logic up to n inclusive.', bounty: '500' }
  ])

  const addMilestone = () => {
    const nextId = `T-0${milestones.length + 1}`
    setMilestones([...milestones, { id: nextId, title: '', signature: '', criteria: '', bounty: '' }])
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  return (
    <main className="min-h-screen bg-white text-black relative">
      <CinematicBackground />
      <FloatingHeader />
      
      <div className="pt-40 pb-48 container mx-auto px-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          
          {/* Left: Metadata & Configuration */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="sticky top-32"
            >
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-primary/5 border border-primary/10 flex items-center justify-center rounded-sm shadow-sm">
                  <Landmark className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold uppercase tracking-tighter font-mono leading-none text-black">Issuance_Portal</h1>
                  <p className="text-[10px] text-black/40 uppercase font-bold tracking-[0.4em] mt-3 italic opacity-60">Protocol Configuration</p>
                </div>
              </div>

              <div className="slab-glass p-1 border-primary/10">
                <div className="p-8">
                  <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary mb-5 block italic">Project_Identifier</label>
                  <Input 
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="E.G. LIQUIDITY-AGENT-01"
                    className="h-16 rounded-none border-black/5 font-mono text-xl uppercase bg-black/[0.02] text-black focus:border-primary/40 focus:ring-primary/20"
                  />
                </div>

                <div className="p-8 bg-black/[0.02] border-t border-black/5">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-black/40 italic opacity-60">Protocol_Summary</span>
                    <Zap className="w-4 h-4 text-primary opacity-40" />
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium italic opacity-80">Total Tranches</span>
                      <span className="font-mono font-bold text-black text-lg">{milestones.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium italic opacity-80">Aggregate Capital</span>
                      <span className="font-mono font-bold text-primary text-2xl">
                        {milestones.reduce((acc, m) => acc + (Number(m.bounty) || 0), 0)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-black/5">
                      <span className="text-sm font-medium italic opacity-80">Validation Mode</span>
                      <span className="text-[10px] font-bold bg-primary text-white px-3 py-1 italic shadow-lg shadow-primary/20">DETERMINISTIC</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full h-20 rounded-none uppercase font-bold tracking-[0.3em] gap-4 bg-primary hover:bg-primary/90 text-white border-none text-sm shadow-xl shadow-primary/20" asChild>
                  <Link href="/create/preview">
                    Generate_Prospectus <ArrowRight className="w-6 h-6" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right: Tranche List */}
          <div className="lg:col-span-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8">
              <div className="flex items-center gap-4">
                <ScrollText className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold uppercase tracking-tighter font-mono italic text-black">Tranche_Definitions</h2>
              </div>
              <Button onClick={addMilestone} className="h-12 rounded-none border-primary/20 border bg-transparent text-primary hover:bg-primary/5 uppercase font-bold text-[11px] tracking-[0.3em] gap-3 italic">
                <Plus className="w-5 h-5" /> Add_Tranche
              </Button>
            </div>

            <div className="space-y-10">
              <AnimatePresence mode="popLayout">
                {milestones.map((m, index) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="group"
                  >
                    <div className="slab-glass border-black/5 hover:border-primary/20 transition-all duration-500 overflow-hidden">
                      <div className="flex flex-col md:flex-row items-stretch">
                        <div className="w-full md:w-16 bg-black/[0.02] border-b md:border-b-0 md:border-r border-black/5 flex flex-row md:flex-col items-center justify-between p-6">
                          <span className="text-[11px] font-bold font-mono text-primary/40 vertical-text-md">{m.id}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeMilestone(index)}
                            className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-none transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                        
                        <div className="flex-1 p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-8">
                            <div>
                              <div className="flex items-center gap-3 mb-4">
                                <Cpu className="w-4 h-4 text-primary/60" />
                                <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/40 block italic">Technical_Spec</label>
                              </div>
                              <Textarea 
                                placeholder="DEF TASK_SIGNATURE():"
                                className="font-mono text-sm min-h-[160px] rounded-none border-black/5 bg-black/[0.02] text-black focus:border-primary/40 focus:ring-primary/20 resize-none placeholder:opacity-20"
                                value={m.signature}
                                onChange={(e) => {
                                  const newMilestones = [...milestones]
                                  newMilestones[index].signature = e.target.value
                                  setMilestones(newMilestones)
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-8">
                            <div>
                              <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-4 h-4 text-primary/60" />
                                <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/40 block italic">Acceptance_Criteria</label>
                              </div>
                              <Textarea 
                                placeholder="NATURAL LANGUAGE REQUIREMENTS..."
                                className="text-sm min-h-[100px] rounded-none border-black/5 bg-black/[0.02] text-black focus:border-primary/40 focus:ring-primary/20 resize-none placeholder:opacity-20"
                                value={m.criteria}
                                onChange={(e) => {
                                  const newMilestones = [...milestones]
                                  newMilestones[index].criteria = e.target.value
                                  setMilestones(newMilestones)
                                }}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-4">
                                <Coins className="w-4 h-4 text-primary/60" />
                                <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/40 block italic">Capital_Allocation</label>
                              </div>
                              <div className="relative">
                                <Input 
                                  type="number" 
                                  placeholder="0.00"
                                  className="h-14 rounded-none border-black/5 font-mono font-bold text-xl bg-black/[0.02] text-black focus:border-primary/40 focus:ring-primary/20 pr-16"
                                  value={m.bounty}
                                  onChange={(e) => {
                                    const newMilestones = [...milestones]
                                    newMilestones[index].bounty = e.target.value
                                    setMilestones(newMilestones)
                                  }}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-primary italic">USDT</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .vertical-text-md {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            transform: rotate(180deg);
          }
        }
      `}</style>
    </main>
  )
}
