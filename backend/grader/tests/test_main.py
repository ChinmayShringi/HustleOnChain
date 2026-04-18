"""FastAPI integration tests with mocked Anthropic."""

from __future__ import annotations

import io

from fastapi.testclient import TestClient

from grader.app.main import app
from grader.app import status as status_mod


class _Block:
    def __init__(self, text): self.text = text


class _Response:
    def __init__(self, text): self.content = [_Block(text)]


class _MockMessages:
    def create(self, **kwargs):
        return _Response(VALID_PYTEST)


class _MockClient:
    messages = _MockMessages()


VALID_PYTEST = """import pytest

def test_a():
    assert 1 == 1

def test_b():
    assert 2 == 2

def test_c():
    assert 3 == 3

def test_d():
    assert 4 == 4

def test_e():
    assert 5 == 5

def test_f():
    assert 6 == 6
"""


def _client():
    app.state.get_anthropic = lambda: _MockClient()
    return TestClient(app)


def test_healthz():
    c = _client()
    r = c.get("/healthz")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_generate_endpoint():
    c = _client()
    r = c.post("/api/v1/grader/generate", json={
        "function_signature": "def f(x: int) -> int:",
        "acceptance_criteria": "return x*2",
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["pytest_hash"].startswith("0x")
    assert body["task_hash"].startswith("0x")
    assert len(body["preview_tests"]) >= 3
    h = body["pytest_hash"]
    # tests route serves the file
    r2 = c.get(f"/tests/{h}")
    assert r2.status_code == 200
    assert b"import pytest" in r2.content
    # tasks route returns sig + criteria
    r3 = c.get(f"/api/v1/tasks/{body['task_hash']}")
    assert r3.status_code == 200
    assert r3.json()["function_signature"].startswith("def f")


def test_deliverable_upload_and_fetch():
    c = _client()
    files = {"file": ("sol.py", io.BytesIO(b"print('hi')"), "text/x-python")}
    r = c.post("/api/v1/deliverables", files=files)
    assert r.status_code == 200
    uri = r.json()["uri"]
    uid = uri.rsplit("/", 1)[-1]
    r2 = c.get(f"/api/v1/deliverables/{uid}")
    assert r2.status_code == 200
    assert r2.content == b"print('hi')"


def test_status_push_and_get():
    status_mod._reset_for_tests()
    c = _client()
    r = c.post("/api/status/push", json={"job_id": "1", "state": "working", "message": "hi"})
    assert r.status_code == 200
    r2 = c.get("/api/status")
    assert r2.status_code == 200
    body = r2.json()
    assert body["state"] == "working"
    assert body["job_id"] == "1"


def test_status_idle_default():
    status_mod._reset_for_tests()
    c = _client()
    r = c.get("/api/status")
    assert r.json()["state"] == "idle"
