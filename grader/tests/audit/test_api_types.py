"""Audit: job_id polymorphic input (int, decimal string, 0x-hex string)."""

from __future__ import annotations

from fastapi.testclient import TestClient

from grader.app.main import SubmitRequest, app


def _client():
    return TestClient(app)


def test_submit_job_id_accepts_int():
    req = SubmitRequest(job_id=42, deliverable_uri="http://x/y")
    assert req.job_id == 42


def test_submit_job_id_accepts_decimal_string():
    req = SubmitRequest(job_id="42", deliverable_uri="http://x/y")
    assert req.job_id == 42


def test_submit_job_id_accepts_hex_string():
    req = SubmitRequest(job_id="0x2a", deliverable_uri="http://x/y")
    assert req.job_id == 42


def test_submit_job_id_accepts_uppercase_hex():
    req = SubmitRequest(job_id="0X2A", deliverable_uri="http://x/y")
    assert req.job_id == 42


def test_submit_job_id_rejects_garbage_string():
    c = _client()
    r = c.post(
        "/api/v1/grader/submit",
        json={"job_id": "not-a-number", "deliverable_uri": "http://x/y"},
    )
    assert r.status_code == 422


def test_submit_job_id_rejects_negative():
    c = _client()
    r = c.post(
        "/api/v1/grader/submit",
        json={"job_id": -1, "deliverable_uri": "http://x/y"},
    )
    assert r.status_code == 422


def test_submit_endpoint_roundtrip_all_three_forms():
    """HTTP-level: all three job_id forms pass validation (then 400 on fetch)."""
    c = _client()
    for jid in (42, "42", "0x2a"):
        r = c.post(
            "/api/v1/grader/submit",
            json={"job_id": jid, "deliverable_uri": "http://127.0.0.1:1/none"},
        )
        # Validation passes; deliverable fetch fails with 400, not 422.
        assert r.status_code == 400, f"job_id={jid!r} got {r.status_code}: {r.text}"
