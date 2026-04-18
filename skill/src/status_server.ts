import http from "node:http";
import type { AddressInfo } from "node:net";

export type AgentState =
  | "idle"
  | "claiming"
  | "solving"
  | "paying_x402"
  | "submitting"
  | "error";

export interface StatusSnapshot {
  state: AgentState;
  job_id?: number | string | null;
  message?: string;
  updated_at: number;
}

const DEFAULT_SNAPSHOT: StatusSnapshot = {
  state: "idle",
  job_id: null,
  message: "",
  updated_at: 0,
};

let currentStatus: StatusSnapshot = { ...DEFAULT_SNAPSHOT };

export function getStatus(): StatusSnapshot {
  return { ...currentStatus };
}

export function updateStatus(
  state: AgentState,
  extras: { job_id?: number | string | null; message?: string } = {},
): StatusSnapshot {
  currentStatus = {
    state,
    job_id: extras.job_id ?? null,
    message: extras.message ?? "",
    updated_at: Date.now(),
  };
  return { ...currentStatus };
}

export function resetStatus(): void {
  currentStatus = { ...DEFAULT_SNAPSHOT };
}

function setCors(res: http.ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function createStatusServer(): http.Server {
  const server = http.createServer(async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    try {
      if (req.method === "GET" && req.url === "/api/status") {
        sendJson(res, 200, getStatus());
        return;
      }
      if (req.method === "POST" && req.url === "/api/status/push") {
        const raw = await readBody(req);
        const parsed = raw.length > 0 ? JSON.parse(raw) : {};
        const state = typeof parsed.state === "string" ? (parsed.state as AgentState) : "idle";
        const snap = updateStatus(state, {
          job_id: parsed.job_id ?? null,
          message: typeof parsed.message === "string" ? parsed.message : "",
        });
        sendJson(res, 200, snap);
        return;
      }
      sendJson(res, 404, { error: "not found" });
    } catch (err) {
      sendJson(res, 500, { error: (err as Error).message });
    }
  });
  return server;
}

export async function startStatusServer(port: number): Promise<{ server: http.Server; port: number }> {
  const server = createStatusServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => resolve());
  });
  const addr = server.address() as AddressInfo;
  return { server, port: addr.port };
}
