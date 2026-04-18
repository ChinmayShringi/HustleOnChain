import { describe, it, expect, vi } from "vitest";
import { solveTask, validateSolution, extractFunctionName } from "../src/solver.js";

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
