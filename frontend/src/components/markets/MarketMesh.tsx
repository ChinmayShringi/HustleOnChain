'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Landmark, Zap, ShieldCheck, Cpu, Coins, Activity, ScrollText, Wallet, ArrowUpRight, ChevronRight } from 'lucide-react'

interface Node {
  id: string
  label: string
  type: 'core' | 'project' | 'wallet' | 'verifier' | 'x402'
  x: number // Percentage 0-100
  y: number // Percentage 0-100
  z: number // Topographic height
  value: string
  status: string
  icon: any
}

export function MarketMesh({ onNodeSelect }: { onNodeSelect: (node: any) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  
  // 1. PERFECT GEOMETRIC CIRCLE ALIGNMENT
  const nodes: Node[] = useMemo(() => {
    const coreX = 50
    const coreY = 50
    const radius = 28
    const baseZ = 60 // Unifying base height for perfect projection alignment
    
    const items = [
      { id: 'w1', label: 'Owner_Vault', type: 'wallet' as const, value: '0x4F9...A28B', status: 'ACTIVE', icon: Wallet },
      { id: 'p1', label: 'Tranche_Alpha', type: 'project' as const, value: '45,000 USDT', status: 'EXECUTING', icon: ScrollText },
      { id: 'p2', label: 'Tranche_Beta', type: 'project' as const, value: '12,400 USDT', status: 'ISSUED', icon: ScrollText },
      { id: 'p3', label: 'Tranche_Gamma', type: 'project' as const, value: '8,200 USDT', status: 'FAILED', icon: ScrollText },
      { id: 'v1', label: 'Verifier_S9', type: 'verifier' as const, value: 'PASS', status: 'ACTIVE', icon: ShieldCheck },
      { id: 'x1', label: 'x402_Payout', type: 'x402' as const, value: '0.045 BTC', status: 'ROUTING', icon: Coins },
    ]

    return [
      { id: 'core', label: 'Settlement_Root', type: 'core' as const, x: coreX, y: coreY, z: baseZ, value: '12.5 BTC', status: 'SYNCHRONIZED', icon: Landmark },
      ...items.map((item, i) => {
        const angle = (i / items.length) * Math.PI * 2 - Math.PI / 2
        return {
          ...item,
          x: coreX + Math.cos(angle) * radius,
          y: coreY + Math.sin(angle) * radius,
          z: baseZ
        }
      })
    ]
  }, [])

  // 2. TOPOGRAPHIC ENGINE
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const rows = 45
    const cols = 65
    let grid: { x: number, y: number, z: number }[][] = []

    const initGrid = (width: number, height: number) => {
      grid = []
      for (let i = 0; i <= rows; i++) {
        grid[i] = []
        for (let j = 0; j <= cols; j++) {
          grid[i][j] = {
            x: (j / cols) * width,
            y: (i / rows) * height,
            z: 0
          }
        }
      }
    }

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
      initGrid(width, height)
    }

    const observer = new ResizeObserver(() => resize())
    observer.observe(container)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const time = Date.now() / 4000

      // Update Topography
      for (let i = 0; i <= rows; i++) {
        for (let j = 0; j <= cols; j++) {
          const p = grid[i][j]
          let h = Math.sin(p.x * 0.003 + time) * 10 + Math.cos(p.y * 0.004 + time * 0.8) * 10
          
          nodes.forEach(node => {
            const nx = (node.x / 100) * canvas.width
            const ny = (node.y / 100) * canvas.height
            const dx = p.x - nx
            const dy = p.y - ny
            const distSq = dx * dx + dy * dy
            const radiusPx = 250
            if (distSq < radiusPx * radiusPx) {
              const influence = (1 - Math.sqrt(distSq) / radiusPx)
              h += Math.pow(influence, 2.5) * node.z
              if (hoveredNode === node.id) h += Math.pow(influence, 5) * 40
            }
          })
          p.z += (h - p.z) * 0.12
        }
      }

      const proj = (p: any) => ({ x: p.x, y: p.y - p.z * 0.6 })

      // Draw Mesh
      ctx.lineWidth = 0.8
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const p1 = grid[i][j], p2 = grid[i][j + 1], p3 = grid[i + 1][j], p4 = grid[i + 1][j + 1]
          const t1 = proj(p1), t2 = proj(p2), t3 = proj(p3), t4 = proj(p4)
          
          const drawTri = (a: any, b: any, c: any, baseZ: number) => {
            const opacity = 0.12 + (baseZ / 150) * 0.28
            ctx.beginPath()
            ctx.strokeStyle = `rgba(31, 41, 55, ${opacity})`
            ctx.fillStyle = `rgba(216, 180, 254, ${opacity * 0.15})`
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath()
            if (baseZ > 35) ctx.fill()
            ctx.stroke()
          }
          drawTri(t1, t2, t3, p1.z)
          drawTri(t2, t4, t3, p4.z)
        }
      }

      // Value Pulses
      nodes.slice(1).forEach(node => {
        const core = nodes[0]
        const from = proj({ x: (core.x / 100) * canvas.width, y: (core.y / 100) * canvas.height, z: core.z })
        const to = proj({ x: (node.x / 100) * canvas.width, y: (node.y / 100) * canvas.height, z: node.z })
        
        ctx.beginPath(); ctx.strokeStyle = 'rgba(243, 186, 47, 0.2)'; ctx.lineWidth = 1.2
        ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke()

        const prog = (Date.now() % 5000) / 5000
        const px = from.x + (to.x - from.x) * prog
        const py = from.y + (to.y - from.y) * prog
        ctx.fillStyle = '#F3BA2F'; ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill()
      })

      animationFrameId = requestAnimationFrame(draw)
    }

    resize(); draw()
    return () => { observer.disconnect(); cancelAnimationFrame(animationFrameId) }
  }, [hoveredNode, nodes])

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-transparent">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full z-0 opacity-100" />

      <div className="absolute inset-0 z-10 pointer-events-none">
        {nodes.map((node) => {
          const isCore = node.type === 'core'
          const isSelected = selectedNode === node.id
          const isHovered = hoveredNode === node.id

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, y: isSelected ? -25 : 0 }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); onNodeSelect(node) }}
              className="absolute pointer-events-auto cursor-pointer"
              style={{ left: `${node.x}%`, top: `${node.y}%`, transform: `translate(-50%, calc(-50% - ${node.z * 0.6}px))` }}
            >
              {isCore ? (
                <div className="relative flex flex-col items-center">
                  <div className="w-44 h-44 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] animate-pulse rounded-full" />
                    <div className="w-32 h-32 bg-white border border-black/10 shadow-2xl flex items-center justify-center rounded-full relative z-10">
                       <node.icon className="w-14 h-14 text-black" />
                    </div>
                  </div>
                  <div className="mt-8 text-center bg-white/80 backdrop-blur-xl px-12 py-5 border border-black/5 shadow-2xl">
                    <div className="text-[12px] font-bold uppercase tracking-[0.5em] text-black font-mono leading-none">{node.label}</div>
                    <div className="text-3xl font-bold font-mono text-primary mt-3 tracking-tighter">{node.value}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 bg-white/95 backdrop-blur-2xl border border-black/10 shadow-2xl rounded-full flex items-center justify-center transition-all duration-500 ${isHovered ? 'border-primary/60 scale-110 shadow-primary/20' : ''}`}>
                    <node.icon className={`w-7 h-7 transition-colors ${isHovered ? 'text-primary' : 'text-black/50'}`} />
                    <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${node.status === 'EXECUTING' ? 'bg-amber-400 animate-pulse' : node.status === 'FAILED' ? 'bg-red-400' : 'bg-primary'}`} />
                  </div>
                  
                  <AnimatePresence>
                    {(isHovered || isSelected) && (
                      <motion.div 
                        initial={{ opacity: 0, x: -15, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -15, scale: 0.9 }}
                        className="flex flex-col bg-white/60 backdrop-blur-md px-6 py-3 border border-black/5 shadow-xl"
                      >
                        <div className="text-[11px] font-bold text-black uppercase tracking-[0.4em] font-mono mb-1">{node.label}</div>
                        <div className="text-[14px] font-bold text-black/50 font-mono italic tracking-tighter">{node.value}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="absolute bottom-10 left-10 flex items-center gap-12 text-black/20">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-signal-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.6em] italic">GEOMETRIC_SYNCHRONIZED</span>
        </div>
      </div>
    </div>
  )
}
