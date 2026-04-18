import { describe, it, expect, vi } from "vitest";
import { keccak256 } from "viem";
import { handleJob, type WatcherDeps } from "../src/job_watcher.js";
import { GraderClient } from "../src/grader_client.js";
import { resetStatus } from "../src/status_server.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const AGENT = "0x9999999999999999999999999999999999999999" as const;
const JOB_FACTORY = "0x1111111111111111111111111111111111111111" as const;
const USDT = "0x2222222222222222222222222222222222222222" as const;
const GRADER_RECIPIENT = "0x3333333333333333333333333333333333333333" as const;
const TASK_HASH = ("0x" + "ab".repeat(32)) as `0x${string}`;

describe("handleJob", () => {
  it("runs the full pipeline end-to-end", async () => {
    resetStatus();

    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      fetchCalls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.includes("/api/v1/tasks/")) {
        return jsonResponse(200, {
          function_signature: "def fizzbuzz(n: int) -> list[str]:",
          acceptance_criteria: "Classic FizzBuzz",
        });
      }
      if (url.endsWith("/x402/hint") && !init) {
        return jsonResponse(402, { recipient: GRADER_RECIPIENT, amount_wei: "1000" });
      }
      if (url.endsWith("/x402/hint")) {
        const headers = init?.headers as Record<string, string> | undefined;
        if (headers?.["X-PAYMENT"]) {
          return jsonResponse(200, { hint: "use divmod" });
        }
        return jsonResponse(402, { recipient: GRADER_RECIPIENT, amount_wei: "1000" });
      }
      if (url.endsWith("/api/v1/deliverables")) {
        return jsonResponse(200, { uid: "xyz", uri: "http://host/api/v1/deliverables/xyz" });
      }
      if (url.includes("/api/v1/status/")) {
        return jsonResponse(200, { ok: true });
      }
      return jsonResponse(404, { err: "unmatched" });
    });

    const grader = new GraderClient({
      baseUrl: "http://host",
      hintUrl: "http://host/x402/hint",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const publicClient = {
      readContract: vi.fn(async () => [
        "0xclient000000000000000000000000000000000000",
        AGENT,
        "0xeval00000000000000000000000000000000000000",
        9_999_999_999n,
        TASK_HASH,
        USDT,
        1_000_000n,
        1,
      ]),
      waitForTransactionReceipt: vi.fn(async () => ({ status: "success" as const })),
      watchContractEvent: vi.fn(),
    } as unknown as WatcherDeps["publicClient"];

    const walletClient = {
      account: { address: AGENT, type: "local" },
      sendTransaction: vi.fn(async () => "0xpayhash" as `0x${string}`),
      writeContract: vi.fn(async () => "0xsubmit" as `0x${string}`),
    } as unknown as WatcherDeps["walletClient"];

    const anthropic = {
      messages: {
        create: vi.fn(async () => ({
          content: [{ type: "text", text: "def fizzbuzz(n):\n    return []\n" }],
        })),
      },
    };

    const deps: WatcherDeps = {
      env: {
        BSC_RPC_URL: "x",
        AGENT_PRIVATE_KEY: "0x00",
        GRADER_URL: "http://host",
        JOB_FACTORY_ADDRESS: JOB_FACTORY,
        GRADER_EVALUATOR_ADDRESS: "0x4444444444444444444444444444444444444444",
        USDT_ADDRESS: USDT,
        ANTHROPIC_API_KEY: "sk-test",
        ANTHROPIC_MODEL: "claude-opus-4-7",
        STATUS_PORT: 0,
        X402_HINT_URL: "http://host/x402/hint",
        X402_PRICE_WEI: 1000n,
      },
      publicClient,
      walletClient,
      agentAddress: AGENT,
      grader,
      anthropic,
    };

    const result = await handleJob(deps, 42n);
    expect(result.jobId).toBe(42n);
    expect(result.submitTxHash).toBe("0xsubmit");
    expect(result.x402TxHash).toBe("0xpayhash");
    expect(result.deliverableUri).toContain("/deliverables/xyz");
    expect(result.solutionHash).toBe(
      keccak256(new TextEncoder().encode("def fizzbuzz(n):\n    return []")),
    );
    expect(walletClient.writeContract).toHaveBeenCalledOnce();
    expect(walletClient.sendTransaction).toHaveBeenCalledOnce();
    expect(anthropic.messages.create).toHaveBeenCalledOnce();
  });

  it("throws if provider does not match agent", async () => {
    resetStatus();
    const grader = new GraderClient({ baseUrl: "http://host" });
    const publicClient = {
      readContract: vi.fn(async () => [
        "0xclient000000000000000000000000000000000000",
        "0x8888888888888888888888888888888888888888",
        "0xeval00000000000000000000000000000000000000",
        0n,
        TASK_HASH,
        USDT,
        0n,
        1,
      ]),
      waitForTransactionReceipt: vi.fn(),
      watchContractEvent: vi.fn(),
    } as unknown as WatcherDeps["publicClient"];
    const walletClient = {
      account: { address: AGENT, type: "local" },
      sendTransaction: vi.fn(),
      writeContract: vi.fn(),
    } as unknown as WatcherDeps["walletClient"];
    const deps: WatcherDeps = {
      env: {
        BSC_RPC_URL: "x",
        AGENT_PRIVATE_KEY: "0x00",
        GRADER_URL: "http://host",
        JOB_FACTORY_ADDRESS: JOB_FACTORY,
        GRADER_EVALUATOR_ADDRESS: "0x4444444444444444444444444444444444444444",
        USDT_ADDRESS: USDT,
        ANTHROPIC_API_KEY: "sk-test",
        ANTHROPIC_MODEL: "claude-opus-4-7",
        STATUS_PORT: 0,
        X402_HINT_URL: "http://host/x402/hint",
        X402_PRICE_WEI: 1000n,
      },
      publicClient,
      walletClient,
      agentAddress: AGENT,
      grader,
      anthropic: { messages: { create: vi.fn() } },
    };
    await expect(handleJob(deps, 1n)).rejects.toThrow(/provider/);
  });
});
