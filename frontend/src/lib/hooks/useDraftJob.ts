'use client'

/**
 * Persists the in-progress job draft across `/create`, `/create/preview`,
 * and `/create/funding` via sessionStorage. Validated with Zod so a stale
 * or malformed draft fails loudly rather than crashing the wizard.
 */

import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'

export const DRAFT_STORAGE_KEY = 'agentwork:draft'

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'invalid address')

const bytes32Schema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'invalid bytes32 hash')

export const draftJobSchema = z.object({
  function_signature: z.string().min(1),
  acceptance_criteria: z.string().min(1),
  preview_tests: z.array(z.string()),
  pytest_hash: bytes32Schema,
  pytest_uri: z.string().url(),
  task_hash: bytes32Schema,
  evaluator_address: addressSchema,
  bounty_wei: z.string().regex(/^[0-9]+$/, 'bounty_wei must be a uint string'),
  bounty_display: z.string(),
  expires_at: z.number().int().positive(),
  provider_address: addressSchema,
})

export type DraftJob = z.infer<typeof draftJobSchema>

function readDraft(): DraftJob | null {
  if (typeof window === 'undefined') return null
  const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    const result = draftJobSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

function writeDraft(draft: DraftJob | null): void {
  if (typeof window === 'undefined') return
  if (draft === null) {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY)
    return
  }
  window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

export function useDraftJob() {
  const [draft, setDraft] = useState<DraftJob | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setDraft(readDraft())
    setHydrated(true)
  }, [])

  const save = useCallback((next: DraftJob) => {
    const validated = draftJobSchema.parse(next)
    writeDraft(validated)
    setDraft(validated)
  }, [])

  const patch = useCallback((partial: Partial<DraftJob>) => {
    setDraft((prev) => {
      if (!prev) return prev
      const merged = { ...prev, ...partial }
      const result = draftJobSchema.safeParse(merged)
      if (!result.success) return prev
      writeDraft(result.data)
      return result.data
    })
  }, [])

  const clear = useCallback(() => {
    writeDraft(null)
    setDraft(null)
  }, [])

  return { draft, hydrated, save, patch, clear }
}
