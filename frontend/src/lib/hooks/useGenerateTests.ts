'use client'

/**
 * Calls the grader `/api/v1/grader/generate` endpoint and persists the
 * response into the sessionStorage draft. Returns a React-Query mutation
 * so the form page can read `isPending`/`error` without plumbing state.
 */

import { useMutation } from '@tanstack/react-query'
import { graderClient } from '@/lib/grader/client'
import type {
  GenerateRequest,
  GenerateResponse,
} from '@/lib/grader/types'
import {
  DRAFT_STORAGE_KEY,
  draftJobSchema,
  type DraftJob,
} from './useDraftJob'

export type GenerateInput = GenerateRequest & {
  readonly bounty_wei: string
  readonly bounty_display: string
  readonly expires_at: number
  readonly provider_address: `0x${string}`
}

export type GenerateMutationResult = {
  readonly response: GenerateResponse
  readonly draft: DraftJob
}

async function runGenerate(
  input: GenerateInput,
): Promise<GenerateMutationResult> {
  const client = graderClient()
  const response = await client.generate({
    function_signature: input.function_signature,
    acceptance_criteria: input.acceptance_criteria,
  })

  const draft: DraftJob = draftJobSchema.parse({
    function_signature: input.function_signature,
    acceptance_criteria: input.acceptance_criteria,
    preview_tests: response.preview_tests,
    pytest_hash: response.pytest_hash,
    pytest_uri: response.pytest_uri,
    task_hash: response.task_hash,
    evaluator_address: response.evaluator_address,
    bounty_wei: input.bounty_wei,
    bounty_display: input.bounty_display,
    expires_at: input.expires_at,
    provider_address: input.provider_address,
  })

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  }

  return { response, draft }
}

export function useGenerateTests() {
  const mutation = useMutation({ mutationFn: runGenerate })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    data: mutation.data,
    error: mutation.error as Error | null,
    isPending: mutation.isPending,
    reset: mutation.reset,
  }
}
