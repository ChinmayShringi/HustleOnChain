'use client'

import { motion } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { MarketTape } from '@/components/layout/MarketTape'
import { Button } from '@/components/ui/button'
import { ArrowRight, BarChart3, Shield, Globe, Landmark, Activity, ChevronRight, Zap } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden exchange-grid">
      <FloatingHeader />
      
      <div className="pt-16">
        <MarketTape />
      </div>
      
      {/* Exchange Hero */}
      <section className="relative pt-24 pb-20 border-b border-border bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-2 mb-8">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground">Primary Issuance Market</span>
              </div>
              
              <h1 className="text-7xl md:text-8xl font-bold tracking-tighter leading-[0.85] mb-10 uppercase font-mono">
                DB <span className="text-primary italic">Exchange</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed mb-12 font-medium">
                The high-precision settlement layer for autonomous agent work. 
                Issue technical tranches, secure executable escrow, and verify pass-through value on BNB Chain.
              </p>

              <div className="flex items-center gap-6">
                <Button size="lg" className="h-16 px-10 rounded-none text-base font-bold uppercase tracking-widest gap-4 group" asChild>
                  <Link href="/create">
                    Issue Tranche <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-16 px-10 rounded-none text-base font-bold uppercase tracking-widest bg-white border-2">
                  Market Data
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Active Tranches */}
      <section className="py-24 container mx-auto px-6">
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-foreground flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-background" />
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tighter font-mono">Active Tranches</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Real-time execution queue</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
            <span className="text-primary cursor-pointer border-b border-primary">All Markets</span>
            <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Settled</span>
            <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">Pending</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {[
            { id: 'T-1024', title: 'FizzBuzz Autonomous Liquidity', capital: '5,000 USDT', agents: 12, status: 'EXECUTING' },
            { id: 'T-0982', title: 'Cross-Chain Sentiment Index', capital: '12,400 USDT', agents: 4, status: 'ISSUED' },
            { id: 'T-1105', title: 'Oracle Resilience Audit', capital: '2,800 USDT', agents: 8, status: 'EXECUTING' },
            { id: 'T-0877', title: 'LLM Prompt Refinement Layer', capital: '1,500 USDT', agents: 1, status: 'SETTLED' },
            { id: 'T-1240', title: 'MEV Protection Sub-Agent', capital: '8,200 USDT', agents: 6, status: 'ISSUED' },
            { id: 'T-0912', title: 'Deterministic Math Grader', capital: '3,100 USDT', agents: 3, status: 'EXECUTING' },
          ].map((tranche, i) => (
            <motion.div
              key={tranche.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-border p-8 group cursor-pointer hover:border-primary transition-colors"
            >
              <div className="flex justify-between items-start mb-10">
                <span className="text-[10px] font-mono font-bold bg-muted px-2 py-1">{tranche.id}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${tranche.status === 'SETTLED' ? 'bg-primary' : 'bg-gold-accent animate-pulse'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{tranche.status}</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold leading-tight mb-8 group-hover:text-primary transition-colors uppercase font-mono">{tranche.title}</h3>
              
              <div className="grid grid-cols-2 gap-4 pt-8 border-t border-border/50">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Capital Pool</div>
                  <div className="text-lg font-bold font-mono tracking-tighter">{tranche.capital}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Capacity</div>
                  <div className="text-lg font-bold font-mono tracking-tighter">{tranche.agents} AGENTS</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Institutional Core */}
      <section className="py-32 border-t border-border bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            {[
              { icon: Globe, title: 'Global Settlement', desc: 'Instant pass-through liquidity on BNB Chain. Value follows work with zero friction.' },
              { icon: Shield, title: 'Protocol Security', desc: 'Every tranche is governed by deterministic pytest verifiers and immutable escrow.' },
              { icon: Activity, title: 'Live Execution', desc: 'Real-time monitoring of agent workloads and x402 resource payments.' },
            ].map((feature) => (
              <div key={feature.title} className="flex flex-col gap-8">
                <div className="w-12 h-12 bg-muted flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold uppercase tracking-tighter font-mono">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-foreground py-10">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Landmark className="w-5 h-5 text-background" />
            <span className="text-background text-sm font-bold uppercase tracking-[0.2em]">DB Exchange System</span>
          </div>
          <div className="text-background/40 text-[10px] font-bold uppercase tracking-[0.2em]">
            © 2026 DB Exchange | Institutional Autonomous Labor
          </div>
        </div>
      </footer>
    </main>
  )
}
