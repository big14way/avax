import { usePublicClient, useWalletClient } from 'wagmi';
import { getContract } from 'viem';
import { 
  CONTRACT_ADDRESSES, 
  PropertyTokenABI, 
  PropertyAutomationABI, 
  PropertyBridgeABI, 
  SyntheticPropertyABI,
  type ContractName 
} from '../contracts/config';

// Custom hook for DREMS contract interactions
export function useContracts() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Property Token Contract
  const propertyToken = getContract({
    address: CONTRACT_ADDRESSES.PropertyToken as `0x${string}`,
    abi: PropertyTokenABI.abi,
    client: walletClient || publicClient,
  });

  // Property Automation Contract
  const propertyAutomation = getContract({
    address: CONTRACT_ADDRESSES.PropertyAutomation as `0x${string}`,
    abi: PropertyAutomationABI.abi,
    client: walletClient || publicClient,
  });

  // Property Bridge Contract
  const propertyBridge = getContract({
    address: CONTRACT_ADDRESSES.PropertyBridge as `0x${string}`,
    abi: PropertyBridgeABI.abi,
    client: walletClient || publicClient,
  });

  // Synthetic Property Contract
  const syntheticProperty = getContract({
    address: CONTRACT_ADDRESSES.SyntheticProperty as `0x${string}`,
    abi: SyntheticPropertyABI.abi,
    client: walletClient || publicClient,
  });

  return {
    propertyToken,
    propertyAutomation,
    propertyBridge,
    syntheticProperty,
    contracts: {
      PropertyToken: propertyToken,
      PropertyAutomation: propertyAutomation,
      PropertyBridge: propertyBridge,
      SyntheticProperty: syntheticProperty,
    },
  };
}

// Hook for individual contract access
export function useContract(contractName: ContractName) {
  const contracts = useContracts();
  return contracts.contracts[contractName];
}

// Property Token specific hooks
export function usePropertyToken() {
  const { propertyToken } = useContracts();

  const registerProperty = async (
    propertyAddress: string,
    propertyId: string,
    physicalAddress: string,
    propertyType: number,
    initialValue: string,
    totalTokens: string,
    expectedYield: number,
    monthlyRent: string,
    propertyManager: string
  ) => {
    if (!propertyToken) throw new Error('PropertyToken contract not available');
    
    return await propertyToken.write.registerProperty([
      propertyAddress as `0x${string}`,
      propertyId,
      physicalAddress,
      propertyType,
      BigInt(initialValue),
      BigInt(totalTokens),
      expectedYield,
      BigInt(monthlyRent),
      propertyManager as `0x${string}`,
    ]);
  };

  const investInProperty = async (propertyAddress: string, amount: string) => {
    if (!propertyToken) throw new Error('PropertyToken contract not available');
    
    return await propertyToken.write.investInProperty([
      propertyAddress as `0x${string}`,
      BigInt(amount)
    ], {
      value: BigInt(amount),
    });
  };

  const getPropertyInfo = async (propertyAddress: string) => {
    if (!propertyToken) throw new Error('PropertyToken contract not available');
    
    return await propertyToken.read.getProperty([propertyAddress as `0x${string}`]);
  };

  const getUserInvestment = async (user: string, propertyAddress: string) => {
    if (!propertyToken) throw new Error('PropertyToken contract not available');
    
    return await propertyToken.read.getUserPropertyBalance([
      user as `0x${string}`, 
      propertyAddress as `0x${string}`
    ]);
  };

  return {
    contract: propertyToken,
    registerProperty,
    investInProperty,
    getPropertyInfo,
    getUserInvestment,
  };
}

// Synthetic Property specific hooks
export function useSyntheticProperty() {
  const { syntheticProperty } = useContracts();

  const mintSynthetic = async (
    propertyToken: string,
    collateralAmount: string,
    syntheticAmount: string
  ) => {
    if (!syntheticProperty) throw new Error('SyntheticProperty contract not available');
    
    return await syntheticProperty.write.mintSynthetic([
      propertyToken as `0x${string}`,
      BigInt(collateralAmount),
      BigInt(syntheticAmount),
    ], { value: BigInt(collateralAmount) });
  };

  const burnSynthetic = async (
    propertyToken: string,
    syntheticAmount: string
  ) => {
    if (!syntheticProperty) throw new Error('SyntheticProperty contract not available');
    
    return await syntheticProperty.write.burnSynthetic([
      propertyToken as `0x${string}`, 
      BigInt(syntheticAmount)
    ]);
  };

  const getPosition = async (user: string, propertyToken: string) => {
    if (!syntheticProperty) throw new Error('SyntheticProperty contract not available');
    
    return await syntheticProperty.read.getPosition([
      user as `0x${string}`, 
      propertyToken as `0x${string}`
    ]);
  };

  const liquidatePosition = async (user: string, propertyToken: string) => {
    if (!syntheticProperty) throw new Error('SyntheticProperty contract not available');
    
    return await syntheticProperty.write.liquidatePosition([
      user as `0x${string}`, 
      propertyToken as `0x${string}`
    ]);
  };

  return {
    contract: syntheticProperty,
    mintSynthetic,
    burnSynthetic,
    getPosition,
    liquidatePosition,
  };
}

// Property Automation specific hooks
export function usePropertyAutomation() {
  const { propertyAutomation } = useContracts();

  const registerForAutomation = async (
    propertyAddress: string,
    rentCollectionInterval?: number,
    valuationInterval?: number,
    maintenanceInterval?: number
  ) => {
    if (!propertyAutomation) throw new Error('PropertyAutomation contract not available');
    
    return await propertyAutomation.write.registerPropertyForAutomation([
      propertyAddress as `0x${string}`,
      rentCollectionInterval || 0,
      valuationInterval || 0,
      maintenanceInterval || 0,
    ]);
  };

  const getAutomationInfo = async (propertyAddress: string) => {
    if (!propertyAutomation) throw new Error('PropertyAutomation contract not available');
    
    return await propertyAutomation.read.getAutomationInfo([propertyAddress as `0x${string}`]);
  };

  return {
    contract: propertyAutomation,
    registerForAutomation,
    getAutomationInfo,
  };
}

// Property Bridge specific hooks
export function usePropertyBridge() {
  const { propertyBridge } = useContracts();

  const sendCrossChainMessage = async (
    destinationChainSelector: string,
    message: string,
    gasLimit: number
  ) => {
    if (!propertyBridge) throw new Error('PropertyBridge contract not available');
    
    return await propertyBridge.write.sendCrossChainMessage([
      BigInt(destinationChainSelector),
      message,
      gasLimit,
    ]);
  };

  const getChainConfig = async (chainSelector: string) => {
    if (!propertyBridge) throw new Error('PropertyBridge contract not available');
    
    return await propertyBridge.read.getChainConfig([BigInt(chainSelector)]);
  };

  return {
    contract: propertyBridge,
    sendCrossChainMessage,
    getChainConfig,
  };
} 