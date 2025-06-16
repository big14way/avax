// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { SyntheticProperty } from "../src/SyntheticProperty.sol";

/**
 * @title UpdateSyntheticMinimum
 * @notice Update the minimum position size in SyntheticProperty contract for easier testing
 */
contract UpdateSyntheticMinimum is Script {
    
    // Deployed contract addresses on Avalanche Fuji
    address payable constant SYNTHETIC_PROPERTY = payable(0x199516b47F1ce8C77617b58526ad701bF1f750FA);
    address constant PROPERTY_TOKEN = 0x789f82778A8d9eB6514a457112a563A89F79A2f1;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        SyntheticProperty syntheticProperty = SyntheticProperty(SYNTHETIC_PROPERTY);
        
        console.log("Updating SyntheticProperty minimum position size...");
        console.log("SyntheticProperty address:", address(syntheticProperty));
        console.log("PropertyToken address:", PROPERTY_TOKEN);
        
        // Update PropertyToken configuration with much lower minimum (0.005 ETH = 5e15)
        syntheticProperty.addSupportedProperty(
            PROPERTY_TOKEN,     // PropertyToken address
            5000,              // 50% liquidation threshold (200% collateral required)
            300,               // 3x maximum leverage (300 basis points)
            100,               // 1% minting fee (100 basis points)
            5000000000000000   // 0.005 minimum position size (5e15)
        );
        
        console.log("PropertyToken configuration updated!");
        console.log("New minimum position: 0.005 ETH");
        
        // Verify the new configuration
        (
            address verifyPropertyToken,
            bool verifyIsSupported,
            uint256 verifyLiquidationThreshold,
            uint256 verifyMaxLeverage,
            uint256 verifyMintingFee,
            uint256 verifyMinPosition
        ) = syntheticProperty.supportedProperties(PROPERTY_TOKEN);
        
        require(verifyIsSupported, "PropertyToken should still be supported");
        require(verifyMinPosition == 5000000000000000, "Min position should be 0.005 ETH");
        
        console.log("Verification successful! New minimum position: 0.005 ETH");
        
        vm.stopBroadcast();
    }
} 