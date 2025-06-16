import { useAccount, useReadContract, useWriteContract, useSimulateContract } from 'wagmi';
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
  const propertyToken = usePropertyToken();
  const syntheticProperty = useSyntheticProperty();
  const propertyAutomation = usePropertyAutomation();
  const propertyBridge = usePropertyBridge();

  return {
    propertyToken,
    syntheticProperty,
    propertyAutomation,
    propertyBridge,
  };
}

// Hook for individual contract access
export function useContract(contractName: ContractName) {
  const contracts = useContracts();
  
  switch (contractName) {
    case 'PropertyToken':
      return contracts.propertyToken;
    case 'SyntheticProperty':
      return contracts.syntheticProperty;
    case 'PropertyAutomation':
      return contracts.propertyAutomation;
    case 'PropertyBridge':
      return contracts.propertyBridge;
    default:
      throw new Error(`Unknown contract: ${contractName}`);
  }
}

// Property Token specific hooks
export function usePropertyToken() {
  const { address } = useAccount();

  // Register Property using Wagmi V2
  const { writeContract: registerProperty, isPending: isRegisterLoading } = useWriteContract({
    mutation: {
      onSuccess: (data: any) => {
        console.log('Property registered successfully:', data);
      },
      onError: (error: any) => {
        console.error('Property registration failed:', error);
      },
    },
  });

  // Invest in Property using Wagmi V2
  const { writeContract: investInProperty, isPending: isInvestLoading } = useWriteContract({
    mutation: {
      onSuccess: (data: any) => {
        console.log('Investment successful:', data);
      },
      onError: (error: any) => {
        console.error('Investment failed:', error);
      },
    },
  });

  // Get Property Info
  const getPropertyInfo = (propertyAddress: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.PropertyToken as `0x${string}`,
      abi: PropertyTokenABI.abi,
      functionName: 'getProperty',
      args: [propertyAddress as `0x${string}`],
      query: {
        enabled: !!propertyAddress,
      },
    });
  };

  // Get User Investment
  const getUserInvestment = (user: string, propertyAddress: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.PropertyToken as `0x${string}`,
      abi: PropertyTokenABI.abi,
      functionName: 'getUserPropertyBalance',
      args: [user as `0x${string}`, propertyAddress as `0x${string}`],
      query: {
        enabled: !!user && !!propertyAddress,
      },
    });
  };

  return {
    registerProperty,
    isRegisterLoading,
    investInProperty,
    isInvestLoading,
    getPropertyInfo,
    getUserInvestment,
  };
}

// Synthetic Property specific hooks
export function useSyntheticProperty() {
  const { address } = useAccount();

  // Mint Synthetic using Wagmi V2
  const { writeContract: mintSynthetic, isPending: isMintLoading } = useWriteContract({
    mutation: {
      onSuccess: (data: any) => {
        console.log('Synthetic token minted successfully:', data);
      },
      onError: (error: any) => {
        console.error('Synthetic token minting failed:', error);
      },
    },
  });

  // Burn Synthetic using Wagmi V2
  const { writeContract: burnSynthetic, isPending: isBurnLoading } = useWriteContract({
    mutation: {
      onSuccess: (data: any) => {
        console.log('Synthetic token burned successfully:', data);
      },
      onError: (error: any) => {
        console.error('Synthetic token burning failed:', error);
      },
    },
  });

  // Get Position
  const getPosition = (user: string, propertyToken: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.SyntheticProperty as `0x${string}`,
      abi: SyntheticPropertyABI.abi,
      functionName: 'getPosition',
      args: [user as `0x${string}`, propertyToken as `0x${string}`],
      query: {
        enabled: !!user && !!propertyToken,
      },
    });
  };

  // Get balance
  const getBalance = (user: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.SyntheticProperty as `0x${string}`,
      abi: SyntheticPropertyABI.abi,
      functionName: 'balanceOf',
      args: [user as `0x${string}`],
      query: {
        enabled: !!user,
      },
    });
  };

  // Get token name
  const getName = () => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.SyntheticProperty as `0x${string}`,
      abi: SyntheticPropertyABI.abi,
      functionName: 'name',
    });
  };

  // Get token symbol
  const getSymbol = () => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.SyntheticProperty as `0x${string}`,
      abi: SyntheticPropertyABI.abi,
      functionName: 'symbol',
    });
  };

  return {
    mintSynthetic,
    isMintLoading,
    burnSynthetic,
    isBurnLoading,
    getPosition,
    getBalance,
    getName,
    getSymbol,
  };
}

// Property Automation specific hooks
export function usePropertyAutomation() {
  const { writeContract: registerForAutomation, isPending: isRegisterLoading } = useWriteContract({
    mutation: {
      onSuccess: (data: any) => {
        console.log('Property registered for automation successfully:', data);
      },
      onError: (error: any) => {
        console.error('Property automation registration failed:', error);
      },
    },
  });

  const getAutomationInfo = (propertyAddress: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.PropertyAutomation as `0x${string}`,
      abi: PropertyAutomationABI.abi,
      functionName: 'getAutomationInfo',
      args: [propertyAddress as `0x${string}`],
      query: {
        enabled: !!propertyAddress,
      },
    });
  };

  return {
    registerForAutomation,
    isRegisterLoading,
    getAutomationInfo,
  };
}

// Property Bridge specific hooks
export function usePropertyBridge() {
  const { writeContract: sendCrossChainMessage, isPending: isSendLoading } = useWriteContract({
    mutation: {
      onSuccess: (data: any) => {
        console.log('Cross-chain message sent successfully:', data);
      },
      onError: (error: any) => {
        console.error('Cross-chain message failed:', error);
      },
    },
  });

  const getChainConfig = (chainSelector: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.PropertyBridge as `0x${string}`,
      abi: PropertyBridgeABI.abi,
      functionName: 'getChainConfig',
      args: [BigInt(chainSelector)],
      query: {
        enabled: !!chainSelector,
      },
    });
  };

  return {
    sendCrossChainMessage,
    isSendLoading,
    getChainConfig,
  };
} 