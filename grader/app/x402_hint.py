"""x402-gated hint endpoint with USDT Transfer verification."""

from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse

from .config import get_settings

router = APIRouter()

_USED_TX: set[str] = set()

# Transfer(address,address,uint256) topic
_TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"


def _relayer_address() -> str:
    from eth_account import Account
    s = get_settings()
    key = s.DEPLOYER_PRIVATE_KEY or s.EVALUATOR_PRIVATE_KEY
    if not key:
        return "0x0000000000000000000000000000000000000000"
    return Account.from_key(key).address


def _payment_required() -> JSONResponse:
    s = get_settings()
    body = {
        "pay_to": s.USDT_ADDRESS,
        "amount_wei": s.X402_PRICE_WEI,
        "recipient": _relayer_address(),
        "memo": "x402-hint",
        "accepts": ["transferWithAuthorization", "nexuspay"],
    }
    return JSONResponse(status_code=402, content=body)


def _verify_tx(w3, tx_hash: str, usdt_address: str, recipient: str, min_wei: int) -> bool:
    try:
        receipt = w3.eth.get_transaction_receipt(tx_hash)
    except Exception:
        return False
    if not receipt or getattr(receipt, "status", 0) != 1:
        return False
    target = usdt_address.lower() if usdt_address else ""
    recipient_low = recipient.lower()
    for log in receipt.logs:
        addr = (log["address"] if isinstance(log, dict) else log.address).lower()
        topics = log["topics"] if isinstance(log, dict) else log.topics
        data = log["data"] if isinstance(log, dict) else log.data
        topic_hexes = [t.hex() if isinstance(t, (bytes, bytearray)) else str(t) for t in topics]
        if target and addr != target:
            continue
        if not topic_hexes or not topic_hexes[0].lower().endswith(_TRANSFER_TOPIC[2:]):
            continue
        if len(topic_hexes) < 3:
            continue
        to_topic = topic_hexes[2]
        to_addr = "0x" + to_topic[-40:]
        if to_addr.lower() != recipient_low:
            continue
        raw = data if isinstance(data, str) else data.hex()
        if raw.startswith("0x"):
            raw = raw[2:]
        if not raw:
            continue
        try:
            amount = int(raw, 16)
        except ValueError:
            continue
        if amount >= min_wei:
            return True
    return False


def build_x402_router(get_web3) -> APIRouter:
    r = APIRouter()

    @r.get("/x402/hint")
    def hint(x_payment: Optional[str] = Header(default=None, alias="X-Payment")) -> JSONResponse:
        if not x_payment:
            return _payment_required()
        try:
            payload = json.loads(x_payment)
        except json.JSONDecodeError:
            return _payment_required()
        tx_hash = payload.get("tx_hash")
        if not tx_hash or tx_hash in _USED_TX:
            return _payment_required()
        s = get_settings()
        try:
            w3 = get_web3()
        except Exception:
            raise HTTPException(status_code=503, detail="web3 unavailable")
        if not _verify_tx(w3, tx_hash, s.USDT_ADDRESS, _relayer_address(), s.X402_PRICE_WEI):
            return _payment_required()
        _USED_TX.add(tx_hash)
        return JSONResponse(status_code=200, content={"hint": "prefer divmod over two modulos"})

    return r
