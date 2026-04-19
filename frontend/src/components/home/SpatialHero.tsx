'use client'

import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Landmark, Zap, ShieldCheck, Activity, ScrollText, Cpu, Link as LinkIcon, Orbit } from 'lucide-react'
import Link from 'next/link'

export function SpatialHero() {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 150])
  const y2 = useTransform(scrollY, [0, 500], [0, -150])
  const driftX = useTransform(scrollY, [0, 1000], [0, 50])

  return (
    <section className="relative pt-32 pb-64 overflow-hidden bg-white">
      
      {/* 1. DIGITAL SOUL SUBSTRATE (FLUX Style - Light) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Wavy Mesh Lines */}
        <div className="absolute top-[20%] left-[-10%] w-[80%] h-[60%] opacity-10">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                x: [0, 30, 0],
                opacity: [0.05, 0.2, 0.05]
              }}
              transition={{ 
                duration: 8 + i, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: i * 0.2
              }}
              className="absolute w-full h-px bg-primary/20"
              style={{ top: `${i * 6}%`, transform: `skewY(${i % 2 === 0 ? 5 : -5}deg)` }}
            />
          ))}
        </div>

        {/* The Particle Head */}
        <motion.div 
          style={{ x: driftX }}
          className="absolute right-[5%] top-[10%] w-[600px] h-[700px] opacity-10 animate-particle-drift"
        >
          <div className="absolute top-[35%] left-[30%] w-6 h-6 bg-primary/20 rounded-full blur-xl glow-primary" />
          <div className="absolute top-[35%] right-[30%] w-6 h-6 bg-primary/20 rounded-full blur-xl glow-primary" />
          <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-4 h-12 bg-primary/10 rounded-full blur-lg" />
          
          <svg viewBox="0 0 600 700" className="w-full h-full fill-primary/10">
            {[...Array(200)].map((_, i) => {
              const angle = (i / 200) * Math.PI * 2
              const r = 250 + Math.sin(angle * 5) * 20
              const cx = 300 + Math.cos(angle) * r
              const cy = 350 + Math.sin(angle) * r * 1.2
              return (
                <circle 
                  key={i} 
                  cx={cx} 
                  cy={cy} 
                  r={Math.random() * 2} 
                  opacity={Math.random() * 0.4}
                />
              )
            })}
          </svg>
        </motion.div>
      </div>

      {/* 2. PROXIMITY GRID */}
      <div className="absolute bottom-0 left-0 w-full h-[60%] z-0 pointer-events-none">
        <div className="absolute inset-0 ledger-wireframe transform rotate-x-[70deg] origin-bottom animate-terrain-wave opacity-20" />
      </div>

      {/* 3. BACKGROUND GLOWS (Subtle Light) */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-tertiary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-10 grid grid-cols-1 lg:grid-cols-12 gap-20 items-center relative z-20">
        
        {/* Left: Cinematic Typography (Dark on White) */}
        <div className="lg:col-span-6">
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
              <Button variant="outline" size="lg" className="h-18 px-12 rounded-none text-[13px] font-bold uppercase tracking-[0.4em] bg-transparent border-black/10 text-black hover:bg-black/5 transition-colors">
                Registry Docs
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

        {/* Right: Glowing Orbital Core Scene (Light Theme) */}
        <div className="lg:col-span-6 relative h-[800px] hidden lg:flex items-center justify-center perspective-1000">
          <motion.div 
            style={{ y: y1, rotateX: 20 }}
            className="relative w-full h-full flex items-center justify-center preserve-3d"
          >
            {/* CENTRAL GLOWING GLOBE */}
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: 360
              }}
              transition={{ 
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 40, repeat: Infinity, ease: "linear" }
              }}
              className="absolute w-[360px] h-[360px] rounded-full z-10"
              style={{ 
                background: 'radial-gradient(circle at center, oklch(0.65 0.25 330 / 0.1), oklch(0.4 0.2 300 / 0.05) 50%, transparent 80%)',
                boxShadow: '0 0 80px oklch(0.6 0.25 330 / 0.1)'
              }}
            >
              <div className="absolute inset-[15%] rounded-full bg-primary/10 blur-md animate-pulse" />
            </motion.div>

            {/* Floating Protocol Slabs (Light) */}
            <motion.div 
              animate={{ y: [0, -30, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-[400px] h-[280px] bg-white/80 backdrop-blur-xl border border-black/5 p-12 flex flex-col justify-between z-20 shadow-2xl"
              style={{ transform: 'translateZ(100px)' }}
            >
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-primary/10 flex items-center justify-center rounded-sm">
                  <Landmark className="w-8 h-8 text-primary" />
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold text-black/40 mb-1 block">PROTOCOL_ID_X</span>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-2 h-2 bg-primary rounded-full animate-signal-pulse" />
                    <span className="text-[10px] font-bold text-black uppercase tracking-widest">Active Settlement Core</span>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-0.5 w-full bg-black/5 overflow-hidden relative">
                  <div className="absolute inset-0 bg-primary/20 animate-flow-trace" />
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold text-black/40 uppercase mb-1">Network State</span>
                    <span className="text-5xl font-mono font-bold tracking-tighter italic text-black">LIVE_EXCH</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-primary italic">BNB_PROTO_01</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Orbiting Satellite Slab 01 */}
            <motion.div 
              animate={{ rotateY: [0, 10, 0], rotateX: [10, 0, 10] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-5%] right-[-5%] w-[240px] h-[160px] bg-white/90 backdrop-blur-xl border border-black/5 p-8 z-30 shadow-xl"
              style={{ y: y2, transform: 'translateZ(200px)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="px-3 py-1 bg-black/5 border border-black/10">
                  <span className="text-[10px] font-mono font-bold text-black/60 italic">TX_READY</span>
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-2xl font-mono font-bold italic tracking-tighter text-black">45,500 USDT</span>
                <div className="h-px w-full bg-black/5" />
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  )
}
