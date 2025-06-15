// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { OracleLib, AggregatorV3Interface } from "./libraries/OracleLib.sol";
import { PropertyToken } from "./PropertyToken.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SyntheticProperty
 * @notice DREMS Platform - Synthetic Property Token for Shorting/Hedging Real Estate
 * @dev Enhanced synthetic asset protocol for real estate exposure without direct ownership
 * 
 * Key Features:
 * 1. Synthetic exposure to property values (long/short positions)
 * 2. Over-collateralized minting with ETH
 * 3. Automated liquidation system
 * 4. Integration with PropertyToken for price feeds
 * 5. Cross-property synthetic baskets
 * 6. Leverage control and risk management
 */
contract SyntheticProperty is ERC20, Ownable, ReentrancyGuard, Pausable {
    using OracleLib for AggregatorV3Interface;

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error SyntheticProperty__InsufficientCollateral();
    error SyntheticProperty__BelowMinimumHealthFactor();
    error SyntheticProperty__InvalidPropertyToken();
    error SyntheticProperty__LiquidationFailed();
    error SyntheticProperty__TransferFailed();
    error SyntheticProperty__InvalidLeverageRatio();
    error SyntheticProperty__PositionTooSmall();

    /*//////////////////////////////////////////////////////////////
                                 ENUMS
    //////////////////////////////////////////////////////////////*/
    enum PositionType {
        LONG,  // Bet on property price increase
        SHORT  // Bet on property price decrease
    }

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/
    struct SyntheticPosition {
        address propertyToken;
        PositionType positionType;
        uint256 syntheticAmount;
        uint256 collateralAmount;
        uint256 entryPrice;
        uint256 timestamp;
        bool isActive;
        uint256 leverageRatio; // 1x, 2x, 3x, etc. (in basis points: 100 = 1x)
    }

    struct PropertyConfig {
        address propertyToken;
        bool isSupported;
        uint256 liquidationThreshold; // Basis points (5000 = 50%)
        uint256 maxLeverage; // Maximum leverage allowed (300 = 3x)
        uint256 mintingFee; // Basis points (100 = 1%)
        uint256 minPosition; // Minimum position size in USD
    }

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    // Price feeds
    address private immutable i_ethUsdFeed;
    PropertyToken public immutable i_mainPropertyToken;

    // Protocol parameters
    uint256 public constant DECIMALS = 8;
    uint256 public constant ADDITIONAL_FEED_PRECISION = 1e10;
    uint256 public constant PRECISION = 1e18;
    uint256 public constant DEFAULT_LIQUIDATION_THRESHOLD = 5000; // 50% (200% over-collateralization)
    uint256 public constant LIQUIDATION_BONUS = 1000; // 10% liquidation bonus
    uint256 public constant LIQUIDATION_PRECISION = 10000;
    uint256 public constant MIN_HEALTH_FACTOR = 1e18;
    uint256 public constant MAX_LEVERAGE = 500; // 5x maximum leverage
    uint256 public constant MIN_POSITION_USD = 100e18; // $100 minimum position

    // User positions
    mapping(address => mapping(uint256 => SyntheticPosition)) public userPositions;
    mapping(address => uint256) public userPositionCount;
    mapping(address => uint256) public userTotalCollateral;

    // Property configurations
    mapping(address => PropertyConfig) public supportedProperties;
    address[] public propertyList;
    uint256 public totalSupportedProperties;

    // Global state
    uint256 public totalSyntheticValue;
    uint256 public totalCollateralValue;
    uint256 public liquidationPool; // Funds from liquidations

    /*//////////////////////////////////////////////////////////////
                                 EVENTS 
    //////////////////////////////////////////////////////////////*/
    event SyntheticPositionOpened(
        address indexed user,
        uint256 indexed positionId,
        address indexed propertyToken,
        PositionType positionType,
        uint256 syntheticAmount,
        uint256 collateralAmount,
        uint256 leverageRatio
    );

    event SyntheticPositionClosed(
        address indexed user,
        uint256 indexed positionId,
        uint256 pnl,
        bool isProfitable
    );

    event PositionLiquidated(
        address indexed user,
        uint256 indexed positionId,
        address indexed liquidator,
        uint256 liquidationBonus
    );

    event PropertyAdded(
        address indexed propertyToken,
        uint256 liquidationThreshold,
        uint256 maxLeverage
    );

    event CollateralDeposited(
        address indexed user,
        uint256 amount
    );

    event CollateralWithdrawn(
        address indexed user,
        uint256 amount
    );

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(
        address ethUsdFeed,
        address mainPropertyToken,
        string memory tokenName,
        string memory tokenSymbol
    ) ERC20(tokenName, tokenSymbol) Ownable(msg.sender) {
        i_ethUsdFeed = ethUsdFeed;
        i_mainPropertyToken = PropertyToken(mainPropertyToken);
    }

    /*//////////////////////////////////////////////////////////////
                         PROPERTY MANAGEMENT
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Add a property token for synthetic trading
     * @param propertyToken Address of the PropertyToken contract
     * @param liquidationThreshold Liquidation threshold in basis points
     * @param maxLeverage Maximum leverage in basis points (100 = 1x)
     * @param mintingFee Fee for opening positions in basis points
     * @param minPosition Minimum position size in USD
     */
    function addSupportedProperty(
        address propertyToken,
        uint256 liquidationThreshold,
        uint256 maxLeverage,
        uint256 mintingFee,
        uint256 minPosition
    ) external onlyOwner {
        if (propertyToken == address(0)) {
            revert SyntheticProperty__InvalidPropertyToken();
        }

        supportedProperties[propertyToken] = PropertyConfig({
            propertyToken: propertyToken,
            isSupported: true,
            liquidationThreshold: liquidationThreshold,
            maxLeverage: maxLeverage,
            mintingFee: mintingFee,
            minPosition: minPosition
        });

        if (!_isPropertyInList(propertyToken)) {
            propertyList.push(propertyToken);
            totalSupportedProperties++;
        }

        emit PropertyAdded(propertyToken, liquidationThreshold, maxLeverage);
    }

    /*//////////////////////////////////////////////////////////////
                          SYNTHETIC POSITIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Open a synthetic position on a property
     * @param propertyToken The property token to create synthetic exposure to
     * @param positionType LONG or SHORT position
     * @param syntheticAmount Amount of synthetic tokens to mint
     * @param leverageRatio Leverage ratio in basis points (100 = 1x, 200 = 2x)
     */
    function openSyntheticPosition(
        address propertyToken,
        PositionType positionType,
        uint256 syntheticAmount,
        uint256 leverageRatio
    ) external payable nonReentrant whenNotPaused {
        PropertyConfig memory config = supportedProperties[propertyToken];
        if (!config.isSupported) {
            revert SyntheticProperty__InvalidPropertyToken();
        }

        if (leverageRatio < 100 || leverageRatio > config.maxLeverage) {
            revert SyntheticProperty__InvalidLeverageRatio();
        }

        // Calculate required collateral based on leverage
        uint256 syntheticValueUsd = _getSyntheticValueInUsd(propertyToken, syntheticAmount);
        uint256 requiredCollateral = _calculateRequiredCollateral(syntheticValueUsd, leverageRatio, config.liquidationThreshold);

        if (msg.value < requiredCollateral) {
            revert SyntheticProperty__InsufficientCollateral();
        }

        if (syntheticValueUsd < config.minPosition) {
            revert SyntheticProperty__PositionTooSmall();
        }

        // Create position
        uint256 positionId = userPositionCount[msg.sender];
        uint256 currentPrice = _getPropertyPrice(propertyToken);

        userPositions[msg.sender][positionId] = SyntheticPosition({
            propertyToken: propertyToken,
            positionType: positionType,
            syntheticAmount: syntheticAmount,
            collateralAmount: msg.value,
            entryPrice: currentPrice,
            timestamp: block.timestamp,
            isActive: true,
            leverageRatio: leverageRatio
        });

        userPositionCount[msg.sender]++;
        userTotalCollateral[msg.sender] += msg.value;
        totalSyntheticValue += syntheticValueUsd;
        totalCollateralValue += msg.value;

        // Mint synthetic tokens to user
        _mint(msg.sender, syntheticAmount);

        emit SyntheticPositionOpened(
            msg.sender,
            positionId,
            propertyToken,
            positionType,
            syntheticAmount,
            msg.value,
            leverageRatio
        );
    }

    /**
     * @notice Close a synthetic position
     * @param positionId The ID of the position to close
     */
    function closeSyntheticPosition(uint256 positionId) external nonReentrant whenNotPaused {
        SyntheticPosition storage position = userPositions[msg.sender][positionId];
        if (!position.isActive) {
            revert SyntheticProperty__InvalidPropertyToken();
        }

        uint256 currentPrice = _getPropertyPrice(position.propertyToken);
        (uint256 pnl, bool isProfitable) = _calculatePnL(position, currentPrice);

        // Calculate return amount
        uint256 returnAmount = position.collateralAmount;
        if (isProfitable) {
            returnAmount += pnl;
        } else {
            if (pnl >= returnAmount) {
                returnAmount = 0; // Total loss
            } else {
                returnAmount -= pnl;
            }
        }

        // Update state
        position.isActive = false;
        userTotalCollateral[msg.sender] -= position.collateralAmount;
        totalSyntheticValue -= _getSyntheticValueInUsd(position.propertyToken, position.syntheticAmount);
        totalCollateralValue -= position.collateralAmount;

        // Burn synthetic tokens
        _burn(msg.sender, position.syntheticAmount);

        // Return collateral (minus/plus PnL)
        if (returnAmount > 0) {
            (bool success,) = msg.sender.call{value: returnAmount}("");
            if (!success) {
                revert SyntheticProperty__TransferFailed();
            }
        }

        emit SyntheticPositionClosed(msg.sender, positionId, pnl, isProfitable);
    }

    /*//////////////////////////////////////////////////////////////
                           LIQUIDATION SYSTEM
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Liquidate an undercollateralized position
     * @param user The user whose position to liquidate
     * @param positionId The position ID to liquidate
     */
    function liquidatePosition(address user, uint256 positionId) external nonReentrant {
        SyntheticPosition storage position = userPositions[user][positionId];
        if (!position.isActive) {
            revert SyntheticProperty__InvalidPropertyToken();
        }

        uint256 healthFactor = getPositionHealthFactor(user, positionId);
        if (healthFactor >= MIN_HEALTH_FACTOR) {
            revert SyntheticProperty__BelowMinimumHealthFactor();
        }

        uint256 currentPrice = _getPropertyPrice(position.propertyToken);
        (uint256 loss,) = _calculatePnL(position, currentPrice);

        // Calculate liquidation bonus for liquidator
        uint256 liquidationBonus = (position.collateralAmount * LIQUIDATION_BONUS) / LIQUIDATION_PRECISION;
        uint256 remainingCollateral = position.collateralAmount > loss ? 
            position.collateralAmount - loss : 0;

        if (remainingCollateral > liquidationBonus) {
            remainingCollateral -= liquidationBonus;
            liquidationPool += remainingCollateral;
        }

        // Update state
        position.isActive = false;
        userTotalCollateral[user] -= position.collateralAmount;
        totalSyntheticValue -= _getSyntheticValueInUsd(position.propertyToken, position.syntheticAmount);
        totalCollateralValue -= position.collateralAmount;

        // Burn synthetic tokens
        _burn(user, position.syntheticAmount);

        // Pay liquidator
        if (liquidationBonus > 0) {
            (bool success,) = msg.sender.call{value: liquidationBonus}("");
            if (!success) {
                revert SyntheticProperty__LiquidationFailed();
            }
        }

        emit PositionLiquidated(user, positionId, msg.sender, liquidationBonus);
    }

    /*//////////////////////////////////////////////////////////////
                             VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Get the health factor of a specific position
     * @param user The user address
     * @param positionId The position ID
     * @return healthFactor The health factor (1e18 = 100%)
     */
    function getPositionHealthFactor(address user, uint256 positionId) public view returns (uint256) {
        SyntheticPosition memory position = userPositions[user][positionId];
        if (!position.isActive) return 0;

        uint256 currentPrice = _getPropertyPrice(position.propertyToken);
        (uint256 loss, bool isProfitable) = _calculatePnL(position, currentPrice);

        uint256 effectiveCollateral = position.collateralAmount;
        if (!isProfitable && loss > 0) {
            if (loss >= effectiveCollateral) return 0;
            effectiveCollateral -= loss;
        }

        uint256 syntheticValueUsd = _getSyntheticValueInUsd(position.propertyToken, position.syntheticAmount);
        PropertyConfig memory config = supportedProperties[position.propertyToken];
        
        uint256 collateralAdjustedForThreshold = (effectiveCollateral * config.liquidationThreshold) / LIQUIDATION_PRECISION;
        return (collateralAdjustedForThreshold * PRECISION) / syntheticValueUsd;
    }

    /**
     * @notice Get PnL for a position
     * @param user The user address
     * @param positionId The position ID
     * @return pnl The profit/loss amount
     * @return isProfitable Whether the position is profitable
     */
    function getPositionPnL(address user, uint256 positionId) external view returns (uint256 pnl, bool isProfitable) {
        SyntheticPosition memory position = userPositions[user][positionId];
        uint256 currentPrice = _getPropertyPrice(position.propertyToken);
        return _calculatePnL(position, currentPrice);
    }

    /**
     * @notice Get user's active positions
     * @param user The user address
     * @return positions Array of active position IDs
     */
    function getUserActivePositions(address user) external view returns (uint256[] memory positions) {
        uint256 count = 0;
        uint256 totalPositions = userPositionCount[user];
        
        // Count active positions
        for (uint256 i = 0; i < totalPositions; i++) {
            if (userPositions[user][i].isActive) {
                count++;
            }
        }
        
        positions = new uint256[](count);
        uint256 index = 0;
        
        // Fill active positions
        for (uint256 i = 0; i < totalPositions; i++) {
            if (userPositions[user][i].isActive) {
                positions[index] = i;
                index++;
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function _calculateRequiredCollateral(
        uint256 syntheticValueUsd,
        uint256 leverageRatio,
        uint256 liquidationThreshold
    ) internal view returns (uint256) {
        // Base collateral requirement based on liquidation threshold
        uint256 baseCollateral = (syntheticValueUsd * LIQUIDATION_PRECISION) / liquidationThreshold;
        
        // Adjust for leverage (higher leverage = more collateral needed)
        uint256 leverageAdjustment = (baseCollateral * leverageRatio) / 100;
        
        return _getEthAmountFromUsd(leverageAdjustment);
    }

    function _calculatePnL(SyntheticPosition memory position, uint256 currentPrice) internal pure returns (uint256 pnl, bool isProfitable) {
        uint256 priceDifference;
        
        if (position.positionType == PositionType.LONG) {
            if (currentPrice > position.entryPrice) {
                priceDifference = currentPrice - position.entryPrice;
                isProfitable = true;
            } else {
                priceDifference = position.entryPrice - currentPrice;
                isProfitable = false;
            }
        } else { // SHORT position
            if (currentPrice < position.entryPrice) {
                priceDifference = position.entryPrice - currentPrice;
                isProfitable = true;
            } else {
                priceDifference = currentPrice - position.entryPrice;
                isProfitable = false;
            }
        }
        
        // Apply leverage to PnL
        pnl = (position.syntheticAmount * priceDifference * position.leverageRatio) / (position.entryPrice * 100);
    }

    function _getPropertyPrice(address propertyToken) internal view returns (uint256) {
        try PropertyToken(propertyToken).getCurrentPropertyValue() returns (uint256 price) {
            return price;
        } catch {
            // Fallback to a default price mechanism if needed
            return 1e18; // $1 default
        }
    }

    function _getSyntheticValueInUsd(address propertyToken, uint256 syntheticAmount) internal view returns (uint256) {
        uint256 propertyPrice = _getPropertyPrice(propertyToken);
        return (syntheticAmount * propertyPrice) / PRECISION;
    }

    function _getEthAmountFromUsd(uint256 usdAmountInWei) internal view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(i_ethUsdFeed);
        (, int256 price,,,) = priceFeed.staleCheckLatestRoundData();
        return (usdAmountInWei * PRECISION) / (uint256(price) * ADDITIONAL_FEED_PRECISION);
    }

    function _isPropertyInList(address propertyToken) internal view returns (bool) {
        for (uint256 i = 0; i < propertyList.length; i++) {
            if (propertyList[i] == propertyToken) {
                return true;
            }
        }
        return false;
    }

    /*//////////////////////////////////////////////////////////////
                           ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Emergency pause/unpause functionality
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw funds from liquidation pool (owner only)
     * @param amount Amount to withdraw
     */
    function withdrawLiquidationPool(uint256 amount) external onlyOwner {
        require(amount <= liquidationPool, "Insufficient pool balance");
        liquidationPool -= amount;
        
        (bool success,) = msg.sender.call{value: amount}("");
        if (!success) {
            revert SyntheticProperty__TransferFailed();
        }
    }

    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {
        liquidationPool += msg.value;
    }
} 