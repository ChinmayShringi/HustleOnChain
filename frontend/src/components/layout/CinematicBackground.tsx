'use client'

import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export function CinematicBackground() {
  const { scrollY } = useScroll()
  const driftX = useTransform(scrollY, [0, 1000], [0, 50])

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#f0f0f2]">
      {/* 1. DIGITAL SOUL SUBSTRATE (FLUX Style - Ceramic) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Wavy Mesh Lines */}
        <div className="absolute top-[20%] left-[-10%] w-[80%] h-[60%] opacity-15">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                x: [0, 30, 0],
                opacity: [0.08, 0.25, 0.08]
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

        {/* The Particle Head (Ceramic) */}
        <motion.div
          style={{ x: driftX }}
          className="absolute right-[5%] top-[10%] w-[600px] h-[700px] opacity-15 animate-particle-drift"
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
                  opacity={Math.random() * 0.5}
                />
              )
            })}
          </svg>
        </motion.div>
      </div>

      {/* 2. PROXIMITY GRID (Ceramic) */}
      <div className="absolute bottom-0 left-0 w-full h-[60%] z-0 pointer-events-none">
        <div className="absolute inset-0 ledger-wireframe transform rotate-x-[70deg] origin-bottom animate-terrain-wave opacity-25" />
      </div>

      {/* 3. BACKGROUND GLOWS (Very Subtle) */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] pointer-events-none animate-orbit-glow" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-tertiary/10 rounded-full blur-[140px] pointer-events-none" />
    </div>
  )
}
