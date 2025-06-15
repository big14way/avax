// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { Test, console } from "forge-std/Test.sol";
import { PropertyToken } from "../../src/PropertyToken.sol";
import { SyntheticProperty } from "../../src/SyntheticProperty.sol";
import { PropertyAutomation } from "../../src/PropertyAutomation.sol";
import { PropertyBridge } from "../../src/PropertyBridge.sol";
import { MockV3Aggregator } from "../../src/test/mocks/MockV3Aggregator.sol";

contract DREMSTest is Test {
    PropertyToken public propertyToken;
    SyntheticProperty public syntheticProperty;
    PropertyAutomation public propertyAutomation;
    PropertyBridge public propertyBridge;
    MockV3Aggregator public ethUsdFeed;
    MockV3Aggregator public usdcUsdFeed;

    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public propertyManager = makeAddr("propertyManager");

    // Mock addresses for testing
    address public constant FUNCTIONS_ROUTER = address(0x123);
    address public constant CCIP_ROUTER = address(0x456);
    address public constant REDEMPTION_COIN = address(0x789);

    // Test constants
    uint64 public constant SUB_ID = 1;
    uint256 public constant INITIAL_ETH_PRICE = 2000e8; // $2000
    uint256 public constant INITIAL_USDC_PRICE = 1e8; // $1
    bytes32 public constant DON_ID = bytes32("test-don");

    function setUp() public {
        vm.startPrank(owner);

        // Deploy mock price feeds
        ethUsdFeed = new MockV3Aggregator(8, int256(INITIAL_ETH_PRICE));
        usdcUsdFeed = new MockV3Aggregator(8, int256(INITIAL_USDC_PRICE));

        // Deploy PropertyToken
        propertyToken = new PropertyToken(
            SUB_ID,
            "property-data-source",
            "rent-collection-source",
            FUNCTIONS_ROUTER,
            DON_ID,
            address(ethUsdFeed),
            address(usdcUsdFeed),
            REDEMPTION_COIN,
            1, // secretVersion
            0  // secretSlot
        );

        // Deploy PropertyAutomation
        propertyAutomation = new PropertyAutomation(address(propertyToken));

        // Deploy PropertyBridge
        propertyBridge = new PropertyBridge(CCIP_ROUTER, address(propertyToken));

        // Deploy SyntheticProperty
        syntheticProperty = new SyntheticProperty(
            address(ethUsdFeed),
            address(propertyToken),
            "Synthetic DREMS Property",
            "sDREMS"
        );

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        PROPERTY TOKEN TESTS
    //////////////////////////////////////////////////////////////*/

    function testPropertyTokenDeployment() public {
        assertTrue(address(propertyToken) != address(0));
        assertEq(propertyToken.name(), "DREMS Property Token");
        assertEq(propertyToken.symbol(), "DREMS");
        assertEq(propertyToken.owner(), owner);
    }

    function testRegisterProperty() public {
        vm.startPrank(owner);
        
        address propertyAddr = address(0x1);
        
        propertyToken.registerProperty(
            propertyAddr,
            "PROP001",
            "123 Test Street",
            PropertyToken.PropertyType.RESIDENTIAL_SINGLE_FAMILY,
            1000000e18, // $1M initial value
            1000000e18, // 1M tokens
            800,         // 8% yield
            8000e18,     // $8k monthly rent
            propertyManager
        );

        PropertyToken.Property memory prop = propertyToken.getProperty(propertyAddr);
        assertEq(prop.propertyId, "PROP001");
        assertEq(prop.initialValue, 1000000e18);
        assertTrue(prop.isActive);
        
        vm.stopPrank();
    }

    function testInvestInProperty() public {
        // First register a property
        vm.startPrank(owner);
        address propertyAddr = address(0x1);
        propertyToken.registerProperty(
            propertyAddr,
            "PROP001",
            "123 Test Street",
            PropertyToken.PropertyType.RESIDENTIAL_SINGLE_FAMILY,
            1000000e18, // $1M
            1000000e18, // 1M tokens
            800,         // 8% yield
            8000e18,     // $8k monthly rent
            propertyManager
        );
        vm.stopPrank();

        // User invests in property
        vm.startPrank(user1);
        vm.deal(user1, 10 ether);
        
        uint256 investmentAmount = 1000e18; // $1000 investment
        uint256 requiredCollateral = propertyToken.getRequiredCollateral(investmentAmount);
        
        propertyToken.investInProperty{value: requiredCollateral}(
            propertyAddr,
            investmentAmount
        );

        uint256 balance = propertyToken.getUserPropertyBalance(user1, propertyAddr);
        assertEq(balance, 1000e18); // Should have 1000 property tokens
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        SYNTHETIC PROPERTY TESTS
    //////////////////////////////////////////////////////////////*/

    function testSyntheticPropertyDeployment() public {
        assertTrue(address(syntheticProperty) != address(0));
        assertEq(syntheticProperty.name(), "Synthetic DREMS Property");
        assertEq(syntheticProperty.symbol(), "sDREMS");
    }

    function testAddSupportedProperty() public {
        vm.startPrank(owner);
        
        syntheticProperty.addSupportedProperty(
            address(propertyToken),
            5000, // 50% liquidation threshold
            300,  // 3x max leverage
            100,  // 1% minting fee
            100e18 // $100 min position
        );

        // Note: Since supportedProperties returns a struct, we'll test the total count instead
        uint256 totalProperties = syntheticProperty.totalSupportedProperties();
        assertEq(totalProperties, 1);
        
        vm.stopPrank();
    }

    function testOpenSyntheticPosition() public {
        // Setup: Add supported property
        vm.startPrank(owner);
        syntheticProperty.addSupportedProperty(
            address(propertyToken),
            5000, // 50% liquidation threshold
            300,  // 3x max leverage
            100,  // 1% minting fee
            100e18 // $100 min position
        );
        vm.stopPrank();

        // User opens a synthetic position
        vm.startPrank(user1);
        vm.deal(user1, 10 ether);
        
        uint256 syntheticAmount = 1000e18; // $1000 synthetic exposure
        uint256 leverageRatio = 200; // 2x leverage
        
        syntheticProperty.openSyntheticPosition{value: 5 ether}(
            address(propertyToken),
            SyntheticProperty.PositionType.LONG,
            syntheticAmount,
            leverageRatio
        );

        uint256 positionCount = syntheticProperty.userPositionCount(user1);
        assertEq(positionCount, 1);
        
        uint256 balance = syntheticProperty.balanceOf(user1);
        assertEq(balance, syntheticAmount);
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        PROPERTY AUTOMATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testPropertyAutomationDeployment() public {
        assertTrue(address(propertyAutomation) != address(0));
        assertEq(address(propertyAutomation.i_propertyToken()), address(propertyToken));
    }

    function testRegisterPropertyForAutomation() public {
        vm.startPrank(owner);
        
        address propertyAddr = address(0x1);
        
        propertyAutomation.registerPropertyForAutomation(
            propertyAddr,
            0, // Default intervals
            0,
            0
        );

        bool isRegistered = propertyAutomation.registeredProperties(propertyAddr);
        assertTrue(isRegistered);
        
        vm.stopPrank();
    }

    function testCheckUpkeep() public {
        vm.startPrank(owner);
        
        // Register a property for automation
        address propertyAddr = address(0x1);
        propertyAutomation.registerPropertyForAutomation(propertyAddr, 0, 0, 0);
        
        // Check upkeep (should be false initially)
        (bool upkeepNeeded, bytes memory performData) = propertyAutomation.checkUpkeep("");
        
        // Initially should not need upkeep since we just registered
        assertFalse(upkeepNeeded);
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        PROPERTY BRIDGE TESTS
    //////////////////////////////////////////////////////////////*/

    function testPropertyBridgeDeployment() public {
        assertTrue(address(propertyBridge) != address(0));
        assertEq(address(propertyBridge.i_propertyToken()), address(propertyToken));
    }

    function testConfigureChain() public {
        vm.startPrank(owner);
        
        uint64 chainSelector = 123456789;
        address bridgeAddress = address(0x999);
        address tokenAddress = address(0x888);
        uint256 gasLimit = 200000;
        
        propertyBridge.configureChain(
            chainSelector,
            bridgeAddress,
            tokenAddress,
            gasLimit
        );

        (
            uint64 storedChainSelector,
            address storedBridge,
            address storedToken,
            bool isActive,
            uint256 storedGasLimit
        ) = propertyBridge.supportedChains(chainSelector);

        assertEq(storedChainSelector, chainSelector);
        assertEq(storedBridge, bridgeAddress);
        assertEq(storedToken, tokenAddress);
        assertTrue(isActive);
        assertEq(storedGasLimit, gasLimit);
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testFullPropertyInvestmentFlow() public {
        // 1. Register property
        vm.startPrank(owner);
        address propertyAddr = address(0x1);
        propertyToken.registerProperty(
            propertyAddr,
            "PROP001",
            "123 Test Street",
            PropertyToken.PropertyType.RESIDENTIAL_SINGLE_FAMILY,
            1000000e18, // $1M
            1000000e18, // 1M tokens  
            800,         // 8% yield
            8000e18,     // $8k monthly rent
            propertyManager
        );

        // 2. Register for automation
        propertyAutomation.registerPropertyForAutomation(propertyAddr, 0, 0, 0);

        // 3. Add to synthetic property support
        syntheticProperty.addSupportedProperty(
            address(propertyToken),
            5000, // 50% liquidation threshold
            300,  // 3x max leverage
            100,  // 1% minting fee
            100e18 // $100 min position
        );
        vm.stopPrank();

        // 4. User invests in property
        vm.startPrank(user1);
        vm.deal(user1, 10 ether);
        
        uint256 investmentAmount = 1000e18; // $1000
        uint256 requiredCollateral = propertyToken.getRequiredCollateral(investmentAmount);
        
        propertyToken.investInProperty{value: requiredCollateral}(
            propertyAddr,
            investmentAmount
        );

        uint256 balance = propertyToken.getUserPropertyBalance(user1, propertyAddr);
        assertEq(balance, 1000e18);
        vm.stopPrank();

        // 5. Another user opens synthetic position
        vm.startPrank(user2);
        vm.deal(user2, 10 ether);
        
        syntheticProperty.openSyntheticPosition{value: 3 ether}(
            address(propertyToken),
            SyntheticProperty.PositionType.LONG,
            500e18, // $500 synthetic exposure
            200     // 2x leverage
        );

        uint256 syntheticBalance = syntheticProperty.balanceOf(user2);
        assertEq(syntheticBalance, 500e18);
        vm.stopPrank();

        // Verify everything is working together
        assertEq(propertyToken.getActivePropertiesCount(), 1);
        assertTrue(propertyAutomation.registeredProperties(propertyAddr));
        // Verify the property is supported by checking the total count
        uint256 supportedCount = syntheticProperty.totalSupportedProperties();
        assertEq(supportedCount, 1);
    }

    function testPriceFeeds() public {
        uint256 ethPrice = propertyToken.getUsdAmountFromEth(1e18);
        uint256 ethAmount = propertyToken.getEthAmountFromUsd(2000e18);
        
        // ETH price should be around $2000 (with precision adjustments)
        assertApproxEqRel(ethPrice, 2000e18, 1e16); // 1% tolerance
        
        // 1 ETH should be worth about $2000, so $2000 should be about 1 ETH
        assertApproxEqRel(ethAmount, 1e18, 1e16); // 1% tolerance
    }

    /*//////////////////////////////////////////////////////////////
                             HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function testGetCurrentPropertyValue() public {
        // Register a property first
        vm.startPrank(owner);
        address propertyAddr = address(0x1);
        propertyToken.registerProperty(
            propertyAddr,
            "PROP001",
            "123 Test Street",
            PropertyToken.PropertyType.RESIDENTIAL_SINGLE_FAMILY,
            1000000e18, // $1M
            1000000e18, // 1M tokens
            800,         // 8% yield
            8000e18,     // $8k monthly rent
            propertyManager
        );
        vm.stopPrank();

        // Should return the weighted average (since we have one property worth $1M with 1M tokens)
        uint256 currentValue = propertyToken.getCurrentPropertyValue();
        assertEq(currentValue, 1e18); // $1 per token
    }
} 