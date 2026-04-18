import { describe, it, expect, vi } from "vitest";
import {
  solveTask,
  validateSolution,
  extractFunctionName,
  AnthropicLlm,
  OpenAiCompatLlm,
  getLlmClient,
  llmAsAnthropicLike,
} from "../src/solver.js";

function makeAnthropic(responses: string[]) {
  const create = vi.fn(async () => {
    const next = responses.shift() ?? "";
    return { content: [{ type: "text", text: next }] };
  });
  return { messages: { create } } as const;
}

describe("solver helpers", () => {
  it("extracts function name from signature", () => {
    expect(extractFunctionName("def fizzbuzz(n: int) -> list[str]:")).toBe("fizzbuzz");
  });
  it("validates solution", () => {
    expect(validateSolution("def fizzbuzz(n):\n    return []", "fizzbuzz")).toBe(true);
    expect(validateSolution("def wrong(n):\n    return []", "fizzbuzz")).toBe(false);
    expect(validateSolution("", "fizzbuzz")).toBe(false);
  });
});

describe("solveTask", () => {
  it("returns bytes on valid first response", async () => {
    const anthropic = makeAnthropic(["def fizzbuzz(n):\n    return []\n"]);
    const out = await solveTask("def fizzbuzz(n: int) -> list[str]:", "criteria", anthropic);
    const text = new TextDecoder().decode(out);
    expect(text).toContain("def fizzbuzz");
  });

  it("retries on invalid output then succeeds", async () => {
    const anthropic = makeAnthropic(["no code here", "def fizzbuzz(n):\n    return []\n"]);
    const out = await solveTask("def fizzbuzz(n: int) -> list[str]:", "criteria", anthropic);
    expect(new TextDecoder().decode(out)).toContain("def fizzbuzz");
    expect(anthropic.messages.create).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting retries", async () => {
    const anthropic = makeAnthropic(["bad", "still bad", "nope"]);
    await expect(
      solveTask("def fizzbuzz(n: int) -> list[str]:", "criteria", anthropic, { maxAttempts: 3 }),
    ).rejects.toThrow(/solveTask failed/);
  });

  it("strips fenced code blocks", async () => {
    const anthropic = makeAnthropic(["```python\ndef fizzbuzz(n):\n    return []\n```"]);
    const out = await solveTask("def fizzbuzz(n: int) -> list[str]:", "criteria", anthropic);
    const text = new TextDecoder().decode(out);
    expect(text.startsWith("def fizzbuzz")).toBe(true);
    expect(text).not.toContain("```");
  });
});

describe("LlmClient implementations", () => {
  it("AnthropicLlm wraps an AnthropicLike", async () => {
    const fake = {
      messages: {
        create: vi.fn(async () => ({ content: [{ type: "text", text: "hello" }] })),
      },
    };
    const llm = new AnthropicLlm(fake as never);
    const out = await llm.complete({ system: "s", user: "u", maxTokens: 10, model: "m" });
    expect(out).toBe("hello");
    expect(fake.messages.create).toHaveBeenCalledTimes(1);
  });

  it("OpenAiCompatLlm posts to /chat/completions and reads choices[0].message.content", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "world" } }] }),
      text: async () => "",
    })) as unknown as typeof fetch;
    const original = globalThis.fetch;
    globalThis.fetch = fetchMock;
    try {
      const llm = new OpenAiCompatLlm("http://x/v1", "k");
      const out = await llm.complete({ system: "s", user: "u", maxTokens: 10, model: "m" });
      expect(out).toBe("world");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("getLlmClient chooses anthropic by default and openai when LLM_PROVIDER=openai", () => {
    const makeA = () => ({ messages: { create: async () => ({ content: [] }) } });
    const a = getLlmClient(
      { LLM_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "k", OPENAI_BASE_URL: "", OPENAI_API_KEY: "" },
      makeA,
    );
    expect(a).toBeInstanceOf(AnthropicLlm);
    const o = getLlmClient(
      { LLM_PROVIDER: "openai", ANTHROPIC_API_KEY: "", OPENAI_BASE_URL: "http://x/v1", OPENAI_API_KEY: "k" },
      makeA,
    );
    expect(o).toBeInstanceOf(OpenAiCompatLlm);
  });

  it("llmAsAnthropicLike lets solveTask run against an OpenAI-compatible backend", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "def fizzbuzz(n):\n    return []\n" } }],
      }),
      text: async () => "",
    })) as unknown as typeof fetch;
    const original = globalThis.fetch;
    globalThis.fetch = fetchMock;
    try {
      const adapted = llmAsAnthropicLike(new OpenAiCompatLlm("http://x/v1", "k"));
      const out = await solveTask("def fizzbuzz(n: int) -> list[str]:", "criteria", adapted);
      expect(new TextDecoder().decode(out)).toContain("def fizzbuzz");
    } finally {
      globalThis.fetch = original;
    }
  });
});
