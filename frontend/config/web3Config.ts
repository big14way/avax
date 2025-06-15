import { avalancheFuji } from 'viem/chains';
import { ChainConfig } from '@/types/contracts';

export const AVALANCHE_FUJI_CONFIG: ChainConfig = {
  chainId: 43113,
  chainName: 'Avalanche Fuji Testnet',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://api.avax-test.network/ext/bc/C/rpc'],
    },
    public: {
      http: ['https://api.avax-test.network/ext/bc/C/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SnowTrace',
      url: 'https://testnet.snowtrace.io',
    },
  },
  testnet: true,
};

// Contract addresses and configurations
export const CONTRACTS = {
  PROPERTY_TOKEN: {
    address: '0x211a38792781b2c7a584a96F0e735d56e809fe85' as const,
    chainId: 43113,
  },
  PROPERTY_AUTOMATION: {
    address: '0x...' as const, // Add your automation contract address
    chainId: 43113,
  },
  PROPERTY_BRIDGE: {
    address: '0x...' as const, // Add your bridge contract address
    chainId: 43113,
  },
} as const;

// Supported chains for the dApp
export const SUPPORTED_CHAINS = [avalancheFuji];

// RainbowKit theme configuration
export const RAINBOWKIT_CONFIG = {
  appName: 'DREMS Platform',
  appDescription: 'Decentralized Real Estate Marketplace',
  appUrl: 'https://drems.app',
  appIcon: '/logo.png',
} as const; 