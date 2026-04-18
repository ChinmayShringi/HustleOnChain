import { getEnv } from "./env.js";
import { startStatusServer, updateStatus } from "./status_server.js";
import { buildDeps, handleJob, watchAndHandle } from "./job_watcher.js";

export interface AgentworkRunArgs {
  mode?: "run" | "once";
  jobId?: bigint | number | string;
}

function parseArgs(argv: string[]): AgentworkRunArgs {
  const args = argv.slice(2);
  if (args.length === 0) return { mode: "run" };
  const mode = args[0] === "once" ? "once" : "run";
  const result: AgentworkRunArgs = { mode };
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--job-id" && i + 1 < args.length) {
      result.jobId = args[i + 1];
      i++;
    }
  }
  return result;
}

export async function agentworkRun(args: AgentworkRunArgs = {}): Promise<void> {
  const env = getEnv();
  const deps = buildDeps(env);
  const { port } = await startStatusServer(env.STATUS_PORT);
  updateStatus("idle");

  console.log(
    `AgentWork agent online — address: ${deps.agentAddress} — watching JobFactory ${env.JOB_FACTORY_ADDRESS}`,
  );
  console.log(`[agent] status server on :${port}`);

  if (args.mode === "once") {
    if (args.jobId === undefined) {
      throw new Error("once mode requires --job-id <n>");
    }
    const jobId = BigInt(args.jobId);
    await handleJob(deps, jobId);
    return;
  }

  await watchAndHandle(deps);
  await new Promise<void>(() => {});
}

export default agentworkRun;

const isMain = (() => {
  try {
    const entry = process.argv[1] ?? "";
    return entry.endsWith("index.ts") || entry.endsWith("index.js");
  } catch {
    return false;
  }
})();

if (isMain) {
  const parsed = parseArgs(process.argv);
  if (parsed.mode === "once") {
    // `once` must complete the job lifecycle and exit cleanly. The status
    // server keeps the event loop alive otherwise, so we explicitly exit.
    (async () => {
      try {
        await agentworkRun(parsed);
        process.exit(0);
      } catch (err) {
        console.error(`[agent] fatal: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    })();
  } else {
    agentworkRun(parsed).catch((err) => {
      console.error(`[agent] fatal: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    });
  }
}
