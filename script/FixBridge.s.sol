// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Script.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {PropertyBridge} from "../src/PropertyBridge.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FixBridge is Script {
    // Updated contract addresses from latest deployment
    address constant PROPERTY_TOKEN = 0x5A481F7dF0faA5c13Cae23a322544A0f873991F3;
    address payable constant PROPERTY_BRIDGE = payable(0x4b5d634b27CA72397fa8b9757332D2A5794632f5);
    
    // CCIP Chain Selectors
    uint64 constant ETHEREUM_SEPOLIA = 16015286601757825753;
    uint64 constant ARBITRUM_SEPOLIA = 3478487238524512106;
    uint64 constant OPTIMISM_SEPOLIA = 5224473277236331295;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        PropertyToken propertyToken = PropertyToken(PROPERTY_TOKEN);
        PropertyBridge propertyBridge = PropertyBridge(PROPERTY_BRIDGE);
        
        console.log("=== FIXING NEW PROPERTY BRIDGE ===");
        console.log("Bridge Address:", address(propertyBridge));
        console.log("Token Address:", address(propertyToken));
        console.log("Your Address:", msg.sender);
        
        // Check your property token balance
        uint256 tokenBalance = propertyToken.balanceOf(msg.sender);
        console.log("Your DREMS Token Balance:", tokenBalance);
        
        // Configure destination chains
        console.log("\n=== CONFIGURING DESTINATION CHAINS ===");
        
        try propertyBridge.configureChain(
            ETHEREUM_SEPOLIA,
            address(propertyBridge), // Bridge address on destination (for demo)
            PROPERTY_TOKEN,          // Token address on destination (for demo) 
            500000                   // Gas limit
        ) {
            console.log("[SUCCESS] Configured Ethereum Sepolia");
        } catch {
            console.log("[INFO] Ethereum Sepolia already configured or access denied");
        }
        
        try propertyBridge.configureChain(
            ARBITRUM_SEPOLIA,
            address(propertyBridge),
            PROPERTY_TOKEN,
            500000
        ) {
            console.log("[SUCCESS] Configured Arbitrum Sepolia");
        } catch {
            console.log("[INFO] Arbitrum Sepolia already configured or access denied");
        }
        
        try propertyBridge.configureChain(
            OPTIMISM_SEPOLIA,
            address(propertyBridge),
            PROPERTY_TOKEN,
            500000
        ) {
            console.log("[SUCCESS] Configured Optimism Sepolia");
        } catch {
            console.log("[INFO] Optimism Sepolia already configured or access denied");
        }
        
        // Check if chains are allowed
        console.log("\n=== CHECKING CHAIN CONFIGURATIONS ===");
        bool ethSepoliaAllowed = propertyBridge.allowlistedDestinationChains(ETHEREUM_SEPOLIA);
        bool arbSepoliaAllowed = propertyBridge.allowlistedDestinationChains(ARBITRUM_SEPOLIA);
        bool opSepoliaAllowed = propertyBridge.allowlistedDestinationChains(OPTIMISM_SEPOLIA);
        
        console.log("Ethereum Sepolia allowed:", ethSepoliaAllowed);
        console.log("Arbitrum Sepolia allowed:", arbSepoliaAllowed);
        console.log("Optimism Sepolia allowed:", opSepoliaAllowed);
        
        // Approve bridge to spend your tokens
        console.log("\n=== SETTING APPROVALS ===");
        uint256 maxApproval = type(uint256).max; // Infinite approval for demo
        
        // Check current allowance
        uint256 currentAllowance = propertyToken.allowance(msg.sender, PROPERTY_BRIDGE);
        console.log("Current Bridge Allowance:", currentAllowance);
        
        if (currentAllowance < tokenBalance) {
            console.log("Setting infinite approval for bridge...");
            propertyToken.approve(PROPERTY_BRIDGE, maxApproval);
            console.log("[SUCCESS] Bridge approved to spend tokens");
        } else {
            console.log("[INFO] Bridge already has sufficient allowance");
        }
        
        // Test basic bridge setup
        console.log("\n=== BRIDGE READINESS CHECK ===");
        console.log("Token Balance:", tokenBalance);
        console.log("Bridge Fee:", propertyBridge.bridgeFee());
        console.log("Bridge Contract Balance:", address(propertyBridge).balance);
        
        // Show supported destinations
        console.log("\n=== SUPPORTED DESTINATIONS ===");
        if (ethSepoliaAllowed) {
            console.log("[OK] Ethereum Sepolia (16015286601757825753)");
        } else {
            console.log("[NO] Ethereum Sepolia (16015286601757825753)");
        }
        if (arbSepoliaAllowed) {
            console.log("[OK] Arbitrum Sepolia (3478487238524512106)");
        } else {
            console.log("[NO] Arbitrum Sepolia (3478487238524512106)");
        }
        if (opSepoliaAllowed) {
            console.log("[OK] Optimism Sepolia (5224473277236331295)");
        } else {
            console.log("[NO] Optimism Sepolia (5224473277236331295)");
        }
        
        console.log("\n=== RECOMMENDED NEXT STEPS ===");
        console.log("1. Refresh your frontend");
        console.log("2. Try bridging 100 DREMS tokens");
        console.log("3. Make sure you have AVAX for gas fees");
        console.log("4. Check console for any remaining errors");
        
        vm.stopBroadcast();
    }
} 