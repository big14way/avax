# DREMS Platform

A decentralized real estate management system built on Avalanche Fuji testnet using Chainlink services.

## Overview

DREMS is a comprehensive blockchain platform for real estate tokenization and management. It enables property tokenization, cross-chain bridging, synthetic property tokens, and automated property management through Chainlink automation.

## Architecture

The platform consists of four main smart contracts:

1. **PropertyToken** - Core ERC-721 contract for property tokenization with Chainlink Functions integration
2. **PropertyAutomation** - Chainlink Keepers-powered automation for property management tasks
3. **PropertyBridge** - Cross-chain property token bridging using Chainlink CCIP
4. **SyntheticProperty** - ERC-20 synthetic tokens backed by real estate with price feeds

## Deployed Contracts (Avalanche Fuji Testnet)

- **PropertyToken**: `0x789f82778a8d9eb6514a457112a563a89f79a2f1`
- **PropertyAutomation**: `0x4f330c74c7bd84665722ba0664705e2f2e6080dc`
- **PropertyBridge**: `0x4addfcfa066e0c955bc0347d9565454ad7ceaae1`
- **SyntheticProperty**: `0x199516b47f1ce8c77617b58526ad701bf1f750fa`

## Features

- **Property Tokenization**: Convert real estate into NFTs with metadata and valuation
- **Cross-Chain Bridging**: Move property tokens across different blockchains
- **Synthetic Tokens**: Create ERC-20 tokens backed by real estate portfolios
- **Automated Management**: Chainlink Keepers for rental payments, maintenance, and updates
- **Oracle Integration**: Real-time property valuations and market data
- **Decentralized Frontend**: React/Next.js interface with RainbowKit wallet integration

## Technology Stack

- **Smart Contracts**: Solidity, Foundry
- **Frontend**: Next.js, React, TypeScript, RainbowKit, Wagmi
- **Blockchain**: Avalanche Fuji Testnet
- **Oracles**: Chainlink Price Feeds, Functions, CCIP, Automation
- **Testing**: Foundry Test Suite

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [Foundry](https://getfoundry.sh/)
- MetaMask or compatible Web3 wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/drems-platform.git
cd drems-platform
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Fill in your environment variables
```

4. Start the development server:
```bash
npm run dev
```

### Smart Contract Deployment

1. Set up your environment:
```bash
# Copy and fill in your private key and RPC URLs
cp .env.example .env
```

2. Deploy contracts:
```bash
# Deploy to Avalanche Fuji testnet
./deploy_avalanche.sh
```

## Usage

1. **Register Properties**: Use the PropertyToken contract to mint property NFTs
2. **Cross-Chain Transfer**: Bridge tokens using PropertyBridge
3. **Create Synthetic Tokens**: Mint synthetic property tokens for fractional ownership
4. **Automation Setup**: Configure Chainlink Keepers for property management

## Testing

Run the test suite:
```bash
forge test
```

Run specific tests:
```bash
forge test --match-test testPropertyRegistration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

⚠️ **IMPORTANT**: This project is for educational and demonstration purposes. The contracts have not been audited. Use at your own risk in production environments. 