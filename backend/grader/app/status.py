"""Process-global agent status tracker."""

from __future__ import annotations

import threading
import time
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()
_LOCK = threading.Lock()
_STATES: dict[str, dict] = {}
_SINGLE_KEY = "__single__"


class StatusPush(BaseModel):
    job_id: Optional[str] = None
    state: str
    message: Optional[str] = None
    agent_address: Optional[str] = None


@router.post("/api/status/push")
def push_status(body: StatusPush) -> dict:
    key = body.agent_address or _SINGLE_KEY
    entry = {
        "job_id": body.job_id,
        "state": body.state,
        "message": body.message,
        "agent_address": body.agent_address,
        "updated_at": int(time.time()),
    }
    with _LOCK:
        _STATES[key] = entry
    return {"ok": True}


@router.get("/api/status")
def get_status(agent_address: Optional[str] = None) -> dict:
    with _LOCK:
        if agent_address:
            return _STATES.get(agent_address, {"state": "idle", "agent_address": agent_address})
        if _STATES:
            # Return newest entry if multiple.
            return max(_STATES.values(), key=lambda e: e.get("updated_at", 0))
        return {"state": "idle"}


def _reset_for_tests() -> None:
    with _LOCK:
        _STATES.clear()
