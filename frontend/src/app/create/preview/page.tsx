'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { CinematicBackground } from '@/components/layout/CinematicBackground'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileCode2, ArrowRight, ShieldCheck, Beaker, FileText, CheckCircle2, Zap } from 'lucide-react'
import Link from 'next/link'

const mockTests = [
  "test_fizzbuzz_multiples_of_3",
  "test_fizzbuzz_multiples_of_5",
  "test_fizzbuzz_multiples_of_both",
  "test_fizzbuzz_edge_cases",
  "test_fizzbuzz_output_format"
]

export default function ProspectusPage() {
  return (
    <main className="min-h-screen bg-white text-black relative">
      <CinematicBackground />
      <FloatingHeader />
      
      <div className="pt-40 pb-48 container mx-auto px-10 max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-6 mb-16">
            <div className="w-16 h-16 bg-primary/5 border border-primary/10 flex items-center justify-center rounded-sm shadow-sm">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-tighter font-mono leading-none text-black">Validation_Prospectus</h1>
              <p className="text-[10px] text-black/40 uppercase font-bold tracking-[0.4em] mt-3 italic opacity-60">Deterministic Verification Schema</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
            {[
              { label: 'Verifier Type', value: 'PYTEST-AGENT-V1', icon: Beaker },
              { label: 'Security Level', value: 'IMMUTABLE', icon: ShieldCheck },
              { label: 'Audit Trail', value: 'ON-CHAIN HASH', icon: FileText },
            ].map((stat) => (
              <div key={stat.label} className="slab-glass p-8 flex flex-col gap-6 border-black/5 group hover:border-primary/20 transition-all duration-500">
                <stat.icon className="w-6 h-6 text-primary/40 group-hover:text-primary transition-colors" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-black/40 mb-3 italic opacity-60 font-mono">{stat.label}</div>
                  <div className="font-mono font-bold tracking-tight text-black text-lg">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="slab-glass border-black/5 overflow-hidden mb-16">
            <div className="bg-black/[0.02] px-10 py-6 border-b border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileCode2 className="w-5 h-5 text-primary/60" />
                <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-black italic font-mono">Generated_Test_Vectors (T-01)</span>
              </div>
              <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[10px] tracking-widest italic">STABLE</div>
            </div>
            
            <div className="p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                <div className="space-y-4">
                  {mockTests.map((test, i) => (
                    <motion.div 
                      key={test}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 bg-black/[0.02] px-6 py-4 border border-black/5 hover:border-primary/20 transition-all group shadow-sm hover:shadow-primary/5"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors" />
                      <span className="text-sm font-mono font-bold text-black/40 group-hover:text-black transition-colors italic">{test}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-slate-50 p-8 font-mono text-[12px] text-black/80 overflow-x-auto leading-relaxed border border-black/5 relative shadow-inner">
                  <div className="absolute top-4 right-4 text-primary/20"><Zap className="w-4 h-4" /></div>
                  <div className="text-primary/60 mb-6 italic"># AUTOMATED_GRADER_SCRIPT_V1</div>
                  <div className="mb-2"><span className="text-primary italic">import</span> pytest</div>
                  <div className="mb-6"><span className="text-primary italic">from</span> deliverable <span className="text-primary italic">import</span> fizzbuzz</div>
                  <div className="mb-2">@pytest.mark.parametrize(<span className="text-tertiary italic">&quot;n, expected&quot;</span>, [</div>
                  <div className="pl-6 mb-1">(3, [<span className="text-tertiary italic">&quot;1&quot;</span>, <span className="text-tertiary italic">&quot;2&quot;</span>, <span className="text-tertiary italic">&quot;Fizz&quot;</span>]),</div>
                  <div className="pl-6 mb-1">(5, [<span className="text-tertiary italic">&quot;1&quot;</span>, <span className="text-tertiary italic">&quot;2&quot;</span>, <span className="text-tertiary italic">&quot;Fizz&quot;</span>, <span className="text-tertiary italic">&quot;4&quot;</span>, <span className="text-tertiary italic">&quot;Buzz&quot;</span>]),</div>
                  <div className="mb-6">])</div>
                  <div className="mb-2"><span className="text-primary italic">def</span> <span className="text-tertiary italic">test_fizzbuzz_basic</span>(n, expected):</div>
                  <div className="pl-6"><span className="text-primary italic">assert</span> fizzbuzz(n) == expected</div>
                </div>
              </div>

              <div className="flex items-center gap-6 p-8 bg-primary/5 border border-primary/20">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <p className="text-sm font-medium text-black/60 leading-relaxed italic">
                  These tests will be hashed and pinned to the **DB Exchange** settlement contract. 
                  Passing all tests is the only condition for capital release.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" className="h-16 px-10 rounded-none border-black/10 bg-transparent uppercase font-bold tracking-[0.3em] text-black hover:bg-black/5 text-[11px] italic" asChild>
              <Link href="/create">Regenerate</Link>
            </Button>
            <Button className="h-16 px-14 rounded-none uppercase font-bold tracking-[0.3em] gap-5 bg-primary hover:bg-primary/90 text-white border-none text-[11px] shadow-xl shadow-primary/20" asChild>
              <Link href="/create/funding">
                Authorize_Issuance <ArrowRight className="w-6 h-6" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
