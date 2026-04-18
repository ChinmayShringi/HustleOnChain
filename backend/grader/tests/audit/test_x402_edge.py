"""Audit: x402 flow edge cases — amount under price, wrong recipient, replay."""

from __future__ import annotations

import json

import pytest
from eth_account import Account
from fastapi.testclient import TestClient

from grader.app import x402_hint
from grader.app.main import app

_PRIV = "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318"
_USDT = "0x000000000000000000000000000000000000AAAA"
_TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"


def _setup(monkeypatch):
    monkeypatch.setenv("DEPLOYER_PRIVATE_KEY", _PRIV)
    monkeypatch.setenv("USDT_ADDRESS", _USDT)
    from grader.app import config as cfg
    cfg.get_settings.cache_clear()


def _log(addr: str, to_addr: str, amount: int):
    class _L:
        def __init__(self):
            self.address = addr
            self.topics = [
                bytes.fromhex(_TRANSFER_TOPIC[2:]),
                bytes(32),
                bytes.fromhex("00" * 12 + to_addr.lower().replace("0x", "")),
            ]
            self.data = "0x" + hex(amount)[2:].rjust(64, "0")
    return _L()


def _receipt(logs):
    class _R:
        status = 1
        def __init__(self, l): self.logs = l
    return _R(logs)


def _mock_w3(receipt_or_raise):
    class _W3:
        class eth:
            @staticmethod
            def get_transaction_receipt(_tx):
                if isinstance(receipt_or_raise, Exception):
                    raise receipt_or_raise
                return receipt_or_raise
    return _W3()


def test_first_request_returns_402_with_pay_to(monkeypatch):
    _setup(monkeypatch)
    x402_hint._USED_TX.clear()
    app.state.get_web3 = lambda: _mock_w3(ValueError("unused"))
    c = TestClient(app)
    r = c.get("/x402/hint")
    assert r.status_code == 402
    body = r.json()
    assert "pay_to" in body and "amount_wei" in body and "recipient" in body


def test_amount_below_price_rejected(monkeypatch):
    _setup(monkeypatch)
    x402_hint._USED_TX.clear()
    recipient = Account.from_key(_PRIV).address
    # Price is 1e16; send 1e15 (too little).
    rcpt = _receipt([_log(_USDT, recipient, 1_000_000_000_000_000)])
    app.state.get_web3 = lambda: _mock_w3(rcpt)
    c = TestClient(app)
    r = c.get("/x402/hint", headers={"X-Payment": json.dumps({"tx_hash": "0xlow"})})
    assert r.status_code == 402


def test_wrong_recipient_rejected(monkeypatch):
    _setup(monkeypatch)
    x402_hint._USED_TX.clear()
    bad = "0x00000000000000000000000000000000000B0B0B"
    rcpt = _receipt([_log(_USDT, bad, 20_000_000_000_000_000)])
    app.state.get_web3 = lambda: _mock_w3(rcpt)
    c = TestClient(app)
    r = c.get("/x402/hint", headers={"X-Payment": json.dumps({"tx_hash": "0xwr"})})
    assert r.status_code == 402


def test_wrong_token_rejected(monkeypatch):
    _setup(monkeypatch)
    x402_hint._USED_TX.clear()
    recipient = Account.from_key(_PRIV).address
    wrong_token = "0x000000000000000000000000000000000000BBBB"
    rcpt = _receipt([_log(wrong_token, recipient, 20_000_000_000_000_000)])
    app.state.get_web3 = lambda: _mock_w3(rcpt)
    c = TestClient(app)
    r = c.get("/x402/hint", headers={"X-Payment": json.dumps({"tx_hash": "0xwt"})})
    assert r.status_code == 402


def test_nonexistent_tx_returns_402_not_500(monkeypatch):
    _setup(monkeypatch)
    x402_hint._USED_TX.clear()
    app.state.get_web3 = lambda: _mock_w3(ValueError("not found"))
    c = TestClient(app)
    r = c.get("/x402/hint", headers={"X-Payment": json.dumps({"tx_hash": "0xnope"})})
    assert r.status_code == 402


def test_malformed_header_json_returns_402(monkeypatch):
    _setup(monkeypatch)
    x402_hint._USED_TX.clear()
    app.state.get_web3 = lambda: _mock_w3(ValueError("unused"))
    c = TestClient(app)
    r = c.get("/x402/hint", headers={"X-Payment": "not-json"})
    assert r.status_code == 402
