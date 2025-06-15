// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { PropertyToken } from "../src/PropertyToken.sol";
import { PropertyAutomation } from "../src/PropertyAutomation.sol";
import { PropertyBridge } from "../src/PropertyBridge.sol";
import { SyntheticProperty } from "../src/SyntheticProperty.sol";

/**
 * @title DeployDREMS
 * @notice Comprehensive deployment script for the DREMS platform
 * @dev Deploys PropertyToken, PropertyAutomation, and PropertyBridge with proper configuration
 * 
 * Usage:
 * forge script script/DeployDREMS.s.sol:DeployDREMS --rpc-url $RPC_URL --broadcast --verify
 */
contract DeployDREMS is Script {
    
    /*//////////////////////////////////////////////////////////////
                           NETWORK CONFIGURATIONS
    //////////////////////////////////////////////////////////////*/
    
    // Polygon Mumbai Testnet Configuration
    struct NetworkConfig {
        uint64 subId;
        address functionsRouter;
        bytes32 donId;
        address ethUsdFeed;
        address usdcUsdFeed;
        address redemptionCoin;
        uint64 secretVersion;
        uint8 secretSlot;
        address ccipRouter;
        uint64 chainSelector;
    }
    
    // Network configurations
    mapping(uint256 => NetworkConfig) public networkConfigs;
    
    /*//////////////////////////////////////////////////////////////
                              CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    // Chainlink Functions source code (base64 encoded for deployment)
    string constant PROPERTY_DATA_SOURCE = "Y29uc3QgcHJvcGVydHlJZCA9IGFyZ3NbMF07"; // Property data fetch source
    string constant RENT_COLLECTION_SOURCE = "Y29uc3QgcHJvcGVydHlJZCA9IGFyZ3NbMF07"; // Rent collection source
    
    /*//////////////////////////////////////////////////////////////
                           DEPLOYMENT STATE
    //////////////////////////////////////////////////////////////*/
    
    PropertyToken public propertyToken;
    PropertyAutomation public propertyAutomation;
    PropertyBridge public propertyBridge;
    SyntheticProperty public syntheticProperty;
    
    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    constructor() {
        // Initialize network configurations
        _initializeNetworkConfigs();
    }
    
    /*//////////////////////////////////////////////////////////////
                           MAIN DEPLOYMENT
    //////////////////////////////////////////////////////////////*/
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Get network configuration
        NetworkConfig memory config = getNetworkConfig();
        
        // Deploy contracts in correct order
        deployPropertyToken(config);
        deployPropertyAutomation();
        deployPropertyBridge(config);
        deploySyntheticProperty(config);
        
        // Configure contracts
        configureContracts(config);
        
        // Register sample properties (for demo purposes)
        registerSampleProperties();
        
        vm.stopBroadcast();
        
        // Log deployment information
        logDeploymentInfo();
    }
    
    /*//////////////////////////////////////////////////////////////
                         CONTRACT DEPLOYMENT
    //////////////////////////////////////////////////////////////*/
    
    function deployPropertyToken(NetworkConfig memory config) internal {
        console.log("Deploying PropertyToken...");
        
        propertyToken = new PropertyToken(
            config.subId,
            PROPERTY_DATA_SOURCE,
            RENT_COLLECTION_SOURCE,
            config.functionsRouter,
            config.donId,
            config.ethUsdFeed,
            config.usdcUsdFeed,
            config.redemptionCoin,
            config.secretVersion,
            config.secretSlot
        );
        
        console.log("PropertyToken deployed at:", address(propertyToken));
    }
    
    function deployPropertyAutomation() internal {
        console.log("Deploying PropertyAutomation...");
        
        propertyAutomation = new PropertyAutomation(address(propertyToken));
        
        console.log("PropertyAutomation deployed at:", address(propertyAutomation));
    }
    
    function deployPropertyBridge(NetworkConfig memory config) internal {
        console.log("Deploying PropertyBridge...");
        
        propertyBridge = new PropertyBridge(
            config.ccipRouter,
            address(propertyToken)
        );
        
        console.log("PropertyBridge deployed at:", address(propertyBridge));
    }
    
    function deploySyntheticProperty(NetworkConfig memory config) internal {
        console.log("Deploying SyntheticProperty...");
        
        syntheticProperty = new SyntheticProperty(
            config.ethUsdFeed,
            address(propertyToken),
            "Synthetic DREMS Property",
            "sDREMS"
        );
        
        console.log("SyntheticProperty deployed at:", address(syntheticProperty));
    }
    
    /*//////////////////////////////////////////////////////////////
                        CONTRACT CONFIGURATION
    //////////////////////////////////////////////////////////////*/
    
    function configureContracts(NetworkConfig memory /* config */) internal {
        console.log("Configuring contracts...");
        
        // Configure cross-chain settings for PropertyBridge
        if (block.chainid == 80001) { // Mumbai
            // Configure Sepolia as destination
            propertyBridge.configureChain(
                16015286601757825753, // Sepolia chain selector
                address(0), // PropertyBridge address on Sepolia (to be updated)
                address(0), // PropertyToken address on Sepolia (to be updated)
                200000 // Gas limit
            );
        } else if (block.chainid == 43113) { // Avalanche Fuji
            // Configure Sepolia as destination for cross-chain
            propertyBridge.configureChain(
                16015286601757825753, // Sepolia chain selector
                address(0), // PropertyBridge address on Sepolia (to be updated)
                address(0), // PropertyToken address on Sepolia (to be updated)
                200000 // Gas limit
            );
        }
        
        // Configure SyntheticProperty with supported properties
        // Add PropertyToken as a supported property for synthetic trading
        syntheticProperty.addSupportedProperty(
            address(propertyToken),
            5000, // 50% liquidation threshold (200% collateral required)
            300,  // 3x maximum leverage
            100,  // 1% minting fee
            100e18 // $100 minimum position
        );
        
        console.log("Contracts configured successfully");
    }
    
    /*//////////////////////////////////////////////////////////////
                        SAMPLE DATA SETUP
    //////////////////////////////////////////////////////////////*/
    
    function registerSampleProperties() internal {
        console.log("Registering sample properties...");
        
        // Register a sample residential property
        propertyToken.registerProperty(
            address(0x1), // Property contract address (mock)
            "MLS123456", // Property ID
            "123 Main St, San Francisco, CA 94102", // Physical address
            PropertyToken.PropertyType.RESIDENTIAL_SINGLE_FAMILY, // Property type
            1000000e18, // Initial value: $1,000,000
            1000000e18, // Total tokens: 1,000,000 (1 token = $1)
            800, // Expected yield: 8% (800 basis points)
            8000e18, // Monthly rent: $8,000
            msg.sender // Property manager
        );
        
        // Register automation for the property
        propertyAutomation.registerPropertyForAutomation(
            address(0x1), // Property address
            0, // Default rent collection interval (30 days)
            0, // Default valuation interval (90 days)
            0  // Default maintenance interval (180 days)
        );
        
        // Register a sample commercial property
        propertyToken.registerProperty(
            address(0x2), // Property contract address (mock)
            "COM789012", // Property ID
            "456 Business Ave, New York, NY 10001", // Physical address
            PropertyToken.PropertyType.COMMERCIAL_OFFICE, // Property type
            5000000e18, // Initial value: $5,000,000
            5000000e18, // Total tokens: 5,000,000
            600, // Expected yield: 6% (600 basis points)
            25000e18, // Monthly rent: $25,000
            msg.sender // Property manager
        );
        
        // Register automation for the commercial property
        propertyAutomation.registerPropertyForAutomation(
            address(0x2), // Property address
            0, // Default intervals
            0,
            0
        );
        
        console.log("Sample properties registered successfully");
    }
    
    /*//////////////////////////////////////////////////////////////
                          HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    function getNetworkConfig() internal view returns (NetworkConfig memory) {
        uint256 chainId = block.chainid;
        
        if (networkConfigs[chainId].functionsRouter != address(0)) {
            return networkConfigs[chainId];
        }
        
        // Default to Mumbai testnet if not configured
        return networkConfigs[80001];
    }
    
    function _initializeNetworkConfigs() internal {
        // Polygon Mumbai Testnet
        networkConfigs[80001] = NetworkConfig({
            subId: 1, // Replace with your actual subscription ID
            functionsRouter: 0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C,
            donId: 0x66756e2d706f6c79676f6e2d6d756d6261692d31000000000000000000000000,
            ethUsdFeed: 0x0715A7794a1dc8e42615F059dD6e406A6594651A,
            usdcUsdFeed: 0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0,
            redemptionCoin: 0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889, // WMATIC on Mumbai
            secretVersion: 1,
            secretSlot: 0,
            ccipRouter: 0x1035CabC275068e0F4b745A29CEDf38E13aF41b1,
            chainSelector: 12532609583862916517
        });
        
        // Ethereum Sepolia Testnet
        networkConfigs[11155111] = NetworkConfig({
            subId: 1, // Replace with your actual subscription ID
            functionsRouter: 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0,
            donId: 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000,
            ethUsdFeed: 0x694AA1769357215DE4FAC081bf1f309aDC325306,
            usdcUsdFeed: 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E,
            redemptionCoin: 0x779877A7B0D9E8603169DdbD7836e478b4624789, // LINK on Sepolia
            secretVersion: 1,
            secretSlot: 0,
            ccipRouter: 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59,
            chainSelector: 16015286601757825753
        });
        
        // Arbitrum Sepolia
        networkConfigs[421614] = NetworkConfig({
            subId: 1, // Replace with your actual subscription ID
            functionsRouter: 0x234a5fb5Bd614a7AA2FfAB244D603abFA0Ac5C5C,
            donId: 0x66756e2d617262697472756d2d7365706f6c69612d3100000000000000000000,
            ethUsdFeed: 0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165,
            usdcUsdFeed: 0x0153002d20B96532C639313c2d54c3dA09109309,
            redemptionCoin: 0xb1D4538B4571d411F07960EF2838Ce337FE1E80E, // LINK on Arbitrum Sepolia
            secretVersion: 1,
            secretSlot: 0,
            ccipRouter: 0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165,
            chainSelector: 3478487238524512106
        });

        // Avalanche Fuji Testnet
        networkConfigs[43113] = NetworkConfig({
            subId: 1, // Replace with your actual subscription ID
            functionsRouter: 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0, // Functions Router on Fuji
            donId: 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000, // fun-avalanche-fuji-1
            ethUsdFeed: 0x86d67c3D38D2bCeE722E601025C25a575021c6EA, // ETH/USD on Fuji
            usdcUsdFeed: 0x86d67c3D38D2bCeE722E601025C25a575021c6EA, // Using ETH/USD as substitute for USDC/USD
            redemptionCoin: 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846, // LINK on Fuji
            secretVersion: 1,
            secretSlot: 0,
            ccipRouter: 0xF694E193200268f9a4868e4Aa017A0118C9a8177, // CCIP Router on Fuji
            chainSelector: 14767482510784806043 // Avalanche Fuji chain selector
        });
    }
    
    /*//////////////////////////////////////////////////////////////
                           LOGGING FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    function logDeploymentInfo() internal view {
        console.log("DREMS PLATFORM DEPLOYMENT COMPLETE!");
        console.log("===============================================");
        console.log("PropertyToken:     ", address(propertyToken));
        console.log("PropertyAutomation:", address(propertyAutomation));
        console.log("PropertyBridge:    ", address(propertyBridge));
        console.log("SyntheticProperty: ", address(syntheticProperty));
        console.log("===============================================");
        console.log("Chain ID:          ", block.chainid);
        console.log("Deployer:          ", msg.sender);
        console.log("Block Number:      ", block.number);
        console.log("===============================================");
        
        console.log("NEXT STEPS:");
        console.log("1. Upload secrets to Chainlink Functions");
        console.log("2. Fund the contracts with LINK tokens");
        console.log("3. Configure automation upkeep");
        console.log("4. Test property registration and investment");
        console.log("5. Set up cross-chain configurations");
        
        console.log("DEMO READY!");
        console.log("Your DREMS platform is ready for demonstration!");
    }
    
    /*//////////////////////////////////////////////////////////////
                         VERIFICATION HELPERS
    //////////////////////////////////////////////////////////////*/
    
    function verifyDeployment() external view returns (bool) {
        return address(propertyToken) != address(0) && 
               address(propertyAutomation) != address(0) && 
               address(propertyBridge) != address(0) &&
               address(syntheticProperty) != address(0);
    }
    
    function getDeployedAddresses() external view returns (address, address, address, address) {
        return (address(propertyToken), address(propertyAutomation), address(propertyBridge), address(syntheticProperty));
    }
} 