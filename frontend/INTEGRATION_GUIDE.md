# DREMS Platform Integration Guide

## 🎉 Successfully Deployed Contracts

All DREMS contracts have been deployed and verified on **Avalanche Fuji Testnet**:

### 📋 Contract Addresses

| Contract | Address | Snowtrace Link |
|----------|---------|----------------|
| **PropertyToken** | `0x789f82778A8d9eB6514a457112a563A89F79A2f1` | [View on Snowtrace](https://testnet.snowtrace.io/address/0x789f82778A8d9eB6514a457112a563A89F79A2f1) |
| **PropertyAutomation** | `0x4f330C74c7bd84665722bA0664705e2f2E6080DC` | [View on Snowtrace](https://testnet.snowtrace.io/address/0x4f330C74c7bd84665722bA0664705e2f2E6080DC) |
| **PropertyBridge** | `0x4adDFcfa066E0c955bC0347d9565454AD7Ceaae1` | [View on Snowtrace](https://testnet.snowtrace.io/address/0x4adDFcfa066E0c955bC0347d9565454AD7Ceaae1) |
| **SyntheticProperty** | `0x199516b47F1ce8C77617b58526ad701bF1f750FA` | [View on Snowtrace](https://testnet.snowtrace.io/address/0x199516b47F1ce8C77617b58526ad701bF1f750FA) |

### 🔗 Network Configuration

```typescript
const AVALANCHE_FUJI = {
  chainId: 43113,
  name: 'Avalanche Fuji Testnet',
  rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
  blockExplorer: 'https://testnet.snowtrace.io',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
};
```

## 🏠 Sample Properties (Already Registered)

The deployment automatically registered 2 sample properties for testing:

### Property 1: Residential
- **ID**: `MLS123456`
- **Address**: `0x0000000000000000000000000000000000000001`
- **Location**: 123 Main St, San Francisco, CA 94102
- **Type**: Residential Single Family
- **Value**: $1,000,000
- **Tokens**: 1,000,000
- **Yield**: 8% APY
- **Monthly Rent**: $8,000

### Property 2: Commercial
- **ID**: `COM789012`
- **Address**: `0x0000000000000000000000000000000000000002`
- **Location**: 456 Business Ave, New York, NY 10001
- **Type**: Commercial Office
- **Value**: $5,000,000
- **Tokens**: 5,000,000
- **Yield**: 6% APY
- **Monthly Rent**: $25,000

## 🔧 Frontend Integration Steps

### 1. Update Wagmi Configuration

```typescript
// wagmi.config.ts
import { avalancheFuji } from 'wagmi/chains';

const config = createConfig({
  chains: [avalancheFuji],
  // ... other config
});
```

### 2. Add Contract ABIs

The ABIs are available in:
- `frontend/contracts/PropertyToken.json`
- `frontend/contracts/PropertyAutomation.json`
- `frontend/contracts/PropertyBridge.json`
- `frontend/contracts/SyntheticProperty.json`

### 3. Basic Contract Interaction Example

```typescript
import { useContractRead, useContractWrite } from 'wagmi';

// Read property information
const { data: propertyInfo } = useContractRead({
  address: '0x789f82778A8d9eB6514a457112a563A89F79A2f1',
  abi: PropertyTokenABI,
  functionName: 'getProperty',
  args: ['0x0000000000000000000000000000000000000001'], // Sample property address
});

// Invest in property
const { write: investInProperty } = useContractWrite({
  address: '0x789f82778A8d9eB6514a457112a563A89F79A2f1',
  abi: PropertyTokenABI,
  functionName: 'investInProperty',
});
```

## 🎯 Key Functions to Integrate

### PropertyToken Contract

#### Core Functions:
- `getProperty(address)` - Get property details
- `investInProperty(address, uint256)` - Invest in a property
- `getUserPropertyBalance(address, address)` - Get user's property tokens
- `registerProperty(...)` - Register new property (admin only)

#### Events to Listen For:
- `PropertyRegistered` - New property added
- `PropertyTokensMinted` - Investment made
- `RentDistributed` - Rent payments distributed

### SyntheticProperty Contract

#### Core Functions:
- `mintSynthetic(address, uint256, uint256)` - Create synthetic position
- `burnSynthetic(address, uint256)` - Close synthetic position
- `getPosition(address, address)` - Get user's synthetic position
- `liquidatePosition(address, address)` - Liquidate undercollateralized position

### PropertyAutomation Contract

#### Core Functions:
- `getAutomationInfo(address)` - Get automation settings
- `registerPropertyForAutomation(...)` - Enable automation

### PropertyBridge Contract

#### Core Functions:
- `sendCrossChainMessage(...)` - Send cross-chain messages
- `getChainConfig(uint64)` - Get chain configuration

## 🔗 Chainlink Services Integration

### Required LINK Funding

Your contracts use these Chainlink services that need LINK tokens:

1. **Chainlink Functions** (PropertyToken)
   - Updates property valuations
   - Collects rent data
   - **LINK Address**: `0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846`

2. **Chainlink Automation** (PropertyAutomation)
   - Triggers automated tasks
   - Manages property maintenance

3. **Chainlink CCIP** (PropertyBridge)
   - Cross-chain messaging
   - Multi-chain property management

### Funding Steps:

1. Get LINK tokens from [Avalanche Fuji Faucet](https://faucets.chain.link/fuji)
2. Send LINK to your deployed contracts
3. Configure automation upkeep on [Chainlink Automation](https://automation.chain.link/)

## 🧪 Testing Your Integration

### 1. Connect to Avalanche Fuji
Make sure your wallet is connected to Avalanche Fuji testnet.

### 2. Get Test AVAX
Use the [Avalanche Fuji Faucet](https://faucet.avax.network/) to get test AVAX.

### 3. Test Basic Functions

```typescript
// Test reading property info
const property1 = await propertyToken.read.getProperty(['0x0000000000000000000000000000000000000001']);

// Test investment (requires AVAX)
const investTx = await propertyToken.write.investInProperty(
  ['0x0000000000000000000000000000000000000001', parseEther('0.1')],
  { value: parseEther('0.1') }
);
```

## 🚀 Next Steps

1. **Update Frontend Components** with new contract addresses
2. **Test Contract Interactions** using the sample properties
3. **Fund Contracts with LINK** for Chainlink services
4. **Set up Automation** for property management
5. **Configure Cross-Chain** for multi-chain support

## 📞 Support

- **Deployment Info**: Block 41835191 on Avalanche Fuji
- **Gas Used**: 10,142,277 total
- **Deployer**: `0x3C343AD077983371b29fee386bdBC8a92E934C51`
- **All contracts verified** on Snowtrace

Your DREMS platform is now live and ready for integration! 🎉 