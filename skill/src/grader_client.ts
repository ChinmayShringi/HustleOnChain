export interface TaskSpec {
  function_signature: string;
  acceptance_criteria: string;
}

export interface DeliverableUpload {
  uri: string;
  uid?: string;
}

export interface Hint402Result {
  status: 402 | 200;
  body: Record<string, unknown>;
}

export interface StatusPushPayload {
  agent_address: string;
  state: string;
  job_id?: number | string | null;
  message?: string;
}

type FetchLike = typeof fetch;

export class GraderClient {
  private readonly baseUrl: string;
  private readonly hintUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(opts: { baseUrl: string; hintUrl?: string; fetchImpl?: FetchLike }) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.hintUrl = opts.hintUrl?.replace(/\/+$/, "") || `${this.baseUrl}/x402/hint`;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async getTask(taskHash: `0x${string}`): Promise<TaskSpec> {
    const url = `${this.baseUrl}/api/v1/tasks/${taskHash}`;
    const res = await this.fetchImpl(url);
    if (!res.ok) {
      throw new Error(`getTask failed: ${res.status} ${res.statusText}`);
    }
    const body = (await res.json()) as TaskSpec;
    if (!body.function_signature || !body.acceptance_criteria) {
      throw new Error("getTask response missing required fields");
    }
    return body;
  }

  async uploadDeliverable(bytes: Uint8Array, filename: string): Promise<DeliverableUpload> {
    const url = `${this.baseUrl}/api/v1/deliverables`;
    const form = new FormData();
    const blob = new Blob([bytes as unknown as BlobPart], { type: "text/x-python" });
    form.append("file", blob, filename);
    const res = await this.fetchImpl(url, { method: "POST", body: form });
    if (!res.ok) {
      throw new Error(`uploadDeliverable failed: ${res.status}`);
    }
    const body = (await res.json()) as DeliverableUpload;
    if (!body.uri) throw new Error("uploadDeliverable missing uri");
    return body;
  }

  async fetchHint402(opts: { paymentTxHash?: string } = {}): Promise<Hint402Result> {
    const headers: Record<string, string> = {};
    if (opts.paymentTxHash) {
      headers["X-PAYMENT"] = JSON.stringify({ tx_hash: opts.paymentTxHash });
    }
    const res = await this.fetchImpl(this.hintUrl, { method: "GET", headers });
    let body: Record<string, unknown> = {};
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    if (res.status === 402) return { status: 402, body };
    if (res.status === 200) return { status: 200, body };
    throw new Error(`fetchHint402 unexpected status ${res.status}`);
  }

  async pushStatus(payload: StatusPushPayload): Promise<void> {
    const url = `${this.baseUrl}/api/status/push`;
    try {
      const res = await this.fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_address: payload.agent_address,
          job_id: payload.job_id != null ? String(payload.job_id) : null,
          state: payload.state,
          message: payload.message ?? null,
        }),
      });
      if (!res.ok && res.status !== 404) {
        // Non-fatal; grader endpoint is optional.
        return;
      }
    } catch {
      // Non-fatal.
    }
  }
}
