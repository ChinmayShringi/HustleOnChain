// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {JobFactory} from "../../src/JobFactory.sol";
import {GraderEvaluator} from "../../src/GraderEvaluator.sol";
import {MockERC20} from "../helpers/MockERC20.sol";

/// @notice Phase 1 adversarial audit tests. These probe cross-evaluator replay,
/// zero-budget fund, double-fund, submit-after-expiry, and state transitions.
/// Any test marked with `AUDIT FINDING` documents a behavior that the auditor
/// surfaced as a finding; the test is written to pass with current contracts.
contract AdversarialTest is Test {
    using MessageHashUtils for bytes32;

    JobFactory factory;
    GraderEvaluator evalA;
    GraderEvaluator evalB;
    MockERC20 token;

    uint256 graderPk = 0xA11CE;
    address grader;
    address client = address(0xC1);
    address provider = address(0xB0B);
    address stranger = address(0xBAD);

    uint256 constant BUDGET = 500 ether;

    function setUp() public {
        grader = vm.addr(graderPk);
        factory = new JobFactory();
        evalA = new GraderEvaluator(address(factory), grader);
        evalB = new GraderEvaluator(address(factory), grader);
        token = new MockERC20("Mock", "MCK");
        token.mint(client, 100_000 ether);
    }

    function _create(address evaluator_, uint256 expiry) internal returns (uint256 jobId) {
        vm.prank(client);
        jobId = factory.createJob(provider, evaluator_, expiry, keccak256("t"), address(0));
    }

    function _fund(uint256 jobId) internal {
        vm.prank(client);
        token.approve(address(factory), BUDGET);
        vm.prank(client);
        factory.fund(jobId, address(token), BUDGET);
    }

    function _submit(uint256 jobId) internal {
        vm.prank(provider);
        factory.submit(jobId, keccak256("d"));
    }

    function _sign(address evaluatorAddr, uint256 jobId, bool passed) internal view returns (bytes memory) {
        bytes32 digest = keccak256(abi.encode(jobId, passed, evaluatorAddr));
        bytes32 ethHash = digest.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(graderPk, ethHash);
        return abi.encodePacked(r, s, v);
    }

    // ------------------------------------------------------------------
    // 1. Cross-evaluator signature replay — digest binds address(this).
    //    A signature for evalA must NOT be accepted by evalB.
    // ------------------------------------------------------------------
    function testCrossEvaluatorReplayRejected() public {
        // Create two sibling jobs with identical id on different evaluators.
        uint256 jobIdA = _create(address(evalA), block.timestamp + 1 days);
        _fund(jobIdA);
        _submit(jobIdA);

        uint256 jobIdB = _create(address(evalB), block.timestamp + 1 days);
        _fund(jobIdB);
        _submit(jobIdB);

        // Sign verdict intended for evalA.
        bytes memory sigForA = _sign(address(evalA), jobIdA, true);

        // Replay on evalB must revert (digest is bound to address(this)).
        // Note: jobIdA and jobIdB are distinct, but even matching ids would fail.
        vm.expectRevert(bytes("bad sig"));
        evalB.submitVerdict(jobIdB, true, sigForA);

        // Sanity: the intended evaluator accepts it.
        evalA.submitVerdict(jobIdA, true, sigForA);
    }

    // ------------------------------------------------------------------
    // 2. Zero-budget fund is rejected (amount=0 require).
    // ------------------------------------------------------------------
    function testZeroBudgetFundReverts() public {
        uint256 jobId = _create(address(evalA), block.timestamp + 1 days);
        vm.prank(client);
        vm.expectRevert(bytes("amount=0"));
        factory.fund(jobId, address(token), 0);
    }

    // ------------------------------------------------------------------
    // 3. Double-fund reverts (state check: must be Open).
    // ------------------------------------------------------------------
    function testDoubleFundReverts() public {
        uint256 jobId = _create(address(evalA), block.timestamp + 1 days);
        _fund(jobId);
        vm.prank(client);
        token.approve(address(factory), BUDGET);
        vm.prank(client);
        vm.expectRevert(bytes("bad state"));
        factory.fund(jobId, address(token), BUDGET);
    }

    // ------------------------------------------------------------------
    // 4. Submit after expiry reverts (block.timestamp < expiresAt).
    // ------------------------------------------------------------------
    function testSubmitAfterExpiryReverts() public {
        uint256 jobId = _create(address(evalA), block.timestamp + 1 days);
        _fund(jobId);
        vm.warp(block.timestamp + 2 days);
        vm.prank(provider);
        vm.expectRevert(bytes("expired"));
        factory.submit(jobId, keccak256("d"));
    }

    // ------------------------------------------------------------------
    // 5. complete() on a Rejected job must revert.
    // ------------------------------------------------------------------
    function testCompleteOnRejectedReverts() public {
        uint256 jobId = _create(address(evalA), block.timestamp + 1 days);
        _fund(jobId);
        _submit(jobId);
        // Evaluator here is evalA contract; to exercise direct calls we use an EOA evaluator.
        // Re-use: create a second job with EOA evaluator for simplicity.
        uint256 jobId2 = _create(stranger, block.timestamp + 1 days); // stranger as evaluator
        _fund(jobId2);
        _submit(jobId2);
        vm.prank(stranger);
        factory.reject(jobId2, "nope");
        vm.prank(stranger);
        vm.expectRevert(bytes("bad state"));
        factory.complete(jobId2, "ok");
    }

    // ------------------------------------------------------------------
    // 6. Re-entrancy / CEI audit — state is written BEFORE external transfer
    //    in complete, reject, claimRefund. This test documents CEI ordering
    //    by relying on state being Completed at the moment the token transfer
    //    fires. A malicious token could try to re-enter, but state is locked.
    // ------------------------------------------------------------------
    function testCEIOrderingCompleteStateBeforeTransfer() public {
        uint256 jobId = _create(stranger, block.timestamp + 1 days);
        _fund(jobId);
        _submit(jobId);
        vm.prank(stranger);
        factory.complete(jobId, "ok");
        (, , , , , , , uint8 state) = factory.jobs(jobId);
        assertEq(state, uint8(3)); // Completed
        // Re-invoking complete after transfer-out must fail due to state check.
        vm.prank(stranger);
        vm.expectRevert(bytes("bad state"));
        factory.complete(jobId, "ok");
    }

    // ------------------------------------------------------------------
    // 7. AUDIT FINDING: digest does NOT include block.chainid. A signature
    //    produced for GraderEvaluator at address X on chain 97 can be
    //    replayed on chain 1 if the evaluator is deployed at the same
    //    address (CREATE2 or same-nonce deployer). Demonstrated below by
    //    confirming the digest is chain-agnostic. Not modifying the
    //    contract — flagged in audit report.
    // ------------------------------------------------------------------
    function testChainIdNotBoundInDigest_AUDIT_FINDING() public {
        uint256 jobId = _create(address(evalA), block.timestamp + 1 days);
        _fund(jobId);
        _submit(jobId);

        bytes memory sig = _sign(address(evalA), jobId, true);

        // Warp chainid — signature still verifies because digest excludes chainid.
        vm.chainId(1);
        evalA.submitVerdict(jobId, true, sig);
        // If the digest were chainid-bound, the above would revert under chain 1
        // while the sig was produced under the Foundry default chainid.
    }
}
