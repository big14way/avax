// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { MockV3Aggregator } from "../src/test/mocks/MockV3Aggregator.sol";
import { MockFunctionsRouter } from "../src/test/mocks/MockFunctionsRouter.sol";
import { MockUSDC } from "../src/test/mocks/MockUSDC.sol";
import { MockCCIPRouter } from "@chainlink/contracts-ccip/src/v0.8/ccip/test/mocks/MockRouter.sol";
import { MockLinkToken } from "../src/test/mocks/MockLinkToken.sol";

contract HelperConfig {
    NetworkConfig public activeNetworkConfig;

    mapping(uint256 chainId => uint64 ccipChainSelector) public chainIdToCCIPChainSelector;

    struct NetworkConfig {
        address tslaPriceFeed;
        address usdcPriceFeed;
        address ethUsdPriceFeed;
        address functionsRouter;
        bytes32 donId;
        uint64 subId;
        address redemptionCoin;
        address linkToken;
        address ccipRouter;
        uint64 ccipChainSelector;
        uint64 secretVersion;
        uint8 secretSlot;
    }

    mapping(uint256 => NetworkConfig) public chainIdToNetworkConfig;

    // Mocks
    MockV3Aggregator public tslaFeedMock;
    MockV3Aggregator public ethUsdFeedMock;
    MockV3Aggregator public usdcFeedMock;
    MockUSDC public usdcMock;
    MockLinkToken public linkTokenMock;
    MockCCIPRouter public ccipRouterMock;

    MockFunctionsRouter public functionsRouterMock;

    // TSLA USD, ETH USD, and USDC USD both have 8 decimals
    uint8 public constant DECIMALS = 8;
    int256 public constant INITIAL_ANSWER = 2000e8;
    int256 public constant INITIAL_ANSWER_USD = 1e8;

    constructor() {
        chainIdToNetworkConfig[137] = getPolygonConfig();
        chainIdToNetworkConfig[80_002] = getAmoyConfig();
        // chainIdToNetworkConfig[43_113] = getFujiConfig(); // Avalanche Fuji Testnet
        // chainIdToNetworkConfig[43_114] = getAvalancheConfig(); // Avalanche Mainnet
        chainIdToNetworkConfig[31_337] = _setupAnvilConfig();
        activeNetworkConfig = chainIdToNetworkConfig[block.chainid];
    }

    function getPolygonConfig() internal pure returns (NetworkConfig memory config) {
        config = NetworkConfig({
            tslaPriceFeed: 0x567E67f456c7453c583B6eFA6F18452cDee1F5a8,
            usdcPriceFeed: 0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7,
            ethUsdPriceFeed: 0xF9680D99D6C9589e2a93a78A04A279e509205945,
            functionsRouter: 0xdc2AAF042Aeff2E68B3e8E33F19e4B9fA7C73F10,
            donId: 0x66756e2d706f6c79676f6e2d6d61696e6e65742d310000000000000000000000,
            subId: 0, // TODO
            // USDC on Polygon
            redemptionCoin: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359,
            linkToken: 0xb0897686c545045aFc77CF20eC7A532E3120E0F1,
            ccipRouter: 0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe,
            ccipChainSelector: 4_051_577_828_743_386_545,
            secretVersion: 0, // fill in!
            secretSlot: 0 // fill in!
         });
        // minimumRedemptionAmount: 30e6 // Please see your brokerage for min redemption amounts
        // https://alpaca.markets/support/crypto-wallet-faq
    }

    function getAmoyConfig() internal pure returns (NetworkConfig memory config) {
        config = NetworkConfig({
            tslaPriceFeed: 0xc2e2848e28B9fE430Ab44F55a8437a33802a219C, // this is LINK / USD but it'll work fine
            usdcPriceFeed: 0x1b8739bB4CdF0089d07097A9Ae5Bd274b29C6F16,
            ethUsdPriceFeed: 0xF0d50568e3A7e8259E16663972b11910F89BD8e7,
            functionsRouter: 0xC22a79eBA640940ABB6dF0f7982cc119578E11De,
            donId: 0x66756e2d706f6c79676f6e2d616d6f792d310000000000000000000000000000,
            subId: 1396, // TODO
            // USDC on Amoy
            redemptionCoin: 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582, 
            linkToken: 0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904,
            ccipRouter: 0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2,
            ccipChainSelector: 16_281_711_391_670_634_445,
            secretVersion: 0, // fill in!
            secretSlot: 0 // fill in!
         });
        // minimumRedemptionAmount: 30e6 // Please see your brokerage for min redemption amounts
        // https://alpaca.markets/support/crypto-wallet-faq
    }

    function getSepoliaConfig() internal pure returns (NetworkConfig memory config) {
        config = NetworkConfig({
            tslaPriceFeed: 0xc59E3633BAAC79493d908e63626716e204A45EdF, // this is LINK / USD but it'll work fine
            usdcPriceFeed: 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E,
            ethUsdPriceFeed: 0x694AA1769357215DE4FAC081bf1f309aDC325306,
            functionsRouter: 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0,
            donId: 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000,
            subId: 2274,
            // USDC on Sepolia
            redemptionCoin: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238,
            linkToken: 0x779877A7B0D9E8603169DdbD7836e478b4624789,
            ccipRouter: 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59,
            ccipChainSelector: 16_015_286_601_757_825_753,
            secretVersion: 0, // fill in!
            secretSlot: 0 // fill in!
         });
        // minimumRedemptionAmount: 30e6 // Please see your brokerage for min redemption amounts
        // https://alpaca.markets/support/crypto-wallet-faq
    }

    /*
    function getFujiConfig() internal pure returns (NetworkConfig memory config) {
        config = NetworkConfig({
            tslaPriceFeed: 0x7898AcCC83587C3c55116C5230c17a6d7c8cF485, // TSLA/USD on Fuji
            usdcPriceFeed: 0x7898AcCC83587C3c55116C5230c17a6d7c8cF485, // Using same feed for demo
            ethUsdPriceFeed: 0x86d67c3D38D2bCeE722E601025C25a575021c6EA, // ETH/USD on Fuji
            functionsRouter: 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0, // Chainlink Functions Router on Fuji
            donId: 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000, // DON ID for Fuji
            subId: 0, // TODO: Create subscription
            redemptionCoin: 0x5425890298aed601595a70AB815c96711a31Bc65, // USDC on Fuji
            linkToken: 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846, // LINK on Fuji
            ccipRouter: 0xF694E193200268f9a4868e4Aa017A0118C9a8177, // CCIP Router on Fuji
            ccipChainSelector: 14_767_482_510_784_806_043, // Fuji CCIP Chain Selector
            secretVersion: 0, // fill in!
            secretSlot: 0 // fill in!
         });
    }

    function getAvalancheConfig() internal pure returns (NetworkConfig memory config) {
        config = NetworkConfig({
            tslaPriceFeed: 0x3CA13391E9fb38a75330fb28f8cc2eB3D9ceceED, // TSLA/USD on Avalanche
            usdcPriceFeed: 0xF096872672F44d6EBA71458D74fe67F9a77a23B9, // USDC/USD on Avalanche
            ethUsdPriceFeed: 0x976B3D034E162d8bD72D6b9C989d545b839003b0, // ETH/USD on Avalanche
            functionsRouter: 0x9F82a6A0758517fD0bA7Ba9616d7a89C5320E8eE, // Chainlink Functions Router on Avalanche
            donId: 0x66756e2d6176616c616e6368652d6d61696e6e65742d3100000000000000000000, // DON ID for Avalanche
            subId: 0, // TODO: Create subscription
            redemptionCoin: 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E, // USDC on Avalanche
            linkToken: 0x5947BB275c521040051D82396192181b413227A3, // LINK on Avalanche
            ccipRouter: 0xF4c7E640EdA248ef95972845a62bdC74237805dB, // CCIP Router on Avalanche
            ccipChainSelector: 6_433_500_567_565_415_381, // Avalanche CCIP Chain Selector
            secretVersion: 0, // fill in!
            secretSlot: 0 // fill in!
         });
    }
    */

    function getAnvilEthConfig() internal view returns (NetworkConfig memory anvilNetworkConfig) {
        anvilNetworkConfig = NetworkConfig({
            tslaPriceFeed: address(tslaFeedMock),
            usdcPriceFeed: address(tslaFeedMock),
            ethUsdPriceFeed: address(ethUsdFeedMock),
            functionsRouter: address(functionsRouterMock),
            donId: 0x66756e2d706f6c79676f6e2d6d756d6261692d31000000000000000000000000, // Dummy
            subId: 1, // Dummy non-zero
            redemptionCoin: address(usdcMock),
            linkToken: address(linkTokenMock),
            ccipRouter: address(ccipRouterMock),
            ccipChainSelector: 1, // This is a dummy non-zero value
            secretVersion: 0,
            secretSlot: 0
        });
        // minimumRedemptionAmount: 30e6 // Please see your brokerage for min redemption amounts
        // https://alpaca.markets/support/crypto-wallet-faq
    }

    function _setupAnvilConfig() internal returns (NetworkConfig memory) {
        usdcMock = new MockUSDC();
        tslaFeedMock = new MockV3Aggregator(DECIMALS, INITIAL_ANSWER);
        ethUsdFeedMock = new MockV3Aggregator(DECIMALS, INITIAL_ANSWER);
        usdcFeedMock = new MockV3Aggregator(DECIMALS, INITIAL_ANSWER_USD);
        functionsRouterMock = new MockFunctionsRouter();
        ccipRouterMock = new MockCCIPRouter();
        linkTokenMock = new MockLinkToken();
        return getAnvilEthConfig();
    }
}
