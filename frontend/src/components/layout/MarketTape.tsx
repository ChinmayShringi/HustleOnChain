'use client'

import { motion } from 'framer-motion'

const transactions = [
  { id: 'TX-082', type: 'CLEARING', amount: '2,500 USDT', status: 'PASS' },
  { id: 'TX-091', type: 'ISSUANCE', amount: '12,000 USDT', status: 'ACTIVE' },
  { id: 'TX-077', type: 'SETTLEMENT', amount: '500 USDT', status: 'PASS' },
  { id: 'TX-102', type: 'GRADING', amount: '1,200 USDT', status: 'PENDING' },
  { id: 'TX-088', type: 'X402 PAY', amount: '0.01 USDT', status: 'COMPLETED' },
]

export function MarketTape() {
  return (
    <div className="w-full bg-[#f0f0f2] py-4 overflow-hidden flex items-center border-y border-black/5 relative z-30">
      <div className="flex whitespace-nowrap animate-ticker">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-10 px-16 border-r border-black/5 group hover:bg-black/5 transition-colors duration-500">
                <span className="text-[10px] font-mono font-bold text-black/30 uppercase tracking-[0.4em] italic group-hover:text-black/50 transition-colors">{tx.type}</span>
                <span className="text-[11px] font-mono font-bold text-black uppercase tracking-widest italic">{tx.id}</span>
                <span className="text-[11px] font-mono font-bold text-primary uppercase tracking-tighter italic">{tx.amount}</span>
                <div className={`w-2 h-2 rounded-full ${tx.status === 'PASS' || tx.status === 'COMPLETED' ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.4)] animate-signal-pulse' : 'bg-black/10'}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
