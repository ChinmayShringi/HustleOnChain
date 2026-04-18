import * as dotenv from "dotenv";

dotenv.config();

export interface AgentEnv {
  BSC_RPC_URL: string;
  AGENT_PRIVATE_KEY: `0x${string}`;
  GRADER_URL: string;
  JOB_FACTORY_ADDRESS: `0x${string}`;
  GRADER_EVALUATOR_ADDRESS: `0x${string}`;
  USDT_ADDRESS: `0x${string}`;
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL: string;
  STATUS_PORT: number;
  X402_HINT_URL: string;
  X402_PRICE_WEI: bigint;
}

const DEFAULTS = {
  BSC_RPC_URL: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  GRADER_URL: "http://localhost:8000",
  ANTHROPIC_MODEL: "claude-opus-4-7",
  STATUS_PORT: "8765",
  X402_PRICE_WEI: "10000000000000000",
};

const REQUIRED_KEYS = [
  "AGENT_PRIVATE_KEY",
  "JOB_FACTORY_ADDRESS",
  "GRADER_EVALUATOR_ADDRESS",
  "USDT_ADDRESS",
  "ANTHROPIC_API_KEY",
] as const;

export function getEnv(source: NodeJS.ProcessEnv = process.env): AgentEnv {
  const missing: string[] = [];
  for (const key of REQUIRED_KEYS) {
    if (!source[key] || source[key]!.trim().length === 0) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const bscRpc = source.BSC_RPC_URL?.trim() || DEFAULTS.BSC_RPC_URL;
  const graderUrl = source.GRADER_URL?.trim() || DEFAULTS.GRADER_URL;
  const anthropicModel = source.ANTHROPIC_MODEL?.trim() || DEFAULTS.ANTHROPIC_MODEL;
  const statusPort = parseInt(source.STATUS_PORT?.trim() || DEFAULTS.STATUS_PORT, 10);
  if (Number.isNaN(statusPort)) {
    throw new Error("STATUS_PORT must be an integer");
  }
  const priceWei = BigInt(source.X402_PRICE_WEI?.trim() || DEFAULTS.X402_PRICE_WEI);
  const hintUrl = source.X402_HINT_URL?.trim() || `${graderUrl}/x402/hint`;

  return {
    BSC_RPC_URL: bscRpc,
    AGENT_PRIVATE_KEY: source.AGENT_PRIVATE_KEY!.trim() as `0x${string}`,
    GRADER_URL: graderUrl,
    JOB_FACTORY_ADDRESS: source.JOB_FACTORY_ADDRESS!.trim() as `0x${string}`,
    GRADER_EVALUATOR_ADDRESS: source.GRADER_EVALUATOR_ADDRESS!.trim() as `0x${string}`,
    USDT_ADDRESS: source.USDT_ADDRESS!.trim() as `0x${string}`,
    ANTHROPIC_API_KEY: source.ANTHROPIC_API_KEY!.trim(),
    ANTHROPIC_MODEL: anthropicModel,
    STATUS_PORT: statusPort,
    X402_HINT_URL: hintUrl,
    X402_PRICE_WEI: priceWei,
  };
}
