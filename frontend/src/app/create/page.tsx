'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, Landmark, ArrowRight, Dna, Coins, User, FileText, LayoutGrid, Shield } from 'lucide-react'
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
    <main className="min-h-screen bg-background exchange-grid">
      <FloatingHeader />
      
      <div className="pt-32 pb-40 container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left: Metadata & Configuration */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-32"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-foreground flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-background" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold uppercase tracking-tighter font-mono leading-none">Issuance Portal</h1>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Market Configuration</p>
                </div>
              </div>

              <div className="space-y-8 p-1 border border-border bg-white shadow-sm">
                <div className="p-6">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 block italic">Project Identifier</label>
                  <Input 
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. LIQUIDITY-AGENT-01"
                    className="h-14 rounded-none border-2 font-mono text-lg uppercase bg-background"
                  />
                </div>

                <div className="p-6 bg-muted/30 border-t border-border">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Market Summary</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Tranches</span>
                      <span className="font-mono font-bold">{milestones.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Aggregate Capital</span>
                      <span className="font-mono font-bold text-primary">
                        {milestones.reduce((acc, m) => acc + (Number(m.bounty) || 0), 0)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Validation Mode</span>
                      <span className="text-[10px] font-bold bg-foreground text-background px-2 py-0.5">DETERMINISTIC</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full h-16 rounded-none uppercase font-bold tracking-[0.2em] gap-3" asChild>
                  <Link href="/create/preview">
                    Generate Prospectus <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right: Tranche List */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-sm font-bold uppercase tracking-widest">Tranche Definitions</h2>
              <Button variant="outline" onClick={addMilestone} className="h-10 rounded-none border-2 uppercase font-bold text-[10px] tracking-widest gap-2 bg-white">
                <Plus className="w-4 h-4" /> Add Tranche
              </Button>
            </div>

            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {milestones.map((m, index) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group"
                  >
                    <Card className="rounded-none border-border border-2 shadow-none hover:border-primary transition-colors p-0 overflow-hidden bg-white">
                      <div className="flex items-stretch">
                        <div className="w-12 bg-muted border-r border-border flex flex-col items-center py-6 gap-2">
                          <span className="text-[10px] font-bold font-mono vertical-text opacity-40">{m.id}</span>
                          <div className="mt-auto">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeMilestone(index)}
                              className="text-destructive hover:bg-destructive/10 rounded-none"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-6">
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Technical Specification</label>
                              <Textarea 
                                placeholder="def task_signature():"
                                className="font-mono text-sm min-h-[140px] rounded-none border-2 bg-muted/20"
                                value={m.signature}
                                onChange={(e) => {
                                  const newMilestones = [...milestones]
                                  newMilestones[index].signature = e.target.value
                                  setMilestones(newMilestones)
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Acceptance Criteria</label>
                              <Textarea 
                                placeholder="Natural language requirements..."
                                className="text-sm min-h-[80px] rounded-none border-2"
                                value={m.criteria}
                                onChange={(e) => {
                                  const newMilestones = [...milestones]
                                  newMilestones[index].criteria = e.target.value
                                  setMilestones(newMilestones)
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Capital Allocation (USDT)</label>
                              <Input 
                                type="number" 
                                placeholder="0.00"
                                className="h-12 rounded-none border-2 font-mono font-bold text-lg"
                                value={m.bounty}
                                onChange={(e) => {
                                  const newMilestones = [...milestones]
                                  newMilestones[index].bounty = e.target.value
                                  setMilestones(newMilestones)
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
        }
      `}</style>
    </main>
  )
}
