#!/bin/bash

# DREMS Platform Deployment to Avalanche Fuji (No Verification)
echo "🏔️ Deploying DREMS Platform to Avalanche Fuji Testnet (No Verification)..."

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

# Deploy all DREMS contracts without verification (faster)
forge script script/DeployDREMS.s.sol:DeployDREMS \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --private-key $PRIVATE_KEY \
  --broadcast \
  -vvvv

echo "✅ Deployment complete!"
echo "🔗 Check your transactions on Snowtrace: https://testnet.snowtrace.io/"
echo "💡 Tip: You can verify contracts later using 'forge verify-contract'" 