'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { CinematicBackground } from '@/components/layout/CinematicBackground'
import { MarketMesh, type MarketNode } from '@/components/markets/MarketMesh'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Activity,
  ShieldCheck,
  Coins,
  Cpu,
  Zap,
  ChevronRight,
  ArrowUpRight,
  Landmark,
  Layers,
  Search,
  Settings2,
  ScrollText
} from 'lucide-react'
import { formatUnits } from 'viem'
import { useAllJobs } from '@/lib/hooks/useAllJobs'
import { useMarketStats } from '@/lib/hooks/useMarketStats'
import { JobState } from '@/lib/contracts/jobState'

const TUSDT_DECIMALS = 18

function jobStatusLabel(state: number): string {
  switch (state) {
    case JobState.Open: return 'QUEUED'
    case JobState.Funded: return 'ISSUED'
    case JobState.Submitted: return 'EXECUTING'
    case JobState.Completed: return 'SETTLED'
    case JobState.Rejected: return 'FAILED'
    case JobState.Expired: return 'EXPIRED'
    default: return 'UNKNOWN'
  }
}

export default function MarketsPage() {
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const { jobs, isLoading: jobsLoading } = useAllJobs()
  const { stats, isLoading: statsLoading } = useMarketStats()

  const meshNodes: MarketNode[] = jobs.slice(0, 6).map((j) => {
    const amt = Number(formatUnits(j.amount, TUSDT_DECIMALS))
    return {
      id: `j-${j.jobId.toString()}`,
      label: `Tranche_${j.jobId.toString()}`,
      type: 'project',
      value: Number.isFinite(amt)
        ? `${amt.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT`
        : '0 USDT',
      status: jobStatusLabel(j.state),
      icon: ScrollText,
    }
  })

  const statCards = [
    { label: 'Total_Escrow', value: stats.totalEscrow, icon: Coins, color: 'text-primary' },
    { label: 'Active_Tranches', value: `${stats.activeTranches} Units`, icon: Landmark, color: 'text-white' },
    { label: 'Settled_Value', value: stats.settledValue, icon: ShieldCheck, color: 'text-green-400' },
    { label: 'Agents_Executing', value: `${stats.agentsExecuting} Instances`, icon: Zap, color: 'text-amber-400' },
    { label: 'Verifier_Load', value: stats.verifierLoad, icon: Cpu, color: 'text-cyan-400' },
    { label: 'x402_Spend', value: stats.x402Spend, icon: Activity, color: 'text-[#F3BA2F]' },
  ]

  return (
    <main className="min-h-screen bg-[#08080a] text-white relative overflow-hidden">
      {/* Dark Cinematic Background for this screen */}
      <div className="fixed inset-0 z-0 bg-black opacity-40" />
      <CinematicBackground />
      <FloatingHeader />

      {/* Main Content */}
      <div className="pt-32 pb-40 container mx-auto px-10 relative z-10 h-screen flex flex-col">
        
        {/* Header & Summary Row */}
        <div className="flex flex-col gap-12 mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-sm shadow-lg shadow-primary/5">
                <Layers className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold uppercase tracking-tighter font-mono italic text-white">Owner_Market_Mesh</h1>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-[0.4em] mt-2 italic">Settlement Topology • Real-time Infrastructure Monitoring</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-white/[0.05] p-1 rounded-sm border border-white/5">
                <button className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20">Topology</button>
                <button className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Registry</button>
              </div>
              <button className="p-3 bg-white/[0.05] border border-white/5 rounded-sm hover:bg-white/[0.1] transition-colors">
                <Settings2 className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
            {statCards.map((stat) => (
              <div key={stat.label} className="bg-white/[0.03] backdrop-blur-md border border-white/5 p-6 flex flex-col gap-3 group hover:bg-white/[0.07] transition-all duration-500 shadow-xl">
                <div className="flex items-center justify-between">
                  <stat.icon className={`w-4 h-4 ${stat.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <ArrowUpRight className="w-3 h-3 text-white/20 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1 italic font-mono">{stat.label}</div>
                  {statsLoading ? (
                    <div className="h-6 w-3/4 bg-white/10 animate-pulse rounded-sm" />
                  ) : (
                    <div className="text-xl font-bold font-mono tracking-tighter text-white">{stat.value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The Star: Market Mesh Visualization */}
        <div className="flex-1 relative slab-glass overflow-hidden border-white/5 bg-black/40 shadow-2xl rounded-sm">
          <MarketMesh
            onNodeSelect={setSelectedNode}
            nodes={meshNodes.length > 0 ? meshNodes : undefined}
          />
          {!jobsLoading && meshNodes.length === 0 && (
            <div className="absolute inset-x-0 bottom-8 flex justify-center z-20 pointer-events-none">
              <div className="px-6 py-3 bg-black/70 border border-white/10 text-[10px] font-bold uppercase tracking-[0.4em] text-white/60 italic font-mono">
                NO_TRANCHES_ISSUED
              </div>
            </div>
          )}
          
          {/* Overlay Navigation / Legend */}
          <div className="absolute top-8 left-8 flex flex-col gap-4 z-20">
            <div className="flex items-center gap-4 p-4 bg-black/60 backdrop-blur-md border border-white/10 shadow-xl rounded-sm">
              <Search className="w-4 h-4 text-white/30" />
              <input 
                placeholder="FIND_NODE_BY_HASH..." 
                className="bg-transparent border-none outline-none text-[10px] font-mono font-bold uppercase tracking-widest w-48 placeholder:text-white/20 text-white"
              />
            </div>
          </div>

          {/* Details Panel */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="absolute top-0 right-0 w-96 h-full bg-black/80 backdrop-blur-2xl border-l border-white/10 z-30 p-12 flex flex-col shadow-2xl"
              >
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/20 border border-primary/40 flex items-center justify-center rounded-sm">
                      <selectedNode.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] italic mb-1">Node_Details</div>
                      <h3 className="text-xl font-bold uppercase tracking-tighter font-mono italic text-white">{selectedNode.label}</h3>
                    </div>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-white/20 hover:text-white transition-colors">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-10 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 block italic">Metadata_Hash</label>
                    <div className="p-4 bg-white/[0.05] border border-white/10 font-mono text-xs text-white/60 break-all leading-relaxed">
                      {selectedNode.hash || '0x4f92...a28b77c1d'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 block italic mb-2">Escrow_Volume</label>
                      <div className="text-2xl font-mono font-bold text-white">{selectedNode.value}</div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 block italic mb-2">Status_Pulse</label>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.6)]" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-primary italic">{selectedNode.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full h-16 rounded-none uppercase font-bold tracking-[0.3em] gap-4 bg-primary hover:bg-primary/90 text-white border-none mt-12 shadow-2xl shadow-primary/20">
                  Open_Instrument <ArrowUpRight className="w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
