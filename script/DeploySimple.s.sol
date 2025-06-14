// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {sTSLA} from "../src/sTSLA.sol";

contract DeploySimple is Script {
    function run() external {
        // Using placeholder addresses that have proper checksums for testing
        address tslaUsdFeed = 0x1111111111111111111111111111111111111111; // Placeholder
        address ethUsdFeed = 0x2222222222222222222222222222222222222222; // Placeholder
        
        vm.startBroadcast();
        
        // Deploy sTSLA with proper constructor parameters
        sTSLA stsla = new sTSLA(tslaUsdFeed, ethUsdFeed);
        
        console.log("sTSLA deployed at:", address(stsla));
        console.log("TSLA Price Feed (placeholder):", tslaUsdFeed);
        console.log("ETH/USD Price Feed (placeholder):", ethUsdFeed);
        
        vm.stopBroadcast();
    }
} 