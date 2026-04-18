"""Audit: API contract parity vs BLUEPRINT.md, deliverable traversal, CORS."""

from __future__ import annotations

import io

from fastapi.testclient import TestClient

from grader.app.main import app


class _Block:
    def __init__(self, text): self.text = text


class _R:
    def __init__(self, t): self.content = [_Block(t)]


VALID = """import pytest

def test_a():
    assert True

def test_b():
    assert True

def test_c():
    assert True
"""


class _Mock:
    class messages:
        @staticmethod
        def create(**kw): return _R(VALID)


def _client():
    app.state.get_anthropic = lambda: _Mock()
    return TestClient(app)


def test_generate_response_has_all_blueprint_fields():
    c = _client()
    r = c.post(
        "/api/v1/grader/generate",
        json={"function_signature": "def f(): pass", "acceptance_criteria": "x"},
    )
    assert r.status_code == 200
    body = r.json()
    # Blueprint requires these exact snake_case keys.
    for key in ("pytest_hash", "pytest_uri", "evaluator_address", "preview_tests"):
        assert key in body, f"missing required field: {key}"
    assert body["pytest_hash"].startswith("0x")
    assert body["pytest_uri"].startswith("http")
    assert isinstance(body["preview_tests"], list)
    # evaluator_address may be empty string when EVALUATOR_PRIVATE_KEY is unset.
    assert isinstance(body["evaluator_address"], str)


def test_submit_request_rejects_missing_required_fields():
    c = _client()
    # job_id and deliverable_uri are required. agent_address optional per impl
    # (Blueprint says agent_address; impl accepts Optional. Note in findings.)
    r = c.post("/api/v1/grader/submit", json={})
    assert r.status_code == 422


def test_deliverable_path_traversal_rejected():
    c = _client()
    # FastAPI path param shouldn't match '../' — expect 404 or 400.
    r = c.get("/api/v1/deliverables/..%2F..%2F..%2Fetc%2Fpasswd")
    assert r.status_code in (400, 404)
    r2 = c.get("/api/v1/deliverables/%2Fetc%2Fpasswd")
    assert r2.status_code in (400, 404)


def test_cors_allows_localhost_3000_not_wildcard():
    c = _client()
    r = c.get("/healthz", headers={"Origin": "http://localhost:3000"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"
    r2 = c.get("/healthz", headers={"Origin": "https://evil.example"})
    # CORS middleware should NOT echo the evil origin.
    assert r2.headers.get("access-control-allow-origin") != "https://evil.example"
    assert r2.headers.get("access-control-allow-origin") != "*"


def test_deliverable_uid_with_traversal_content_404s():
    c = _client()
    # Register a real uid first to ensure normal path works.
    files = {"file": ("s.py", io.BytesIO(b"print(1)"), "text/x-python")}
    r = c.post("/api/v1/deliverables", files=files)
    assert r.status_code == 200
    # Now try something that would escape if we concatenated naively.
    # FastAPI path routing rejects segments with '/', so this 404s.
    r2 = c.get("/api/v1/deliverables/..")
    assert r2.status_code in (400, 404)


def test_submit_field_name_is_job_id_snake_case():
    """job_id accepts int, decimal string, or hex string (post phase-2 audit fix).

    Garbage strings must still 422.
    """
    c = _client()
    r = c.post(
        "/api/v1/grader/submit",
        json={"job_id": "not-a-number", "deliverable_uri": "http://x/y"},
    )
    assert r.status_code == 422
