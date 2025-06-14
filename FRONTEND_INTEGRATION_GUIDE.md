# 🚀 Frontend Integration Guide: sTSLA Synthetic Asset dApp

## 📋 **Contract Details**
- **Contract Address**: `0x211a38792781b2c7a584a96F0e735d56e809fe85`
- **Network**: Avalanche Fuji Testnet (Chain ID: 43113)
- **Explorer**: https://testnet.snowtrace.io/address/0x211a38792781b2c7a584a96F0e735d56e809fe85

## 🎯 **Demo Features to Showcase**

### **Core Functionality**
1. **Deposit ETH & Mint sTSLA** - Users deposit ETH as collateral to mint synthetic Tesla tokens
2. **Real-time Price Feeds** - Display live TSLA and ETH prices via Chainlink oracles
3. **Health Factor Monitoring** - Show user's collateralization ratio and liquidation risk
4. **Redeem & Burn** - Allow users to burn sTSLA tokens and withdraw ETH collateral
5. **Portfolio Dashboard** - Display user's positions, collateral, and minted tokens

### **Advanced Features**
- **Collateral Ratio Calculator** - Real-time calculation of required collateral
- **Price Impact Simulator** - Show how TSLA price changes affect positions
- **Transaction History** - Display user's minting/burning activities
- **Risk Alerts** - Warn users when health factor approaches liquidation threshold

## 🛠 **Technical Implementation**

### **1. Web3 Setup (React/Next.js)**

```javascript
// config/web3Config.js
export const AVALANCHE_FUJI_CONFIG = {
  chainId: '0xa869', // 43113 in hex
  chainName: 'Avalanche Fuji Testnet',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
};

export const CONTRACT_CONFIG = {
  address: '0x211a38792781b2c7a584a96F0e735d56e809fe85',
  abi: [/* ABI provided by user */]
};
```

### **2. Contract Interaction Hooks**

```javascript
// hooks/usesTSLAContract.js
import { useContract, useContractRead, useContractWrite } from 'wagmi';
import { CONTRACT_CONFIG } from '../config/web3Config';

export function usesTSLAContract() {
  const contract = useContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
  });

  // Read functions
  const { data: userBalance } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'balanceOf',
    args: [userAddress],
  });

  const { data: healthFactor } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'getHealthFactor',
    args: [userAddress],
  });

  const { data: accountInfo } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'getAccountInformationValue',
    args: [userAddress],
  });

  // Write functions
  const { write: depositAndMint } = useContractWrite({
    ...CONTRACT_CONFIG,
    functionName: 'depositAndmint',
  });

  const { write: redeemAndBurn } = useContractWrite({
    ...CONTRACT_CONFIG,
    functionName: 'redeemAndBurn',
  });

  return {
    userBalance,
    healthFactor,
    accountInfo,
    depositAndMint,
    redeemAndBurn,
  };
}
```

### **3. Key Demo Components**

#### **A. Minting Interface**
```javascript
// components/MintingInterface.jsx
function MintingInterface() {
  const [ethAmount, setEthAmount] = useState('');
  const [tslaAmount, setTslaAmount] = useState('');
  const { depositAndMint } = usesTSLAContract();

  const handleMint = async () => {
    try {
      await depositAndMint({
        args: [parseEther(tslaAmount)],
        value: parseEther(ethAmount),
      });
      toast.success('sTSLA minted successfully!');
    } catch (error) {
      toast.error('Minting failed: ' + error.message);
    }
  };

  return (
    <div className="mint-interface">
      <h2>🏭 Mint Synthetic Tesla (sTSLA)</h2>
      <div className="input-group">
        <label>ETH Collateral Amount</label>
        <input 
          type="number" 
          value={ethAmount}
          onChange={(e) => setEthAmount(e.target.value)}
          placeholder="0.1"
        />
      </div>
      <div className="input-group">
        <label>sTSLA to Mint</label>
        <input 
          type="number" 
          value={tslaAmount}
          onChange={(e) => setTslaAmount(e.target.value)}
          placeholder="1.0"
        />
      </div>
      <button onClick={handleMint} className="mint-btn">
        Deposit ETH & Mint sTSLA
      </button>
    </div>
  );
}
```

#### **B. Price Feed Display**
```javascript
// components/PriceFeedDisplay.jsx
function PriceFeedDisplay() {
  const { data: tslaPrice } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'getUsdAmountFromTsla',
    args: [parseEther('1')], // 1 TSLA in USD
  });

  const { data: ethPrice } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'getUsdAmountFromEth',
    args: [parseEther('1')], // 1 ETH in USD
  });

  return (
    <div className="price-feed">
      <h2>📊 Live Chainlink Price Feeds</h2>
      <div className="price-cards">
        <div className="price-card">
          <h3>🚗 TSLA/USD</h3>
          <p className="price">${formatEther(tslaPrice || 0)}</p>
          <span className="source">Powered by Chainlink</span>
        </div>
        <div className="price-card">
          <h3>⚡ ETH/USD</h3>
          <p className="price">${formatEther(ethPrice || 0)}</p>
          <span className="source">Powered by Chainlink</span>
        </div>
      </div>
    </div>
  );
}
```

