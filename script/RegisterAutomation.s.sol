// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "forge-std/Script.sol";
import {PropertyAutomation} from "../src/PropertyAutomation.sol";
import {PropertyToken} from "../src/PropertyToken.sol";

contract RegisterAutomation is Script {
    // Contract addresses - Updated with correct PropertyAutomation address
    address constant PROPERTY_AUTOMATION = 0x4f330C74c7bd84665722bA0664705e2f2E6080DC;
    address constant PROPERTY_TOKEN = 0x5A481F7dF0faA5c13Cae23a322544A0f873991F3;
    
    // Property addresses (from deployment)
    address constant PROPERTY_1 = 0x0000000000000000000000000000000000000001;
    address constant PROPERTY_2 = 0x0000000000000000000000000000000000000002;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        PropertyAutomation automation = PropertyAutomation(PROPERTY_AUTOMATION);
        
        console.log("=== REGISTERING PROPERTIES FOR AUTOMATION ===");
        
        // Register Property 1 for automation
        console.log("Registering Property 1 for automation...");
        try automation.registerPropertyForAutomation(
            PROPERTY_1,
            0, // Use default rent collection interval (30 days)
            0, // Use default valuation interval (90 days)  
            0  // Use default maintenance interval (180 days)
        ) {
            console.log("[SUCCESS] Property 1 registered successfully");
        } catch {
            console.log("[WARNING] Property 1 already registered or failed");
        }
        
        // Register Property 2 for automation
        console.log("Registering Property 2 for automation...");
        try automation.registerPropertyForAutomation(
            PROPERTY_2,
            0, // Use default intervals
            0,
            0
        ) {
            console.log("[SUCCESS] Property 2 registered successfully");
        } catch {
            console.log("[WARNING] Property 2 already registered or failed");
        }
        
        // Check registration status
        console.log("\n=== CHECKING REGISTRATION STATUS ===");
        bool property1Registered = automation.registeredProperties(PROPERTY_1);
        bool property2Registered = automation.registeredProperties(PROPERTY_2);
        
        console.log("Property 1 registered:", property1Registered);
        console.log("Property 2 registered:", property2Registered);
        
        // Get automation stats
        uint256 nextTaskId = automation.nextTaskId();
        uint256 totalActiveTasks = automation.totalActiveTasks();
        
        console.log("Next Task ID:", nextTaskId);
        console.log("Total Active Tasks:", totalActiveTasks);
        
        // Check property schedules
        if (property1Registered) {
            console.log("\n=== PROPERTY 1 SCHEDULE ===");
            (
                uint256 nextRentCollection,
                uint256 nextValuationUpdate,
                uint256 nextMaintenanceCheck,
                uint256 rentCollectionInterval,
                uint256 valuationInterval,
                uint256 maintenanceInterval
            ) = automation.propertySchedules(PROPERTY_1);
            
            console.log("Next Rent Collection:", nextRentCollection);
            console.log("Next Valuation Update:", nextValuationUpdate);
            console.log("Next Maintenance Check:", nextMaintenanceCheck);
            console.log("Rent Interval (days):", rentCollectionInterval / 86400);
            console.log("Valuation Interval (days):", valuationInterval / 86400);
            console.log("Maintenance Interval (days):", maintenanceInterval / 86400);
        }
        
        if (property2Registered) {
            console.log("\n=== PROPERTY 2 SCHEDULE ===");
            (
                uint256 nextRentCollection,
                uint256 nextValuationUpdate,
                uint256 nextMaintenanceCheck,
                uint256 rentCollectionInterval,
                uint256 valuationInterval,
                uint256 maintenanceInterval
            ) = automation.propertySchedules(PROPERTY_2);
            
            console.log("Next Rent Collection:", nextRentCollection);
            console.log("Next Valuation Update:", nextValuationUpdate);
            console.log("Next Maintenance Check:", nextMaintenanceCheck);
            console.log("Rent Interval (days):", rentCollectionInterval / 86400);
            console.log("Valuation Interval (days):", valuationInterval / 86400);
            console.log("Maintenance Interval (days):", maintenanceInterval / 86400);
        }
        
        // Check if upkeep is needed
        console.log("\n=== CHECKING UPKEEP STATUS ===");
        try automation.checkUpkeep("") returns (bool upkeepNeeded, bytes memory performData) {
            console.log("Upkeep Needed:", upkeepNeeded);
            console.log("Perform Data Length:", performData.length);
            
            if (upkeepNeeded) {
                console.log("[READY] Automation tasks are ready to be executed!");
                console.log("Your Chainlink Automation upkeep will trigger these tasks automatically.");
            } else {
                console.log("[WAITING] No automation tasks ready for execution yet.");
            }
        } catch {
            console.log("[ERROR] Failed to check upkeep status");
        }
        
        console.log("\n=== AUTOMATION SETUP COMPLETE ===");
        console.log("[ACTIVE] PropertyAutomation is now managing your properties!");
        console.log("[FUNDED] Your 10 LINK upkeep balance will fund the automation");
        console.log("[SCHEDULED] Tasks will execute automatically based on schedules");
        console.log("[MONITOR] Monitor at: https://automation.chain.link/fuji/");
        
        vm.stopBroadcast();
    }
} 