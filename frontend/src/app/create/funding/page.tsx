'use client'

/**
 * Step 3/3 — approves tUSDT, creates the job, funds it, then routes
 * to `/project/[jobId]`. Each step is visible and each tx hash links
 * to the BscScan testnet explorer.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Coins,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useAccount, useChainId } from 'wagmi'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { CinematicBackground } from '@/components/layout/CinematicBackground'
import { Button } from '@/components/ui/button'
import {
  BSC_TESTNET_CHAIN_ID,
  bscTestnet,
} from '@/lib/contracts/addresses'
import { useCreateJob } from '@/lib/hooks/useCreateJob'
import { useDraftJob } from '@/lib/hooks/useDraftJob'
import { useFundJob } from '@/lib/hooks/useFundJob'
import { txExplorerUrl } from '@/components/wiring/TxToast'

type Phase =
  | 'ready'
  | 'creating'
  | 'created'
  | 'funding'
  | 'complete'
  | 'error'

type StepStatus = 'idle' | 'pending' | 'done' | 'error'

function StepRow(props: {
  index: number
  title: string
  description: string
  status: StepStatus
  hash?: string
}) {
  const { index, title, description, status, hash } = props
  const icon =
    status === 'done' ? (
      <CheckCircle2 className="w-5 h-5 text-primary" />
    ) : status === 'pending' ? (
      <Loader2 className="w-5 h-5 text-primary animate-spin" />
    ) : (
      <span className="font-mono text-[11px] italic opacity-60">
        0{index}
      </span>
    )
  return (
    <div className="slab-glass border-black/5 p-6 flex items-start gap-6">
      <div className="w-10 h-10 bg-black/[0.02] border border-black/5 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-black italic">
          {title}
        </p>
        <p className="text-[13px] italic opacity-60 mt-1">{description}</p>
        {hash ? (
          <a
            href={txExplorerUrl(hash as `0x${string}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-primary hover:underline"
          >
            {hash.slice(0, 10)}…{hash.slice(-8)}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : null}
      </div>
    </div>
  )
}

export default function CreateFundingPage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const onCorrectChain = chainId === BSC_TESTNET_CHAIN_ID

  const { draft, hydrated } = useDraftJob()

  useEffect(() => {
    if (!hydrated) return
    if (!draft) {
      toast.error('No draft found — start from /create')
      router.replace('/create')
    }
  }, [draft, hydrated, router])

  const amountWei = useMemo<bigint | undefined>(() => {
    if (!draft) return undefined
    try {
      return BigInt(draft.bounty_wei)
    } catch {
      return undefined
    }
  }, [draft])

  const createJob = useCreateJob()
  const fundJob = useFundJob(amountWei)

  const [phase, setPhase] = useState<Phase>('ready')
  const [phaseError, setPhaseError] = useState<string | null>(null)

  // When the create tx is mined and jobId is parsed, run the fund flow.
  useEffect(() => {
    if (phase !== 'creating' || !createJob.jobId || !amountWei) return
    setPhase('funding')
    fundJob
      .run({ jobId: createJob.jobId, amountWei })
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createJob.jobId, phase, amountWei])

  useEffect(() => {
    if (createJob.error && phase === 'creating') {
      setPhaseError(createJob.error.message)
      setPhase('error')
      toast.error(createJob.error.message)
    }
  }, [createJob.error, phase])

  useEffect(() => {
    if (fundJob.state.step === 'done' && createJob.jobId) {
      setPhase('complete')
      toast.success(`Job #${createJob.jobId.toString()} funded`)
      router.push(`/project/${createJob.jobId.toString()}`)
    }
    if (fundJob.state.step === 'error' && fundJob.state.error) {
      setPhaseError(fundJob.state.error.message)
      setPhase('error')
      toast.error(fundJob.state.error.message)
    }
  }, [fundJob.state, createJob.jobId, router])

  const onStart = async () => {
    if (!draft || !amountWei) return
    if (!isConnected) {
      toast.error('Connect your wallet first')
      return
    }
    if (!onCorrectChain) {
      toast.error('Switch to BSC Testnet (chainId 97)')
      return
    }

    setPhaseError(null)
    setPhase('creating')
    try {
      await createJob.submit({
        provider: draft.provider_address as `0x${string}`,
        evaluator: draft.evaluator_address as `0x${string}`,
        expiresAt: draft.expires_at,
        // CRITICAL: on-chain taskHash must be the grader-returned
        // `task_hash` (NOT `pytest_hash`).
        taskHash: draft.task_hash as `0x${string}`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'createJob failed'
      setPhaseError(msg)
      setPhase('error')
      toast.error(msg)
    }
  }

  const createStatus: StepStatus =
    phase === 'error' && !createJob.jobId
      ? 'error'
      : createJob.jobId
        ? 'done'
        : phase === 'creating'
          ? 'pending'
          : 'idle'

  const approveStatus: StepStatus =
    fundJob.state.step === 'approving'
      ? 'pending'
      : fundJob.state.approveHash
        ? 'done'
        : fundJob.state.needsApproval === false &&
            fundJob.state.allowance !== undefined
          ? 'done'
          : 'idle'

  const fundStatus: StepStatus =
    fundJob.state.step === 'funding'
      ? 'pending'
      : fundJob.state.step === 'done'
        ? 'done'
        : fundJob.state.step === 'error'
          ? 'error'
          : 'idle'

  const canStart =
    phase === 'ready' &&
    !!draft &&
    !!amountWei &&
    isConnected &&
    onCorrectChain

  return (
    <main className="min-h-screen bg-white text-black relative">
      <CinematicBackground />
      <FloatingHeader />

      <div className="pt-40 pb-48 container mx-auto px-10 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary/5 border border-primary/10 flex items-center justify-center rounded-sm shadow-sm">
              <Coins className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-tighter font-mono leading-none text-black">
                Fund_Portal
              </h1>
              <p className="text-[10px] text-black/40 uppercase font-bold tracking-[0.4em] mt-3 italic opacity-60">
                Step 3 of 3 · Approve · Create · Fund
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/create/preview')}
            className="h-12 rounded-none bg-transparent border-black/10 text-black uppercase font-bold text-[11px] tracking-[0.3em] gap-3 italic"
            disabled={phase === 'creating' || phase === 'funding'}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </div>

        {draft ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="slab-glass border-black/5 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] italic opacity-60 mb-3">
                Bounty
              </p>
              <p className="font-mono text-2xl font-bold text-primary">
                {draft.bounty_display} tUSDT
              </p>
            </div>
            <div className="slab-glass border-black/5 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] italic opacity-60 mb-3">
                Provider
              </p>
              <p className="font-mono text-[11px] break-all text-black">
                {draft.provider_address}
              </p>
            </div>
            <div className="slab-glass border-black/5 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] italic opacity-60 mb-3">
                Expires_At
              </p>
              <p className="font-mono text-[13px] text-black">
                {new Date(draft.expires_at * 1000).toLocaleString()}
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-6 mb-12">
          <StepRow
            index={1}
            title="Approve_tUSDT"
            description={
              fundJob.state.needsApproval
                ? 'Permit JobFactory to pull tUSDT from your wallet.'
                : 'Allowance already sufficient — will skip.'
            }
            status={approveStatus}
            hash={fundJob.state.approveHash}
          />
          <StepRow
            index={2}
            title="Create_Job"
            description="Publishes the job with the task hash returned by the grader."
            status={createStatus}
            hash={createJob.hash}
          />
          <StepRow
            index={3}
            title="Fund_Job"
            description="Transfers tUSDT into escrow and marks the job Funded."
            status={fundStatus}
            hash={fundJob.state.fundHash}
          />
        </div>

        {phaseError ? (
          <div className="slab-glass border-destructive/30 p-6 mb-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-destructive italic">
              Error: {phaseError}
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-4">
          {phase === 'complete' && createJob.jobId ? (
            <Button
              onClick={() =>
                router.push(`/project/${createJob.jobId!.toString()}`)
              }
              className="h-14 rounded-none uppercase font-bold tracking-[0.3em] gap-3 bg-primary hover:bg-primary/90 text-white border-none text-[11px] shadow-xl shadow-primary/20"
            >
              View Job <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onStart}
              disabled={!canStart}
              className="h-14 rounded-none uppercase font-bold tracking-[0.3em] gap-3 bg-primary hover:bg-primary/90 text-white border-none text-[11px] shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {phase === 'creating'
                ? 'Creating…'
                : phase === 'funding'
                  ? 'Funding…'
                  : 'Start_Funding'}
              {phase === 'ready' ? <ShieldCheck className="w-4 h-4" /> : null}
              {phase === 'creating' || phase === 'funding' ? (
                <Zap className="w-4 h-4 animate-pulse" />
              ) : null}
            </Button>
          )}
        </div>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] italic opacity-50">
          Network: {bscTestnet.name} · chainId {BSC_TESTNET_CHAIN_ID}
        </p>
      </div>
    </main>
  )
}
