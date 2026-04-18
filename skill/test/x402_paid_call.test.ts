import { describe, it, expect, vi } from "vitest";
import { payForHint } from "../src/x402_paid_call.js";
import { GraderClient } from "../src/grader_client.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("payForHint", () => {
  it("runs the full 402 -> pay -> 200 flow", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (calls.length === 1) {
        return jsonResponse(402, {
          recipient: "0x4444444444444444444444444444444444444444",
          amount_wei: "1000",
        });
      }
      return jsonResponse(200, { hint: "use divmod" });
    });
    const grader = new GraderClient({
      baseUrl: "http://host",
      hintUrl: "http://host/x402/hint",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const walletClient = { sendTransaction: vi.fn(async () => "0xdeadbeef" as `0x${string}`) };
    const publicClient = {
      waitForTransactionReceipt: vi.fn(async () => ({ status: "success" as const })),
    };
    const result = await payForHint({
      walletClient,
      publicClient,
      grader,
      usdtAddress: "0x5555555555555555555555555555555555555555",
      log: () => undefined,
    });
    expect(result.txHash).toBe("0xdeadbeef");
    expect(result.hint).toBe("use divmod");
    expect(walletClient.sendTransaction).toHaveBeenCalledOnce();
    expect(publicClient.waitForTransactionReceipt).toHaveBeenCalledOnce();
    expect(calls).toHaveLength(2);
  });

  it("throws if grader still returns 402", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(402, { recipient: "0x4444444444444444444444444444444444444444", amount_wei: "1" }),
    );
    const grader = new GraderClient({
      baseUrl: "http://host",
      hintUrl: "http://host/x402/hint",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const walletClient = { sendTransaction: vi.fn(async () => "0xaa" as `0x${string}`) };
    const publicClient = {
      waitForTransactionReceipt: vi.fn(async () => ({ status: "success" as const })),
    };
    await expect(
      payForHint({
        walletClient,
        publicClient,
        grader,
        usdtAddress: "0x5555555555555555555555555555555555555555",
        log: () => undefined,
      }),
    ).rejects.toThrow(/still returned 402/);
  });

  it("throws if receipt reverted", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(402, { recipient: "0x4444444444444444444444444444444444444444", amount_wei: "1" }),
    );
    const grader = new GraderClient({
      baseUrl: "http://host",
      hintUrl: "http://host/x402/hint",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const walletClient = { sendTransaction: vi.fn(async () => "0xbb" as `0x${string}`) };
    const publicClient = {
      waitForTransactionReceipt: vi.fn(async () => ({ status: "reverted" as const })),
    };
    await expect(
      payForHint({
        walletClient,
        publicClient,
        grader,
        usdtAddress: "0x5555555555555555555555555555555555555555",
        log: () => undefined,
      }),
    ).rejects.toThrow(/reverted/);
  });
});
