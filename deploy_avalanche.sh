#!/bin/bash

# DREMS Platform Deployment to Avalanche Fuji
echo "🏔️ Deploying DREMS Platform to Avalanche Fuji Testnet..."

# Source environment variables from .env file
if [ -f .env ]; then
  echo "📄 Loading environment variables from .env file..."
  source .env
else
  echo "❌ Error: .env file not found"
  echo "Please create a .env file with your PRIVATE_KEY"
  exit 1
fi

# Check if private key is loaded
if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ Error: PRIVATE_KEY not found in .env file"
  echo "Please add PRIVATE_KEY=your_private_key_here to your .env file"
  exit 1
fi

echo "✅ Private key loaded successfully"
echo "🔑 Using wallet address derived from private key"

# Deploy all DREMS contracts
forge script script/DeployDREMS.s.sol:DeployDREMS \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvvv

echo "✅ Deployment complete!"
echo "🔗 Check contract verification on Snowtrace: https://testnet.snowtrace.io/" 