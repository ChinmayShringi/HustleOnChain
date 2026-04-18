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
    <div className="w-full bg-foreground py-3 overflow-hidden flex items-center border-y border-white/10">
      <div className="flex whitespace-nowrap animate-ticker">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-8 px-12 border-r border-white/5">
                <span className="text-[10px] font-mono font-medium text-background/40 uppercase tracking-widest">{tx.type}</span>
                <span className="text-[10px] font-mono font-bold text-background uppercase tracking-tight">{tx.id}</span>
                <span className="text-[10px] font-mono font-medium text-primary uppercase tracking-tight">{tx.amount}</span>
                <div className={`w-1 h-1 rounded-full ${tx.status === 'PASS' || tx.status === 'COMPLETED' ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
