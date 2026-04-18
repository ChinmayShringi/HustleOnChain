"""JSON-file-backed store for task metadata and pytest files."""

from __future__ import annotations

import json
import threading
import time
from pathlib import Path
from typing import Optional

from .config import get_settings

_LOCK = threading.Lock()


def _root() -> Path:
    return get_settings().data_path


def _tasks_file() -> Path:
    return _root() / "tasks.json"


def _tests_dir() -> Path:
    d = _root() / "tests-store"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _load() -> dict:
    f = _tasks_file()
    if not f.exists():
        return {}
    try:
        return json.loads(f.read_text())
    except json.JSONDecodeError:
        return {}


def _save(data: dict) -> None:
    _tasks_file().write_text(json.dumps(data, indent=2))


def put(task_hash: str, payload: dict) -> None:
    with _LOCK:
        data = _load()
        entry = dict(payload)
        entry.setdefault("created_at", int(time.time()))
        data[task_hash] = entry
        _save(data)


def get(task_hash: str) -> Optional[dict]:
    with _LOCK:
        return _load().get(task_hash)


def put_pytest(pytest_hash: str, file_bytes: bytes) -> Path:
    path = _tests_dir() / f"{pytest_hash}.py"
    path.write_bytes(file_bytes)
    return path


def get_pytest(pytest_hash: str) -> Optional[bytes]:
    path = _tests_dir() / f"{pytest_hash}.py"
    if not path.exists():
        return None
    return path.read_bytes()
