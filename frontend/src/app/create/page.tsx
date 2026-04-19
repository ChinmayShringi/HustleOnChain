'use client'

/**
 * Step 1/3 of the job-creation wizard. Collects function signature,
 * acceptance criteria, bounty, expiry, and provider address, then calls
 * the grader `/api/v1/grader/generate` endpoint and routes to
 * `/create/preview`.
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { parseUnits } from 'viem'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { z } from 'zod'
import {
  ArrowRight,
  Coins,
  Cpu,
  FileText,
  Landmark,
  ScrollText,
  User,
  Zap,
} from 'lucide-react'
import { FloatingHeader } from '@/components/layout/FloatingHeader'
import { CinematicBackground } from '@/components/layout/CinematicBackground'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  BSC_TESTNET_CHAIN_ID,
  getContracts,
} from '@/lib/contracts/addresses'
import { erc20Abi } from '@/lib/contracts/erc20.abi'
import { useGenerateTests } from '@/lib/hooks/useGenerateTests'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const MIN_BOUNTY_TUSDT = 0.01
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/

const EXPIRES_OPTIONS = [
  { key: '1h', label: '1 hour', seconds: 60 * 60 },
  { key: '6h', label: '6 hours', seconds: 6 * 60 * 60 },
  { key: '24h', label: '24 hours', seconds: 24 * 60 * 60 },
  { key: '7d', label: '7 days', seconds: 7 * 24 * 60 * 60 },
] as const

type ExpiresKey = (typeof EXPIRES_OPTIONS)[number]['key']

const formSchema = z.object({
  function_signature: z.string().trim().min(3, 'function signature required'),
  acceptance_criteria: z
    .string()
    .trim()
    .min(10, 'acceptance criteria required'),
  bounty: z
    .number()
    .refine((n) => Number.isFinite(n) && n >= MIN_BOUNTY_TUSDT, {
      message: `bounty must be >= ${MIN_BOUNTY_TUSDT} tUSDT`,
    }),
  expires_key: z.enum(['1h', '6h', '24h', '7d']),
  provider_address: z
    .string()
    .regex(ADDRESS_REGEX, 'invalid 0x address'),
})

function countCriteria(text: string): number {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .length
}

export default function CreateProjectPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const onCorrectChain = chainId === BSC_TESTNET_CHAIN_ID

  const contracts = useMemo(() => {
    try {
      return getContracts(BSC_TESTNET_CHAIN_ID)
    } catch {
      return null
    }
  }, [])

  const decimalsQuery = useReadContract({
    abi: erc20Abi,
    address: contracts?.tUSDT,
    functionName: 'decimals',
    query: { enabled: Boolean(contracts) },
  })
  const decimals =
    typeof decimalsQuery.data === 'number' ? decimalsQuery.data : 18

  const [functionSig, setFunctionSig] = useState('fizzbuzz(n: int) -> str')
  const [criteria, setCriteria] = useState(
    [
      'Return "Fizz" when n is divisible by 3',
      'Return "Buzz" when n is divisible by 5',
      'Return "FizzBuzz" when divisible by both',
      'Otherwise return the number as a string',
    ].join('\n'),
  )
  const [bounty, setBounty] = useState('1')
  const [expiresKey, setExpiresKey] = useState<ExpiresKey>('24h')
  const [providerAddress, setProviderAddress] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { mutateAsync, isPending } = useGenerateTests()

  const effectiveProvider =
    providerAddress.trim().length > 0
      ? providerAddress.trim()
      : address ?? ''

  const criteriaCount = countCriteria(criteria)
  const criteriaValid = criteriaCount >= 3 && criteriaCount <= 10

  const onSubmit = async () => {
    setFieldErrors({})

    if (!isConnected || !address) {
      toast.error('Connect your wallet first')
      return
    }
    if (!onCorrectChain) {
      toast.error('Switch to BSC Testnet (chainId 97)')
      return
    }
    if (!criteriaValid) {
      setFieldErrors({
        acceptance_criteria: 'enter 3 to 10 bullet points (one per line)',
      })
      return
    }

    const bountyNumber = Number(bounty)
    const parsed = formSchema.safeParse({
      function_signature: functionSig,
      acceptance_criteria: criteria,
      bounty: bountyNumber,
      expires_key: expiresKey,
      provider_address: effectiveProvider,
    })

    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        errs[String(issue.path[0] ?? 'form')] = issue.message
      }
      setFieldErrors(errs)
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid form')
      return
    }

    let bountyWei: bigint
    try {
      bountyWei = parseUnits(bounty, decimals)
    } catch {
      setFieldErrors({ bounty: 'invalid bounty amount' })
      return
    }

    if (parsed.data.provider_address === ZERO_ADDRESS) {
      setFieldErrors({ provider_address: 'provider cannot be zero' })
      return
    }

    const expiresAt =
      Math.floor(Date.now() / 1000) +
      (EXPIRES_OPTIONS.find((o) => o.key === parsed.data.expires_key)
        ?.seconds ?? 24 * 60 * 60)

    try {
      await mutateAsync({
        function_signature: parsed.data.function_signature,
        acceptance_criteria: parsed.data.acceptance_criteria,
        bounty_wei: bountyWei.toString(),
        bounty_display: bounty,
        expires_at: expiresAt,
        provider_address: parsed.data.provider_address as `0x${string}`,
      })
      toast.success('Tests generated')
      router.push('/create/preview')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      toast.error(message)
    }
  }

  const submitDisabled =
    isPending || !isConnected || !onCorrectChain || !criteriaValid

  return (
    <main className="min-h-screen bg-white text-black relative">
      <CinematicBackground />
      <FloatingHeader />

      <div className="pt-40 pb-48 container mx-auto px-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="sticky top-32"
            >
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-primary/5 border border-primary/10 flex items-center justify-center rounded-sm shadow-sm">
                  <Landmark className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold uppercase tracking-tighter font-mono leading-none text-black">
                    Issuance_Portal
                  </h1>
                  <p className="text-[10px] text-black/40 uppercase font-bold tracking-[0.4em] mt-3 italic opacity-60">
                    Step 1 of 3 · Configure Task
                  </p>
                </div>
              </div>

              <div className="slab-glass p-1 border-primary/10">
                <div className="p-8 bg-black/[0.02] border-b border-black/5">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-black/40 italic opacity-60">
                      Run_Summary
                    </span>
                    <Zap className="w-4 h-4 text-primary opacity-40" />
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium italic opacity-80">
                        Criteria_Count
                      </span>
                      <span className="font-mono font-bold text-black text-lg">
                        {criteriaCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium italic opacity-80">
                        Bounty
                      </span>
                      <span className="font-mono font-bold text-primary text-2xl">
                        {bounty || '0'} tUSDT
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium italic opacity-80">
                        Expires_In
                      </span>
                      <span className="font-mono font-bold text-black text-sm uppercase">
                        {EXPIRES_OPTIONS.find((o) => o.key === expiresKey)
                          ?.label ?? '24 hours'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-black/5">
                      <span className="text-sm font-medium italic opacity-80">
                        Validation_Mode
                      </span>
                      <span className="text-[10px] font-bold bg-primary text-white px-3 py-1 italic shadow-lg shadow-primary/20">
                        DETERMINISTIC
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitDisabled}
                  className="w-full h-20 rounded-none uppercase font-bold tracking-[0.3em] gap-4 bg-primary hover:bg-primary/90 text-white border-none text-sm shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {isPending ? 'Generating…' : 'Generate_Tests'}
                  <ArrowRight className="w-6 h-6" />
                </Button>
                {!isConnected ? (
                  <p className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-destructive italic">
                    Connect wallet to continue
                  </p>
                ) : null}
                {isConnected && !onCorrectChain ? (
                  <p className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-destructive italic">
                    Switch to BSC Testnet to continue
                  </p>
                ) : null}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8">
              <div className="flex items-center gap-4">
                <ScrollText className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold uppercase tracking-tighter font-mono italic text-black">
                  Task_Definition
                </h2>
              </div>
            </div>

            <div className="space-y-10">
              <div className="slab-glass border-black/5 overflow-hidden">
                <div className="p-10 space-y-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Cpu className="w-4 h-4 text-primary/60" />
                      <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/40 block italic">
                        Function_Signature
                      </label>
                    </div>
                    <Input
                      value={functionSig}
                      onChange={(e) => setFunctionSig(e.target.value)}
                      placeholder="fizzbuzz(n: int) -> str"
                      className="h-14 font-mono text-sm rounded-none border-black/5 bg-black/[0.02] text-black focus:border-primary/40 focus:ring-primary/20 placeholder:opacity-30"
                    />
                    {fieldErrors.function_signature ? (
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-destructive italic">
                        {fieldErrors.function_signature}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-4 h-4 text-primary/60" />
                      <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/40 block italic">
                        Acceptance_Criteria (3 to 10 lines)
                      </label>
                    </div>
                    <Textarea
                      value={criteria}
                      onChange={(e) => setCriteria(e.target.value)}
                      placeholder={'Return "Fizz" when n is divisible by 3\nReturn "Buzz" when n is divisible by 5'}
                      className="text-sm min-h-[180px] rounded-none border-black/5 bg-black/[0.02] text-black focus:border-primary/40 focus:ring-primary/20 resize-none placeholder:opacity-30"
                    />
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] italic opacity-60">
                      {criteriaCount} / 3-10 bullet points
                    </p>
                    {fieldErrors.acceptance_criteria ? (
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-destructive italic">
                        {fieldErrors.acceptance_criteria}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Coins className="w-4 h-4 text-primary/60" />
                        <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/40 block italic">
                          Bounty (tUSDT)
                        </label>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min={MIN_BOUNTY_TUSDT}
                        value={bounty}
                        onChange={(e) => setBounty(e.target.value)}
                        placeholder="1.00"
                        className="h-14 rounded-none font-mono font-bold text-xl border-black/5 bg-black/[0.02] text-black focus:border-primary/40 focus:ring-primary/20"
                      />
                      {fieldErrors.bounty ? (
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-destructive italic">
                          {fieldErrors.bounty}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="w-4 h-4 text-primary/60" />
                        <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/40 block italic">
                          Expires_In
                        </label>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {EXPIRES_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setExpiresKey(opt.key)}
                            className={`h-14 rounded-none font-mono text-[11px] uppercase tracking-[0.2em] border transition-colors ${
                              expiresKey === opt.key
                                ? 'bg-primary text-white border-primary'
                                : 'bg-black/[0.02] text-black border-black/5 hover:border-primary/40'
                            }`}
                          >
                            {opt.key}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <User className="w-4 h-4 text-primary/60" />
                      <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/40 block italic">
                        Provider_Address (defaults to connected wallet)
                      </label>
                    </div>
                    <Input
                      value={providerAddress}
                      onChange={(e) => setProviderAddress(e.target.value)}
                      placeholder={address ?? '0x…'}
                      className="h-14 font-mono text-sm rounded-none border-black/5 bg-black/[0.02] text-black focus:border-primary/40 focus:ring-primary/20 placeholder:opacity-30"
                    />
                    {fieldErrors.provider_address ? (
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-destructive italic">
                        {fieldErrors.provider_address}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
