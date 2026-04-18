#!/usr/bin/env bash
# [DEMO DRY-RUN] AgentWork cold-start demo walkthrough.
#
# This script narrates the end-to-end demo. It does NOT deploy contracts or
# submit real transactions. It starts the grader and skill in local dry-run
# mode where possible, and prints the exact manual commands a judge would run
# against a live BSC testnet deployment, along with what to verify at each step.

set -u
set -o pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

say() {
  printf '\n[DEMO DRY-RUN] %s\n' "$1"
}

step() {
  printf '\n==================== %s ====================\n' "$1"
}

pause() {
  printf '  (press enter to continue, or ctrl-c to abort) '
  read -r _ || true
}

GRADER_PID=""
SKILL_PID=""

cleanup() {
  say "cleaning up background processes"
  if [ -n "$GRADER_PID" ] && kill -0 "$GRADER_PID" 2>/dev/null; then
    kill "$GRADER_PID" 2>/dev/null || true
  fi
  if [ -n "$SKILL_PID" ] && kill -0 "$SKILL_PID" 2>/dev/null; then
    kill "$SKILL_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

step "AgentWork cold-start demo  [DRY-RUN]"
say "This walkthrough narrates the 10-step demo from BLUEPRINT.md."
say "Nothing is broadcast. Nothing is deployed. Follow the printed commands to run it live."
pause

step "STEP 1/10  Start grader service (background)"
if [ -x "$REPO_ROOT/grader/.venv/bin/uvicorn" ]; then
  say "launching: grader/.venv/bin/uvicorn app.main:app --port 8000 (background)"
  (
    cd "$REPO_ROOT/grader"
    "$REPO_ROOT/grader/.venv/bin/uvicorn" app.main:app --port 8000 >/tmp/agentwork-grader.log 2>&1 &
    echo $!
  ) >/tmp/agentwork-grader.pid
  GRADER_PID="$(cat /tmp/agentwork-grader.pid)"
  say "grader PID $GRADER_PID. logs: /tmp/agentwork-grader.log"
  sleep 2
else
  say "grader venv not found. Skipping live start. To enable:"
  say "  cd grader && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
fi

step "STEP 2/10  Start skill status server (background)"
if [ -f "$REPO_ROOT/skill/dist/index.js" ]; then
  say "launching: node skill/dist/index.js (background, dry-run unless env is set)"
  (
    cd "$REPO_ROOT/skill"
    node dist/index.js >/tmp/agentwork-skill.log 2>&1 &
    echo $!
  ) >/tmp/agentwork-skill.pid
  SKILL_PID="$(cat /tmp/agentwork-skill.pid)"
  say "skill PID $SKILL_PID. logs: /tmp/agentwork-skill.log"
  sleep 1
else
  say "skill not built. Skipping live start. To enable:"
  say "  cd skill && npm install && npm run build"
fi

step "STEP 3/10  Health check the grader"
if [ -n "$GRADER_PID" ] && kill -0 "$GRADER_PID" 2>/dev/null; then
  say "curl -sS http://localhost:8000/healthz"
  curl -sS http://localhost:8000/healthz || say "(grader not responding yet)"
  printf '\n'
else
  say "grader not running; would run: curl -sS http://localhost:8000/healthz"
fi

step "STEP 4/10  Poster creates project with two milestones"
say "In the frontend (out of scope for this backend demo) or via cast:"
cat <<'EOF'
  # For each milestone:
  cast send $JOB_FACTORY "createJob(address,address,uint256,bytes32,address)" \
    $AGENT_ADDRESS $GRADER_EVALUATOR $(( $(date +%s) + 86400 )) $TASK_HASH 0x0000...0 \
    --private-key $POSTER_KEY --rpc-url $BSC_TESTNET
  # verify JobCreated event and record jobId
EOF

step "STEP 5/10  Grader generates pytest for M1"
say "POST /api/v1/grader/generate with fizzbuzz signature + criteria."
say "Verify: response has pytest_hash (0x...), pytest_uri, preview_tests (>=3 names)."
cat <<'EOF'
  curl -sS -X POST http://localhost:8000/api/v1/grader/generate \
    -H 'content-type: application/json' \
    -d '{"function_signature":"def fizzbuzz(n: int) -> list[str]:", "acceptance_criteria":"Classic FizzBuzz up to n inclusive."}'
EOF

step "STEP 6/10  Poster funds the job with 1 test USDT"
cat <<'EOF'
  cast send $TEST_USDT "approve(address,uint256)" $JOB_FACTORY 1000000 \
    --private-key $POSTER_KEY --rpc-url $BSC_TESTNET
  cast send $JOB_FACTORY "fund(uint256,address,uint256)" $JOB_ID $TEST_USDT 1000000 \
    --private-key $POSTER_KEY --rpc-url $BSC_TESTNET
  # verify JobFunded event emitted
EOF

step "STEP 7/10  Skill picks up JobFunded and starts solving"
say "In the skill log you should see:"
say "  [agent] picked up job <N> provider=<addr>"
say "  [agent] fetched task hash=0x..."
say "  [agent] solving with Claude..."

step "STEP 8/10  Skill pays 0.01 USDT via x402 for the hint"
say "In the skill log you should see (this is the visible x402 integration):"
say "  [x402] paid 10000 to 0x... tx: 0x...  <-- record this tx hash into bsc.address"

step "STEP 9/10  Skill submits deliverable and calls JobFactory.submit"
say "Verify: JobSubmitted event emitted with the expected deliverable hash."

step "STEP 10/10  Grader runs pytest, signs verdict, calls submitVerdict"
say "Verify: JobCompleted event emitted, escrow moved to agent wallet."
say "Check bscscan testnet for the JobCompleted tx. Record into bsc.address."

step "Final tx hashes to record in bsc.address"
cat <<'EOF'
  createJob (M1):           0x...
  fund (M1):                0x...
  submit (M1):               0x...
  submitVerdict (M1 pass):   0x...
  x402 payment (hint):       0x...
EOF

say "dry-run walkthrough complete. See docs/TECHNICAL.md for the live sequence."
say "if grader/skill were started above, they are still running; exiting will stop them."

# Keep background processes alive until user hits ctrl-c, so they can poke at them.
if [ -n "$GRADER_PID$SKILL_PID" ]; then
  say "leaving background services alive. ctrl-c to stop."
  while true; do
    sleep 60
  done
fi
