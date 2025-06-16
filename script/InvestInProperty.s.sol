// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Script.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {PropertyBridge} from "../src/PropertyBridge.sol";

contract InvestInProperty is Script {
    // Your deployed contract addresses
    address constant PROPERTY_TOKEN = 0xA9F06A78635bBe19d8773D8CdF0F0507838A5A93;
    address constant PROPERTY_BRIDGE = 0xa2c0180508D3540e85d97ba7BE1BA61b6510aBc4;
    
    // Sample property addresses from your deployment
    address constant PROPERTY_1 = address(0x1); // Residential property
    address constant PROPERTY_2 = address(0x2); // Commercial property
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        PropertyToken propertyToken = PropertyToken(PROPERTY_TOKEN);
        
        console.log("=== INVESTING IN PROPERTY ===");
        console.log("Investor address:", msg.sender);
        console.log("ETH Balance:", msg.sender.balance);
        
        // Check if properties exist
        console.log("\n=== CHECKING PROPERTIES ===");
        try propertyToken.getProperty(PROPERTY_1) returns (PropertyToken.Property memory prop1) {
            console.log("Property 1 found:");
            console.log("- ID:", prop1.propertyId);
            console.log("- Address:", prop1.propertyAddress);
            console.log("- Value:", prop1.currentValue);
            console.log("- Total Tokens:", prop1.totalTokens);
            console.log("- Active:", prop1.isActive);
        } catch {
            console.log("Property 1 not found or error");
        }
        
        // Invest in Property 1
        console.log("\n=== INVESTING IN PROPERTY 1 ===");
        uint256 tokenAmount = 1000e18; // Invest for 1000 tokens
        uint256 requiredCollateral = propertyToken.getRequiredCollateral(
            propertyToken.getUsdValueOfPropertyTokens(PROPERTY_1, tokenAmount)
        );
        
        console.log("Token Amount:", tokenAmount);
        console.log("Required Collateral (ETH):", requiredCollateral);
        
        if (msg.sender.balance >= requiredCollateral) {
            console.log("Investing in property...");
            
            propertyToken.investInProperty{value: requiredCollateral}(PROPERTY_1, tokenAmount);
            
            console.log("[SUCCESS] Investment successful!");
            console.log("Your property token balance:", propertyToken.getUserPropertyBalance(msg.sender, PROPERTY_1));
            console.log("Your total DREMS balance:", propertyToken.balanceOf(msg.sender));
        } else {
            console.log("[ERROR] Insufficient ETH balance for collateral");
            console.log("Required:", requiredCollateral);
            console.log("Available:", msg.sender.balance);
        }
        
        vm.stopBroadcast();
        
        console.log("\n=== NEXT STEPS ===");
        console.log("1. You now own property tokens!");
        console.log("2. You can bridge these tokens using the PropertyBridge");
        console.log("3. Configure destination chains in the bridge");
        console.log("4. Transfer tokens cross-chain");
    }
} 