"""Verdict signer recovery consistency with EIP-191 digest."""

from __future__ import annotations

from eth_account import Account
from eth_account.messages import encode_defunct

from grader.app.evaluator_signer import sign_verdict, verdict_digest

_PRIV = "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318"


def test_sign_and_recover():
    acct = Account.from_key(_PRIV)
    evaluator = "0x000000000000000000000000000000000000dEaD"
    job_id = 42
    passed = True
    sig = sign_verdict(job_id, passed, evaluator, _PRIV)
    assert len(sig) == 65
    digest = verdict_digest(job_id, passed, evaluator)
    msg = encode_defunct(primitive=digest)
    recovered = Account.recover_message(msg, signature=sig)
    assert recovered.lower() == acct.address.lower()


def test_different_job_id_changes_signature():
    evaluator = "0x000000000000000000000000000000000000dEaD"
    s1 = sign_verdict(1, True, evaluator, _PRIV)
    s2 = sign_verdict(2, True, evaluator, _PRIV)
    assert s1 != s2


def test_passed_flag_affects_signature():
    evaluator = "0x000000000000000000000000000000000000dEaD"
    s1 = sign_verdict(1, True, evaluator, _PRIV)
    s2 = sign_verdict(1, False, evaluator, _PRIV)
    assert s1 != s2
