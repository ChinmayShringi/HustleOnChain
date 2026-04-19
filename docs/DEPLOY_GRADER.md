# Deploy Grader to Railway

The FastAPI grader at `backend/grader/` is deployed to Railway so the Vercel-hosted frontend can call it from a browser. This deployment runs in **frontend-serve mode**: it generates pytest files, serves them, serves deliverables, and handles status push/poll. It does **not** grade submissions on Railway because Docker-in-Docker (required by the sandbox) is not available on Railway's container runtime. Live grading (`/api/v1/grader/submit`) returns `503 sandbox_unavailable` on Railway; run the local grader against the same chain for the demo video.

## 1. Install the Railway CLI

```bash
# macOS
brew install railway

# Or via npm
npm i -g @railway/cli
```

Verify:

```bash
railway --version
```

## 2. Authenticate

```bash
railway login
```

This opens a browser; approve the CLI in your Railway account.

## 3. Create a project (one-time)

From the repo root:

```bash
cd backend/grader
railway init
```

Pick an empty project name (e.g. `agentwork-grader`). Railway will link the current directory to the new project.

## 4. Set environment variables

Use the dashboard (Project → Variables) or the CLI. Minimum required for the demo:

```bash
railway variables --set ANTHROPIC_API_KEY=sk-ant-...
railway variables --set EVALUATOR_PRIVATE_KEY=0x...
railway variables --set DEPLOYER_PRIVATE_KEY=0x...   # optional; falls back to evaluator key
railway variables --set BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
railway variables --set ERC8183_ADDRESS=0x3464e64dD53bC093c53050cE5114062765e9F1b6
railway variables --set GRADER_EVALUATOR_ADDRESS=0x...
railway variables --set LLM_PROVIDER=anthropic
railway variables --set CORS_ALLOW_ORIGINS=https://your-app.vercel.app,http://localhost:3000
# Set after first deploy so pytest_uri links back to the public URL:
# railway variables --set GRADER_PUBLIC_BASE_URL=https://<service>.up.railway.app
```

See `backend/grader/.env.example` for the full list and comments.

## 5. Deploy

```bash
railway up
```

Railway builds `backend/grader/Dockerfile` (pointed at by `railway.json`) and boots `uvicorn app.main:app` on the injected `$PORT`. Healthcheck is `/healthz` (configured in `railway.json`).

## 6. Expose a public URL

```bash
railway domain
```

This generates or prints the public URL, e.g. `https://agentwork-grader.up.railway.app`. Copy it into:

- `GRADER_PUBLIC_BASE_URL` (grader env var, so returned `pytest_uri` is reachable from the browser — re-deploy after setting).
- `NEXT_PUBLIC_GRADER_URL` in the frontend Vercel project env.

## 7. Smoke test

```bash
GRADER_URL=https://agentwork-grader.up.railway.app

# Health
curl -sS "$GRADER_URL/healthz"
# → {"ok":true}

# CORS preflight (should include Access-Control-Allow-Origin)
curl -sS -i -X OPTIONS "$GRADER_URL/api/v1/grader/generate" \
  -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: POST"

# Generate a pytest (real call)
curl -sS -X POST "$GRADER_URL/api/v1/grader/generate" \
  -H "Content-Type: application/json" \
  -d '{"function_signature":"def fizzbuzz(n: int) -> str","acceptance_criteria":"classic FizzBuzz"}'
```

## 8. Confirm /submit returns 503 on Railway (expected)

```bash
curl -sS -i -X POST "$GRADER_URL/api/v1/grader/submit" \
  -H "Content-Type: application/json" \
  -d '{"job_id":1,"deliverable_uri":"https://example.com/x.py","task_hash":"0x00"}'
# → HTTP/1.1 503 Service Unavailable
# → {"detail":{"error":"sandbox_unavailable","hint":"Grader is in frontend-serve mode; use local grader for submit."}}
```

This is the intended behaviour. Run the local grader (`uvicorn app.main:app --port 8000` from `backend/grader/`) against the same contracts to grade real deliverables during the demo.

## Troubleshooting

- **Build fails on `pip install`**: confirm `backend/grader/requirements.txt` is committed.
- **`/healthz` returns 502**: check `railway logs` for uvicorn startup errors; usually a missing required env var surfaced at first request.
- **CORS error in browser**: verify `CORS_ALLOW_ORIGINS` contains the exact Vercel origin (no trailing slash) and re-deploy.
- **`pytest_uri` points at localhost**: `GRADER_PUBLIC_BASE_URL` was not set or not re-deployed after setting.
