'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileCode2, ArrowRight, ShieldCheck, Beaker, FileText, CheckCircle2 } from 'lucide-react'
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
    <main className="min-h-screen bg-background exchange-grid">
      <FloatingHeader />
      
      <div className="pt-32 pb-40 container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-foreground flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-tighter font-mono leading-none">Validation Prospectus</h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Deterministic Verification Schema</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { label: 'Verifier Type', value: 'PYTEST-AGENT-V1', icon: Beaker },
              { label: 'Security Level', value: 'IMMUTABLE', icon: ShieldCheck },
              { label: 'Audit Trail', value: 'ON-CHAIN HASH', icon: FileText },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border-2 border-border p-6 flex flex-col gap-4">
                <stat.icon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</div>
                  <div className="font-mono font-bold tracking-tight">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          <Card className="rounded-none border-2 border-border shadow-none bg-white p-0 overflow-hidden mb-12">
            <div className="bg-muted px-8 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCode2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Generated Test Vectors (T-01)</span>
              </div>
              <Badge variant="outline" className="rounded-none border-2 font-mono font-bold text-[10px] bg-background">STABLE</Badge>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-3">
                  {mockTests.map((test, i) => (
                    <motion.div 
                      key={test}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 bg-muted/30 px-4 py-3 border border-border/50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-mono font-bold">{test}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-foreground rounded-none p-6 font-mono text-[11px] text-background/80 overflow-x-auto leading-relaxed">
                  <div className="text-primary/60 mb-4"># Automated Grader Script</div>
                  <div className="mb-2"><span className="text-primary">import</span> pytest</div>
                  <div className="mb-4"><span className="text-primary">from</span> deliverable <span className="text-primary">import</span> fizzbuzz</div>
                  <div>@pytest.mark.parametrize(<span className="text-gold-accent">&quot;n, expected&quot;</span>, [</div>
                  <div className="pl-4">(3, [<span className="text-gold-accent">&quot;1&quot;</span>, <span className="text-gold-accent">&quot;2&quot;</span>, <span className="text-gold-accent">&quot;Fizz&quot;</span>]),</div>
                  <div className="pl-4">(5, [<span className="text-gold-accent">&quot;1&quot;</span>, <span className="text-gold-accent">&quot;2&quot;</span>, <span className="text-gold-accent">&quot;Fizz&quot;</span>, <span className="text-gold-accent">&quot;4&quot;</span>, <span className="text-gold-accent">&quot;Buzz&quot;</span>]),</div>
                  <div>])</div>
                  <div className="mt-4"><span className="text-primary">def</span> <span className="text-gold-accent">test_fizzbuzz_basic</span>(n, expected):</div>
                  <div className="pl-4"><span className="text-primary">assert</span> fizzbuzz(n) == expected</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <p className="text-xs font-medium text-foreground/80 leading-relaxed">
                  These tests will be hashed and pinned to the **DB Exchange** settlement contract. 
                  Passing all tests is the only condition for capital release.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" className="h-14 px-8 rounded-none border-2 uppercase font-bold tracking-widest bg-white" asChild>
              <Link href="/create">Regenerate</Link>
            </Button>
            <Button className="h-14 px-12 rounded-none uppercase font-bold tracking-[0.2em] gap-4" asChild>
              <Link href="/create/funding">
                Authorize Issuance <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