#### **C. Health Factor Monitor**
```javascript
// components/HealthFactorMonitor.jsx
function HealthFactorMonitor({ userAddress }) {
  const { data: healthFactor } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'getHealthFactor',
    args: [userAddress],
  });

  const healthFactorFormatted = healthFactor ? formatEther(healthFactor) : '0';
  const isHealthy = parseFloat(healthFactorFormatted) > 1.0;

  return (
    <div className={`health-monitor ${isHealthy ? 'healthy' : 'danger'}`}>
      <h3>🏥 Health Factor</h3>
      <div className="health-value">
        {healthFactorFormatted}
      </div>
      <div className="health-status">
        {isHealthy ? '✅ Safe' : '⚠️ Risk of Liquidation'}
      </div>
      <div className="health-bar">
        <div 
          className="health-fill" 
          style={{ width: `${Math.min(parseFloat(healthFactorFormatted) * 50, 100)}%` }}
        />
      </div>
    </div>
  );
}
```

## 🎨 **Demo Flow & User Experience**

### **Step 1: Connect Wallet**
- User connects MetaMask to Avalanche Fuji testnet
- Display user's AVAX balance and wallet address

### **Step 2: View Live Prices**
- Show real-time TSLA and ETH prices from Chainlink oracles
- Highlight that prices update automatically via blockchain

### **Step 3: Mint sTSLA Tokens**
- User inputs ETH amount to deposit as collateral
- Calculate maximum sTSLA they can mint (150% collateralization)
- Execute `depositAndmint()` transaction
- Show transaction hash and success message

### **Step 4: Monitor Position**
- Display user's collateral amount and minted sTSLA
- Show health factor and liquidation risk
- Real-time updates as prices change

### **Step 5: Redeem & Burn**
- User can burn sTSLA tokens to withdraw ETH collateral
- Execute `redeemAndBurn()` transaction
- Update portfolio display

## 🔗 **Chainlink Integration Highlights**

### **Price Feed Demonstration**
```javascript
// Show how Chainlink feeds work
const demonstrateChainlinkFeeds = async () => {
  // Get TSLA price in USD
  const tslaUsdPrice = await contract.getUsdAmountFromTsla(parseEther('1'));
  
  // Get ETH price in USD  
  const ethUsdPrice = await contract.getUsdAmountFromEth(parseEther('1'));
  
  // Calculate collateral ratio
  const collateralRatio = (ethUsdPrice * ethCollateral) / (tslaUsdPrice * tslaMinted);
  
  console.log('🔗 Chainlink Data:');
  console.log(`TSLA/USD: $${formatEther(tslaUsdPrice)}`);
  console.log(`ETH/USD: $${formatEther(ethUsdPrice)}`);
  console.log(`Collateral Ratio: ${collateralRatio.toFixed(2)}%`);
};
```

## 📱 **UI/UX Best Practices**

### **Visual Elements**
- **Tesla Branding**: Use Tesla-inspired colors (red, black, white)
- **Real-time Updates**: Show loading states and live data updates
- **Transaction Feedback**: Clear success/error messages with transaction links
- **Responsive Design**: Mobile-friendly interface

### **Educational Elements**
- **Tooltips**: Explain synthetic assets and collateralization
- **Risk Warnings**: Clear alerts about liquidation risks
- **How It Works**: Step-by-step guide for new users

## 🚀 **Deployment Checklist**

### **Frontend Setup**
- [ ] Install dependencies: `wagmi`, `ethers`, `@rainbow-me/rainbowkit`
- [ ] Configure Avalanche Fuji network
- [ ] Add contract ABI and address
- [ ] Implement wallet connection
- [ ] Create contract interaction hooks

### **Demo Features**
- [ ] Price feed display with Chainlink branding
- [ ] Minting interface with collateral calculator
- [ ] Health factor monitoring with visual indicators
- [ ] Portfolio dashboard with transaction history
- [ ] Redeem/burn functionality

### **Testing**
- [ ] Test on Avalanche Fuji testnet
- [ ] Verify all contract interactions work
- [ ] Test edge cases (insufficient collateral, etc.)
- [ ] Mobile responsiveness testing

## 🏆 **Hackathon Demo Script**

### **Opening (30 seconds)**
"Welcome to our sTSLA synthetic asset platform built on Avalanche! This dApp allows users to mint synthetic Tesla stock tokens backed by ETH collateral, powered by Chainlink price feeds."

### **Live Demo (2 minutes)**
1. **Show Price Feeds**: "Here you can see live TSLA and ETH prices from Chainlink oracles updating in real-time"
2. **Mint Tokens**: "I'll deposit 0.1 ETH as collateral to mint sTSLA tokens - notice the 150% collateralization requirement"
3. **Health Factor**: "The health factor shows our position safety - if it drops below 1.0, liquidation risk increases"
4. **Blockchain Interaction**: "Each transaction is recorded on Avalanche Fuji testnet - here's the transaction hash"

### **Technical Highlights (1 minute)**
- "Built with Solidity 0.8.30 and Foundry framework"
- "Integrates Chainlink price feeds for accurate, decentralized pricing"
- "Deployed and verified on Avalanche Fuji testnet"
- "Features over-collateralized synthetic asset minting"

### **Closing (30 seconds)**
"This demonstrates the power of DeFi on Avalanche - bringing traditional assets like Tesla stock to the blockchain with full transparency and decentralization!"

---

## 📞 **Next Steps**

1. **Set up your frontend framework** (React/Next.js recommended)
2. **Install Web3 libraries** (wagmi, ethers, rainbowkit)
3. **Implement the components** shown above
4. **Test thoroughly** on Avalanche Fuji testnet
5. **Deploy your frontend** (Vercel, Netlify, etc.)
6. **Create demo video** for hackathon submission

**Your sTSLA contract is ready for integration! The ABI you provided contains all the functions needed for a complete DeFi experience.** 🚀 