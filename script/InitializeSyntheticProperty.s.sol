// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { SyntheticProperty } from "../src/SyntheticProperty.sol";

/**
 * @title InitializeSyntheticProperty
 * @notice Initialize the SyntheticProperty contract with supported properties
 * @dev Run this script to add PropertyToken as a supported property for synthetic trading
 */
contract InitializeSyntheticProperty is Script {
    
    // Deployed contract addresses on Avalanche Fuji
    address payable constant SYNTHETIC_PROPERTY = payable(0x199516b47F1ce8C77617b58526ad701bF1f750FA);
    address constant PROPERTY_TOKEN = 0x789f82778A8d9eB6514a457112a563A89F79A2f1;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        SyntheticProperty syntheticProperty = SyntheticProperty(SYNTHETIC_PROPERTY);
        
        console.log("Initializing SyntheticProperty contract...");
        console.log("SyntheticProperty address:", address(syntheticProperty));
        console.log("PropertyToken address:", PROPERTY_TOKEN);
        
        // Check if PropertyToken is already supported
        try syntheticProperty.supportedProperties(PROPERTY_TOKEN) returns (
            address propertyToken,
            bool isSupported,
            uint256 liquidationThreshold,
            uint256 maxLeverage,
            uint256 mintingFee,
            uint256 minPosition
        ) {
            if (isSupported) {
                console.log("PropertyToken is already supported!");
                console.log("Liquidation Threshold:", liquidationThreshold);
                console.log("Max Leverage:", maxLeverage);
                console.log("Minting Fee:", mintingFee);
                console.log("Min Position:", minPosition);
                vm.stopBroadcast();
                return;
            }
        } catch {
            console.log("PropertyToken not yet supported, adding...");
        }
        
        // Add PropertyToken as supported property
        syntheticProperty.addSupportedProperty(
            PROPERTY_TOKEN,     // PropertyToken address
            5000,              // 50% liquidation threshold (200% collateral required)
            300,               // 3x maximum leverage (300 basis points)
            100,               // 1% minting fee (100 basis points)
            100e18             // $100 minimum position size
        );
        
        console.log("PropertyToken added as supported property!");
        console.log("Configuration:");
        console.log("- Liquidation Threshold: 50% (200% collateral required)");
        console.log("- Maximum Leverage: 3x");
        console.log("- Minting Fee: 1%");
        console.log("- Minimum Position: $100");
        
        // Verify the configuration
        (
            address verifyPropertyToken,
            bool verifyIsSupported,
            uint256 verifyLiquidationThreshold,
            uint256 verifyMaxLeverage,
            uint256 verifyMintingFee,
            uint256 verifyMinPosition
        ) = syntheticProperty.supportedProperties(PROPERTY_TOKEN);
        
        require(verifyIsSupported, "Failed to add PropertyToken as supported property");
        require(verifyPropertyToken == PROPERTY_TOKEN, "Property token address mismatch");
        require(verifyLiquidationThreshold == 5000, "Liquidation threshold mismatch");
        require(verifyMaxLeverage == 300, "Max leverage mismatch");
        require(verifyMintingFee == 100, "Minting fee mismatch");
        require(verifyMinPosition == 100e18, "Min position mismatch");
        
        console.log("Verification successful! SyntheticProperty is ready for trading.");
        
        vm.stopBroadcast();
    }
} 