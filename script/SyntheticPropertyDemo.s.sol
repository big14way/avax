// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Script.sol";
import {SyntheticProperty} from "../src/SyntheticProperty.sol";
import {PropertyToken} from "../src/PropertyToken.sol";

contract SyntheticPropertyDemo is Script {
    // Contract addresses
    address payable constant SYNTHETIC_PROPERTY = payable(0xCAfF99170BEa7fDb5B8b4C30CCf966e9c08286D5);
    address constant PROPERTY_TOKEN = 0x5A481F7dF0faA5c13Cae23a322544A0f873991F3;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        SyntheticProperty syntheticProperty = SyntheticProperty(SYNTHETIC_PROPERTY);
        PropertyToken propertyToken = PropertyToken(PROPERTY_TOKEN);
        
        console.log("=== SYNTHETIC PROPERTY SYSTEM DEMO ===");
        console.log("SyntheticProperty Contract:", SYNTHETIC_PROPERTY);
        console.log("PropertyToken Contract:", PROPERTY_TOKEN);
        
        // Check current state
        console.log("\n=== CURRENT STATE ===");
        uint256 totalSupply = syntheticProperty.totalSupply();
        uint256 totalSyntheticValue = syntheticProperty.totalSyntheticValue();
        uint256 totalCollateralValue = syntheticProperty.totalCollateralValue();
        
        console.log("Total SynProp Supply:", totalSupply);
        console.log("Total Synthetic Value (USD):", totalSyntheticValue);
        console.log("Total Collateral Value:", totalCollateralValue);
        
        // Get user's balance
        address user = vm.addr(deployerPrivateKey);
        uint256 userSynBalance = syntheticProperty.balanceOf(user);
        uint256 userPropertyBalance = propertyToken.balanceOf(user);
        uint256 userPositionCount = syntheticProperty.userPositionCount(user);
        
        console.log("\n=== USER BALANCES ===");
        console.log("User Address:", user);
        console.log("SyntheticProperty Balance:", userSynBalance);
        console.log("PropertyToken Balance:", userPropertyBalance);
        console.log("User Position Count:", userPositionCount);
        console.log("User ETH Balance:", user.balance);
        
        // Check supported properties
        console.log("\n=== SUPPORTED PROPERTIES ===");
        uint256 totalSupportedProperties = syntheticProperty.totalSupportedProperties();
        console.log("Total Supported Properties:", totalSupportedProperties);
        
        // Check if PropertyToken is supported for synthetic trading
        console.log("\n=== SYNTHETIC POSITION DEMO ===");
        console.log("Synthetic positions enable LONG/SHORT exposure to property values");
        console.log("Users can leverage up to configured limits (e.g., 5x)");
        console.log("Positions are over-collateralized for safety");
        
        console.log("\n=== DEMO SCENARIO ===");
        uint256 syntheticAmount = 50 ether; // 50 SynProp tokens
        console.log("Example: Opening 50 SynProp token LONG position");
        console.log("This gives exposure to $50 USD worth of property appreciation");
        console.log("With 2x leverage, user needs ~$25 USD worth of ETH collateral");
        console.log("If property value increases 10%, position profits $5 USD");
        
        // Show the relationship between PropertyTokens and SyntheticProperty
        console.log("\n=== INTEGRATION WITH PROPERTY TOKENS ===");
        console.log("1. PropertyTokens (DREMS) = Direct property ownership");
        console.log("   - You own actual shares of physical properties");
        console.log("   - Receive rental income and property appreciation");
        console.log("   - Limited by actual property supply");
        console.log("");
        console.log("2. SyntheticProperty (SynProp) = Property exposure tokens");
        console.log("   - Track property values without direct ownership");
        console.log("   - Instant liquidity and 24/7 trading");
        console.log("   - Backed by over-collateralized ETH/AVAX");
        console.log("   - Unlimited mintable supply");
        
        console.log("\n=== USE CASES ===");
        console.log("[INSTITUTIONAL] Large funds can get property exposure without KYC");
        console.log("[RETAIL] Small investors can access property markets globally");
        console.log("[ARBITRAGE] Price differences between direct and synthetic tokens");
        console.log("[HEDGING] Property owners can hedge against market downturns");
        console.log("[LIQUIDITY] 24/7 trading vs traditional property transactions");
        
        console.log("\n=== CHAINLINK INTEGRATION ===");
        console.log("[PRICE FEEDS] Real-time ETH/USD for collateral valuation");
        console.log("[AUTOMATION] Automated rebalancing and liquidations");
        console.log("[FUNCTIONS] Off-chain property data for valuations");
        console.log("[CCIP] Cross-chain synthetic property trading");
        
        console.log("\n=== SYNTHETIC PROPERTY DEMO COMPLETE ===");
        console.log("SyntheticProperty enables global property investment without barriers!");
        
        vm.stopBroadcast();
    }
} 