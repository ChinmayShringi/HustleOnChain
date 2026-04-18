// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Minimal ERC-8183 surface used by AgentWork. The deployed reference at
// 0x3464e64dD53bC093c53050cE5114062765e9F1b6 may differ; our JobFactory is the
// implementation we actually deploy and test against.
interface IERC8183 {
    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed provider,
        address evaluator,
        uint256 expiresAt,
        bytes32 taskHash,
        address hook
    );
    event JobFunded(uint256 indexed jobId, address token, uint256 amount);
    event JobSubmitted(uint256 indexed jobId, bytes32 deliverableHash);
    event JobCompleted(uint256 indexed jobId, string reason);
    event JobRejected(uint256 indexed jobId, string reason);
    event JobExpired(uint256 indexed jobId);
    event Refunded(uint256 indexed jobId, address token, uint256 amount);

    function createJob(
        address provider,
        address evaluator,
        uint256 expiresAt,
        bytes32 taskHash,
        address hook
    ) external returns (uint256 jobId);

    function fund(uint256 jobId, address token, uint256 amount) external;

    function submit(uint256 jobId, bytes32 deliverableHash) external;

    function complete(uint256 jobId, string memory reason) external;

    function reject(uint256 jobId, string memory reason) external;

    function claimRefund(uint256 jobId) external;

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
        );
}
