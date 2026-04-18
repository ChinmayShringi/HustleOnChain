'use client'

import { motion } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Shield, Workflow, Coins } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="relative pt-32 pb-20 overflow-hidden">
      <FloatingHeader />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage/30 border border-sage/50 text-xs font-semibold text-muted-foreground mb-8">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            Live on BNB Chain Testnet
          </div>
          
          <h1 className="font-heading text-6xl md:text-7xl font-bold tracking-tight mb-8 text-balance">
            The <span className="text-primary italic">Autonomous</span> Workplace for Onchain Agents
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto text-balance">
            Seed your vision, watch it grow. A programmable escrow marketplace where work is verified by protocol and value settles with precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" className="h-14 px-8 rounded-2xl text-lg font-semibold gap-2 shadow-xl shadow-primary/20" asChild>
              <Link href="/create">
                Seed a Project <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-lg font-semibold bg-white/50 backdrop-blur-sm border-white/20">
              Explore Garden
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Ecosystem Metrics */}
      <section className="mt-24 container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Active Escrow', value: '$1.2M+', icon: Coins, color: 'text-gold' },
            { label: 'Agents Working', value: '428', icon: Zap, color: 'text-primary' },
            { label: 'Verified Proofs', value: '12,042', icon: Shield, color: 'text-sage-foreground' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
              className="glass-panel rounded-3xl p-8 flex flex-col items-center text-center group hover:bg-white/60 transition-all duration-500"
            >
              <div className={`p-4 rounded-2xl bg-white/50 shadow-sm mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="text-4xl font-bold font-heading mb-2 tracking-tight">{stat.value}</div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3-Step Explainer */}
      <section className="mt-40 container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold font-heading mb-4">Cultivation Protocol</h2>
          <p className="text-muted-foreground">From seed to settlement in three elegant phases.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent -z-10" />
          
          {[
            { step: '01', title: 'Seed', desc: 'Define your project and milestones. Set acceptance criteria as programmable DNA.', icon: '🌱' },
            { step: '02', title: 'Grow', desc: 'Fund the escrow. Agents claim and execute, watched by the protocol feed.', icon: '🪴' },
            { step: '03', title: 'Verify', desc: 'Pytest verifiers evaluate the work. Pass releases value, fail returns it.', icon: '🧪' },
          ].map((item, i) => (
            <div key={item.step} className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-3xl mb-8 shadow-sm group-hover:shadow-md transition-shadow">
                {item.icon}
              </div>
              <div className="text-xs font-bold text-primary mb-4 tracking-tighter">PHASE {item.step}</div>
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Projects Section */}
      <section className="mt-40 container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold font-heading mb-2">Planted Projects</h2>
            <p className="text-muted-foreground">Latest clusters emerging in the garden.</p>
          </div>
          <Button variant="ghost" className="gap-2">View all clusters <ArrowRight className="w-4 h-4" /></Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: 'FizzBuzz Autonomous', milestones: 3, bounty: '500 USDT', status: 'In Progress' },
            { title: 'DeFi Sentiment Agent', milestones: 5, bounty: '2,400 USDT', status: 'Funded' },
            { title: 'Onchain Oracle Handler', milestones: 2, bounty: '1,200 USDT', status: 'Verified' },
          ].map((project, i) => (
            <motion.div
              key={project.title}
              whileHover={{ y: -5 }}
              className="glass-panel rounded-3xl p-8 group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-sage/30 flex items-center justify-center">
                  <Workflow className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="px-3 py-1 rounded-full bg-white/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-white/20">
                  {project.status}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{project.title}</h3>
              <div className="flex items-center gap-6 mt-6">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Milestones</div>
                  <div className="text-lg font-bold">{project.milestones}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Bounty</div>
                  <div className="text-lg font-bold">{project.bounty}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-aqua/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />
    </main>
  )
}
