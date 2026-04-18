// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {JobFactory} from "../src/JobFactory.sol";
import {GraderEvaluator} from "../src/GraderEvaluator.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address graderSigner = vm.envAddress("GRADER_SIGNER_ADDRESS");
        vm.startBroadcast(pk);
        JobFactory factory = new JobFactory();
        GraderEvaluator evaluator = new GraderEvaluator(address(factory), graderSigner);
        vm.stopBroadcast();
        console2.log("JobFactory:", address(factory));
        console2.log("GraderEvaluator:", address(evaluator));
    }
}
