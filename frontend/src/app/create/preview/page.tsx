'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ArrowLeft, Beaker, CheckCircle2, RotateCcw, ShieldCheck, Zap, Info, Code2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const MOCK_TESTS = [
  { id: '1', name: 'test_fizz_basic', status: 'ready', description: 'Verifies that input 3 returns "Fizz"' },
  { id: '2', name: 'test_buzz_basic', status: 'ready', description: 'Verifies that input 5 returns "Buzz"' },
  { id: '3', name: 'test_fizzbuzz_basic', status: 'ready', description: 'Verifies that input 15 returns "FizzBuzz"' },
  { id: '4', name: 'test_negative_values', status: 'ready', description: 'Ensures system handles non-positive integers' },
  { id: '5', name: 'test_gas_efficiency', status: 'ready', description: 'Checks if execution stays within 200k gas' },
]

const MOCK_CODE = `import pytest
from brownie import FizzBuzz, accounts

def test_fizz_basic(fizzbuzz):
    # Test that 3 returns Fizz
    result = fizzbuzz.solve(3)
    assert result == "Fizz"

def test_buzz_basic(fizzbuzz):
    # Test that 5 returns Buzz
    result = fizzbuzz.solve(5)
    assert result == "Buzz"

def test_fizzbuzz_basic(fizzbuzz):
    # Test that 15 returns FizzBuzz
    result = fizzbuzz.solve(15)
    assert result == "FizzBuzz"

def test_negative_values(fizzbuzz):
    with pytest.raises(Exception):
        fizzbuzz.solve(-1)
`

export default function VerifierPreviewPage() {
  const router = useRouter()
  const [selectedTest, setSelectedTest] = useState(MOCK_TESTS[0])
  const [isApproving, setIsApproving] = useState(false)

  const handleApprove = () => {
    setIsApproving(true)
    setTimeout(() => {
      router.push('/create/funding')
    }, 1500)
  }

  return (
    <main className="relative pt-32 pb-40 min-h-screen">
      <FloatingHeader />
      
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-6">
              <Button variant="ghost" className="rounded-full w-12 h-12 p-0" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold font-heading">Verifier Greenhouse</h1>
                <p className="text-muted-foreground">AI-generated autonomous assay markers for milestone #1</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end mr-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Confidence</span>
                <span className="text-sm font-bold text-primary">98.4% Coverage</span>
              </div>
              <div className="w-48 h-2 bg-sage/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '98.4%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Specimen List */}
            <div className="lg:col-span-4 space-y-4">
              <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Generated Specimens
              </div>
              {MOCK_TESTS.map((test) => (
                <motion.div
                  key={test.id}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedTest(test)}
                  className={`cursor-pointer rounded-2xl p-4 transition-all border ${
                    selectedTest.id === test.id 
                      ? 'bg-white shadow-md border-primary/20 ring-1 ring-primary/10' 
                      : 'bg-white/40 border-white/20 hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-mono font-bold ${selectedTest.id === test.id ? 'text-primary' : 'text-muted-foreground'}`}>
                      {test.name}
                    </span>
                    <Badge variant="outline" className="text-[9px] h-4 bg-sage/10 text-sage-foreground border-sage/20">
                      STABLE
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{test.description}</p>
                </motion.div>
              ))}

              <Button variant="outline" className="w-full mt-4 h-12 rounded-xl border-dashed gap-2 group">
                <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                Regenerate All
              </Button>
            </div>

            {/* Code View / Lab Bench */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="glass-panel rounded-3xl overflow-hidden flex flex-col h-[500px]">
                <div className="px-6 py-4 bg-white/40 border-b border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-destructive/30" />
                      <div className="w-2 h-2 rounded-full bg-gold/30" />
                      <div className="w-2 h-2 rounded-full bg-primary/30" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground ml-4">milestone_verifier_v1.py</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Code2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-auto p-8 font-mono text-sm leading-relaxed bg-[#FDFDFD]">
                  <pre className="text-muted-foreground">
                    {MOCK_CODE.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-8 group">
                        <span className="w-4 text-muted-foreground/30 text-right select-none">{i + 1}</span>
                        <span className={line.includes('def ') ? 'text-foreground font-bold' : line.includes('assert') ? 'text-primary' : ''}>
                          {line}
                        </span>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>

              {/* Explanation Panel */}
              <div className="glass-panel rounded-3xl p-6 bg-mint/5 border-mint/10 flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Info className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">Specimen Interpretation</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This verifier uses <span className="text-foreground font-semibold">Pytest-Brownie</span> to simulate an EVM environment. 
                    It checks for boundary conditions, return value precision, and gas consumption limits. 
                    If the agent's submission fails any of these {MOCK_TESTS.length} assays, the protocol will automatically deny settlement.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Ritual */}
          <div className="mt-12 flex justify-center">
            <Button 
              size="lg" 
              onClick={handleApprove}
              disabled={isApproving}
              className="h-20 px-16 rounded-[2.5rem] text-xl font-bold shadow-2xl shadow-primary/20 gap-4 transition-all hover:scale-105"
            >
              {isApproving ? (
                <>
                  <RotateCcw className="w-6 h-6 animate-spin" />
                  Cultivating Protocol...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-7 h-7" />
                  Approve & Seed System
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
