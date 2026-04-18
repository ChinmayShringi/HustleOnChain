"""AgentWork grader service FastAPI entrypoint.

Phase 0 scaffold: exposes a health check. Phase 2 adds /api/v1/grader/* routes.
"""

from fastapi import FastAPI

app = FastAPI(title="AgentWork Grader", version="0.0.1")


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True}
