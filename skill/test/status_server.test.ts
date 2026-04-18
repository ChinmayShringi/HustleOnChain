import { describe, it, expect, afterEach, beforeEach } from "vitest";
import type { Server } from "node:http";
import { startStatusServer, resetStatus, updateStatus } from "../src/status_server.js";

describe("status server", () => {
  let server: Server;
  let port: number;

  beforeEach(async () => {
    resetStatus();
    const started = await startStatusServer(0);
    server = started.server;
    port = started.port;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("GET /api/status returns default", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/status`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { state: string };
    expect(body.state).toBe("idle");
  });

  it("POST /api/status/push updates state", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/status/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "solving", job_id: "42", message: "working" }),
    });
    expect(res.status).toBe(200);
    const getRes = await fetch(`http://127.0.0.1:${port}/api/status`);
    const body = (await getRes.json()) as { state: string; job_id: string; message: string };
    expect(body.state).toBe("solving");
    expect(body.job_id).toBe("42");
    expect(body.message).toBe("working");
  });

  it("updateStatus exposed for local calls", async () => {
    updateStatus("paying_x402", { job_id: 7, message: "x402" });
    const res = await fetch(`http://127.0.0.1:${port}/api/status`);
    const body = (await res.json()) as { state: string; job_id: number };
    expect(body.state).toBe("paying_x402");
    expect(body.job_id).toBe(7);
  });

  it("CORS header present", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/status`);
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
  });
});
