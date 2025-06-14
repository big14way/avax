// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IRouterClient } from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import { OwnerIsCreator } from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import { CCIPReceiver } from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import { IERC20 } from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import { PropertyToken } from "./PropertyToken.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PropertyBridge
 * @notice CCIP-enabled cross-chain bridge for DREMS property tokens
 * @dev Enables property token transfers across different blockchains for global liquidity
 * 
 * Features:
 * 1. Cross-chain property token transfers via Chainlink CCIP
 * 2. Multi-chain liquidity pools for property tokens
 * 3. Automated arbitrage detection and execution
 * 4. Cross-chain collateral management
 * 5. Global property portfolio management
 */
contract PropertyBridge is CCIPReceiver, OwnerIsCreator, ReentrancyGuard, Pausable {
    
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error PropertyBridge__NotEnoughBalance();
    error PropertyBridge__NothingToWithdraw();
    error PropertyBridge__FailedToWithdrawEth();
    error PropertyBridge__DestinationChainNotAllowlisted();
    error PropertyBridge__SourceChainNotAllowlisted();
    error PropertyBridge__SenderNotAllowlisted();
    error PropertyBridge__InvalidPropertyToken();
    error PropertyBridge__InsufficientGasLimit();
    error PropertyBridge__InvalidReceiver();

    /*//////////////////////////////////////////////////////////////
                                 ENUMS
    //////////////////////////////////////////////////////////////*/
    enum MessageType {
        PROPERTY_TRANSFER,
        COLLATERAL_SYNC,
        RENT_DISTRIBUTION,
        ARBITRAGE_EXECUTION
    }

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/
    struct PropertyTransferMessage {
        address propertyToken;
        address recipient;
        uint256 amount;
        address originalProperty;
        bytes32 propertyId;
    }

    struct CollateralSyncMessage {
        address user;
        uint256 collateralAmount;
        uint256 totalPropertyValue;
    }

    struct ChainConfig {
        uint64 chainSelector;
        address propertyBridge;
        address propertyToken;
        bool isActive;
        uint256 gasLimit;
    }

    struct ArbitrageOpportunity {
        address propertyToken;
        uint64 sourceChain;
        uint64 destinationChain;
        uint256 priceDifference;
        uint256 potentialProfit;
        bool isActive;
    }

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    PropertyToken public immutable i_propertyToken;
    
    // CCIP Configuration
    bytes32 private s_lastReceivedMessageId;
    address private s_lastReceivedTokenAddress;
    uint256 private s_lastReceivedTokenAmount;
    string private s_lastReceivedText;

    // Cross-chain configuration
    mapping(uint64 => ChainConfig) public supportedChains;
    mapping(uint64 => bool) public allowlistedDestinationChains;
    mapping(uint64 => bool) public allowlistedSourceChains;
    mapping(address => bool) public allowlistedSenders;
    
    // Property token mappings across chains
    mapping(address => mapping(uint64 => address)) public propertyTokenOnChain; // property -> chain -> token address
    mapping(bytes32 => address) public propertyIdToToken; // propertyId -> local token address
    
    // User balances across chains
    mapping(address => mapping(uint64 => uint256)) public userBalanceOnChain;
    mapping(address => uint256) public userTotalBalance;
    
    // Bridge fees and limits
    uint256 public bridgeFee = 0.001 ether; // 0.001 ETH bridge fee
    uint256 public maxTransferAmount = 1000000e18; // 1M tokens max transfer
    uint256 public minTransferAmount = 1e18; // 1 token min transfer
    
    // Arbitrage tracking
    mapping(bytes32 => ArbitrageOpportunity) public arbitrageOpportunities;
    uint256 public arbitrageThreshold = 50; // 0.5% price difference threshold

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event PropertyTokensBridged(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        address propertyToken,
        uint256 amount,
        uint256 fees
    );

    event PropertyTokensReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        address propertyToken,
        uint256 amount
    );

    event ChainConfigured(
        uint64 indexed chainSelector,
        address propertyBridge,
        address propertyToken,
        uint256 gasLimit
    );

    event ArbitrageOpportunityDetected(
        bytes32 indexed opportunityId,
        address propertyToken,
        uint64 sourceChain,
        uint64 destinationChain,
        uint256 priceDifference
    );

    event ArbitrageExecuted(
        bytes32 indexed opportunityId,
        address executor,
        uint256 profit
    );

    event CollateralSynced(
        address indexed user,
        uint64 indexed sourceChain,
        uint256 collateralAmount,
        uint256 totalPropertyValue
    );

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(
        address router,
        address propertyTokenAddress
    ) CCIPReceiver(router) {
        i_propertyToken = PropertyToken(propertyTokenAddress);
    }

    /*//////////////////////////////////////////////////////////////
                        CHAIN CONFIGURATION
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Configure a destination chain for property token bridging
     * @param chainSelector The CCIP chain selector
     * @param propertyBridge The PropertyBridge contract address on destination chain
     * @param propertyToken The PropertyToken contract address on destination chain
     * @param gasLimit Gas limit for CCIP messages
     */
    function configureChain(
        uint64 chainSelector,
        address propertyBridge,
        address propertyToken,
        uint256 gasLimit
    ) external onlyOwner {
        supportedChains[chainSelector] = ChainConfig({
            chainSelector: chainSelector,
            propertyBridge: propertyBridge,
            propertyToken: propertyToken,
            isActive: true,
            gasLimit: gasLimit
        });

        allowlistedDestinationChains[chainSelector] = true;
        allowlistedSourceChains[chainSelector] = true;
        allowlistedSenders[propertyBridge] = true;

        emit ChainConfigured(chainSelector, propertyBridge, propertyToken, gasLimit);
    }

    /*//////////////////////////////////////////////////////////////
                       PROPERTY TOKEN BRIDGING
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Bridge property tokens to another chain
     * @param destinationChainSelector The destination chain selector
     * @param receiver The receiver address on destination chain
     * @param propertyToken The property token contract address
     * @param amount The amount of tokens to bridge
     * @return messageId The CCIP message ID
     */
    function bridgePropertyTokens(
        uint64 destinationChainSelector,
        address receiver,
        address propertyToken,
        uint256 amount
    ) external payable nonReentrant whenNotPaused returns (bytes32 messageId) {
        if (!allowlistedDestinationChains[destinationChainSelector]) {
            revert PropertyBridge__DestinationChainNotAllowlisted();
        }
        
        if (amount < minTransferAmount || amount > maxTransferAmount) {
            revert PropertyBridge__NotEnoughBalance();
        }

        if (receiver == address(0)) {
            revert PropertyBridge__InvalidReceiver();
        }

        ChainConfig memory destChain = supportedChains[destinationChainSelector];
        if (!destChain.isActive) {
            revert PropertyBridge__DestinationChainNotAllowlisted();
        }

        // Transfer tokens from user to bridge
        IERC20(propertyToken).transferFrom(msg.sender, address(this), amount);

        // Get property details for cross-chain verification
        PropertyToken.Property memory property = i_propertyToken.getProperty(propertyToken);
        
        // Create transfer message
        PropertyTransferMessage memory transferMsg = PropertyTransferMessage({
            propertyToken: propertyToken,
            recipient: receiver,
            amount: amount,
            originalProperty: propertyToken,
            propertyId: keccak256(abi.encodePacked(property.propertyId))
        });

        // Create CCIP message
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(destChain.propertyBridge),
            data: abi.encode(MessageType.PROPERTY_TRANSFER, transferMsg),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: destChain.gasLimit})
            ),
            feeToken: address(0) // Pay in native token
        });

        // Calculate fee
        uint256 fees = IRouterClient(this.getRouter()).getFee(destinationChainSelector, evm2AnyMessage);
        
        if (fees > msg.value) {
            revert PropertyBridge__NotEnoughBalance();
        }

        // Send CCIP message
        messageId = IRouterClient(this.getRouter()).ccipSend{value: fees}(
            destinationChainSelector,
            evm2AnyMessage
        );

        emit PropertyTokensBridged(
            messageId,
            destinationChainSelector,
            receiver,
            propertyToken,
            amount,
            fees
        );

        return messageId;
    }

    /**
     * @notice Receive and process CCIP messages
     * @param any2EvmMessage The CCIP message
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override nonReentrant {
        if (!allowlistedSourceChains[any2EvmMessage.sourceChainSelector]) {
            revert PropertyBridge__SourceChainNotAllowlisted();
        }

        address sender = abi.decode(any2EvmMessage.sender, (address));
        if (!allowlistedSenders[sender]) {
            revert PropertyBridge__SenderNotAllowlisted();
        }

        // Decode message type and data
        (MessageType messageType, bytes memory messageData) = abi.decode(any2EvmMessage.data, (MessageType, bytes));

        if (messageType == MessageType.PROPERTY_TRANSFER) {
            _handlePropertyTransfer(any2EvmMessage.messageId, any2EvmMessage.sourceChainSelector, messageData);
        } else if (messageType == MessageType.COLLATERAL_SYNC) {
            _handleCollateralSync(any2EvmMessage.sourceChainSelector, messageData);
        }
    }

    /**
     * @notice Handle incoming property token transfers
     */
    function _handlePropertyTransfer(
        bytes32 messageId,
        uint64 sourceChainSelector,
        bytes memory messageData
    ) internal {
        PropertyTransferMessage memory transferMsg = abi.decode(messageData, (PropertyTransferMessage));
        
        // Find or create local property token representation
        address localToken = propertyIdToToken[transferMsg.propertyId];
        
        if (localToken == address(0)) {
            // For this demo, we'll use the main property token contract
            localToken = address(i_propertyToken);
        }

        // Mint tokens to recipient (in a full implementation, this would be more sophisticated)
        // For now, we'll transfer from bridge reserves
        IERC20(localToken).transfer(transferMsg.recipient, transferMsg.amount);

        emit PropertyTokensReceived(
            messageId,
            sourceChainSelector,
            transferMsg.recipient,
            localToken,
            transferMsg.amount
        );
    }

    /**
     * @notice Handle collateral synchronization across chains
     */
    function _handleCollateralSync(
        uint64 sourceChainSelector,
        bytes memory messageData
    ) internal {
        CollateralSyncMessage memory syncMsg = abi.decode(messageData, (CollateralSyncMessage));
        
        // Update user's cross-chain balance tracking
        userBalanceOnChain[syncMsg.user][sourceChainSelector] = syncMsg.totalPropertyValue;
        
        emit CollateralSynced(
            syncMsg.user,
            sourceChainSelector,
            syncMsg.collateralAmount,
            syncMsg.totalPropertyValue
        );
    }

    /*//////////////////////////////////////////////////////////////
                           ARBITRAGE SYSTEM
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Detect arbitrage opportunities between chains
     * @param propertyToken The property token to check
     * @param sourceChain Source chain with lower price
     * @param destinationChain Destination chain with higher price
     * @param sourcePrice Price on source chain
     * @param destinationPrice Price on destination chain
     */
    function detectArbitrageOpportunity(
        address propertyToken,
        uint64 sourceChain,
        uint64 destinationChain,
        uint256 sourcePrice,
        uint256 destinationPrice
    ) external {
        if (destinationPrice <= sourcePrice) {
            return; // No arbitrage opportunity
        }

        uint256 priceDifference = ((destinationPrice - sourcePrice) * 10000) / sourcePrice;
        
        if (priceDifference < arbitrageThreshold) {
            return; // Below threshold
        }

        bytes32 opportunityId = keccak256(abi.encodePacked(
            propertyToken,
            sourceChain,
            destinationChain,
            block.timestamp
        ));

        arbitrageOpportunities[opportunityId] = ArbitrageOpportunity({
            propertyToken: propertyToken,
            sourceChain: sourceChain,
            destinationChain: destinationChain,
            priceDifference: priceDifference,
            potentialProfit: (destinationPrice - sourcePrice),
            isActive: true
        });

        emit ArbitrageOpportunityDetected(
            opportunityId,
            propertyToken,
            sourceChain,
            destinationChain,
            priceDifference
        );
    }

    /*//////////////////////////////////////////////////////////////
                            FEES AND LIMITS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Update bridge fee
     * @param newFee New bridge fee in ETH
     */
    function updateBridgeFee(uint256 newFee) external onlyOwner {
        bridgeFee = newFee;
    }

    /**
     * @notice Update transfer limits
     * @param newMinAmount New minimum transfer amount
     * @param newMaxAmount New maximum transfer amount
     */
    function updateTransferLimits(uint256 newMinAmount, uint256 newMaxAmount) external onlyOwner {
        minTransferAmount = newMinAmount;
        maxTransferAmount = newMaxAmount;
    }

    /*//////////////////////////////////////////////////////////////
                             EMERGENCY
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Emergency withdrawal of tokens
     * @param token The token to withdraw
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @notice Emergency withdrawal of ETH
     */
    function emergencyWithdrawEth() external onlyOwner {
        uint256 amount = address(this).balance;
        if (amount == 0) revert PropertyBridge__NothingToWithdraw();
        
        (bool sent,) = owner().call{value: amount}("");
        if (!sent) revert PropertyBridge__FailedToWithdrawEth();
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Get the last received message details
     */
    function getLastReceivedMessageDetails()
        public
        view
        returns (bytes32 messageId, address tokenAddress, uint256 tokenAmount, string memory text)
    {
        return (s_lastReceivedMessageId, s_lastReceivedTokenAddress, s_lastReceivedTokenAmount, s_lastReceivedText);
    }

    /**
     * @notice Get chain configuration
     * @param chainSelector The chain selector
     * @return config The chain configuration
     */
    function getChainConfig(uint64 chainSelector) external view returns (ChainConfig memory config) {
        return supportedChains[chainSelector];
    }

    /**
     * @notice Check if arbitrage opportunity exists
     * @param opportunityId The opportunity ID
     * @return opportunity The arbitrage opportunity details
     */
    function getArbitrageOpportunity(bytes32 opportunityId) 
        external 
        view 
        returns (ArbitrageOpportunity memory opportunity) 
    {
        return arbitrageOpportunities[opportunityId];
    }

    /**
     * @notice Get user's total balance across all chains
     * @param user The user address
     * @return totalBalance The total balance across all chains
     */
    function getUserTotalBalance(address user) external view returns (uint256 totalBalance) {
        return userTotalBalance[user];
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
} 