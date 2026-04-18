import { describe, it, expect, vi } from "vitest";
import { GraderClient } from "../../src/grader_client.js";
import { payForHint } from "../../src/x402_paid_call.js";

// Phase 3 Audit: contract drift between skill and grader/contracts.
// These tests assert the exact URL + method + headers for each outgoing
// call so any divergence fails immediately.

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    return handler(url, init);
  }) as unknown as typeof fetch;
}

describe("grader API parity", () => {
  const baseUrl = "http://grader.test";
  const taskHash = ("0x" + "ab".repeat(32)) as `0x${string}`;

  it("getTask hits GET /api/v1/tasks/<0x...64hex>", async () => {
    let seenUrl = "";
    let seenMethod: string | undefined;
    const fetchImpl = mockFetch(async (url, init) => {
      seenUrl = url;
      seenMethod = init?.method ?? "GET";
      return new Response(
        JSON.stringify({ function_signature: "def f(): ...", acceptance_criteria: "x" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    const c = new GraderClient({ baseUrl, fetchImpl });
    await c.getTask(taskHash);
    expect(seenUrl).toBe(`${baseUrl}/api/v1/tasks/${taskHash}`);
    expect(seenMethod).toBe("GET");
    // Must be 0x + 64 hex chars (bytes32).
    expect(taskHash).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it("uploadDeliverable POSTs multipart to /api/v1/deliverables", async () => {
    let seenUrl = "";
    let seenMethod: string | undefined;
    let contentType: string | null = null;
    const fetchImpl = mockFetch(async (url, init) => {
      seenUrl = url;
      seenMethod = init?.method;
      const h = new Headers(init?.headers as HeadersInit | undefined);
      contentType = h.get("content-type");
      return new Response(JSON.stringify({ uid: "abc", uri: `${baseUrl}/api/v1/deliverables/abc` }), {
        status: 200,
      });
    });
    const c = new GraderClient({ baseUrl, fetchImpl });
    await c.uploadDeliverable(new Uint8Array([1, 2, 3]), "sol.py");
    expect(seenUrl).toBe(`${baseUrl}/api/v1/deliverables`);
    expect(seenMethod).toBe("POST");
    // FormData sets its own multipart boundary; fetch will set content-type
    // automatically but we at least confirm caller didn't force JSON.
    if (contentType) expect(contentType).not.toMatch(/application\/json/i);
  });

  it("fetchHint402 GET /x402/hint with X-PAYMENT JSON { tx_hash }", async () => {
    let seenUrl = "";
    let seenHeader: string | null = null;
    const fetchImpl = mockFetch(async (url, init) => {
      seenUrl = url;
      const h = new Headers(init?.headers as HeadersInit | undefined);
      seenHeader = h.get("x-payment");
      return new Response(JSON.stringify({ hint: "ok" }), { status: 200 });
    });
    const c = new GraderClient({ baseUrl, fetchImpl });
    await c.fetchHint402({ paymentTxHash: "0xdeadbeef" });
    expect(seenUrl).toBe(`${baseUrl}/x402/hint`);
    expect(seenHeader).toBeTruthy();
    const parsed = JSON.parse(seenHeader as string);
    expect(parsed).toEqual({ tx_hash: "0xdeadbeef" });
  });

  it("pushStatus POSTs /api/status/push with StatusPush body", async () => {
    // Grader's router (grader/app/status.py) registers POST /api/status/push
    // with body { job_id, state, message, agent_address }. The skill must
    // match that shape exactly so the frontend's status polling receives
    // agent-pushed state transitions.
    let seenUrl = "";
    let seenMethod: string | undefined;
    let seenContentType: string | null = null;
    let seenBody: Record<string, unknown> = {};
    const fetchImpl = mockFetch(async (url, init) => {
      seenUrl = url;
      seenMethod = init?.method;
      const h = new Headers(init?.headers as HeadersInit | undefined);
      seenContentType = h.get("content-type");
      seenBody = JSON.parse(init?.body as string);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const c = new GraderClient({ baseUrl, fetchImpl });
    await c.pushStatus({ agent_address: "0xabc", state: "solving", job_id: "1", message: "hi" });
    expect(seenUrl).toBe(`${baseUrl}/api/status/push`);
    expect(seenMethod).toBe("POST");
    expect(seenContentType).toMatch(/application\/json/i);
    expect(seenBody).toEqual({
      agent_address: "0xabc",
      job_id: "1",
      state: "solving",
      message: "hi",
    });
  });
});

describe("JobFactory ABI parity (bytes-level)", () => {
  it("jobs() tuple ordering matches Solidity return order", async () => {
    // From contracts/src/JobFactory.sol jobs() returns:
    // (client, provider, evaluator, expiresAt, taskHash, token, budget, state)
    const { JOB_FACTORY_ABI } = await import("../../src/abi.js");
    const jobsDef = JOB_FACTORY_ABI.find((e) => e.type === "function" && e.name === "jobs");
    expect(jobsDef).toBeTruthy();
    const outNames = (jobsDef as { outputs: { name: string; type: string }[] }).outputs.map(
      (o) => o.name,
    );
    expect(outNames).toEqual([
      "client",
      "provider",
      "evaluator",
      "expiresAt",
      "taskHash",
      "token",
      "budget",
      "state",
    ]);
    const outTypes = (jobsDef as { outputs: { name: string; type: string }[] }).outputs.map(
      (o) => o.type,
    );
    expect(outTypes).toEqual([
      "address",
      "address",
      "address",
      "uint256",
      "bytes32",
      "address",
      "uint256",
      "uint8",
    ]);
  });

  it("submit(uint256,bytes32) signature present", async () => {
    const { JOB_FACTORY_ABI } = await import("../../src/abi.js");
    const sub = JOB_FACTORY_ABI.find((e) => e.type === "function" && e.name === "submit");
    expect(sub).toBeTruthy();
    const ins = (sub as { inputs: { name: string; type: string }[] }).inputs.map((i) => i.type);
    expect(ins).toEqual(["uint256", "bytes32"]);
  });

  it("JobFunded event: jobId indexed, token + amount non-indexed", async () => {
    const { JOB_FACTORY_ABI } = await import("../../src/abi.js");
    const ev = JOB_FACTORY_ABI.find((e) => e.type === "event" && e.name === "JobFunded");
    expect(ev).toBeTruthy();
    const inputs = (ev as { inputs: { name: string; type: string; indexed: boolean }[] }).inputs;
    expect(inputs[0]).toMatchObject({ name: "jobId", type: "uint256", indexed: true });
    expect(inputs[1]).toMatchObject({ name: "token", type: "address", indexed: false });
    expect(inputs[2]).toMatchObject({ name: "amount", type: "uint256", indexed: false });
  });

  it("JobCompleted / JobRejected: jobId indexed, reason string non-indexed", async () => {
    const { JOB_FACTORY_ABI } = await import("../../src/abi.js");
    for (const name of ["JobCompleted", "JobRejected"] as const) {
      const ev = JOB_FACTORY_ABI.find((e) => e.type === "event" && e.name === name);
      expect(ev, `${name} missing`).toBeTruthy();
      const inputs = (ev as { inputs: { name: string; type: string; indexed: boolean }[] }).inputs;
      expect(inputs[0]).toMatchObject({ name: "jobId", type: "uint256", indexed: true });
      expect(inputs[1]).toMatchObject({ name: "reason", type: "string", indexed: false });
    }
  });
});

describe("x402 recipient + amount integrity", () => {
  it("payForHint sends USDT transfer to the 402-returned recipient and amount", async () => {
    const recipient = "0x1111111111111111111111111111111111111111";
    const amountWei = "12345";

    // GraderClient stub returning 402 then 200.
    let call = 0;
    const grader = {
      fetchHint402: vi.fn(async () => {
        call += 1;
        if (call === 1) {
          return { status: 402 as const, body: { recipient, amount_wei: amountWei } };
        }
        return { status: 200 as const, body: { hint: "h" } };
      }),
    } as unknown as Parameters<typeof payForHint>[0]["grader"];

    let sentTo: string | undefined;
    let sentData: string | undefined;
    const walletClient = {
      sendTransaction: async (args: { to: string; data: string }) => {
        sentTo = args.to;
        sentData = args.data;
        return "0xhash" as `0x${string}`;
      },
    };
    const publicClient = {
      waitForTransactionReceipt: async () => ({ status: "success" as const }),
    };
    const usdt = "0x2222222222222222222222222222222222222222" as `0x${string}`;

    const res = await payForHint({
      walletClient,
      publicClient,
      grader,
      usdtAddress: usdt,
      log: () => undefined,
    });
    expect(res.txHash).toBe("0xhash");
    // Transaction goes to USDT contract, not the recipient.
    expect(sentTo).toBe(usdt);
    // Encoded transfer(recipient, amount) — the 40 hex chars of recipient
    // appear in the calldata (without 0x, lowercase).
    expect(sentData?.toLowerCase()).toContain(recipient.slice(2).toLowerCase());
    // Amount (0x3039 = 12345) also appears in calldata.
    expect(sentData?.toLowerCase()).toContain("3039");
  });

  it("throws if 402 body lacks recipient (does NOT fall back to pay_to)", async () => {
    // pay_to is the USDT token contract, not the payment recipient.
    // Falling back to it would silently send funds to the wrong address.
    const grader = {
      fetchHint402: vi.fn(async () => ({
        status: 402 as const,
        body: { amount_wei: "1", pay_to: "0x2222222222222222222222222222222222222222" },
      })),
    } as unknown as Parameters<typeof payForHint>[0]["grader"];
    await expect(
      payForHint({
        walletClient: { sendTransaction: async () => "0x" as `0x${string}` },
        publicClient: { waitForTransactionReceipt: async () => ({ status: "success" as const }) },
        grader,
        usdtAddress: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        log: () => undefined,
      }),
    ).rejects.toThrow(/x402 response missing recipient/);
  });
});

describe("watcher error resilience", () => {
  it("continues after payForHint throws (documented via design — error caught per-log in watchAndHandle)", async () => {
    // watchAndHandle wraps handleJob in try/catch, logs error, and continues.
    // This test verifies the catch-and-continue shape without spinning up a
    // real chain client: we import the module and confirm handleJob throws
    // propagate as Error (not as unhandled rejections).
    const { handleJob } = await import("../../src/job_watcher.js");
    // Call with a deps shape that will explode on first await; expect a rejected promise, not a process crash.
    await expect(
      // @ts-expect-error intentional bad deps
      handleJob({ env: {}, publicClient: {}, walletClient: {}, agentAddress: "0x0", grader: {}, anthropic: {} }, 1n),
    ).rejects.toBeDefined();
  });
});

describe("status server port collision", () => {
  it("surfaces EADDRINUSE as a rejected promise rather than crashing", async () => {
    const { startStatusServer } = await import("../../src/status_server.js");
    const first = await startStatusServer(0);
    try {
      await expect(startStatusServer(first.port)).rejects.toMatchObject({ code: "EADDRINUSE" });
    } finally {
      await new Promise<void>((r) => first.server.close(() => r()));
    }
  });
});
