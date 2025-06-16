// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Script.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {PropertyBridge} from "../src/PropertyBridge.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ConfigureBridge is Script {
    // Your deployed contract addresses
    address constant PROPERTY_TOKEN = 0xA9F06A78635bBe19d8773D8CdF0F0507838A5A93;
    address payable constant PROPERTY_BRIDGE = payable(0xa2c0180508D3540e85d97ba7BE1BA61b6510aBc4);
    
    // CCIP Chain Selectors
    uint64 constant ETHEREUM_SEPOLIA = 16015286601757825753;
    uint64 constant ARBITRUM_SEPOLIA = 3478487238524512106;
    uint64 constant OPTIMISM_SEPOLIA = 5224473277236331295;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        PropertyToken propertyToken = PropertyToken(PROPERTY_TOKEN);
        PropertyBridge propertyBridge = PropertyBridge(PROPERTY_BRIDGE);
        
        console.log("=== CONFIGURING PROPERTY BRIDGE ===");
        console.log("Bridge Address:", address(propertyBridge));
        console.log("Your Address:", msg.sender);
        
        // Check your property token balance
        uint256 tokenBalance = propertyToken.balanceOf(msg.sender);
        console.log("Your DREMS Token Balance:", tokenBalance);
        
        if (tokenBalance == 0) {
            console.log("[ERROR] You have no property tokens to bridge!");
            console.log("Please run InvestInProperty.s.sol first");
            vm.stopBroadcast();
            return;
        }
        
        // Configure destination chains
        console.log("\n=== CONFIGURING DESTINATION CHAINS ===");
        
        // Configure Ethereum Sepolia
        console.log("Configuring Ethereum Sepolia...");
        propertyBridge.configureChain(
            ETHEREUM_SEPOLIA,
            address(propertyBridge), // Same bridge address (for demo)
            PROPERTY_TOKEN,          // Same token address (for demo)
            500000                   // Gas limit
        );
        
        // Configure Arbitrum Sepolia
        console.log("Configuring Arbitrum Sepolia...");
        propertyBridge.configureChain(
            ARBITRUM_SEPOLIA,
            address(propertyBridge), // Same bridge address (for demo)
            PROPERTY_TOKEN,          // Same token address (for demo)
            500000                   // Gas limit
        );
        
        console.log("[SUCCESS] Bridge configured for cross-chain transfers!");
        
        // Prepare for bridging
        console.log("\n=== PREPARING FOR BRIDGE TRANSFER ===");
        uint256 bridgeAmount = 100e18; // Bridge 100 tokens
        
        if (tokenBalance >= bridgeAmount) {
            // Approve bridge to spend tokens
            console.log("Approving bridge to spend tokens...");
            propertyToken.approve(PROPERTY_BRIDGE, bridgeAmount);
            
            console.log("[SUCCESS] Bridge approved to spend", bridgeAmount, "tokens");
            console.log("\n=== READY TO BRIDGE ===");
            console.log("You can now bridge", bridgeAmount, "property tokens to:");
            console.log("- Ethereum Sepolia (Chain ID: 16015286601757825753)");
            console.log("- Arbitrum Sepolia (Chain ID: 3478487238524512106)");
            console.log("\nExample bridge call:");
            console.log("propertyBridge.bridgePropertyTokens(");
            console.log("  16015286601757825753,  // destinationChainSelector");
            console.log("  YOUR_ADDRESS,          // receiver");
            console.log("  PROPERTY_TOKEN,        // propertyToken");
            console.log("  100000000000000000000  // amount (100 tokens)");
            console.log(");");
        } else {
            console.log("[ERROR] Insufficient tokens for bridging");
            console.log("Required:", bridgeAmount);
            console.log("Available:", tokenBalance);
        }
        
        vm.stopBroadcast();
    }
} 