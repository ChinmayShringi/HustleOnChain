// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {JobFactory} from "../src/JobFactory.sol";
import {GraderEvaluator} from "../src/GraderEvaluator.sol";
import {MockERC20} from "../test/helpers/MockERC20.sol";

contract DeployAll is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address graderSigner = vm.envAddress("GRADER_SIGNER_ADDRESS");
        address poster = vm.envOr("POSTER_ADDRESS", vm.addr(pk));
        address agent = vm.envOr("AGENT_ADDRESS", vm.addr(pk));

        vm.startBroadcast(pk);
        JobFactory factory = new JobFactory();
        GraderEvaluator evaluator = new GraderEvaluator(address(factory), graderSigner);
        MockERC20 usdt = new MockERC20("AgentWork Test USDT", "tUSDT");
        usdt.mint(poster, 1_000 ether);
        usdt.mint(agent, 1_000 ether);
        vm.stopBroadcast();

        console2.log("JobFactory:", address(factory));
        console2.log("GraderEvaluator:", address(evaluator));
        console2.log("tUSDT:", address(usdt));
        console2.log("Poster (funded 1000 tUSDT):", poster);
        console2.log("Agent (funded 1000 tUSDT):", agent);
    }
}
