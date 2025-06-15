import { ContractConfig, PropertyType, Property, PlatformConstants } from '@/types/contracts';
import { CONTRACT_ADDRESSES, PropertyTokenABI, PropertyAutomationABI, PropertyBridgeABI, SyntheticPropertyABI } from '../contracts/config';

export const CONTRACT_CONFIG = {
  PropertyToken: {
    address: CONTRACT_ADDRESSES.PropertyToken,
    abi: PropertyTokenABI,
    chainId: 43113,
  },
  PropertyAutomation: {
    address: CONTRACT_ADDRESSES.PropertyAutomation,
    abi: PropertyAutomationABI,
    chainId: 43113,
  },
  PropertyBridge: {
    address: CONTRACT_ADDRESSES.PropertyBridge,
    abi: PropertyBridgeABI,
    chainId: 43113,
  },
  SyntheticProperty: {
    address: CONTRACT_ADDRESSES.SyntheticProperty,
    abi: SyntheticPropertyABI,
    chainId: 43113,
  },
} as const;

// Property types for DREMS platform
export const PROPERTY_TYPES: PropertyType[] = [
  { id: 0, name: 'Residential Single Family', icon: '🏠', description: 'Single-family homes' },
  { id: 1, name: 'Residential Multi Family', icon: '🏘️', description: 'Apartment buildings, duplexes' },
  { id: 2, name: 'Residential Condo', icon: '🏢', description: 'Condominiums and townhouses' },
  { id: 3, name: 'Commercial Office', icon: '🏢', description: 'Office buildings and spaces' },
  { id: 4, name: 'Commercial Retail', icon: '🏪', description: 'Retail stores and shopping centers' },
  { id: 5, name: 'Commercial Industrial', icon: '🏭', description: 'Warehouses and manufacturing' },
  { id: 6, name: 'Commercial Mixed Use', icon: '🏬', description: 'Combined residential and commercial' },
];

// Sample properties for demo
export const SAMPLE_PROPERTIES: Property[] = [
  {
    id: 1,
    name: 'San Francisco Family Home',
    type: 'Residential Single Family',
    location: 'San Francisco, CA',
    price: 1000000,
    tokenPrice: 1,
    totalTokens: 1000000,
    availableTokens: 1000000,
    yieldAPY: 8.0,
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500',
    description: 'Beautiful single-family home in prime San Francisco location',
    details: {
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      yearBuilt: 2015,
      occupancyRate: 100,
      monthlyRent: 8000,
    }
  },
  {
    id: 2,
    name: 'NYC Commercial Office',
    type: 'Commercial Office',
    location: 'New York, NY',
    price: 5000000,
    tokenPrice: 1,
    totalTokens: 5000000,
    availableTokens: 5000000,
    yieldAPY: 6.0,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500',
    description: 'Premium office space in Manhattan business district',
    details: {
      floors: 5,
      totalSqft: 12000,
      yearBuilt: 2018,
      occupancyRate: 95,
      monthlyRent: 25000,
    }
  },
];

// Platform constants
export const PLATFORM_CONSTANTS: PlatformConstants = {
  MINIMUM_INVESTMENT: 100, // $100 minimum
  COLLATERAL_RATIO: 150, // 150% collateralization
  LIQUIDATION_THRESHOLD: 110, // 110% liquidation threshold
  PLATFORM_FEE: 1, // 1% platform fee
  MANAGEMENT_FEE: 0.5, // 0.5% annual management fee
}; 