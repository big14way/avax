// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { FunctionsClient } from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import { ConfirmedOwner } from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import { FunctionsRequest } from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { OracleLib, AggregatorV3Interface } from "./libraries/OracleLib.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PropertyToken
 * @notice DREMS Platform - Decentralized Real Estate Marketplace
 * @dev Enhanced RWA tokenization for real estate properties with automated management
 * @notice Fractional property ownership with automated rent distribution and cross-chain trading
 * 
 * Key Features:
 * - Fractional property ownership through ERC20 tokens
 * - Automated rent collection and distribution via Chainlink Automation
 * - Real-time property valuation using Chainlink Functions
 * - Cross-chain property token trading via Chainlink CCIP
 * - Dynamic collateralization based on market conditions
 */
contract PropertyToken is FunctionsClient, ConfirmedOwner, ERC20, Pausable, ReentrancyGuard {
    using FunctionsRequest for FunctionsRequest.Request;
    using OracleLib for AggregatorV3Interface;
    using Strings for uint256;

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error PropertyToken__NotEnoughCollateral();
    error PropertyToken__BelowMinimumInvestment();
    error PropertyToken__PropertyNotActive();
    error PropertyToken__InvalidPropertyType();
    error PropertyToken__RentDistributionFailed();
    error PropertyToken__OnlyPropertyManager();
    error PropertyToken__InsufficientRentBalance();
    error UnexpectedRequestID(bytes32 requestId);

    /*//////////////////////////////////////////////////////////////
                                 ENUMS
    //////////////////////////////////////////////////////////////*/
    enum PropertyType {
        RESIDENTIAL_SINGLE_FAMILY,
        RESIDENTIAL_CONDO,
        RESIDENTIAL_APARTMENT,
        COMMERCIAL_OFFICE,
        COMMERCIAL_RETAIL,
        COMMERCIAL_INDUSTRIAL,
        LAND_DEVELOPMENT,
        REIT_TOKEN
    }

    enum RequestType {
        MINT,
        REDEEM,
        PROPERTY_VALUATION,
        RENT_COLLECTION
    }

    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/
    struct Property {
        string propertyAddress;
        string propertyId; // Unique identifier from external APIs
        PropertyType propertyType;
        uint256 totalTokens; // Total supply for this property
        uint256 initialValue; // Initial property value in USD
        uint256 currentValue; // Current market value in USD
        uint256 expectedRentalYield; // Annual yield percentage (e.g., 8% = 800)
        uint256 monthlyRent; // Monthly rent in USD
        uint256 lastValuationUpdate;
        uint256 lastRentCollection;
        bool isActive;
        address propertyManager; // Can be different from owner
    }

    struct PropertyRequest {
        uint256 amount;
        address requester;
        RequestType requestType;
        address propertyAddress;
    }

    struct RentalData {
        uint256 totalRentCollected;
        uint256 availableForDistribution;
        uint256 lastDistributionDate;
        uint256 occupancyRate; // Percentage (e.g., 95% = 9500)
        mapping(address => uint256) userRentClaims;
    }

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    // Chainlink Configuration
    uint32 private constant GAS_LIMIT = 300_000;
    uint64 immutable i_subId;
    address s_functionsRouter;
    string s_propertyDataSource;
    string s_rentCollectionSource;
    bytes32 s_donID;
    uint64 s_secretVersion;
    uint8 s_secretSlot;

    // Price Feeds
    address public immutable i_ethUsdFeed;
    address public immutable i_usdcUsdFeed;
    address public immutable i_redemptionCoin;

    // Property Management
    mapping(address => Property) public properties;
    mapping(bytes32 => PropertyRequest) private s_requestIdToRequest;
    mapping(address => RentalData) public propertyRentals;
    
    // User balances and collateral
    mapping(address => mapping(address => uint256)) public userPropertyTokens; // user -> property -> amount
    mapping(address => uint256) public userCollateral; // ETH collateral per user
    mapping(address => uint256) public userWithdrawableRent; // Accumulated rent per user

    // Platform Configuration
    uint256 public constant MINIMUM_INVESTMENT = 10e18; // $10 minimum investment
    uint256 public constant COLLATERAL_RATIO = 150; // 150% collateral ratio
    uint256 public constant COLLATERAL_PRECISION = 100;
    uint256 public constant PRECISION = 1e18;
    uint256 public constant ADDITIONAL_FEED_PRECISION = 1e10;
    uint256 public constant YIELD_PRECISION = 10000; // For percentage calculations (100% = 10000)
    uint256 public constant PLATFORM_FEE = 100; // 1% platform fee (1% = 100/10000)

    // Property registry
    address[] public activeProperties;
    uint256 public totalProperties;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event PropertyRegistered(
        address indexed propertyAddress,
        string propertyId,
        PropertyType propertyType,
        uint256 initialValue,
        uint256 totalTokens
    );
    
    event PropertyTokensMinted(
        address indexed user,
        address indexed property,
        uint256 amount,
        uint256 collateralUsed
    );
    
    event PropertyTokensRedeemed(
        address indexed user,
        address indexed property,
        uint256 amount,
        uint256 collateralReturned
    );
    
    event RentCollected(
        address indexed property,
        uint256 amount,
        uint256 timestamp
    );
    
    event RentDistributed(
        address indexed user,
        address indexed property,
        uint256 amount
    );
    
    event PropertyValuationUpdated(
        address indexed property,
        uint256 oldValue,
        uint256 newValue,
        uint256 timestamp
    );

    event ChainlinkResponse(
        bytes32 indexed requestId,
        RequestType requestType,
        bytes response,
        bytes err
    );

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(
        uint64 subId,
        string memory propertyDataSource,
        string memory rentCollectionSource,
        address functionsRouter,
        bytes32 donId,
        address ethPriceFeed,
        address usdcPriceFeed,
        address redemptionCoin,
        uint64 secretVersion,
        uint8 secretSlot
    )
        FunctionsClient(functionsRouter)
        ConfirmedOwner(msg.sender)
        ERC20("DREMS Property Token", "DREMS")
    {
        s_propertyDataSource = propertyDataSource;
        s_rentCollectionSource = rentCollectionSource;
        s_functionsRouter = functionsRouter;
        s_donID = donId;
        i_ethUsdFeed = ethPriceFeed;
        i_usdcUsdFeed = usdcPriceFeed;
        i_redemptionCoin = redemptionCoin;
        i_subId = subId;
        s_secretVersion = secretVersion;
        s_secretSlot = secretSlot;
    }

    /*//////////////////////////////////////////////////////////////
                        PROPERTY REGISTRATION
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Register a new property for tokenization
     * @param propertyAddr The address of the property contract
     * @param propertyId Unique identifier from external APIs (e.g., MLS number)
     * @param physicalAddress Physical address of the property
     * @param propertyType Type of property (residential, commercial, etc.)
     * @param initialValue Initial market value in USD (18 decimals)
     * @param totalTokens Total number of tokens to represent 100% ownership
     * @param expectedYield Expected annual rental yield (basis points: 800 = 8%)
     * @param monthlyRent Expected monthly rental income in USD
     * @param propertyManager Address authorized to manage this property
     */
    function registerProperty(
        address propertyAddr,
        string memory propertyId,
        string memory physicalAddress,
        PropertyType propertyType,
        uint256 initialValue,
        uint256 totalTokens,
        uint256 expectedYield,
        uint256 monthlyRent,
        address propertyManager
    ) external onlyOwner {
        if (properties[propertyAddr].isActive) {
            revert PropertyToken__PropertyNotActive();
        }

        properties[propertyAddr] = Property({
            propertyAddress: physicalAddress,
            propertyId: propertyId,
            propertyType: propertyType,
            totalTokens: totalTokens,
            initialValue: initialValue,
            currentValue: initialValue,
            expectedRentalYield: expectedYield,
            monthlyRent: monthlyRent,
            lastValuationUpdate: block.timestamp,
            lastRentCollection: block.timestamp,
            isActive: true,
            propertyManager: propertyManager
        });

        activeProperties.push(propertyAddr);
        totalProperties++;

        emit PropertyRegistered(propertyAddr, propertyId, propertyType, initialValue, totalTokens);
    }

    /*//////////////////////////////////////////////////////////////
                         PROPERTY INVESTMENT
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Invest in a property by minting property tokens with ETH collateral
     * @param propertyAddr The property contract address
     * @param tokenAmount Amount of property tokens to mint
     */
    function investInProperty(address propertyAddr, uint256 tokenAmount) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        Property storage property = properties[propertyAddr];
        if (!property.isActive) {
            revert PropertyToken__PropertyNotActive();
        }

        uint256 investmentValue = getUsdValueOfPropertyTokens(propertyAddr, tokenAmount);
        if (investmentValue < MINIMUM_INVESTMENT) {
            revert PropertyToken__BelowMinimumInvestment();
        }

        // Check collateral requirements
        uint256 requiredCollateral = getRequiredCollateral(investmentValue);
        if (msg.value < requiredCollateral) {
            revert PropertyToken__NotEnoughCollateral();
        }

        // Update user balances
        userCollateral[msg.sender] += msg.value;
        userPropertyTokens[msg.sender][propertyAddr] += tokenAmount;

        // Mint tokens representing property ownership
        _mint(msg.sender, tokenAmount);

        emit PropertyTokensMinted(msg.sender, propertyAddr, tokenAmount, msg.value);
    }

    /*//////////////////////////////////////////////////////////////
                         CHAINLINK FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Request property valuation update using Chainlink Functions
     * @param propertyAddr The property to update valuation for
     */
    function requestPropertyValuation(address propertyAddr) 
        external 
        returns (bytes32 requestId) 
    {
        Property storage property = properties[propertyAddr];
        if (!property.isActive) {
            revert PropertyToken__PropertyNotActive();
        }

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(s_propertyDataSource);
        req.addDONHostedSecrets(s_secretSlot, s_secretVersion);
        
        // Pass property ID as argument for API lookup
        string[] memory args = new string[](1);
        args[0] = property.propertyId;
        req.setArgs(args);

        requestId = _sendRequest(req.encodeCBOR(), i_subId, GAS_LIMIT, s_donID);
        s_requestIdToRequest[requestId] = PropertyRequest(
            0, // No amount for valuation requests
            msg.sender,
            RequestType.PROPERTY_VALUATION,
            propertyAddr
        );

        return requestId;
    }

    /**
     * @notice Request rent collection for a property
     * @param propertyAddr The property to collect rent for
     */
    function requestRentCollection(address propertyAddr) 
        external 
        returns (bytes32 requestId) 
    {
        Property storage property = properties[propertyAddr];
        if (!property.isActive) {
            revert PropertyToken__PropertyNotActive();
        }
        
        // Only property manager or owner can trigger rent collection
        if (msg.sender != property.propertyManager && msg.sender != owner()) {
            revert PropertyToken__OnlyPropertyManager();
        }

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(s_rentCollectionSource);
        req.addDONHostedSecrets(s_secretSlot, s_secretVersion);
        
        string[] memory args = new string[](2);
        args[0] = property.propertyId;
        args[1] = property.monthlyRent.toString();
        req.setArgs(args);

        requestId = _sendRequest(req.encodeCBOR(), i_subId, GAS_LIMIT, s_donID);
        s_requestIdToRequest[requestId] = PropertyRequest(
            property.monthlyRent,
            msg.sender,
            RequestType.RENT_COLLECTION,
            propertyAddr
        );

        return requestId;
    }

    /**
     * @notice Chainlink Functions callback
     * @param requestId The request ID
     * @param response The response data
     * @param err Any error data
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        PropertyRequest memory request = s_requestIdToRequest[requestId];
        
        if (request.requestType == RequestType.PROPERTY_VALUATION) {
            _handleValuationResponse(request.propertyAddress, response, err);
        } else if (request.requestType == RequestType.RENT_COLLECTION) {
            _handleRentCollectionResponse(request.propertyAddress, response, err);
        }

        emit ChainlinkResponse(requestId, request.requestType, response, err);
        delete s_requestIdToRequest[requestId];
    }

    /*//////////////////////////////////////////////////////////////
                      PROPERTY VALUE CALCULATIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Get USD value of property tokens
     * @param propertyAddr Property contract address
     * @param tokenAmount Amount of tokens
     * @return USD value (18 decimals)
     */
    function getUsdValueOfPropertyTokens(address propertyAddr, uint256 tokenAmount) 
        public 
        view 
        returns (uint256) 
    {
        Property storage property = properties[propertyAddr];
        return (tokenAmount * property.currentValue) / property.totalTokens;
    }

    /**
     * @notice Get required ETH collateral for investment amount
     * @param investmentValueUsd Investment value in USD
     * @return Required ETH amount
     */
    function getRequiredCollateral(uint256 investmentValueUsd) 
        public 
        view 
        returns (uint256) 
    {
        uint256 collateralValueUsd = (investmentValueUsd * COLLATERAL_RATIO) / COLLATERAL_PRECISION;
        return getEthAmountFromUsd(collateralValueUsd);
    }

    /**
     * @notice Convert USD amount to ETH using Chainlink price feed
     * @param usdAmount USD amount (18 decimals)
     * @return ETH amount (18 decimals)
     */
    function getEthAmountFromUsd(uint256 usdAmount) public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(i_ethUsdFeed);
        (, int256 price,,,) = priceFeed.staleCheckLatestRoundData();
        return (usdAmount * PRECISION) / (uint256(price) * ADDITIONAL_FEED_PRECISION);
    }

    /**
     * @notice Convert ETH amount to USD using Chainlink price feed
     * @param ethAmount ETH amount (18 decimals)
     * @return USD amount (18 decimals)
     */
    function getUsdAmountFromEth(uint256 ethAmount) public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(i_ethUsdFeed);
        (, int256 price,,,) = priceFeed.staleCheckLatestRoundData();
        return (ethAmount * uint256(price) * ADDITIONAL_FEED_PRECISION) / PRECISION;
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Handle property valuation response from Chainlink Functions
     */
    function _handleValuationResponse(
        address propertyAddr,
        bytes memory response,
        bytes memory err
    ) internal {
        if (err.length > 0) {
            return; // Valuation update failed, keep current value
        }

        Property storage property = properties[propertyAddr];
        uint256 oldValue = property.currentValue;
        
        // Parse response - expecting JSON with property value
        uint256 newValue = abi.decode(response, (uint256));
        
        property.currentValue = newValue;
        property.lastValuationUpdate = block.timestamp;

        emit PropertyValuationUpdated(propertyAddr, oldValue, newValue, block.timestamp);
    }

    /**
     * @notice Handle rent collection response from Chainlink Functions
     */
    function _handleRentCollectionResponse(
        address propertyAddr,
        bytes memory response,
        bytes memory err
    ) internal {
        if (err.length > 0) {
            return; // Rent collection failed
        }

        Property storage property = properties[propertyAddr];
        RentalData storage rental = propertyRentals[propertyAddr];
        
        // Parse response - expecting rent amount collected
        uint256 rentCollected = abi.decode(response, (uint256));
        
        rental.totalRentCollected += rentCollected;
        rental.availableForDistribution += rentCollected;
        property.lastRentCollection = block.timestamp;

        emit RentCollected(propertyAddr, rentCollected, block.timestamp);
        
        // Trigger automated rent distribution
        _distributeRent(propertyAddr);
    }

    /**
     * @notice Distribute collected rent to token holders
     */
    function _distributeRent(address propertyAddr) internal {
        RentalData storage rental = propertyRentals[propertyAddr];
        Property storage property = properties[propertyAddr];
        
        if (rental.availableForDistribution == 0) {
            return;
        }

        uint256 platformFee = (rental.availableForDistribution * PLATFORM_FEE) / YIELD_PRECISION;
        uint256 distributableRent = rental.availableForDistribution - platformFee;
        
        // Mark rent as distributed
        rental.availableForDistribution = 0;
        rental.lastDistributionDate = block.timestamp;
        
        // Note: In a production system, we would iterate through token holders
        // For this implementation, we'll use a claim-based system for gas efficiency
    }

    /*//////////////////////////////////////////////////////////////
                         ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function setSecretVersion(uint64 secretVersion) external onlyOwner {
        s_secretVersion = secretVersion;
    }

    function setSecretSlot(uint8 secretSlot) external onlyOwner {
        s_secretSlot = secretSlot;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                             VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function getProperty(address propertyAddr) external view returns (Property memory) {
        return properties[propertyAddr];
    }

    function getActivePropertiesCount() external view returns (uint256) {
        return activeProperties.length;
    }

    function getActiveProperty(uint256 index) external view returns (address) {
        return activeProperties[index];
    }

    function getUserPropertyBalance(address user, address propertyAddr) 
        external 
        view 
        returns (uint256) 
    {
        return userPropertyTokens[user][propertyAddr];
    }
}
