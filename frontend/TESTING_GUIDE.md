# DREMS Platform Testing Guide

## Overview
Professional DeFi platform for real estate tokenization with live Chainlink integration on Avalanche Fuji testnet.

**Contract Address:** `0x211a38792781b2c7a584a96F0e735d56e809fe85`
**Network:** Avalanche Fuji Testnet

## Prerequisites

1. **MetaMask or Web3 Wallet** - Install and configure
2. **Avalanche Fuji Testnet** - Add to your wallet:
   - Network Name: Avalanche Fuji C-Chain
   - RPC URL: `https://api.avax-test.network/ext/bc/C/rpc`
   - Chain ID: `43113`
   - Symbol: `AVAX`
   - Explorer: `https://testnet.snowtrace.io`

3. **Testnet AVAX** - Get free tokens from [Avalanche Faucet](https://faucet.avax.network/)

## Application Structure

The DREMS platform is now a professional single-page application with four main tabs:

### 1. Overview Tab
- **Live Chainlink Price Feeds** - Real-time TSLA and ETH prices
- **Platform Statistics** - TVL, active users, transactions
- **Feature Overview** - Asset tokenization, smart automation, cross-chain

### 2. Trade Tab  
- **Open Positions** - Deposit AVAX collateral and mint sTSLA
- **Close Positions** - Burn sTSLA and redeem AVAX
- **Real-time Transaction Processing** - Live blockchain interactions

### 3. Portfolio Tab
- **Position Overview** - Your sTSLA balance, collateral, and minted amounts
- **Health Factor Monitoring** - Real-time liquidation risk assessment
- **Position Management** - Track and manage your investments

### 4. Analytics Tab
- **Live Market Data** - Real-time price feeds with Chainlink integration
- **Protocol Metrics** - Oracle updates, active positions, liquidations
- **Contract Information** - Deployment details and integration status

## Testing Workflow

### Step 1: Platform Overview
1. Navigate to `http://localhost:3000`
2. Observe the professional interface with live data
3. Check that TSLA and ETH prices are updating from real Chainlink feeds
4. Verify the navigation tabs work smoothly

### Step 2: Wallet Connection
1. Click "Connect Wallet" in the header
2. Select your wallet and connect to Avalanche Fuji
3. Ensure you have testnet AVAX for transactions
4. Verify your wallet address appears correctly

### Step 3: Test Trading Functionality
1. Navigate to the **Trade** tab
2. **Open a Position:**
   - Enter small amounts (e.g., 0.01 AVAX, 0.01 sTSLA)
   - Click "Open Position"
   - Confirm the transaction in your wallet
   - Wait for confirmation and success notification

3. **Monitor Position:**
   - Switch to **Portfolio** tab
   - Verify your balance updates are reflected
   - Check that health factor is calculated correctly
   - Ensure all values are live and updating

4. **Close a Position:**
   - Return to **Trade** tab
   - Enter sTSLA amount to burn
   - Click "Close Position"
   - Confirm transaction and verify AVAX redemption

### Step 4: Verify Live Data Integration
1. Go to **Analytics** tab
2. Confirm price feeds show "Live Data" status
3. Verify Chainlink integration indicators are green
4. Check that contract information is accurate

### Step 5: Health Factor Testing
1. Open a position with minimal collateral
2. Monitor health factor in **Portfolio** tab
3. Verify warnings appear when health factor approaches 1.0
4. Test that health factor updates with price changes

## Expected Results

### ✅ Real Working Prototype
- All contract interactions execute on live testnet
- Real Chainlink price feeds provide actual market data
- Health factor calculations use live oracle data
- Transactions affect real blockchain state

### ✅ Professional Interface
- Modern, clean design with professional color scheme
- Smooth tab navigation without page reloads
- Responsive design works on mobile and desktop
- Professional DeFi platform appearance

### ✅ Live Data Integration
- TSLA/USD price feed updates with real market data
- ETH/USD price feed reflects actual Ethereum prices
- Health factor calculations use real-time oracle prices
- All data updates automatically without page refresh

### ✅ Complete Functionality
- Wallet connection and network verification
- Real smart contract interactions
- Position management and monitoring
- Risk assessment and health factor tracking

## Troubleshooting

### Common Issues
1. **"Insufficient funds"** - Get more testnet AVAX from faucet
2. **Transaction fails** - Check gas settings, ensure proper network
3. **Price feeds not updating** - Verify contract is connected and network is correct
4. **Health factor showing 0** - Connect wallet and ensure you have an active position

### Network Issues
- Ensure you're connected to Avalanche Fuji testnet (Chain ID: 43113)
- Verify you have sufficient AVAX for gas fees
- Check that your wallet is properly connected

### Contract Verification
- All contract interactions are live on Avalanche Fuji
- Price feeds use real Chainlink oracle data
- Health factor calculations reflect actual risk
- Positions affect real blockchain state

## Success Criteria

✅ Professional single-page application with smooth tab navigation  
✅ Real Chainlink price feeds display live market data  
✅ Health factor calculations use actual oracle prices  
✅ All contract interactions execute on live blockchain  
✅ Position management works with real asset backing  
✅ Modern, professional DeFi platform design  
✅ Mobile-responsive interface  
✅ Real-time data updates without page refresh  

## Contract Integration

### Live Chainlink Services
- **Price Feeds**: TSLA/USD and ETH/USD real-time data
- **Automation**: Automated liquidation monitoring
- **Functions**: Custom oracle computations
- **CCIP**: Cross-chain communication ready

### Real Blockchain Interactions
- **Deposit & Mint**: Add AVAX collateral, create sTSLA tokens
- **Burn & Redeem**: Close positions, recover collateral
- **Health Monitoring**: Real-time risk assessment
- **Oracle Integration**: Live price feed consumption

## Links
- [Live Contract on SnowTrace](https://testnet.snowtrace.io/address/0x211a38792781b2c7a584a96F0e735d56e809fe85)
- [Avalanche Faucet](https://faucet.avax.network/)
- [Chainlink Documentation](https://docs.chain.link/)

This is now a **real working prototype** of a professional DeFi platform, not a demo. All data is live, all transactions are real, and the platform provides actual financial functionality with proper risk management. 