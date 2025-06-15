// DREMS Platform Contract Configuration
// Deployed on Avalanche Fuji Testnet

import PropertyTokenABI from './PropertyToken.json';
import PropertyAutomationABI from './PropertyAutomation.json';
import PropertyBridgeABI from './PropertyBridge.json';
import SyntheticPropertyABI from './SyntheticProperty.json';

export const NETWORK_CONFIG = {
  chainId: 43113,
  name: 'Avalanche Fuji Testnet',
  rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
  blockExplorer: 'https://testnet.snowtrace.io',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
} as const;

export const CONTRACT_ADDRESSES = {
  PropertyToken: '0x789f82778A8d9eB6514a457112a563A89F79A2f1',
  PropertyAutomation: '0x4f330C74c7bd84665722bA0664705e2f2E6080DC',
  PropertyBridge: '0x4adDFcfa066E0c955bC0347d9565454AD7Ceaae1',
  SyntheticProperty: '0x199516b47F1ce8C77617b58526ad701bF1f750FA',
} as const;

export const DEPLOYMENT_INFO = {
  deployedAt: '2025-06-14T21:00:00Z',
  deployer: '0x3C343AD077983371b29fee386bdBC8a92E934C51',
  blockNumber: 41835191,
  totalGasUsed: 10142277,
  verified: true,
  verificationUrls: {
    PropertyToken: 'https://testnet.snowtrace.io/address/0x789f82778A8d9eB6514a457112a563A89F79A2f1',
    PropertyAutomation: 'https://testnet.snowtrace.io/address/0x4f330C74c7bd84665722bA0664705e2f2E6080DC',
    PropertyBridge: 'https://testnet.snowtrace.io/address/0x4adDFcfa066E0c955bC0347d9565454AD7Ceaae1',
    SyntheticProperty: 'https://testnet.snowtrace.io/address/0x199516b47F1ce8C77617b58526ad701bF1f750FA',
  },
} as const;

// Sample Properties (registered during deployment)
export const SAMPLE_PROPERTIES = [
  {
    id: 'MLS123456',
    address: '0x0000000000000000000000000000000000000001',
    physicalAddress: '123 Main St, San Francisco, CA 94102',
    type: 'RESIDENTIAL_SINGLE_FAMILY',
    initialValue: '1000000000000000000000000', // $1,000,000 (18 decimals)
    totalTokens: '1000000000000000000000000', // 1,000,000 tokens
    expectedYield: 800, // 8% (800 basis points)
    monthlyRent: '8000000000000000000000', // $8,000 (18 decimals)
  },
  {
    id: 'COM789012',
    address: '0x0000000000000000000000000000000000000002',
    physicalAddress: '456 Business Ave, New York, NY 10001',
    type: 'COMMERCIAL_OFFICE',
    initialValue: '5000000000000000000000000', // $5,000,000 (18 decimals)
    totalTokens: '5000000000000000000000000', // 5,000,000 tokens
    expectedYield: 600, // 6% (600 basis points)
    monthlyRent: '25000000000000000000000', // $25,000 (18 decimals)
  },
] as const;

// Chainlink Service Configuration
export const CHAINLINK_CONFIG = {
  functionsRouter: '0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0',
  donId: '0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000',
  ccipRouter: '0xF694E193200268f9a4868e4Aa017A0118C9a8177',
  ethUsdFeed: '0x86d67c3D38D2bCeE722E601025C25a575021c6EA',
  linkToken: '0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846',
} as const;

// Export ABIs
export { PropertyTokenABI, PropertyAutomationABI, PropertyBridgeABI, SyntheticPropertyABI };

// Helper function to get contract config
export function getContractConfig(contractName: keyof typeof CONTRACT_ADDRESSES) {
  return {
    address: CONTRACT_ADDRESSES[contractName],
    chainId: NETWORK_CONFIG.chainId,
    blockExplorer: `${NETWORK_CONFIG.blockExplorer}/address/${CONTRACT_ADDRESSES[contractName]}`,
  };
}

// Helper function to format token amounts
export function formatTokenAmount(amount: string, decimals: number = 18): string {
  const value = BigInt(amount) / BigInt(10 ** decimals);
  return value.toLocaleString();
}

// Property type enum mapping
export const PROPERTY_TYPES = {
  0: 'RESIDENTIAL_SINGLE_FAMILY',
  1: 'RESIDENTIAL_MULTI_FAMILY',
  2: 'RESIDENTIAL_CONDO',
  3: 'COMMERCIAL_OFFICE',
  4: 'COMMERCIAL_RETAIL',
  5: 'COMMERCIAL_INDUSTRIAL',
  6: 'COMMERCIAL_MIXED_USE',
} as const;

export type PropertyType = keyof typeof PROPERTY_TYPES;
export type ContractName = keyof typeof CONTRACT_ADDRESSES; 