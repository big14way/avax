# Avalanche Deployment Guide

## 🎯 Deploying Your DeFi Platform on Avalanche Fuji Testnet

Your contracts have been tested and are ready for deployment! Here's how to deploy them on Avalanche Fuji testnet for the hackathon.

## 📋 Prerequisites

### 1. Get Testnet AVAX
- Go to [Avalanche Faucet](https://core.app/tools/testnet-faucet/)
- Use the code "avalanche-academy" 
- Or request from [Discord](https://discord.com/invite/RwXY7P6)

### 2. Set Up Environment Variables
Create a `.env` file in your project root:

```bash
# Required for deployment
PRIVATE_KEY=your_private_key_here_without_0x_prefix
SNOWTRACE_API_KEY=your_snowtrace_api_key_here

# Other API keys (set to dummy values if not needed)
POLYGONSCAN_API_KEY=dummy
ETHERSCAN_API_KEY=dummy
```

### 3. Get Snowtrace API Key (Optional, for verification)
- Go to [Snowtrace](https://snowtrace.io/apis)
- Create an account and get your API key

## 🚀 Deployment Commands

### Test Local Deployment First
```bash
# Start local node
anvil --port 8545 --host 0.0.0.0

# In another terminal, test deployment
POLYGONSCAN_API_KEY=test SNOWTRACE_API_KEY=test ETHERSCAN_API_KEY=test make test-deploy
```

### Deploy to Avalanche Fuji Testnet
```bash
# Make sure you have AVAX in your wallet for gas fees
POLYGONSCAN_API_KEY=dummy SNOWTRACE_API_KEY=your_key_here make deploy-fuji
```

### Deploy to Avalanche Mainnet (Production)
```bash
# Only when ready for mainnet
POLYGONSCAN_API_KEY=dummy SNOWTRACE_API_KEY=your_key_here make deploy-avalanche
```

## 📊 Network Information

### Avalanche Fuji Testnet
- **Chain ID**: 43113
- **RPC URL**: https://api.avax-test.network/ext/bc/C/rpc
- **Explorer**: https://testnet.snowtrace.io/
- **Currency**: AVAX

### Avalanche Mainnet
- **Chain ID**: 43114
- **RPC URL**: https://api.avax.network/ext/bc/C/rpc
- **Explorer**: https://snowtrace.io/
- **Currency**: AVAX

## 🔗 Add Network to MetaMask

### Fuji Testnet
```javascript
Network Name: Avalanche Fuji C-Chain
New RPC URL: https://api.avax-test.network/ext/bc/C/rpc
Chain ID: 43113
Symbol: AVAX
Explorer: https://testnet.snowtrace.io/
```

### Avalanche Mainnet
```javascript
Network Name: Avalanche C-Chain
New RPC URL: https://api.avax.network/ext/bc/C/rpc
Chain ID: 43114
Symbol: AVAX
Explorer: https://snowtrace.io/
```

## 📝 What Gets Deployed

Currently, the simple deployment script deploys:
- **sTSLA**: Synthetic Tesla token contract
- Uses placeholder price feeds for testing

## 🔧 Next Steps for Hackathon

1. **Test Your Deployment**: Interact with your deployed contracts
2. **Add Frontend**: Create a React frontend to interact with your contracts
3. **Integrate Chainlink**: Connect real price feeds and Chainlink Functions
4. **Document Features**: Highlight your DeFi innovation
5. **Create Demo**: Show cross-chain functionality if applicable

## 🏆 Avalanche Bounty Requirements

✅ **Deployed on Avalanche Fuji Testnet**  
✅ **Smart contract-based dApp**  
✅ **DeFi vertical** (synthetic assets, staking, cross-chain)  
✅ **Uses Solidity**  

### For Extra Points:
- Deploy on your own Avalanche L1 (Advanced)
- Integrate Core wallet in frontend
- Use Chainlink VRF or other Avalanche-specific features

## 🛠 Troubleshooting

### Common Issues:
1. **Insufficient gas**: Make sure you have enough AVAX
2. **RPC connection**: Check your internet connection
3. **Private key format**: No 0x prefix needed in .env

### Get Help:
- [Avalanche Discord](https://discord.com/invite/RwXY7P6)
- [Developer Documentation](https://docs.avax.network/)
- [Avalanche Academy](https://academy.avax.network/)

## 📚 Resources

- [Avalanche Developer Hub](https://build.avax.network/)
- [Chainlink on Avalanche](https://docs.chain.link/avalanche)
- [Core Wallet Integration](https://docs.avax.network/dapps/browser-extension)

Good luck with your hackathon submission! 🚀 