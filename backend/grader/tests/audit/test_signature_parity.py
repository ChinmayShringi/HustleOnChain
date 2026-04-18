"""Audit: cross-check Python evaluator_signer vs Solidity GraderEvaluator.

Solidity digest: keccak256(abi.encode(uint256, bool, address))
                 .toEthSignedMessageHash()   // EIP-191 prefix
Python: eth_abi.encode([...]) -> keccak -> encode_defunct -> sign.

We reconstruct the Solidity digest byte-for-byte here and recover the signer.
"""

from __future__ import annotations

from eth_abi import encode as abi_encode
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_utils import keccak, to_checksum_address

from grader.app.evaluator_signer import sign_verdict, verdict_digest


_PRIV = "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318"


def _solidity_eth_hash(job_id: int, passed: bool, evaluator: str) -> bytes:
    # Mirror Solidity: keccak256(abi.encode(uint256, bool, address))
    digest = keccak(
        abi_encode(
            ["uint256", "bool", "address"],
            [int(job_id), bool(passed), to_checksum_address(evaluator)],
        )
    )
    # toEthSignedMessageHash equivalent is produced by encode_defunct's body field.
    msg = encode_defunct(primitive=digest)
    # The body field is the prefixed message; hashing it yields ethSignedMessageHash.
    prefix = b"\x19Ethereum Signed Message:\n32"
    return keccak(prefix + digest)


VECTORS = [
    (1, True, "0x1111111111111111111111111111111111111111"),
    (42, False, "0x2222222222222222222222222222222222222222"),
    (2**64 - 1, True, "0x3333333333333333333333333333333333333333"),
]


def test_python_digest_matches_solidity_reconstruction():
    for job_id, passed, evaluator in VECTORS:
        py_digest = verdict_digest(job_id, passed, evaluator)
        sol_inner = keccak(
            abi_encode(
                ["uint256", "bool", "address"],
                [job_id, passed, to_checksum_address(evaluator)],
            )
        )
        assert py_digest == sol_inner


def test_recovered_signer_matches_authorized_grader():
    authorized = Account.from_key(_PRIV).address
    for job_id, passed, evaluator in VECTORS:
        sig = sign_verdict(job_id, passed, evaluator, _PRIV)
        assert len(sig) == 65, f"sig must be 65 bytes, got {len(sig)}"
        eth_hash = _solidity_eth_hash(job_id, passed, evaluator)
        # eth_account exposes a low-level recover via messages
        from eth_account._utils.signing import to_standard_signature_bytes
        from eth_keys import keys
        std = to_standard_signature_bytes(sig)
        pub = keys.Signature(std).recover_public_key_from_msg_hash(eth_hash)
        recovered = pub.to_checksum_address()
        assert recovered == authorized, (recovered, authorized)


def test_passed_flag_changes_digest():
    a = verdict_digest(1, True, VECTORS[0][2])
    b = verdict_digest(1, False, VECTORS[0][2])
    assert a != b


def test_evaluator_address_changes_digest():
    a = verdict_digest(1, True, "0x1111111111111111111111111111111111111111")
    b = verdict_digest(1, True, "0x2222222222222222222222222222222222222222")
    assert a != b
