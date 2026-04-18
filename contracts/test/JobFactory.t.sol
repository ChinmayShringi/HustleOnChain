// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {JobFactory} from "../src/JobFactory.sol";
import {MockERC20} from "./helpers/MockERC20.sol";

contract JobFactoryTest is Test {
    JobFactory factory;
    MockERC20 token;

    address client = address(0xC1);
    address provider = address(0xB0B);
    address evaluator = address(0xE7A);
    address stranger = address(0xBAD);

    uint256 constant BUDGET = 1_000 ether;

    function setUp() public {
        factory = new JobFactory();
        token = new MockERC20("Mock", "MCK");
        token.mint(client, 10_000 ether);
    }

    function _createAndFund() internal returns (uint256 jobId) {
        vm.prank(client);
        jobId = factory.createJob(provider, evaluator, block.timestamp + 1 days, keccak256("task"), address(0));
        vm.prank(client);
        token.approve(address(factory), BUDGET);
        vm.prank(client);
        factory.fund(jobId, address(token), BUDGET);
    }

    function testHappyPass() public {
        uint256 jobId = _createAndFund();
        vm.prank(provider);
        factory.submit(jobId, keccak256("deliverable"));
        uint256 pre = token.balanceOf(provider);
        vm.prank(evaluator);
        factory.complete(jobId, "ok");
        assertEq(token.balanceOf(provider), pre + BUDGET);
        (, , , , , , , uint8 state) = factory.jobs(jobId);
        assertEq(state, uint8(3));
    }

    function testHappyFail() public {
        uint256 jobId = _createAndFund();
        vm.prank(provider);
        factory.submit(jobId, keccak256("deliverable"));
        uint256 pre = token.balanceOf(client);
        vm.prank(evaluator);
        factory.reject(jobId, "nope");
        assertEq(token.balanceOf(client), pre + BUDGET);
        (, , , , , , , uint8 state) = factory.jobs(jobId);
        assertEq(state, uint8(4));
    }

    function testExpiryRefund() public {
        uint256 jobId = _createAndFund();
        uint256 pre = token.balanceOf(client);
        vm.warp(block.timestamp + 2 days);
        vm.prank(client);
        factory.claimRefund(jobId);
        assertEq(token.balanceOf(client), pre + BUDGET);
        (, , , , , , , uint8 state) = factory.jobs(jobId);
        assertEq(state, uint8(5));
    }

    function testNonProviderSubmitReverts() public {
        uint256 jobId = _createAndFund();
        vm.prank(stranger);
        vm.expectRevert(bytes("not provider"));
        factory.submit(jobId, keccak256("d"));
    }

    function testNonEvaluatorCompleteReverts() public {
        uint256 jobId = _createAndFund();
        vm.prank(provider);
        factory.submit(jobId, keccak256("d"));
        vm.prank(stranger);
        vm.expectRevert(bytes("not evaluator"));
        factory.complete(jobId, "ok");
    }

    function testClaimRefundBeforeExpiryReverts() public {
        uint256 jobId = _createAndFund();
        vm.prank(client);
        vm.expectRevert(bytes("not expired"));
        factory.claimRefund(jobId);
    }
}
