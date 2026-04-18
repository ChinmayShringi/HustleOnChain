# AI Build Log — AgentWork

Hackathon bonus track: how we used Claude Code to build AgentWork end-to-end.

## Overview

AgentWork's backend (contracts, grader, skill) was built using a three-role agent orchestration pattern repeated per phase:

1. **Builder** — implements the phase's deliverables: contracts, tests, endpoints, skill modules.
2. **Auditor** — independent second pass. Adds adversarial tests, checks blueprint parity, runs the full test suite, produces `docs/audits/phase-N.md`.
3. **Scribe** — final gate. Only commits once Auditor sign-off lands; writes commit messages and keeps `docs/addresses.md` in sync.

Parallel agents were spawned inside each phase for research and independent workstreams (for example during Phase 1, one agent read the ERC-8183 spec while another inventoried OpenZeppelin imports; during Phase 3, one agent scaffolded the x402 pay flow while another wrote the viem ABI).

Phases executed in order: 0 setup, 1 contracts, 2 grader, 3 skill, 4 hardening and submission (this phase).

## Sample successful prompts

### pytest generator system prompt (grader/app/pytest_gen.py)

```
You write deterministic pytest files for Python function specifications.
Output ONLY the pytest file contents. No markdown fences. No commentary.
Hard requirements:
  1. The file must start with `import pytest`.
  2. Include at least 6 test functions, each named `def test_<something>(...)`.
  3. Cover basic cases, edge cases (empty/zero/negative), and at least one error path using `pytest.raises`.
  4. All tests must be deterministic; no randomness, no network, no filesystem.
  5. Import the function under test from `solution` (i.e. `from solution import <name>`).
The user will supply the function signature and acceptance criteria.
```

Post-generation validator: `ast.parse` succeeds, file contains `import pytest`, and contains at least 3 `def test_` definitions. On failure, retry up to 2 times, then raise.

### solver system prompt (skill/src/solver.ts)

```
You are an expert Python programmer writing a single-file solution.
You MUST output ONLY the Python source. No markdown, no fences, no commentary.
The file MUST define the exact function signature given by the user, importable
as `from solution import <name>`. No prints, no reads from disk, no network.
Think step by step internally, but emit only the final code.
```

Post-generation validator: `py_compile.compile` inside a temp file. On failure, retry once with the compiler error appended to the prompt, then raise.

## Sample failure mode and fix

**Failure (caught by Phase 3 audit, F-1):** the skill's `GraderClient.pushStatus` was POSTing to `${baseUrl}/api/v1/status/${agent_address}`, but the grader mounts `POST /api/status/push` with the address in the JSON body. The skill swallowed non-2xx responses, so the frontend's status polling never received pushes. The end-to-end skill tests still passed because the status push was mocked.

**Root cause:** the Builder wrote the URL from memory of an earlier draft of `docs/api.md`, which itself had drifted. No contract test linked the skill URL to the grader route.

**Fix:** (a) corrected the URL in `skill/src/grader_client.ts`, (b) moved `agent_address` into the JSON body to match `StatusPush`, (c) added an API-parity audit test in `skill/test/audit/api_parity.test.ts` that pins the exact URL and payload shape, (d) updated `docs/api.md`. After the fix, the drift test was flipped from "documents bug" to "asserts correct URL."

**Lesson:** API parity must be a machine-checked test, not a doc-level claim. Whenever a URL shape lives in two repos, a third test file is required to pin both.

## Lessons

**What worked**

- **Strict validators on LLM output.** Every Claude-generated artifact (pytest file, Python solution, verdict JSON) flows through a syntactic validator before it can leave the agent. `ast.parse`, `py_compile`, and Pydantic models were the three lines of defence.
- **CEI ordering and explicit state machines.** `JobFactory` writes state first, transfers second. The Phase 1 adversarial test suite reproduced every state transition; re-entrancy was structurally impossible before we even added a guard.
- **Audit-before-commit gates.** The Scribe never commits without `docs/audits/phase-N.md` landing. This stopped at least three would-be regressions (status URL drift, event naming divergence, sandbox fallback network gap) from reaching main.
- **Pinned dependencies.** `skill/package.json` pins viem, vitest, and the CryptoClaw manifest shape on day one. No surprise upgrades mid-hackathon.

**What was tricky**

- **CryptoClaw skill API opacity.** The public CryptoClaw repo has examples but no stable typed API for skill registration. We fell back to a standalone `node dist/index.js` CLI entrypoint with a manifest (`cryptoclaw-skill.json`) that points to the same dist file. The skill still registers as `agentwork_run`; if the CryptoClaw host supports the manifest, it picks it up. If not, the CLI still runs.
- **x402 semantics drift.** `pay_to` in x402 responses can mean either the recipient wallet or the token contract depending on the facilitator. We accept both `recipient` and `pay_to` in the skill but key off `recipient` + `amount_wei` when present. Documented in Phase 3 audit F-4.
- **Sandbox base image.** `python:3.11-slim` with `--network=none` cannot `pip install pytest`; the prebuilt `agentwork-sandbox` image was required to close the network gap. Documented as a Phase 4 hardening item.

## Prompt engineering notes

- **Validators are non-negotiable.** Every LLM output path in production has a parser or compiler gate. The agent never trusts Claude's output as final.
- **Retry limits.** 2 retries max for pytest generation, 1 for solver. Beyond that the task fails loudly rather than spinning the meter.
- **No chain-of-thought in the wire format.** System prompts explicitly forbid markdown fences and commentary; the model is instructed to think internally and emit only the artifact.
- **Determinism.** Both pytest and solver prompts forbid randomness, network, and filesystem access. This makes the sandboxed pytest run byte-reproducible, which in turn makes the verdict signature meaningful.
- **Context boundaries.** The Builder agent never reads the Auditor's findings until after it has shipped. The Auditor never reads the Builder's reasoning chain, only the committed files and tests. This reduced echo-chamber confirmations.

## Tooling footprint

- Claude Code (Opus) for all agent roles.
- Foundry for contracts (Solc 0.8.33, forge-std, OpenZeppelin ECDSA).
- FastAPI + pytest for grader.
- viem + vitest for skill.
- Docker for the pytest sandbox (prebuilt image `agentwork-sandbox`).
