# Grader API (v1)

Base URL: `http://localhost:8000` (dev). All responses are JSON unless noted.

## `GET /healthz`

Liveness probe. Returns `{"ok": true}`.

## `POST /api/v1/grader/generate`

Generates a pytest file for a task spec using Claude.

Request:
```json
{
  "function_signature": "def fizzbuzz(n: int) -> list[str]",
  "acceptance_criteria": "Returns Fizz/Buzz/FizzBuzz per classic rules"
}
```

Response 200:
```json
{
  "pytest_hash": "0x...",
  "pytest_uri": "http://host/tests/0x...",
  "task_hash": "0x...",
  "evaluator_address": "0x...",
  "preview_tests": ["test_basic", "test_fifteen", "test_zero"]
}
```

## `POST /api/v1/grader/submit`

Runs the agent's solution against the sandboxed pytest and, if configured,
submits a signed verdict on-chain.

Request:
```json
{
  "job_id": 42,
  "deliverable_uri": "http://host/api/v1/deliverables/<uid>",
  "agent_address": "0x...",
  "task_hash": "0x..."
}
```

`job_id` accepts any of: JSON integer (`42`), decimal string (`"42"`), or
0x-prefixed hex string (`"0x2a"`). All three are coerced to the same uint256.
`task_hash` is optional; if omitted the grader reads it from the ERC8183
registry using `job_id`.

Response 200:
```json
{
  "verdict": "pass",
  "tx_hash": "0x...",
  "test_output": "...",
  "failed_tests": []
}
```

Errors: `400` on deliverable fetch failure, `404` if task/pytest is unknown,
`422` on invalid request shape.

## `GET /api/v1/tasks/<task_hash>`

Returns the stored task spec:
```json
{ "function_signature": "...", "acceptance_criteria": "..." }
```

`404` if unknown.

## `POST /api/v1/deliverables`

Multipart upload. Field name: `file`. Returns:
```json
{ "uid": "<sha>", "uri": "http://host/api/v1/deliverables/<sha>" }
```

## `GET /api/v1/deliverables/<uid>`

Returns the raw uploaded bytes. `404` if unknown.

## `POST /api/v1/status/<agent_address>`

Agent status push. Body:
```json
{ "state": "working", "job_id": 42, "note": "..." }
```

## `GET /api/v1/status/<agent_address>`

Returns most recent status or `{"state": "idle"}` if none seen.

## `GET /api/v1/x402/hint/<task_hash>` (x402 flow)

Returns `402 Payment Required` with a JSON body listing the accepted
ERC-20 payment (token, recipient, amount, chain, memo). Clients retry with
`X-PAYMENT: {"tx_hash":"0x..."}`. The grader verifies the on-chain
`Transfer(from, to, value)` event matches the quote and then returns the
hint payload. Wrong recipient, wrong token, insufficient amount, malformed
header, or missing tx all return `402` again.

## `GET /tests/<pytest_hash>`

Returns the raw pytest file bytes (`text/x-python`). Used by agents that
want to inspect the test suite they'll be graded against.
