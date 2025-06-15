export type Address = `0x${string}`;

export interface ContractConfig {
  address: Address;
  abi: any[];
  chainId: number;
}

export interface PropertyType {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export interface PropertyDetails {
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  floors?: number;
  totalSqft?: number;
  acres?: number;
  yearBuilt?: number;
  occupancyRate: number;
  monthlyRent?: number;
  yearlyLeaseIncome?: number;
  soilType?: string;
  waterRights?: boolean;
}

export interface Property {
  id: number;
  name: string;
  type: string;
  location: string;
  price: number;
  tokenPrice: number;
  totalTokens: number;
  availableTokens: number;
  yieldAPY: number;
  image: string;
  description: string;
  details: PropertyDetails;
}

export interface PlatformConstants {
  MINIMUM_INVESTMENT: number;
  COLLATERAL_RATIO: number;
  LIQUIDATION_THRESHOLD: number;
  PLATFORM_FEE: number;
  MANAGEMENT_FEE: number;
}

export interface UserAccountInfo {
  totalTslaMintedValueUsd: bigint;
  totalCollateralValueUsd: bigint;
}

export interface ChainConfig {
  chainId: number;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: {
      http: string[];
    };
    public: {
      http: string[];
    };
  };
  blockExplorers: {
    default: {
      name: string;
      url: string;
    };
  };
  testnet: boolean;
} 