"""x402 hint route: 402 protocol and mocked receipt verification."""

from __future__ import annotations

import json

from eth_account import Account
from fastapi.testclient import TestClient

from grader.app.main import app
from grader.app import x402_hint

_PRIV = "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318"
_USDT = "0x000000000000000000000000000000000000AAAA"


def _setup_env(monkeypatch):
    monkeypatch.setenv("DEPLOYER_PRIVATE_KEY", _PRIV)
    monkeypatch.setenv("USDT_ADDRESS", _USDT)
    from grader.app import config as cfg
    cfg.get_settings.cache_clear()


def test_402_without_payment(monkeypatch):
    _setup_env(monkeypatch)
    x402_hint._USED_TX.clear()
    app.state.get_web3 = lambda: (_ for _ in ()).throw(RuntimeError("no w3 needed"))
    c = TestClient(app)
    r = c.get("/x402/hint")
    assert r.status_code == 402
    body = r.json()
    assert body["amount_wei"] == 10_000_000_000_000_000
    assert body["pay_to"].lower() == _USDT.lower()
    assert body["recipient"] == Account.from_key(_PRIV).address


def test_402_with_bad_tx(monkeypatch):
    _setup_env(monkeypatch)
    x402_hint._USED_TX.clear()

    class _W3:
        class eth:
            @staticmethod
            def get_transaction_receipt(tx):
                raise ValueError("not found")

    app.state.get_web3 = lambda: _W3()
    c = TestClient(app)
    r = c.get("/x402/hint", headers={"X-Payment": json.dumps({"tx_hash": "0xdeadbeef"})})
    assert r.status_code == 402


def test_hint_granted_after_valid_transfer(monkeypatch):
    _setup_env(monkeypatch)
    x402_hint._USED_TX.clear()
    recipient = Account.from_key(_PRIV).address
    transfer_topic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
    pad_addr = "0x" + "00" * 12 + recipient.lower().replace("0x", "")
    # encode amount 0.02 token (2e16)
    amount_hex = hex(20_000_000_000_000_000)[2:].rjust(64, "0")

    class _Log:
        def __init__(self):
            self.address = _USDT
            self.topics = [bytes.fromhex(transfer_topic[2:]), bytes(32), bytes.fromhex(pad_addr[2:])]
            self.data = "0x" + amount_hex

    class _Receipt:
        status = 1
        logs = [_Log()]

    class _W3:
        class eth:
            @staticmethod
            def get_transaction_receipt(tx):
                return _Receipt()

    app.state.get_web3 = lambda: _W3()
    c = TestClient(app)
    r = c.get("/x402/hint", headers={"X-Payment": json.dumps({"tx_hash": "0xabc"})})
    assert r.status_code == 200, r.text
    assert "hint" in r.json()
    # Replay rejected
    r2 = c.get("/x402/hint", headers={"X-Payment": json.dumps({"tx_hash": "0xabc"})})
    assert r2.status_code == 402
