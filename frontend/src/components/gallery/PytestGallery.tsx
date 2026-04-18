'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal, ShieldCheck, ChevronRight, FileCode2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Test {
  id: string
  name: string
  status: string
  coverage: string
  risk: string
}

interface PytestGalleryProps {
  tests: Test[]
  code: string
}

export function PytestGallery({ tests, code }: PytestGalleryProps) {
  const [selectedTest, setSelectedTest] = useState(tests[0])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Test Artifact List */}
      <div className="lg:col-span-4 space-y-4">
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground block mb-6">Assay Specimens</span>
        {tests.map((test) => (
          <motion.div
            key={test.id}
            whileHover={{ x: 8 }}
            onClick={() => setSelectedTest(test)}
            className={`cursor-pointer p-8 transition-all duration-300 gallery-frame relative overflow-hidden ${
              selectedTest.id === test.id 
                ? 'border-primary bg-stone/20' 
                : 'border-border/50 hover:border-primary/30'
            }`}
          >
            {selectedTest.id === test.id && (
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            )}
            
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-mono font-medium tracking-tight text-muted-foreground">{test.name}</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-widest">{test.coverage} Coverage</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedTest.id === test.id ? 'translate-x-2 text-primary' : 'text-muted-foreground/20'}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Code Illumination Bench */}
      <div className="lg:col-span-8 flex flex-col gallery-frame bg-foreground overflow-hidden exhibit-shadow">
        <div className="px-8 py-6 border-b border-background/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono font-medium text-background/40 uppercase tracking-[0.3em]">{selectedTest.name} // SOURCE_ARTIFACT</span>
          </div>
          <div className="flex gap-4">
            <Badge className="rounded-none bg-primary/10 text-primary border-primary/20 text-[9px] uppercase tracking-widest">Deterministic</Badge>
            <Badge className="rounded-none bg-jade/10 text-jade border-jade/20 text-[9px] uppercase tracking-widest">Validated</Badge>
          </div>
        </div>

        <div className="p-12 font-mono text-sm leading-relaxed text-background/80 h-[500px] overflow-auto custom-scrollbar bg-[#0A0A0A]">
          <pre>
            {code.split('\n').map((line, i) => (
              <div key={i} className="flex gap-12 group/line">
                <span className="w-8 text-background/10 text-right select-none group-hover/line:text-background/30 transition-colors">{i + 1}</span>
                <span className={line.includes('def ') ? 'text-primary' : line.includes('assert') ? 'text-background font-medium' : 'text-background/60'}>
                  {line}
                </span>
              </div>
            ))}
          </pre>
        </div>

        <div className="p-8 border-t border-background/10 bg-background/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileCode2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-background/40">Grader V2 Protocol Hash: 0x8829...ae32</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-jade" />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-jade">Assay Certified</span>
          </div>
        </div>
      </div>
    </div>
  )
}
