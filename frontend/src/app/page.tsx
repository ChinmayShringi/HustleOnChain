'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { MarketTape } from '@/components/layout/MarketTape'
import { CinematicBackground } from '@/components/layout/CinematicBackground'
import { TrancheBlock } from '@/components/home/TrancheBlock'
import { MarketMesh } from '@/components/markets/MarketMesh'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  BarChart3, 
  Shield, 
  Globe, 
  Landmark, 
  Activity, 
  ChevronRight, 
  Zap, 
  ScrollText, 
  Cpu, 
  ShieldCheck,
  Layers,
  Coins,
  ArrowUpRight,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { useAllJobs } from '@/lib/hooks/useAllJobs'
import { useMarketStats } from '@/lib/hooks/useMarketStats'

export default function HomePage() {
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const { jobs, isLoading: jobsLoading } = useAllJobs()
  const { stats, isLoading: statsLoading } = useMarketStats()

  const visibleJobs = jobs.slice(0, 6)
  const statCards = [
    { label: 'Total_Escrow', value: stats.totalEscrow, icon: Coins, color: 'text-primary' },
    { label: 'Active_Tranches', value: `${stats.activeTranches} Units`, icon: Landmark, color: 'text-black' },
    { label: 'Settled_Value', value: stats.settledValue, icon: ShieldCheck, color: 'text-green-600' },
    { label: 'Agents_Executing', value: `${stats.agentsExecuting} Instances`, icon: Zap, color: 'text-amber-500' },
    { label: 'Verifier_Load', value: stats.verifierLoad, icon: Cpu, color: 'text-tertiary' },
    { label: 'x402_Spend', value: stats.x402Spend, icon: Activity, color: 'text-[#F3BA2F]' },
  ]

  return (
    <main className="relative min-h-screen bg-transparent text-black overflow-x-hidden">
      <CinematicBackground />
      <FloatingHeader />
      
      {/* Spacer for fixed header */}
      <div className="pt-20">
        <MarketTape />
      </div>

      {/* Spatial Hero Section */}
      <section className="relative pt-32 pb-48 overflow-hidden">
        <div className="container mx-auto px-10 relative z-20">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/10 backdrop-blur-md">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-primary italic">Onchain Settlement</span>
                </div>
              </div>
              
              <h1 className="text-[5rem] md:text-[6.5rem] font-bold tracking-tighter leading-[0.8] mb-12 uppercase font-mono text-black">
                DB <span className="text-primary italic">Exchange</span>
              </h1>
              
              <p className="text-2xl text-black/60 max-w-xl leading-relaxed mb-16 font-medium italic">
                High-precision settlement architecture for autonomous agents. 
                Issuing, grading, and clearing work tranches across the BNB Chain network.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-10">
                <Button size="lg" className="h-18 px-14 rounded-none text-[13px] font-bold uppercase tracking-[0.4em] gap-4 group bg-primary hover:bg-primary/90 text-white border-none shadow-xl shadow-primary/20" asChild>
                  <Link href="/create">
                    Launch Portal <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-18 px-12 rounded-none text-[13px] font-bold uppercase tracking-[0.4em] bg-transparent border-black/10 text-black hover:bg-black/5 transition-colors" asChild>
                  <Link href="#market-mesh">Market Data</Link>
                </Button>
              </div>

              <div className="mt-24 flex items-center gap-16 border-t border-black/5 pt-12">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-primary">
                    <Activity className="w-5 h-5" />
                    <span className="text-[11px] font-bold uppercase tracking-widest italic">Live Execution</span>
                  </div>
                  <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest italic font-mono">NODE-STRIP-992</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-tertiary">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[11px] font-bold uppercase tracking-widest italic">Agent Soul Active</span>
                  </div>
                  <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest italic font-mono">DETER-V1.2</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Owner Market Mesh Section */}
      <section id="market-mesh" className="py-48 container mx-auto px-10 relative">
        <div className="flex flex-col gap-12 mb-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-primary/5 border border-primary/10 flex items-center justify-center rounded-sm shadow-sm">
                <Layers className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold uppercase tracking-tighter font-mono italic text-black">Owner_Market_Mesh</h1>
                <p className="text-[10px] text-black/40 uppercase font-bold tracking-[0.4em] mt-2 italic">Settlement Topology • Real-time Infrastructure Monitoring</p>
              </div>
            </div>
            <Link href="/markets" className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary hover:text-primary/80 transition-colors italic group flex items-center gap-3">
              Full_Screen_Visualizer <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
            {statCards.map((stat) => (
              <div key={stat.label} className="bg-white/40 backdrop-blur-md border border-black/5 p-6 flex flex-col gap-3 group hover:bg-white transition-all duration-500 shadow-sm">
                <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/30 mb-1 italic font-mono">{stat.label}</div>
                {statsLoading ? (
                  <div className="h-6 w-3/4 bg-black/10 animate-pulse rounded-sm" />
                ) : (
                  <div className="text-xl font-bold font-mono tracking-tighter text-black">{stat.value}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-[900px] slab-glass overflow-hidden border-black/5 bg-transparent shadow-2xl rounded-sm">
          <MarketMesh onNodeSelect={setSelectedNode} />
          
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="absolute top-0 right-0 w-80 h-full bg-white/60 backdrop-blur-3xl border-l border-black/10 z-30 p-10 flex flex-col shadow-2xl"
              >
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <selectedNode.icon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold uppercase tracking-tighter font-mono italic text-black">{selectedNode.label}</h3>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-black/20 hover:text-black transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-black/40 block italic mb-2">Escrow_Volume</label>
                    <div className="text-2xl font-mono font-bold text-black">{selectedNode.value}</div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-black/40 block italic mb-2">Status_Pulse</label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary italic">{selectedNode.status}</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full h-14 rounded-none uppercase font-bold tracking-[0.3em] gap-3 bg-primary hover:bg-primary/90 text-white border-none mt-8 text-[10px]">
                  Open_Instrument <ArrowUpRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Active Tranches Section */}
      <section className="py-48 container mx-auto px-10 relative">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-32 gap-12 relative z-10">
          <div className="flex items-center gap-10">
            <div className="w-20 h-20 bg-primary/5 border border-primary/10 flex items-center justify-center rounded-sm shadow-sm">
              <ScrollText className="w-10 h-10 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-primary italic">Protocol_Registry</span>
                <div className="h-[1px] w-20 bg-black/5" />
              </div>
              <h2 className="text-[4.5rem] font-bold uppercase tracking-tighter font-mono italic leading-none text-black">Listed_Instruments</h2>
              <p className="text-[11px] text-black/40 uppercase font-bold tracking-[0.4em] mt-6 italic opacity-50">Verified Onchain Slabs • Live Settlement Routing</p>
            </div>
          </div>
          <div className="flex items-center gap-12 text-[11px] font-bold uppercase tracking-[0.4em] italic relative z-10">
            <span className="text-primary cursor-pointer border-b-2 border-primary pb-3">Full_Market</span>
            <span className="text-black/40 cursor-pointer hover:text-black transition-colors pb-3">Resolved</span>
            <span className="text-black/40 cursor-pointer hover:text-black transition-colors pb-3">Pending</span>
          </div>
        </div>

        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative z-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[420px] bg-white/40 border border-black/5 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : visibleJobs.length === 0 ? (
          <div className="relative z-10 slab-glass border border-black/5 bg-white/40 p-20 flex flex-col items-center gap-8 text-center shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-[0.5em] text-black/30 italic font-mono">NO_TRANCHES_ISSUED</div>
            <p className="text-xl text-black/60 italic max-w-xl">No tranches have been issued on this network yet. Be the first to create a work tranche on the settlement rail.</p>
            <Button size="lg" className="h-16 px-12 rounded-none text-[11px] font-bold uppercase tracking-[0.4em] gap-4 bg-primary hover:bg-primary/90 text-white border-none" asChild>
              <Link href="/create">
                Create the first <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative z-10">
            {visibleJobs.map((job, i) => (
              <motion.div
                key={job.jobId.toString()}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: 'easeOut' }}
              >
                <TrancheBlock job={job} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Cinematic Features Section */}
      <section className="py-64 border-t border-black/5 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-10 relative z-10">
          <div className="max-w-4xl mb-40">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              <span className="text-[12px] font-bold uppercase tracking-[0.5em] text-primary italic">Platform_Capabilities</span>
            </div>
            <h2 className="text-6xl font-bold uppercase tracking-tighter font-mono italic mb-10 text-black">Engineered_For_Value</h2>
            <p className="text-2xl text-black/60 leading-relaxed italic font-medium">
              The high-fidelity settlement layer for the agentic economy. Value movement secured by deterministic proof systems and immutable escrow portals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-32">
            {[
              { icon: Globe, title: 'Network_Settle', desc: 'Instant pass-through liquidity on BNB Chain. Value follows work through verified protocol transitions.' },
              { icon: ShieldCheck, title: 'Logic_Trust', desc: 'Every entry is governed by deterministic pytest verifiers and autonomous onchain seal portals.' },
              { icon: Cpu, title: 'Trace_Node', desc: 'Real-time monitoring of agent workloads and x402 resource payments through our dark ledger floor.' },
            ].map((feature) => (
              <div key={feature.title} className="flex flex-col gap-12 group">
                <div className="w-24 h-24 bg-white border border-black/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-700 shadow-sm rounded-sm">
                  <feature.icon className="w-12 h-12 text-black group-hover:text-primary transition-colors duration-700" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold uppercase tracking-tighter font-mono mb-8 italic text-black group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-black/60 leading-relaxed font-medium italic text-xl group-hover:opacity-100 transition-opacity">{feature.desc}</p>
                </div>
                <div className="h-[2px] w-full bg-black/5 group-hover:bg-primary/20 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white py-32 border-t border-black/5 relative overflow-hidden">
        <div className="container mx-auto px-10 relative z-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-24 mb-32">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-primary/5 border border-primary/10 flex items-center justify-center rounded-sm">
                <Landmark className="w-10 h-10 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-4xl font-bold text-black uppercase tracking-tighter font-mono leading-none">DB_EXCH</span>
                <span className="text-[11px] font-bold text-primary uppercase tracking-[0.5em] mt-3 italic">Linked_Ledger_Protocol</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-24">
              <div className="flex flex-col gap-8">
                <span className="text-[11px] font-bold text-black uppercase tracking-[0.4em] italic opacity-40">System</span>
                <div className="flex flex-col gap-4 text-sm text-black/60 font-medium italic">
                  <span className="hover:text-primary transition-colors cursor-pointer">Settlement_Rails</span>
                  <span className="hover:text-primary transition-colors cursor-pointer">Verifier_Nodes</span>
                  <span className="hover:text-primary transition-colors cursor-pointer">Escrow_Portals</span>
                </div>
              </div>
              <div className="flex flex-col gap-8">
                <span className="text-[11px] font-bold text-black uppercase tracking-[0.4em] italic opacity-40">Network</span>
                <div className="flex flex-col gap-4 text-sm text-black/60 font-medium italic">
                  <span className="hover:text-primary transition-colors cursor-pointer">BNB_Chain_V1</span>
                  <span className="hover:text-primary transition-colors cursor-pointer">x402_Registry</span>
                  <span className="hover:text-primary transition-colors cursor-pointer">Explorer_Live</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-16 border-t border-black/5 gap-10">
            <div className="text-black/20 text-[11px] font-bold uppercase tracking-[0.5em] italic">
              © 2026 DB_EXCHANGE | CINEMATIC_PROTOCOL_V1.0
            </div>
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-signal-pulse" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-[0.3em] italic">Relay_Active</span>
              </div>
              <div className="text-black/40 text-[11px] font-bold uppercase tracking-[0.5em] italic">
                Immutable_Registry_S9
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
