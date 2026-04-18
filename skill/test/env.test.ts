import { describe, it, expect } from "vitest";
import { getEnv } from "../src/env.js";

const FULL: NodeJS.ProcessEnv = {
  AGENT_PRIVATE_KEY: "0xabc",
  JOB_FACTORY_ADDRESS: "0x1111111111111111111111111111111111111111",
  GRADER_EVALUATOR_ADDRESS: "0x2222222222222222222222222222222222222222",
  USDT_ADDRESS: "0x3333333333333333333333333333333333333333",
  ANTHROPIC_API_KEY: "sk-test",
};

describe("getEnv", () => {
  it("returns defaults and required values", () => {
    const env = getEnv({ ...FULL });
    expect(env.BSC_RPC_URL).toContain("binance");
    expect(env.GRADER_URL).toBe("http://localhost:8000");
    expect(env.STATUS_PORT).toBe(8765);
    expect(env.X402_PRICE_WEI).toBe(10000000000000000n);
    expect(env.X402_HINT_URL).toBe("http://localhost:8000/x402/hint");
  });

  it("throws when required keys missing", () => {
    expect(() => getEnv({})).toThrow(/Missing required env vars/);
  });

  it("throws when one required key is missing", () => {
    const partial = { ...FULL };
    delete partial.AGENT_PRIVATE_KEY;
    expect(() => getEnv(partial)).toThrow(/AGENT_PRIVATE_KEY/);
  });

  it("honors custom X402_HINT_URL and STATUS_PORT", () => {
    const env = getEnv({ ...FULL, X402_HINT_URL: "http://x.example/h", STATUS_PORT: "9999" });
    expect(env.X402_HINT_URL).toBe("http://x.example/h");
    expect(env.STATUS_PORT).toBe(9999);
  });
});
