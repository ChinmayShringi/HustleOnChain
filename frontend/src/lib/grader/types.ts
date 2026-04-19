/**
 * Zod schemas for the AgentWork grader REST API.
 *
 * Source of truth: `backend/grader/app/main.py`, `status.py`,
 * `deliverables.py`. Keep these schemas aligned with the FastAPI
 * response shapes — run contract tests if you change them.
 */

import { z } from 'zod'

export const generateRequestSchema = z.object({
  function_signature: z.string().min(1),
  acceptance_criteria: z.string().min(1),
})
export type GenerateRequest = z.infer<typeof generateRequestSchema>

export const generateResponseSchema = z.object({
  pytest_hash: z.string(),
  pytest_uri: z.string().url(),
  task_hash: z.string(),
  evaluator_address: z.string(),
  preview_tests: z.array(z.string()),
})
export type GenerateResponse = z.infer<typeof generateResponseSchema>

export const taskResponseSchema = z.object({
  function_signature: z.string(),
  acceptance_criteria: z.string(),
})
export type TaskResponse = z.infer<typeof taskResponseSchema>

export const statusResponseSchema = z.object({
  state: z.string(),
  job_id: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  agent_address: z.string().nullable().optional(),
  updated_at: z.number().int().optional(),
})
export type StatusResponse = z.infer<typeof statusResponseSchema>

export const deliverableUploadResponseSchema = z.object({
  uri: z.string().url(),
})
export type DeliverableUploadResponse = z.infer<
  typeof deliverableUploadResponseSchema
>

export const healthResponseSchema = z.object({
  ok: z.boolean(),
})
export type HealthResponse = z.infer<typeof healthResponseSchema>
