// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Script.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {PropertyBridge} from "../src/PropertyBridge.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestBridge is Script {
    // Contract addresses
    address constant PROPERTY_TOKEN = 0x5A481F7dF0faA5c13Cae23a322544A0f873991F3;
    address payable constant PROPERTY_BRIDGE = payable(0x4b5d634b27CA72397fa8b9757332D2A5794632f5);
    
    // Test parameters
    uint64 constant ETHEREUM_SEPOLIA = 16015286601757825753;
    address constant TEST_RECIPIENT = 0x3C343AD077983371b29fee386bdBC8a92E934C51;
    uint256 constant TEST_AMOUNT = 100e18; // 100 tokens
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        PropertyToken propertyToken = PropertyToken(PROPERTY_TOKEN);
        PropertyBridge propertyBridge = PropertyBridge(PROPERTY_BRIDGE);
        
        console.log("=== TESTING BRIDGE FUNCTIONALITY ===");
        console.log("Bridge Address:", address(propertyBridge));
        console.log("Token Address:", address(propertyToken));
        console.log("Test User:", msg.sender);
        
        // Check balances
        uint256 userBalance = propertyToken.balanceOf(msg.sender);
        uint256 userAllowance = propertyToken.allowance(msg.sender, PROPERTY_BRIDGE);
        uint256 bridgeFee = propertyBridge.bridgeFee();
        
        console.log("\n=== CURRENT STATE ===");
        console.log("User Token Balance:", userBalance);
        console.log("Bridge Allowance:", userAllowance);
        console.log("Bridge Fee:", bridgeFee);
        console.log("User ETH Balance:", msg.sender.balance);
        
        // Check chain configuration
        bool isChainAllowed = propertyBridge.allowlistedDestinationChains(ETHEREUM_SEPOLIA);
        console.log("Ethereum Sepolia Allowed:", isChainAllowed);
        
        if (!isChainAllowed) {
            console.log("[ERROR] Destination chain not configured");
            vm.stopBroadcast();
            return;
        }
        
        if (userBalance < TEST_AMOUNT) {
            console.log("[ERROR] Insufficient token balance for test");
            console.log("Required:", TEST_AMOUNT);
            console.log("Available:", userBalance);
            vm.stopBroadcast();
            return;
        }
        
        if (userAllowance < TEST_AMOUNT) {
            console.log("[INFO] Setting approval for bridge...");
            propertyToken.approve(PROPERTY_BRIDGE, type(uint256).max);
            console.log("[SUCCESS] Approval set");
        }
        
        // Test bridge fee calculation
        console.log("\n=== TESTING BRIDGE ===");
        console.log("Attempting to bridge", TEST_AMOUNT, "tokens to Ethereum Sepolia");
        
        // Calculate total fee needed
        uint256 totalFeeNeeded = bridgeFee + 0.01 ether; // Bridge fee + extra for CCIP
        
        if (msg.sender.balance < totalFeeNeeded) {
            console.log("[ERROR] Insufficient ETH for fees");
            console.log("Required:", totalFeeNeeded);
            console.log("Available:", msg.sender.balance);
            vm.stopBroadcast();
            return;
        }
        
        try propertyBridge.bridgePropertyTokens{value: totalFeeNeeded}(
            ETHEREUM_SEPOLIA,
            TEST_RECIPIENT,
            PROPERTY_TOKEN,
            TEST_AMOUNT
        ) returns (bytes32 messageId) {
            console.log("[SUCCESS] Bridge transaction completed!");
            console.log("Message ID:", vm.toString(messageId));
            
            // Check balances after
            uint256 newBalance = propertyToken.balanceOf(msg.sender);
            console.log("New Token Balance:", newBalance);
            console.log("Tokens Bridged:", userBalance - newBalance);
            
        } catch Error(string memory reason) {
            console.log("[ERROR] Bridge failed with reason:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("[ERROR] Bridge failed with low-level error");
            console.logBytes(lowLevelData);
        }
        
        vm.stopBroadcast();
    }
} 