'use client'

/**
 * Step 2/3 — shows the pytest file returned by the grader with python
 * syntax highlighting (shiki). Offers Regenerate (reruns generate with
 * the current draft) and Proceed (routes to /create/funding).
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAccount, useChainId } from 'wagmi'
import { ArrowLeft, ArrowRight, FileCode, RefreshCw } from 'lucide-react'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { CinematicBackground } from '@/components/layout/CinematicBackground'
import { Button } from '@/components/ui/button'
import { graderClient } from '@/lib/grader/client'
import { BSC_TESTNET_CHAIN_ID } from '@/lib/contracts/addresses'
import { useDraftJob } from '@/lib/hooks/useDraftJob'
import { useGenerateTests } from '@/lib/hooks/useGenerateTests'

export default function CreatePreviewPage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const onCorrectChain = chainId === BSC_TESTNET_CHAIN_ID

  const { draft, hydrated } = useDraftJob()
  const [pytestSource, setPytestSource] = useState<string>('')
  const [highlighted, setHighlighted] = useState<string>('')
  const [loadingTests, setLoadingTests] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const { mutateAsync: regenerate, isPending: regenerating } =
    useGenerateTests()

  useEffect(() => {
    if (!hydrated) return
    if (!draft) {
      toast.error('No draft found — start from /create')
      router.replace('/create')
    }
  }, [draft, hydrated, router])

  useEffect(() => {
    if (!draft) return
    let cancelled = false
    setLoadingTests(true)
    setLoadError(null)
    graderClient()
      .getTests(draft.pytest_hash)
      .then((src) => {
        if (cancelled) return
        setPytestSource(src)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const msg =
          err instanceof Error ? err.message : 'Failed to load tests'
        setLoadError(msg)
      })
      .finally(() => {
        if (!cancelled) setLoadingTests(false)
      })
    return () => {
      cancelled = true
    }
  }, [draft])

  useEffect(() => {
    if (!pytestSource) {
      setHighlighted('')
      return
    }
    let cancelled = false
    // Shiki emits its own escaped HTML; the raw pytest text is tokenized
    // into <span> elements with HTML-encoded text nodes. Safe for innerHTML.
    import('shiki')
      .then(async (mod) => {
        const highlighter = await mod.createHighlighter({
          themes: ['github-light'],
          langs: ['python'],
        })
        if (cancelled) return
        const html = highlighter.codeToHtml(pytestSource, {
          lang: 'python',
          theme: 'github-light',
        })
        setHighlighted(html)
      })
      .catch(() => {
        if (!cancelled) setHighlighted('')
      })
    return () => {
      cancelled = true
    }
  }, [pytestSource])

  const onRegenerate = async () => {
    if (!draft) return
    try {
      await regenerate({
        function_signature: draft.function_signature,
        acceptance_criteria: draft.acceptance_criteria,
        bounty_wei: draft.bounty_wei,
        bounty_display: draft.bounty_display,
        expires_at: draft.expires_at,
        provider_address: draft.provider_address as `0x${string}`,
      })
      toast.success('Regenerated')
      setPytestSource('')
      setLoadingTests(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Regenerate failed'
      toast.error(msg)
    }
  }

  const onProceed = () => {
    if (!isConnected) {
      toast.error('Connect your wallet first')
      return
    }
    if (!onCorrectChain) {
      toast.error('Switch to BSC Testnet (chainId 97)')
      return
    }
    router.push('/create/funding')
  }

  const previewPlainFallback = useMemo(
    () => (
      <pre className="font-mono text-[12px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">
        {pytestSource}
      </pre>
    ),
    [pytestSource],
  )

  return (
    <main className="min-h-screen bg-white text-black relative">
      <CinematicBackground />
      <FloatingHeader />

      <div className="pt-40 pb-48 container mx-auto px-10 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary/5 border border-primary/10 flex items-center justify-center rounded-sm shadow-sm">
              <FileCode className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-tighter font-mono leading-none text-black">
                Test_Prospectus
              </h1>
              <p className="text-[10px] text-black/40 uppercase font-bold tracking-[0.4em] mt-3 italic opacity-60">
                Step 2 of 3 · Review deterministic tests
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/create')}
              className="h-12 rounded-none bg-transparent border-black/10 text-black uppercase font-bold text-[11px] tracking-[0.3em] gap-3 italic"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              variant="outline"
              disabled={regenerating || !draft}
              onClick={onRegenerate}
              className="h-12 rounded-none border-primary/20 border bg-transparent text-primary hover:bg-primary/5 uppercase font-bold text-[11px] tracking-[0.3em] gap-3 italic"
            >
              <RefreshCw
                className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`}
              />{' '}
              {regenerating ? 'Regenerating…' : 'Regenerate'}
            </Button>
            <Button
              onClick={onProceed}
              disabled={!isConnected || !onCorrectChain || loadingTests}
              className="h-12 rounded-none uppercase font-bold tracking-[0.3em] gap-3 bg-primary hover:bg-primary/90 text-white border-none text-[11px] shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              Proceed <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {draft ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="slab-glass border-black/5 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] italic opacity-60 mb-3">
                Task_Hash (on-chain taskHash)
              </p>
              <p className="font-mono text-[11px] break-all text-black">
                {draft.task_hash}
              </p>
            </div>
            <div className="slab-glass border-black/5 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] italic opacity-60 mb-3">
                Pytest_Hash (grader storage key)
              </p>
              <p className="font-mono text-[11px] break-all text-black">
                {draft.pytest_hash}
              </p>
            </div>
            <div className="slab-glass border-black/5 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] italic opacity-60 mb-3">
                Evaluator_Address
              </p>
              <p className="font-mono text-[11px] break-all text-black">
                {draft.evaluator_address}
              </p>
            </div>
          </div>
        ) : null}

        <div className="slab-glass border-black/5 overflow-hidden">
          <div className="p-6 border-b border-black/5 bg-black/[0.02] flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] italic opacity-60">
              tests/test_task.py
            </span>
          </div>
          <div className="p-8 bg-white overflow-x-auto">
            {loadingTests ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] italic opacity-60">
                Loading pytest file…
              </p>
            ) : loadError ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] italic text-destructive">
                {loadError}
              </p>
            ) : highlighted ? (
              // eslint-disable-next-line react/no-danger -- shiki escapes all user-supplied text
              <div
                className="font-mono text-[12px] leading-relaxed overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            ) : (
              previewPlainFallback
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
