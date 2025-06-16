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
  PropertyToken: '0x5A481F7dF0faA5c13Cae23a322544A0f873991F3',
  PropertyAutomation: '0x1905eb10DB823CC61faf31e5Be1e220669a29446',
  PropertyBridge: '0x4b5d634b27CA72397fa8b9757332D2A5794632f5',
  SyntheticProperty: '0xCAfF99170BEa7fDb5B8b4C30CCf966e9c08286D5',
} as const;

export const DEPLOYMENT_INFO = {
  deployedAt: new Date().toISOString(),
  deployer: '0x3C343AD077983371b29fee386bdBC8a92E934C51',
  blockNumber: 41846864,
  totalGasUsed: 13597168,
  verified: true,
  verificationUrls: {
    PropertyToken: 'https://testnet.snowtrace.io/address/0xD16780D7e6CC8aa3ca67992E570D6C9697Dc0C64',
    PropertyAutomation: 'https://testnet.snowtrace.io/address/0xB33EC213C33050F3a0b814dB264985fE69876948',
    PropertyBridge: 'https://testnet.snowtrace.io/address/0x8A0b2a30a3aD12e8f0448af4EAe826fAa7E37eE2',
    SyntheticProperty: 'https://testnet.snowtrace.io/address/0xAe5d0B6F5f7112c6742cf1F6E097c71dDA85E352',
  },
  priceFeedFix: {
    applied: true,
    description: 'Extended Chainlink price feed staleness timeout from 3 hours to 24 hours for testnet compatibility',
    previousTimeout: '3 hours',
    currentTimeout: '24 hours',
  },
} as const;

// Platform Statistics for Overview Tab
export const PLATFORM_STATS = {
  protocolVersion: 'v1.0.0',
  totalProperties: 2,
  totalValueLocked: '6000000000000000000000000', // $6M USD (sum of sample properties)
  totalTokenSupply: '6000000000000000000000000', // 6M tokens
  averageYield: 700, // 7% average
  protocolFee: 100, // 1%
  minimumInvestment: '10000000000000000000', // $10 minimum
  collateralRatio: 150, // 150%
  supportedChains: ['Avalanche Fuji', 'Ethereum Sepolia', 'Polygon Mumbai'],
  features: [
    'Fractional Property Ownership',
    'Automated Rent Distribution',
    'Cross-Chain Trading',
    'Real-time Valuation',
    'Synthetic Asset Creation',
    'DeFi Integration'
  ],
} as const;

// Registered Properties (from deployment script)
export const REGISTERED_PROPERTIES = [
  {
    address: '0x0000000000000000000000000000000000000001', // address(0x1) from deployment
    id: 'MLS123456',
    physicalAddress: '123 Main St, San Francisco, CA 94102',
    type: 'RESIDENTIAL_SINGLE_FAMILY',
    initialValue: '1000000000000000000000000', // $1,000,000
    totalTokens: '1000000000000000000000000', // 1,000,000 tokens
    expectedYield: 800, // 8%
    monthlyRent: '8000000000000000000000', // $8,000
    isActive: true,
  },
  {
    address: '0x0000000000000000000000000000000000000002', // address(0x2) from deployment
    id: 'COM789012',
    physicalAddress: '456 Business Ave, New York, NY 10001',
    type: 'COMMERCIAL_OFFICE',
    initialValue: '5000000000000000000000000', // $5,000,000
    totalTokens: '5000000000000000000000000', // 5,000,000 tokens
    expectedYield: 600, // 6%
    monthlyRent: '25000000000000000000000', // $25,000
    isActive: true,
  },
] as const;

// Sample Properties (legacy - keeping for compatibility)
export const SAMPLE_PROPERTIES = REGISTERED_PROPERTIES;

// Chainlink Service Configuration
export const CHAINLINK_CONFIG = {
  functionsRouter: '0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0',
  donId: '0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000',
  ccipRouter: '0xF694E193200268f9a4868e4Aa017A0118C9a8177',
  ethUsdFeed: '0x86d67c3D38D2bCeE722E601025C25a575021c6EA',
  linkToken: '0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846',
} as const;

// Testing Configuration - Updated with proper minimum amounts
export const TESTING_CONFIG = {
  // Test amounts for different operations (must meet $10 minimum)
  testAmounts: {
    small: '10000000000000000000', // $10 minimum investment
    medium: '50000000000000000000', // $50 investment
    large: '100000000000000000000', // $100 investment
    premium: '500000000000000000000', // $500 investment
  },
  // Investment amounts for quick buttons
  INVESTMENT_AMOUNTS: [10, 25, 50, 100],
  // Quick test amounts for buttons
  quickAmounts: [
    { label: '$10', value: '10000000000000000000', description: 'Minimum investment' },
    { label: '$25', value: '25000000000000000000', description: 'Small test amount' },
    { label: '$50', value: '50000000000000000000', description: 'Medium test amount' },
    { label: '$100', value: '100000000000000000000', description: 'Large test amount' },
  ],
  // Property types for testing
  propertyTypes: [
    { value: 0, label: 'RESIDENTIAL_SINGLE_FAMILY' },
    { value: 1, label: 'RESIDENTIAL_MULTI_FAMILY' },
    { value: 2, label: 'RESIDENTIAL_CONDO' },
    { value: 3, label: 'COMMERCIAL_OFFICE' },
    { value: 4, label: 'COMMERCIAL_RETAIL' },
    { value: 5, label: 'COMMERCIAL_INDUSTRIAL' },
    { value: 6, label: 'COMMERCIAL_MIXED_USE' },
  ],
  // Default test property - use the registered residential property
  defaultTestProperty: REGISTERED_PROPERTIES[0],
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

// Contract configuration object for easy access
export const CONTRACT_CONFIG = {
  PropertyToken: {
    address: CONTRACT_ADDRESSES.PropertyToken,
    abi: PropertyTokenABI.abi,
  },
  PropertyAutomation: {
    address: CONTRACT_ADDRESSES.PropertyAutomation,
    abi: PropertyAutomationABI.abi,
  },
  PropertyBridge: {
    address: CONTRACT_ADDRESSES.PropertyBridge,
    abi: PropertyBridgeABI.abi,
  },
  SyntheticProperty: {
    address: CONTRACT_ADDRESSES.SyntheticProperty,
    abi: SyntheticPropertyABI.abi,
  },
} as const;

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

// Helper functions for testing
export const formatEther = (value: bigint | string | number): string => {
  const bigValue = typeof value === 'bigint' ? value : BigInt(value.toString());
  return (Number(bigValue) / Math.pow(10, 18)).toFixed(6);
};

export const parseEther = (value: string): bigint => {
  return BigInt(Math.floor(parseFloat(value) * Math.pow(10, 18)));
};

export const formatUSD = (value: bigint | string | number): string => {
  const bigValue = typeof value === 'bigint' ? value : BigInt(value.toString());
  return '$' + (Number(bigValue) / Math.pow(10, 18)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}; 