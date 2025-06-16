# DREMS Frontend - TypeScript

A modern, responsive frontend for the DREMS (Decentralized Real Estate Marketplace) platform built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **TypeScript** - Full type safety for better development experience
- **Next.js 14** - React framework with app router and server components
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Wagmi + Viem** - React hooks for Ethereum with type safety
- **RainbowKit** - Beautiful wallet connection UI
- **Framer Motion** - Smooth animations and transitions
- **Real-time Contract Interaction** - Direct integration with sTSLA synthetic asset contract

## 🛠 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the frontend directory:
   ```env
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
frontend/
├── config/
│   ├── web3Config.ts        # Web3 and chain configurations
│   └── contractConfig.ts    # Contract ABIs and addresses
├── pages/
│   ├── _app.tsx            # App wrapper with providers
│   ├── index.tsx           # Landing page
│   └── demo.tsx            # sTSLA contract demo
├── types/
│   └── contracts.ts        # TypeScript type definitions
├── styles/
│   └── globals.css         # Global styles and Tailwind CSS
└── sTSLA_ABI.json         # Smart contract ABI
```

## 🔗 Key Features

### 1. **Landing Page (`/`)**
- Platform overview and features
- Chainlink integration showcase
- Property investment opportunities
- Connect wallet functionality

### 2. **Demo Page (`/demo`)**
- Live Chainlink price feeds (TSLA/USD, ETH/USD)
- Mint sTSLA tokens with ETH collateral
- Burn sTSLA tokens and redeem ETH
- Real-time health factor monitoring
- User portfolio tracking

## 🌐 Web3 Integration

The frontend integrates with:
- **Avalanche Fuji Testnet** (Chain ID: 43113)
- **sTSLA Contract**: `0x211a38792781b2c7a584a96F0e735d56e809fe85`
- **Chainlink Price Feeds** for real-time asset pricing
- **MetaMask, WalletConnect, and other wallets** via RainbowKit

## 🎨 Design System

- **Color Palette**: Blue primary, green secondary, purple accent
- **Typography**: Inter font family
- **Components**: Reusable card, button, and form components
- **Responsive**: Mobile-first design approach
- **Animations**: Smooth transitions with Framer Motion

## 📊 Contract Interactions

The demo page showcases:
1. **Reading contract state** (balances, health factor, prices)
2. **Writing to contract** (minting and burning tokens)
3. **Real-time updates** with automatic refresh
4. **Error handling** with user-friendly notifications

## 🔧 Development

- **Type checking**: `npm run type-check`
- **Linting**: `npm run lint`
- **Building**: `npm run build`
- **Production**: `npm run start`

## 🌟 Next Steps

1. Add more property types and investment options
2. Implement portfolio analytics and charts
3. Add cross-chain functionality with CCIP
4. Integrate property management automation
5. Add social features and community tools

## 📝 Environment Setup

For the best development experience:
1. Install the recommended VS Code extensions
2. Configure your wallet with Avalanche Fuji testnet
3. Get testnet AVAX from the Avalanche faucet
4. Connect your wallet to interact with the demo

## 🎯 Demo Flow

1. **Connect Wallet** - Use RainbowKit to connect your Web3 wallet
2. **View Prices** - See live TSLA and ETH prices from Chainlink oracles
3. **Mint sTSLA** - Deposit ETH as collateral to mint synthetic TSLA tokens
4. **Monitor Health** - Keep track of your collateralization ratio
5. **Burn & Redeem** - Burn sTSLA tokens to get your ETH collateral back

## 📚 Documentation

### Architecture & Design
- [System Architecture](./ARCHITECTURE.md) - Comprehensive technical architecture
- [User Journey Guide](./docs/USER_JOURNEY.md) - Detailed user experience flows
- [Performance Metrics](./docs/PERFORMANCE_METRICS.md) - System performance benchmarks

### Development Resources
- [Component Documentation](./components/) - Individual component guides
- [Contract Integration](./contracts/config.ts) - Smart contract configurations
- [Testing Strategy](./docs/) - Testing frameworks and methodologies

Built with ❤️ for the Chainlink Hackathon 2024 