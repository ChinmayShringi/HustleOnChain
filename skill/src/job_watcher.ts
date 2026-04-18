import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import Anthropic from "@anthropic-ai/sdk";
import { JOB_FACTORY_ABI } from "./abi.js";
import type { AgentEnv } from "./env.js";
import { GraderClient } from "./grader_client.js";
import { solveTask, type AnthropicLike, getLlmClient, llmAsAnthropicLike } from "./solver.js";
import { payForHint } from "./x402_paid_call.js";
import { updateStatus } from "./status_server.js";

export interface JobFundedEvent {
  jobId: bigint;
  token: Address;
  amount: bigint;
}

export interface JobRecord {
  client: Address;
  provider: Address;
  evaluator: Address;
  expiresAt: bigint;
  taskHash: Hex;
  token: Address;
  budget: bigint;
  state: number;
}

export interface WatcherDeps {
  env: AgentEnv;
  publicClient: PublicClient;
  walletClient: WalletClient;
  agentAddress: Address;
  grader: GraderClient;
  anthropic: AnthropicLike;
}

export function buildDeps(env: AgentEnv): WatcherDeps {
  const account = privateKeyToAccount(env.AGENT_PRIVATE_KEY);
  const transport = http(env.BSC_RPC_URL);
  const publicClient = createPublicClient({ chain: bscTestnet, transport });
  const walletClient = createWalletClient({ account, chain: bscTestnet, transport });
  const grader = new GraderClient({ baseUrl: env.GRADER_URL, hintUrl: env.X402_HINT_URL });
  const llm = getLlmClient(env, (apiKey) => new Anthropic({ apiKey }) as unknown as AnthropicLike);
  const anthropic = llmAsAnthropicLike(llm);
  return {
    env,
    publicClient: publicClient as PublicClient,
    walletClient: walletClient as WalletClient,
    agentAddress: account.address,
    grader,
    anthropic,
  };
}

export async function readJob(
  publicClient: PublicClient,
  jobFactory: Address,
  jobId: bigint,
): Promise<JobRecord> {
  const result = (await publicClient.readContract({
    address: jobFactory,
    abi: JOB_FACTORY_ABI,
    functionName: "jobs",
    args: [jobId],
  })) as readonly [Address, Address, Address, bigint, Hex, Address, bigint, number];
  return {
    client: result[0],
    provider: result[1],
    evaluator: result[2],
    expiresAt: result[3],
    taskHash: result[4],
    token: result[5],
    budget: result[6],
    state: Number(result[7]),
  };
}

export interface HandleResult {
  jobId: bigint;
  solutionHash: Hex;
  submitTxHash: Hex;
  x402TxHash: Hex;
  deliverableUri: string;
}

export async function handleJob(deps: WatcherDeps, jobId: bigint): Promise<HandleResult> {
  const { env, publicClient, walletClient, agentAddress, grader, anthropic } = deps;
  updateStatus("claiming", { job_id: jobId.toString() });
  await grader.pushStatus({ agent_address: agentAddress, state: "claiming", job_id: jobId.toString() });

  const job = await readJob(publicClient, env.JOB_FACTORY_ADDRESS, jobId);
  if (job.provider.toLowerCase() !== agentAddress.toLowerCase()) {
    throw new Error(`job ${jobId} provider ${job.provider} != agent ${agentAddress}`);
  }

  const task = await grader.getTask(job.taskHash);

  updateStatus("solving", { job_id: jobId.toString() });
  await grader.pushStatus({ agent_address: agentAddress, state: "solving", job_id: jobId.toString() });
  const solverModel =
    (env.LLM_PROVIDER ?? "anthropic").toLowerCase() === "openai"
      ? env.OPENAI_MODEL
      : env.ANTHROPIC_MODEL;
  const solutionBytes = await solveTask(task.function_signature, task.acceptance_criteria, anthropic, {
    model: solverModel,
  });

  updateStatus("paying_x402", { job_id: jobId.toString() });
  await grader.pushStatus({ agent_address: agentAddress, state: "paying_x402", job_id: jobId.toString() });
  const { txHash: x402TxHash } = await payForHint({
    walletClient: {
      sendTransaction: async (args) =>
        await walletClient.sendTransaction({
          account: walletClient.account!,
          chain: bscTestnet,
          to: args.to,
          data: args.data,
          value: args.value,
        }),
    },
    publicClient: {
      waitForTransactionReceipt: async (args) =>
        (await publicClient.waitForTransactionReceipt({
          hash: args.hash,
          confirmations: args.confirmations ?? 1,
        })) as { status: "success" | "reverted" },
    },
    grader,
    usdtAddress: env.USDT_ADDRESS,
  });

  updateStatus("submitting", { job_id: jobId.toString() });
  await grader.pushStatus({ agent_address: agentAddress, state: "submitting", job_id: jobId.toString() });
  const upload = await grader.uploadDeliverable(solutionBytes, `job-${jobId}.py`);
  const solutionHash = keccak256(solutionBytes);

  const submitTxHash = await walletClient.writeContract({
    account: walletClient.account!,
    chain: bscTestnet,
    address: env.JOB_FACTORY_ADDRESS,
    abi: JOB_FACTORY_ABI,
    functionName: "submit",
    args: [jobId, solutionHash],
  });
  await publicClient.waitForTransactionReceipt({ hash: submitTxHash, confirmations: 1 });

  updateStatus("idle", { job_id: jobId.toString(), message: `submitted ${submitTxHash}` });
  await grader.pushStatus({ agent_address: agentAddress, state: "idle", job_id: jobId.toString() });
  console.log(`[agent] submitted job ${jobId} tx ${submitTxHash}`);

  return { jobId, solutionHash, submitTxHash, x402TxHash, deliverableUri: upload.uri };
}

export async function watchAndHandle(deps: WatcherDeps): Promise<() => void> {
  const { publicClient, env, agentAddress } = deps;
  const unwatch = publicClient.watchContractEvent({
    address: env.JOB_FACTORY_ADDRESS,
    abi: JOB_FACTORY_ABI,
    eventName: "JobFunded",
    onLogs: async (logs) => {
      for (const log of logs) {
        const args = (log as { args?: { jobId?: bigint } }).args ?? {};
        if (args.jobId === undefined) continue;
        try {
          const job = await readJob(publicClient, env.JOB_FACTORY_ADDRESS, args.jobId);
          if (job.provider.toLowerCase() !== agentAddress.toLowerCase()) continue;
          await handleJob(deps, args.jobId);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[agent] error handling job ${args.jobId}: ${message}`);
          updateStatus("error", { job_id: args.jobId.toString(), message });
        }
      }
    },
    onError: (err) => {
      console.error(`[agent] watch error: ${err.message}`);
    },
  });
  return unwatch;
}
