// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC8183} from "./interfaces/IERC8183.sol";

contract GraderEvaluator {
    using MessageHashUtils for bytes32;

    address public immutable jobFactory;
    address public immutable authorizedGrader;

    // Replay guard: a verdict per jobId can only be consumed once.
    mapping(uint256 => bool) public consumed;

    event VerdictSubmitted(uint256 indexed jobId, bool passed, address grader);

    constructor(address jobFactory_, address authorizedGrader_) {
        require(jobFactory_ != address(0), "factory=0");
        require(authorizedGrader_ != address(0), "grader=0");
        jobFactory = jobFactory_;
        authorizedGrader = authorizedGrader_;
    }

    function submitVerdict(uint256 jobId, bool passed, bytes calldata sig) external {
        require(!consumed[jobId], "replay");
        bytes32 digest = keccak256(abi.encode(jobId, passed, address(this)));
        bytes32 ethHash = digest.toEthSignedMessageHash();
        address recovered = ECDSA.recover(ethHash, sig);
        require(recovered == authorizedGrader, "bad sig");
        consumed[jobId] = true;
        if (passed) {
            IERC8183(jobFactory).complete(jobId, "grader pass");
        } else {
            IERC8183(jobFactory).reject(jobId, "grader fail");
        }
        emit VerdictSubmitted(jobId, passed, recovered);
    }
}
