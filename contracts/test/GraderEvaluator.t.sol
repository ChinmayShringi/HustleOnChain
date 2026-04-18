// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {JobFactory} from "../src/JobFactory.sol";
import {GraderEvaluator} from "../src/GraderEvaluator.sol";
import {MockERC20} from "./helpers/MockERC20.sol";

contract GraderEvaluatorTest is Test {
    using MessageHashUtils for bytes32;

    JobFactory factory;
    GraderEvaluator evaluator;
    MockERC20 token;

    uint256 graderPk = 0xA11CE;
    uint256 badPk = 0xBADBAD;
    address grader;
    address client = address(0xC1);
    address provider = address(0xB0B);

    uint256 constant BUDGET = 500 ether;

    function setUp() public {
        grader = vm.addr(graderPk);
        factory = new JobFactory();
        evaluator = new GraderEvaluator(address(factory), grader);
        token = new MockERC20("Mock", "MCK");
        token.mint(client, 10_000 ether);
    }

    function _createFundSubmit() internal returns (uint256 jobId) {
        vm.prank(client);
        jobId = factory.createJob(provider, address(evaluator), block.timestamp + 1 days, keccak256("t"), address(0));
        vm.prank(client);
        token.approve(address(factory), BUDGET);
        vm.prank(client);
        factory.fund(jobId, address(token), BUDGET);
        vm.prank(provider);
        factory.submit(jobId, keccak256("d"));
    }

    function _sign(uint256 pk, uint256 jobId, bool passed) internal view returns (bytes memory) {
        bytes32 digest = keccak256(abi.encode(jobId, passed, address(evaluator)));
        bytes32 ethHash = digest.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, ethHash);
        return abi.encodePacked(r, s, v);
    }

    function testSubmitVerdictPass() public {
        uint256 jobId = _createFundSubmit();
        bytes memory sig = _sign(graderPk, jobId, true);
        uint256 pre = token.balanceOf(provider);
        evaluator.submitVerdict(jobId, true, sig);
        assertEq(token.balanceOf(provider), pre + BUDGET);
    }

    function testSubmitVerdictFail() public {
        uint256 jobId = _createFundSubmit();
        bytes memory sig = _sign(graderPk, jobId, false);
        uint256 pre = token.balanceOf(client);
        evaluator.submitVerdict(jobId, false, sig);
        assertEq(token.balanceOf(client), pre + BUDGET);
    }

    function testBadSignatureReverts() public {
        uint256 jobId = _createFundSubmit();
        bytes memory sig = _sign(badPk, jobId, true);
        vm.expectRevert(bytes("bad sig"));
        evaluator.submitVerdict(jobId, true, sig);
    }

    function testReplayReverts() public {
        uint256 jobId = _createFundSubmit();
        bytes memory sig = _sign(graderPk, jobId, true);
        evaluator.submitVerdict(jobId, true, sig);
        vm.expectRevert(bytes("replay"));
        evaluator.submitVerdict(jobId, true, sig);
    }
}
