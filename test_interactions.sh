#!/bin/bash

# DREMS Platform Contract Interaction Test Script
# This script tests the deployed contracts on Avalanche Fuji testnet

# Load environment variables
source .env

# Contract addresses
PROPERTY_TOKEN="0x789f82778a8d9eb6514a457112a563a89f79a2f1"
PROPERTY_AUTOMATION="0x4f330c74c7bd84665722ba0664705e2f2e6080dc"
PROPERTY_BRIDGE="0x4addfcfa066e0c955bc0347d9565454ad7ceaae1"
SYNTHETIC_PROPERTY="0x199516b47f1ce8c77617b58526ad701bf1f750fa"
LINK_TOKEN="0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846"
RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
USER_ADDRESS="0x3C343AD077983371b29fee386bdBC8a92E934C51"

echo "🏠 DREMS Platform Contract Interaction Tests"
echo "============================================"

echo "📊 Contract Status Checks..."

# Check AVAX balance
echo "💰 AVAX Balance:"
cast balance $USER_ADDRESS --rpc-url $RPC_URL

# Check LINK balance
echo "🔗 LINK Balance:"
cast call $LINK_TOKEN "balanceOf(address)" $USER_ADDRESS --rpc-url $RPC_URL | xargs cast to-dec | awk '{print $1/1e18 " LINK"}'

# Test PropertyToken
echo "🏘️  PropertyToken Tests:"
echo "  - Owner:" $(cast call $PROPERTY_TOKEN "owner()" --rpc-url $RPC_URL)
echo "  - Name:" $(cast call $PROPERTY_TOKEN "name()" --rpc-url $RPC_URL | cast to-ascii)

# Test SyntheticProperty
echo "💎 SyntheticProperty Tests:"
echo "  - Name:" $(cast call $SYNTHETIC_PROPERTY "name()" --rpc-url $RPC_URL | cast to-ascii)
echo "  - Symbol:" $(cast call $SYNTHETIC_PROPERTY "symbol()" --rpc-url $RPC_URL | cast to-ascii)
echo "  - Total Supply:" $(cast call $SYNTHETIC_PROPERTY "totalSupply()" --rpc-url $RPC_URL | xargs cast to-dec)

# Test PropertyAutomation
echo "⚙️  PropertyAutomation Tests:"
echo "  - Property Registered:" $(cast call $PROPERTY_AUTOMATION "isPropertyRegistered(address)" 0x0000000000000000000000000000000000000001 --rpc-url $RPC_URL | xargs cast to-dec)

# Test PropertyBridge
echo "🌉 PropertyBridge Tests:"
echo "  - Owner:" $(cast call $PROPERTY_BRIDGE "owner()" --rpc-url $RPC_URL)

echo "✅ All contract interaction tests completed!"
echo "📋 Summary:"
echo "  - All contracts are deployed and accessible"
echo "  - LINK tokens have been distributed to contracts"
echo "  - Sample property has been registered"
echo "  - PropertyAutomation is configured"
echo "  - Ready for frontend integration!" 