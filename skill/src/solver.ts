export interface AnthropicLike {
  messages: {
    create(args: {
      model: string;
      max_tokens: number;
      system: string;
      messages: Array<{ role: string; content: string }>;
    }): Promise<{ content: Array<{ type: string; text?: string }> }>;
  };
}

export interface LlmClient {
  complete(args: { system: string; user: string; maxTokens: number; model: string }): Promise<string>;
}

export class AnthropicLlm implements LlmClient {
  constructor(private readonly client: AnthropicLike) {}
  async complete(args: { system: string; user: string; maxTokens: number; model: string }): Promise<string> {
    const resp = await this.client.messages.create({
      model: args.model,
      max_tokens: args.maxTokens,
      system: args.system,
      messages: [{ role: "user", content: args.user }],
    });
    return resp.content.map((b) => (b.type === "text" ? b.text ?? "" : "")).join("");
  }
}

export class OpenAiCompatLlm implements LlmClient {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}
  async complete(args: { system: string; user: string; maxTokens: number; model: string }): Promise<string> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const body = {
      model: args.model,
      max_tokens: args.maxTokens,
      temperature: 0.2,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`openai-compat ${resp.status}: ${text.slice(0, 500)}`);
    }
    const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? "";
    return typeof content === "string" ? content : String(content);
  }
}

// Adapter: wraps LlmClient as AnthropicLike so solveTask can consume either.
export function llmAsAnthropicLike(llm: LlmClient): AnthropicLike {
  return {
    messages: {
      create: async (args) => {
        const userMsg = args.messages.find((m) => m.role === "user");
        const text = await llm.complete({
          system: args.system,
          user: typeof userMsg?.content === "string" ? userMsg.content : "",
          maxTokens: args.max_tokens,
          model: args.model,
        });
        return { content: [{ type: "text", text }] };
      },
    },
  };
}

export interface EnvForLlm {
  LLM_PROVIDER: string;
  ANTHROPIC_API_KEY: string;
  OPENAI_BASE_URL: string;
  OPENAI_API_KEY: string;
}

export function getLlmClient(
  env: EnvForLlm,
  makeAnthropic: (apiKey: string) => AnthropicLike,
): LlmClient {
  if (env.LLM_PROVIDER.toLowerCase() === "openai") {
    const base = env.OPENAI_BASE_URL || "http://127.0.0.1:1234/v1";
    return new OpenAiCompatLlm(base, env.OPENAI_API_KEY || "lm-studio");
  }
  return new AnthropicLlm(makeAnthropic(env.ANTHROPIC_API_KEY));
}

const SYSTEM_PROMPT =
  "You write deterministic Python solutions for function specifications. " +
  "Output only the Python source file with the function implemented. " +
  "No markdown, no commentary. Include any necessary imports.";

export function extractFunctionName(signature: string): string {
  const match = signature.match(/def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
  if (!match) {
    throw new Error(`Could not extract function name from signature: ${signature}`);
  }
  return match[1];
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    lines.shift();
    if (lines.length > 0 && lines[lines.length - 1].trim().startsWith("```")) {
      lines.pop();
    }
    return lines.join("\n").trim();
  }
  return trimmed;
}

export function validateSolution(source: string, functionName: string): boolean {
  if (!source || source.trim().length === 0) return false;
  if (!source.includes("def ")) return false;
  const nameRegex = new RegExp(`def\\s+${functionName}\\s*\\(`);
  return nameRegex.test(source);
}

export async function solveTask(
  signature: string,
  criteria: string,
  anthropic: AnthropicLike,
  opts: { model?: string; maxTokens?: number; maxAttempts?: number } = {},
): Promise<Uint8Array> {
  const model = opts.model ?? "claude-opus-4-7";
  const maxTokens = opts.maxTokens ?? 2048;
  const maxAttempts = opts.maxAttempts ?? 3;
  const functionName = extractFunctionName(signature);
  const userPrompt = `Function signature:\n${signature}\n\nAcceptance criteria:\n${criteria}`;

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });
      const text = response.content
        .map((block) => (block.type === "text" ? block.text ?? "" : ""))
        .join("");
      const cleaned = stripFences(text);
      if (validateSolution(cleaned, functionName)) {
        return new TextEncoder().encode(cleaned);
      }
      lastError = new Error(`attempt ${attempt}: invalid solution (missing def ${functionName})`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw new Error(`solveTask failed after ${maxAttempts} attempts: ${lastError?.message ?? "unknown"}`);
}
