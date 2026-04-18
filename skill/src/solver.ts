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
