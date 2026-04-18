'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ExternalLink, History } from 'lucide-react'

interface Event {
  id: string
  type: string
  msg: string
  time: string
  tx: string
}

export function ProvenanceRail({ events }: { events: Event[] }) {
  return (
    <div className="flex flex-col h-full border-l border-border/50">
      <div className="p-10 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <History className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-sm font-medium uppercase tracking-[0.3em]">Provenance Rail</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-jade animate-pulse" />
          <span className="text-[10px] font-medium text-jade uppercase tracking-widest">Live Feed</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-10 space-y-12 provenance-line">
          {events.map((event) => (
            <div key={event.id} className="relative group">
              <div className="absolute top-2 -left-[33px] w-2.5 h-2.5 rounded-full bg-background border-2 border-border group-hover:border-primary transition-colors" />
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-medium text-muted-foreground">{event.time}</span>
                  <span className={`text-[8px] font-medium uppercase tracking-widest px-2 py-0.5 border ${
                    event.type === 'SETTLEMENT' ? 'border-jade/30 text-jade' : 
                    event.type === 'X402_PAYMENT' ? 'border-primary/30 text-primary' : 
                    'border-border text-muted-foreground'
                  }`}>
                    {event.type}
                  </span>
                </div>
                
                <p className="text-xs font-medium uppercase tracking-tight leading-relaxed group-hover:text-primary transition-colors">
                  {event.msg}
                </p>
                
                <div className="flex items-center gap-2 group/tx cursor-pointer">
                  <span className="text-[9px] font-mono text-muted-foreground/50 group-hover/tx:text-muted-foreground transition-colors truncate">
                    {event.tx}
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground/30 group-hover/tx:text-primary transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
