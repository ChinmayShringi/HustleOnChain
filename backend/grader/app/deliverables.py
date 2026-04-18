"""Routes for deliverable upload and retrieval."""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

from .config import get_settings

router = APIRouter()


def _dir() -> Path:
    d = get_settings().data_path / "deliverables"
    d.mkdir(parents=True, exist_ok=True)
    return d


@router.post("/api/v1/deliverables")
async def upload_deliverable(file: UploadFile = File(...)) -> dict:
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="empty file")
    uid = uuid.uuid4().hex
    (_dir() / f"{uid}.py").write_bytes(contents)
    base = get_settings().GRADER_PUBLIC_BASE_URL.rstrip("/")
    return {"uri": f"{base}/api/v1/deliverables/{uid}"}


@router.get("/api/v1/deliverables/{uid}")
def get_deliverable(uid: str) -> Response:
    path = _dir() / f"{uid}.py"
    if not path.exists():
        raise HTTPException(status_code=404, detail="not found")
    return Response(content=path.read_bytes(), media_type="text/x-python")
