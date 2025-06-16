// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Script.sol";
import {PropertyToken} from "../src/PropertyToken.sol";

contract MintTestTokens is Script {
    // New contract addresses
    address constant PROPERTY_TOKEN = 0x5A481F7dF0faA5c13Cae23a322544A0f873991F3;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        PropertyToken propertyToken = PropertyToken(PROPERTY_TOKEN);
        
        console.log("=== MINTING TEST TOKENS ===");
        console.log("PropertyToken Address:", address(propertyToken));
        console.log("Your Address:", msg.sender);
        
        // Try investing in property 1 to get DREMS tokens
        console.log("[INFO] Attempting to invest in properties to get DREMS tokens...");
        
        // Try investing in property 1
        try propertyToken.investInProperty{value: 0.1 ether}(
            address(0x1), // Property 1
            1000e18       // $1000 investment
        ) {
            console.log("[SUCCESS] Invested $1000 in property 1");
        } catch {
            console.log("[ERROR] Large investment failed, trying smaller amount...");
            
            // Try smaller investment
            try propertyToken.investInProperty{value: 0.01 ether}(
                address(0x1), // Property 1
                100e18        // $100 investment
            ) {
                console.log("[SUCCESS] Invested $100 in property 1");
            } catch {
                console.log("[ERROR] All investment attempts failed");
                console.log("[INFO] You may need to use the frontend to invest");
            }
        }
        
        // Check final balance
        uint256 finalBalance = propertyToken.balanceOf(msg.sender);
        console.log("Final DREMS Balance:", finalBalance);
        
        if (finalBalance > 0) {
            console.log("\n=== SUCCESS! ===");
            console.log("You now have DREMS tokens to test bridging");
            console.log("Refresh your frontend and try the bridge");
        } else {
            console.log("\n=== MANUAL STEPS NEEDED ===");
            console.log("1. Use the frontend to invest in properties");
            console.log("2. Make sure you have enough AVAX for collateral");
            console.log("3. Try investing at least $10 minimum");
        }
        
        vm.stopBroadcast();
    }
} 