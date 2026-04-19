'use client'

/**
 * Live view of a single AgentWork job.
 *
 * Layout:
 *   Header — job ID, state badge, escrow amount, expiry countdown.
 *   Left column — chronological timeline of on-chain events (newest
 *     first) with BscScan links.
 *   Right column — live agent status pill from the grader.
 *
 * Conditional sections:
 *   - x402 card if an agent status message mentions x402 or if
 *     tUSDT Transfer events flow to the grader signer during the job.
 *   - "Claim refund" button if state=Expired and the connected
 *     wallet is the job's client.
 */

import React, { use, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { formatUnits } from 'viem'
import { useAccount, useReadContract } from 'wagmi'
import { CinematicBackground } from '@/components/layout/CinematicBackground'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { Button } from '@/components/ui/button'
import { bscTestnet } from '@/lib/contracts/addresses'
import { erc20Abi } from '@/lib/contracts/erc20.abi'
import { JobState, jobStateLabel, isTerminalState } from '@/lib/contracts/jobState'
import { useAgentStatus } from '@/lib/hooks/useAgentStatus'
import { useClaimRefund } from '@/lib/hooks/useClaimRefund'
import { useJob, type Job } from '@/lib/hooks/useJob'
import { useJobEvents, type TimelineEvent } from '@/lib/hooks/useJobEvents'
import { useX402Payment } from '@/lib/hooks/useX402Payment'
import { txExplorerUrl, trackTx } from '@/components/wiring/TxToast'
import { usePublicClient } from 'wagmi'
import { toast } from 'sonner'
import {
  ExternalLink,
  ScrollText,
  Activity,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  XCircle,
  HourglassIcon,
  Zap,
  ArrowLeftRight,
  FileCode2,
} from 'lucide-react'

type PageProps = {
  readonly params: Promise<{ id: string }>
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const parsed = parseJobId(id)

  if (parsed === null) {
    return <InvalidIdView raw={id} />
  }

  return <ProjectDetail jobId={parsed} rawId={id} />
}

function ProjectDetail({ jobId, rawId }: { jobId: bigint; rawId: string }) {
  const job = useJob(jobId)
  const hasJob = Boolean(job.data)
  const events = useJobEvents(jobId, job.data?.state)
  const agent = useAgentStatus(job.data?.state)
  const x402 = useX402Payment({
    jobExists: hasJob,
    provider: job.data?.provider ?? null,
    token: job.data?.token ?? null,
  })

  // Track whether the agent status ever surfaced an x402 event.
  const sawX402Ref = useRef(false)
  useEffect(() => {
    const msg = agent.status?.message?.toLowerCase() ?? ''
    const state = agent.status?.state?.toLowerCase() ?? ''
    if (msg.includes('x402') || state.includes('x402') || state.includes('paying_x402')) {
      sawX402Ref.current = true
    }
  }, [agent.status])

  const tokenMeta = useTokenMeta(job.data?.token ?? null)
  const showX402 = sawX402Ref.current || x402.data.length > 0

  return (
    <main className="min-h-screen bg-white text-black relative">
      <CinematicBackground />
      <FloatingHeader />

      <div className="pt-40 pb-48 container mx-auto px-10 relative z-10">
        <Header
          jobId={jobId}
          rawId={rawId}
          job={job.data}
          loading={job.isLoading}
          error={job.error}
          token={tokenMeta}
        />

        {job.isLoading && !job.data ? (
          <LoadingView />
        ) : job.error ? (
          <ErrorView error={job.error} />
        ) : !job.data ? (
          <NotFoundView jobId={jobId} />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mt-16">
              <div className="lg:col-span-8 space-y-16">
                <TimelineCard events={events.data} loading={events.isLoading} />
                {showX402 && (
                  <X402Card
                    payments={x402.data}
                    token={tokenMeta}
                    statusMessage={agent.status?.message ?? null}
                  />
                )}
                <ClientActions job={job.data} />
              </div>

              <div className="lg:col-span-4">
                <div className="sticky top-40 space-y-8">
                  <AgentStatusCard
                    status={agent.status}
                    jobState={job.data.state}
                    isPolling={agent.isPolling}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

/* -------------------------------- header -------------------------------- */

function Header(props: {
  jobId: bigint
  rawId: string
  job: Job | null
  loading: boolean
  error: Error | null
  token: TokenMeta | null
}) {
  const state = props.job?.state ?? null
  const badge = stateBadge(state)
  const amount = useMemo(() => {
    if (!props.job) return null
    const decimals = props.token?.decimals ?? 18
    return formatUnits(props.job.budget, decimals)
  }, [props.job, props.token])

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 text-[11px] font-mono font-bold text-primary tracking-widest shadow-sm">
            JOB-{props.rawId}
          </div>
          <div
            className={`flex items-center gap-3 px-4 py-1.5 border shadow-sm font-mono text-[10px] font-bold uppercase tracking-[0.4em] italic ${badge.classes}`}
          >
            <div className={`w-2 h-2 rounded-full ${badge.dot}`} />
            <span>{badge.label}</span>
          </div>
        </div>
        <h1 className="text-[3rem] md:text-[4rem] font-bold uppercase tracking-tighter font-mono leading-[0.9] text-black italic">
          Job_{props.rawId.padStart(4, '0')}
        </h1>
        {props.job && (
          <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-black/50 italic">
            Task: {shortHash(props.job.taskHash)}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-10 p-10 slab-glass border-primary/20 bg-white/80 shadow-2xl shadow-primary/5">
        <div>
          <div className="text-[11px] text-primary uppercase font-bold tracking-[0.4em] mb-4 italic font-mono">
            Settlement_Escrow
          </div>
          <div className="text-3xl md:text-4xl font-bold font-mono tracking-tighter text-black">
            {amount ?? '—'}{' '}
            <span className="text-primary italic">
              {props.token?.symbol ?? 'TOKEN'}
            </span>
          </div>
        </div>
        <div className="hidden md:block w-px h-16 bg-black/5" />
        <div>
          <div className="text-[11px] text-black/40 uppercase font-bold tracking-[0.4em] mb-4 italic font-mono">
            Expires
          </div>
          <ExpiresCountdown
            expiresAt={props.job?.expiresAt ?? null}
            state={state}
          />
        </div>
      </div>
    </div>
  )
}

function ExpiresCountdown(props: {
  expiresAt: bigint | null
  state: number | null
}) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1_000)
    return () => clearInterval(id)
  }, [])

  if (props.expiresAt === null) {
    return <div className="font-mono text-lg tracking-tight text-black/50">—</div>
  }
  if (
    props.state !== null &&
    (props.state === JobState.Completed ||
      props.state === JobState.Rejected)
  ) {
    return (
      <div className="font-mono text-lg tracking-tight text-black/50 italic">
        n/a
      </div>
    )
  }
  const secs = Number(props.expiresAt) - now
  if (secs <= 0) {
    return (
      <div className="font-mono text-lg tracking-tight text-destructive italic">
        EXPIRED
      </div>
    )
  }
  return (
    <div className="font-mono text-lg tracking-tight text-black">
      {formatDuration(secs)}
    </div>
  )
}

/* ------------------------------ timeline ------------------------------- */

function TimelineCard(props: {
  events: readonly TimelineEvent[]
  loading: boolean
}) {
  const ordered = useMemo(
    () => [...props.events].reverse(),
    [props.events],
  )

  return (
    <div className="slab-glass border-black/5 overflow-hidden shadow-2xl">
      <div className="bg-black/[0.02] px-10 py-6 border-b border-black/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ScrollText className="w-5 h-5 text-primary/60" />
          <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-black italic font-mono">
            Settlement_Tape
          </span>
        </div>
        <div className="text-[10px] font-mono font-bold text-black/40 italic tracking-widest">
          {props.events.length} EVENTS
        </div>
      </div>

      <div className="p-10">
        {props.loading && props.events.length === 0 ? (
          <div className="text-[11px] font-mono italic text-black/40 tracking-widest uppercase">
            Scanning_Chain...
          </div>
        ) : ordered.length === 0 ? (
          <div className="text-[11px] font-mono italic text-black/40 tracking-widest uppercase">
            No_Events_Yet
          </div>
        ) : (
          <ol className="relative border-l border-black/5 pl-10 space-y-10 py-2">
            {ordered.map((ev) => (
              <TimelineRow
                key={`${ev.txHash}-${ev.logIndex}-${ev.type}`}
                event={ev}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  const meta = eventMeta(event.type)
  const when = event.timestamp
    ? relativeTime(event.timestamp)
    : 'just now'
  return (
    <li className="relative group">
      <div className={`absolute -left-[45px] top-1 w-3 h-3 border ${meta.dotClasses}`} />
      <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-black/40 mb-2 uppercase tracking-[0.35em] italic">
        <meta.icon className="w-3.5 h-3.5" />
        <span className={meta.labelColor}>{event.type}</span>
        <span className="text-black/30">·</span>
        <span>block {event.blockNumber.toString()}</span>
        <span className="text-black/30">·</span>
        <span>{when}</span>
      </div>
      {renderEventArgs(event)}
      <a
        href={txExplorerUrl(event.txHash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-[11px] font-mono font-bold text-black/40 hover:text-primary transition-colors italic"
      >
        {shortHash(event.txHash)}
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </li>
  )
}

function renderEventArgs(event: TimelineEvent): React.ReactNode {
  const a = event.args
  const bits: string[] = []
  if (event.type === 'JobFunded') {
    const token = a.token as string | undefined
    const amount = a.amount as bigint | undefined
    if (token) bits.push(`token=${shortHash(token)}`)
    if (typeof amount === 'bigint') bits.push(`amount=${amount.toString()}`)
  } else if (event.type === 'JobSubmitted') {
    const h = a.deliverableHash as string | undefined
    if (h) bits.push(`deliverable=${shortHash(h)}`)
  } else if (event.type === 'JobCompleted' || event.type === 'JobRejected') {
    const r = a.reason as string | undefined
    if (r) bits.push(`reason="${r}"`)
  } else if (event.type === 'VerdictSubmitted') {
    const passed = a.passed as boolean | undefined
    if (typeof passed === 'boolean') bits.push(passed ? 'passed=true' : 'passed=false')
  } else if (event.type === 'JobCreated') {
    const client = a.client as string | undefined
    const provider = a.provider as string | undefined
    if (client) bits.push(`client=${shortHash(client)}`)
    if (provider) bits.push(`provider=${shortHash(provider)}`)
  } else if (event.type === 'Refunded') {
    const amount = a.amount as bigint | undefined
    if (typeof amount === 'bigint') bits.push(`amount=${amount.toString()}`)
  }
  if (bits.length === 0) return null
  return (
    <p className="text-sm text-black/70 mb-2 font-mono italic leading-snug">
      {bits.join(' · ')}
    </p>
  )
}

/* --------------------------- agent status card -------------------------- */

function AgentStatusCard(props: {
  status: import('@/lib/grader/types').StatusResponse | null
  jobState: number
  isPolling: boolean
}) {
  const terminal = isTerminalState(props.jobState)
  const st = props.status
  const label = terminal ? 'Agent_Idle' : (st?.state ?? 'connecting')

  return (
    <div className="slab-glass border-black/5 p-8 bg-white/70 shadow-xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 bg-primary/5 border border-primary/10 flex items-center justify-center rounded-sm">
          <Cpu className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-bold uppercase tracking-tighter font-mono italic text-black">
          Agent_Relay
        </h2>
      </div>

      <div className={`inline-flex items-center gap-2 px-3 py-1.5 mb-6 border font-mono text-[10px] font-bold uppercase tracking-[0.3em] italic ${
        terminal
          ? 'bg-black/5 border-black/10 text-black/40'
          : 'bg-primary/5 border-primary/20 text-primary'
      }`}>
        <div
          className={`w-2 h-2 rounded-full ${
            terminal ? 'bg-black/30' : 'bg-primary animate-signal-pulse'
          }`}
        />
        {label}
      </div>

      <div className="space-y-5">
        <Field label="Last_Message">
          <span className="text-sm text-black/80 font-medium italic">
            {terminal
              ? 'Job finalized on-chain.'
              : st?.message ?? '—'}
          </span>
        </Field>
        <Field label="Job_Id_Reported">
          <span className="font-mono text-sm text-black/70">
            {st?.job_id ?? '—'}
          </span>
        </Field>
        <Field label="Updated">
          <span className="font-mono text-xs text-black/50 italic">
            {st?.updated_at ? relativeTime(st.updated_at) : '—'}
          </span>
        </Field>
        <Field label="Polling">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] italic text-black/50">
            {terminal ? 'Stopped' : props.isPolling ? 'Every_3s' : 'Paused'}
          </span>
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-black/40 italic font-mono">
        {label}
      </span>
      {children}
    </div>
  )
}

/* ------------------------------- x402 card ----------------------------- */

function X402Card(props: {
  payments: readonly import('@/lib/hooks/useX402Payment').X402Payment[]
  token: TokenMeta | null
  statusMessage: string | null
}) {
  return (
    <div className="slab-glass border-primary/20 p-10 bg-primary/[0.02] shadow-xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-sm">
          <Coins className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold uppercase tracking-tighter font-mono italic text-black">
            x402_Resource_Payment
          </h3>
          <p className="text-[10px] text-black/40 font-bold uppercase tracking-[0.4em] italic font-mono mt-1">
            Agent_Paid_For_Compute
          </p>
        </div>
      </div>

      {props.payments.length === 0 ? (
        <p className="text-sm text-black/60 italic font-medium">
          Agent reported an x402 payment: {props.statusMessage ?? '—'}
        </p>
      ) : (
        <ul className="space-y-4">
          {props.payments.map((p) => {
            const decimals = props.token?.decimals ?? 18
            const symbol = props.token?.symbol ?? 'TOKEN'
            return (
              <li
                key={p.txHash}
                className="flex items-center justify-between p-6 border border-black/5 bg-white/60"
              >
                <div className="flex items-center gap-4">
                  <ArrowLeftRight className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-mono text-lg font-bold text-black tracking-tighter">
                      {formatUnits(p.value, decimals)}{' '}
                      <span className="text-primary italic">{symbol}</span>
                    </div>
                    <div className="text-[10px] font-mono text-black/40 italic uppercase tracking-widest">
                      block {p.blockNumber.toString()}
                    </div>
                  </div>
                </div>
                <a
                  href={txExplorerUrl(p.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[11px] font-mono font-bold text-primary italic hover:underline"
                >
                  {shortHash(p.txHash)}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ----------------------------- client actions --------------------------- */

function ClientActions({ job }: { job: Job }) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const claim = useClaimRefund()

  const isClient =
    isConnected &&
    address?.toLowerCase() === job.client.toLowerCase()
  const canClaim = job.state === JobState.Expired && isClient

  if (!canClaim) return null

  const onClaim = async () => {
    try {
      const hash = await claim.submit(job.jobId)
      if (publicClient) {
        await trackTx({
          hash,
          publicClient,
          label: 'Claim refund',
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Refund failed'
      toast.error(msg)
    }
  }

  return (
    <div className="slab-glass border-destructive/30 p-10 bg-destructive/[0.02] shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h3 className="text-lg font-bold uppercase tracking-tighter font-mono italic text-black">
          Job_Expired
        </h3>
      </div>
      <p className="text-sm text-black/60 italic mb-8 font-medium">
        Escrow remains locked until the client reclaims it.
      </p>
      <Button
        onClick={onClaim}
        disabled={claim.isPending}
        className="h-16 px-10 rounded-none uppercase font-bold tracking-[0.3em] gap-3 bg-destructive hover:bg-destructive/90 text-white border-none text-[11px] italic"
      >
        {claim.isPending ? 'Claiming...' : 'Claim_Refund'}
      </Button>
      {claim.error && (
        <p className="mt-4 text-xs font-mono text-destructive italic">
          {claim.error.message}
        </p>
      )}
    </div>
  )
}

/* ------------------------------ sub-views ------------------------------- */

function LoadingView() {
  return (
    <div className="mt-20 p-16 slab-glass border-black/5 bg-white/60 text-center">
      <div className="text-[11px] font-mono italic text-black/40 tracking-widest uppercase">
        Loading_Onchain_State...
      </div>
    </div>
  )
}

function ErrorView({ error }: { error: Error }) {
  return (
    <div className="mt-20 p-16 slab-glass border-destructive/30 bg-destructive/[0.02]">
      <div className="flex items-center gap-4 mb-4">
        <XCircle className="w-6 h-6 text-destructive" />
        <h2 className="text-xl font-mono font-bold uppercase tracking-tighter italic">
          Chain_Read_Failed
        </h2>
      </div>
      <p className="text-sm text-black/60 font-mono italic">{error.message}</p>
    </div>
  )
}

function NotFoundView({ jobId }: { jobId: bigint }) {
  return (
    <div className="mt-20 p-16 slab-glass border-black/5 bg-white/60">
      <div className="flex items-center gap-4 mb-4">
        <AlertTriangle className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-mono font-bold uppercase tracking-tighter italic">
          Job_Not_Found
        </h2>
      </div>
      <p className="text-sm text-black/60 font-mono italic">
        No job with id {jobId.toString()} exists on this network.
      </p>
      <Link
        href="/markets"
        className="inline-block mt-6 text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-primary italic hover:underline"
      >
        View_Active_Jobs →
      </Link>
    </div>
  )
}

function InvalidIdView({ raw }: { raw: string }) {
  return (
    <main className="min-h-screen bg-white text-black relative">
      <CinematicBackground />
      <FloatingHeader />
      <div className="pt-40 pb-48 container mx-auto px-10 relative z-10">
        <div className="p-16 slab-glass border-destructive/30 bg-destructive/[0.02] max-w-2xl">
          <div className="flex items-center gap-4 mb-4">
            <XCircle className="w-6 h-6 text-destructive" />
            <h2 className="text-2xl font-mono font-bold uppercase tracking-tighter italic">
              Invalid_Job_Id
            </h2>
          </div>
          <p className="text-sm text-black/60 font-mono italic mb-6">
            &quot;{raw}&quot; is not a valid uint job id.
          </p>
          <Link
            href="/markets"
            className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-primary italic hover:underline"
          >
            Back_To_Markets →
          </Link>
        </div>
      </div>
    </main>
  )
}

/* -------------------------------- utils -------------------------------- */

type TokenMeta = { readonly symbol: string; readonly decimals: number }

function useTokenMeta(token: `0x${string}` | null): TokenMeta | null {
  const zero = '0x0000000000000000000000000000000000000000'
  const enabled = Boolean(token) && token !== zero

  const symbol = useReadContract({
    abi: erc20Abi,
    address: token ?? undefined,
    functionName: 'symbol',
    query: { enabled },
  })
  const decimals = useReadContract({
    abi: erc20Abi,
    address: token ?? undefined,
    functionName: 'decimals',
    query: { enabled },
  })

  if (!enabled) return null
  if (symbol.data === undefined || decimals.data === undefined) return null
  return {
    symbol: symbol.data as string,
    decimals: Number(decimals.data),
  }
}

function parseJobId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null
  try {
    const big = BigInt(raw)
    if (big < 0n) return null
    return big
  } catch {
    return null
  }
}

function shortHash(hash: string): string {
  if (!hash || hash.length < 12) return hash
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

function formatDuration(secs: number): string {
  if (secs <= 0) return 'EXPIRED'
  const d = Math.floor(secs / 86_400)
  const h = Math.floor((secs % 86_400) / 3_600)
  const m = Math.floor((secs % 3_600) / 60)
  const s = secs % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function relativeTime(tsSec: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - tsSec
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function stateBadge(state: number | null): {
  readonly label: string
  readonly classes: string
  readonly dot: string
} {
  if (state === null) {
    return {
      label: 'Loading',
      classes: 'bg-black/[0.02] border-black/5 text-black/50',
      dot: 'bg-black/30',
    }
  }
  const label = jobStateLabel(state).toUpperCase()
  switch (state) {
    case JobState.Open:
      return {
        label,
        classes: 'bg-amber-50 border-amber-200 text-amber-700',
        dot: 'bg-amber-500 animate-pulse',
      }
    case JobState.Funded:
      return {
        label,
        classes: 'bg-primary/10 border-primary/20 text-primary',
        dot: 'bg-primary animate-signal-pulse',
      }
    case JobState.Submitted:
      return {
        label,
        classes: 'bg-blue-50 border-blue-200 text-blue-700',
        dot: 'bg-blue-500 animate-pulse',
      }
    case JobState.Completed:
      return {
        label,
        classes: 'bg-green-50 border-green-200 text-green-700',
        dot: 'bg-green-500',
      }
    case JobState.Rejected:
      return {
        label,
        classes: 'bg-rose-50 border-rose-200 text-rose-700',
        dot: 'bg-rose-500',
      }
    case JobState.Expired:
      return {
        label,
        classes: 'bg-black/5 border-black/10 text-black/60',
        dot: 'bg-black/40',
      }
    default:
      return {
        label,
        classes: 'bg-black/[0.02] border-black/5 text-black/50',
        dot: 'bg-black/30',
      }
  }
}

function eventMeta(type: string): {
  readonly icon: React.ComponentType<{ className?: string }>
  readonly dotClasses: string
  readonly labelColor: string
} {
  switch (type) {
    case 'JobCreated':
      return {
        icon: FileCode2,
        dotClasses: 'bg-white border-primary/40',
        labelColor: 'text-primary',
      }
    case 'JobFunded':
      return {
        icon: Coins,
        dotClasses: 'bg-primary border-primary',
        labelColor: 'text-primary',
      }
    case 'JobSubmitted':
      return {
        icon: Zap,
        dotClasses: 'bg-white border-blue-500',
        labelColor: 'text-blue-700',
      }
    case 'JobCompleted':
      return {
        icon: CheckCircle2,
        dotClasses: 'bg-green-500 border-green-500',
        labelColor: 'text-green-700',
      }
    case 'JobRejected':
      return {
        icon: XCircle,
        dotClasses: 'bg-rose-500 border-rose-500',
        labelColor: 'text-rose-700',
      }
    case 'JobExpired':
      return {
        icon: HourglassIcon,
        dotClasses: 'bg-black/40 border-black/40',
        labelColor: 'text-black/60',
      }
    case 'Refunded':
      return {
        icon: ArrowLeftRight,
        dotClasses: 'bg-amber-500 border-amber-500',
        labelColor: 'text-amber-700',
      }
    case 'VerdictSubmitted':
      return {
        icon: ShieldCheck,
        dotClasses: 'bg-white border-tertiary',
        labelColor: 'text-tertiary',
      }
    default:
      return {
        icon: Activity,
        dotClasses: 'bg-black/20 border-black/20',
        labelColor: 'text-black/60',
      }
  }
}
