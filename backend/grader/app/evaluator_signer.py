"""EIP-191 verdict signing matching GraderEvaluator.sol recovery path."""

from __future__ import annotations

from eth_abi import encode as abi_encode
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_utils import keccak, to_checksum_address


def verdict_digest(job_id: int, passed: bool, evaluator_address: str) -> bytes:
    # Solidity: keccak256(abi.encode(uint256, bool, address))
    encoded = abi_encode(
        ["uint256", "bool", "address"],
        [int(job_id), bool(passed), to_checksum_address(evaluator_address)],
    )
    return keccak(encoded)


def sign_verdict(job_id: int, passed: bool, evaluator_address: str, private_key: str) -> bytes:
    digest = verdict_digest(job_id, passed, evaluator_address)
    msg = encode_defunct(primitive=digest)
    signed = Account.from_key(private_key).sign_message(msg)
    return bytes(signed.signature)
