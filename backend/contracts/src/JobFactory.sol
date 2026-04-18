// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC8183} from "./interfaces/IERC8183.sol";

contract JobFactory is IERC8183 {
    enum JobState {
        Open,
        Funded,
        Submitted,
        Completed,
        Rejected,
        Expired
    }

    struct Job {
        address client;
        address provider;
        address evaluator;
        uint256 expiresAt;
        bytes32 taskHash;
        address hook;
        address token;
        uint256 budget;
        bytes32 deliverableHash;
        JobState state;
    }

    mapping(uint256 => Job) internal _jobs;
    uint256 public nextJobId;

    function createJob(
        address provider,
        address evaluator,
        uint256 expiresAt,
        bytes32 taskHash,
        address hook
    ) external returns (uint256 jobId) {
        require(provider != address(0), "provider=0");
        require(evaluator != address(0), "evaluator=0");
        require(expiresAt > block.timestamp, "expiry past");
        jobId = ++nextJobId;
        _jobs[jobId] = Job({
            client: msg.sender,
            provider: provider,
            evaluator: evaluator,
            expiresAt: expiresAt,
            taskHash: taskHash,
            hook: hook,
            token: address(0),
            budget: 0,
            deliverableHash: bytes32(0),
            state: JobState.Open
        });
        emit JobCreated(jobId, msg.sender, provider, evaluator, expiresAt, taskHash, hook);
    }

    function fund(uint256 jobId, address token, uint256 amount) external {
        Job storage j = _jobs[jobId];
        require(j.client == msg.sender, "not client");
        require(j.state == JobState.Open, "bad state");
        require(token != address(0), "token=0");
        require(amount > 0, "amount=0");
        j.token = token;
        j.budget = amount;
        j.state = JobState.Funded;
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        emit JobFunded(jobId, token, amount);
    }

    function submit(uint256 jobId, bytes32 deliverableHash) external {
        Job storage j = _jobs[jobId];
        require(msg.sender == j.provider, "not provider");
        require(j.state == JobState.Funded, "bad state");
        require(block.timestamp < j.expiresAt, "expired");
        j.deliverableHash = deliverableHash;
        j.state = JobState.Submitted;
        emit JobSubmitted(jobId, deliverableHash);
    }

    function complete(uint256 jobId, string memory reason) external {
        Job storage j = _jobs[jobId];
        require(msg.sender == j.evaluator, "not evaluator");
        require(j.state == JobState.Submitted, "bad state");
        j.state = JobState.Completed;
        uint256 amount = j.budget;
        address token = j.token;
        address provider = j.provider;
        require(IERC20(token).transfer(provider, amount), "transfer failed");
        emit JobCompleted(jobId, reason);
    }

    function reject(uint256 jobId, string memory reason) external {
        Job storage j = _jobs[jobId];
        require(msg.sender == j.evaluator, "not evaluator");
        require(j.state == JobState.Funded || j.state == JobState.Submitted, "bad state");
        j.state = JobState.Rejected;
        uint256 amount = j.budget;
        address token = j.token;
        address client = j.client;
        require(IERC20(token).transfer(client, amount), "transfer failed");
        emit JobRejected(jobId, reason);
    }

    function claimRefund(uint256 jobId) external {
        Job storage j = _jobs[jobId];
        require(msg.sender == j.client, "not client");
        require(j.state == JobState.Funded, "bad state");
        require(block.timestamp >= j.expiresAt, "not expired");
        j.state = JobState.Expired;
        uint256 amount = j.budget;
        address token = j.token;
        require(IERC20(token).transfer(j.client, amount), "transfer failed");
        emit JobExpired(jobId);
        emit Refunded(jobId, token, amount);
    }

    function jobs(uint256 jobId)
        external
        view
        returns (
            address client,
            address provider,
            address evaluator,
            uint256 expiresAt,
            bytes32 taskHash,
            address token,
            uint256 budget,
            uint8 state
        )
    {
        Job storage j = _jobs[jobId];
        return (j.client, j.provider, j.evaluator, j.expiresAt, j.taskHash, j.token, j.budget, uint8(j.state));
    }

    function jobHook(uint256 jobId) external view returns (address) {
        return _jobs[jobId].hook;
    }

    function jobDeliverable(uint256 jobId) external view returns (bytes32) {
        return _jobs[jobId].deliverableHash;
    }
}
