import { describe, it, expect, vi } from "vitest";
import { GraderClient } from "../src/grader_client.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("GraderClient", () => {
  it("getTask returns parsed body", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, { function_signature: "def x():", acceptance_criteria: "do x" }),
    );
    const c = new GraderClient({ baseUrl: "http://host", fetchImpl: fetchImpl as unknown as typeof fetch });
    const task = await c.getTask("0xabc");
    expect(task.function_signature).toBe("def x():");
    expect(fetchImpl).toHaveBeenCalledWith("http://host/api/v1/tasks/0xabc");
  });

  it("getTask throws on non-200", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(404, { err: "nope" }));
    const c = new GraderClient({ baseUrl: "http://host", fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(c.getTask("0xabc")).rejects.toThrow(/getTask failed/);
  });

  it("uploadDeliverable posts multipart and returns uri", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBeInstanceOf(FormData);
      return jsonResponse(200, { uid: "abc", uri: "http://host/api/v1/deliverables/abc" });
    });
    const c = new GraderClient({ baseUrl: "http://host", fetchImpl: fetchImpl as unknown as typeof fetch });
    const out = await c.uploadDeliverable(new TextEncoder().encode("hello"), "f.py");
    expect(out.uri).toContain("/deliverables/abc");
  });

  it("fetchHint402 returns 402 with body", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(402, { recipient: "0xrecv", amount_wei: "1000" }),
    );
    const c = new GraderClient({ baseUrl: "http://host", fetchImpl: fetchImpl as unknown as typeof fetch });
    const out = await c.fetchHint402();
    expect(out.status).toBe(402);
    expect(out.body.recipient).toBe("0xrecv");
  });

  it("fetchHint402 200 returns hint and sends X-PAYMENT header", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string> | undefined;
      expect(headers?.["X-PAYMENT"]).toContain("0xtxhash");
      return jsonResponse(200, { hint: "use divmod" });
    });
    const c = new GraderClient({ baseUrl: "http://host", fetchImpl: fetchImpl as unknown as typeof fetch });
    const out = await c.fetchHint402({ paymentTxHash: "0xtxhash" });
    expect(out.status).toBe(200);
    expect(out.body.hint).toBe("use divmod");
  });

  it("pushStatus is non-fatal on failure", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const c = new GraderClient({ baseUrl: "http://host", fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(
      c.pushStatus({ agent_address: "0xagent", state: "idle" }),
    ).resolves.toBeUndefined();
  });
});
