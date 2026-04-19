/**
 * Minimal REST client for the AgentWork grader service.
 *
 * All responses are validated with zod so schema drift between the
 * FastAPI backend and this client fails loudly at the boundary
 * instead of leaking `any` into UI code.
 */

import {
  deliverableUploadResponseSchema,
  generateRequestSchema,
  generateResponseSchema,
  healthResponseSchema,
  statusResponseSchema,
  taskResponseSchema,
  type DeliverableUploadResponse,
  type GenerateRequest,
  type GenerateResponse,
  type HealthResponse,
  type StatusResponse,
  type TaskResponse,
} from './types'

function resolveBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_GRADER_URL
  if (!raw || raw.trim().length === 0) {
    throw new Error(
      'NEXT_PUBLIC_GRADER_URL is not set — configure it in .env.local',
    )
  }
  return raw.replace(/\/+$/, '')
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  parse: (data: unknown) => T,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(
      `Grader request failed: ${res.status} ${res.statusText} — ${body.slice(0, 200)}`,
    )
  }
  const data = await res.json()
  return parse(data)
}

export type GraderClient = {
  readonly baseUrl: string
  generate(req: GenerateRequest): Promise<GenerateResponse>
  getTask(taskHash: string): Promise<TaskResponse>
  getTests(pytestHash: string): Promise<string>
  getStatus(agentAddress?: string): Promise<StatusResponse>
  getDeliverable(uid: string): Promise<string>
  uploadDeliverable(body: Blob | File): Promise<DeliverableUploadResponse>
  health(): Promise<HealthResponse>
}

export function createGraderClient(baseUrlOverride?: string): GraderClient {
  const baseUrl = baseUrlOverride?.replace(/\/+$/, '') ?? resolveBaseUrl()

  return {
    baseUrl,

    async generate(req) {
      const body = generateRequestSchema.parse(req)
      return requestJson(
        `${baseUrl}/api/v1/grader/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        (data) => generateResponseSchema.parse(data),
      )
    },

    async getTask(taskHash) {
      return requestJson(
        `${baseUrl}/api/v1/tasks/${encodeURIComponent(taskHash)}`,
        { method: 'GET' },
        (data) => taskResponseSchema.parse(data),
      )
    },

    async getTests(pytestHash) {
      const res = await fetch(
        `${baseUrl}/tests/${encodeURIComponent(pytestHash)}`,
        { method: 'GET' },
      )
      if (!res.ok) {
        throw new Error(
          `Grader getTests failed: ${res.status} ${res.statusText}`,
        )
      }
      return res.text()
    },

    async getStatus(agentAddress) {
      const qs = agentAddress
        ? `?agent_address=${encodeURIComponent(agentAddress)}`
        : ''
      return requestJson(
        `${baseUrl}/api/status${qs}`,
        { method: 'GET' },
        (data) => statusResponseSchema.parse(data),
      )
    },

    async getDeliverable(uid) {
      const res = await fetch(
        `${baseUrl}/api/v1/deliverables/${encodeURIComponent(uid)}`,
        { method: 'GET' },
      )
      if (!res.ok) {
        throw new Error(
          `Grader getDeliverable failed: ${res.status} ${res.statusText}`,
        )
      }
      return res.text()
    },

    async uploadDeliverable(body) {
      const form = new FormData()
      const file =
        body instanceof File ? body : new File([body], 'deliverable.py')
      form.append('file', file)
      return requestJson(
        `${baseUrl}/api/v1/deliverables`,
        { method: 'POST', body: form },
        (data) => deliverableUploadResponseSchema.parse(data),
      )
    },

    async health() {
      return requestJson(
        `${baseUrl}/healthz`,
        { method: 'GET' },
        (data) => healthResponseSchema.parse(data),
      )
    },
  }
}

/**
 * Lazy default client. The `NEXT_PUBLIC_GRADER_URL` env var is read on
 * first use so modules that only import types do not crash at build
 * time when the env is absent.
 */
let _default: GraderClient | null = null

export function graderClient(): GraderClient {
  if (!_default) {
    _default = createGraderClient()
  }
  return _default
}
