import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useSimulateContract } from 'wagmi';
import toast from 'react-hot-toast';
import { CONTRACT_CONFIG } from '../contracts/config';

interface ContractSetupProps {
  onSetupComplete?: () => void;
}

const ContractSetup: React.FC<ContractSetupProps> = ({ onSetupComplete }) => {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  // Check if PropertyToken is already supported
  const { data: supportedProperty } = useReadContract({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi,
    functionName: 'supportedProperties',
    args: [CONTRACT_CONFIG.PropertyToken.address],
  });

  // Simulate the addSupportedProperty call
  const { data: simulateData } = useSimulateContract({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi,
    functionName: 'addSupportedProperty',
    args: [
      CONTRACT_CONFIG.PropertyToken.address, // propertyToken
      8000, // liquidationThreshold (80% in basis points)
      500, // maxLeverage (5x leverage)
      100, // mintingFee (1% in basis points)
      BigInt("1000000000000000000"), // minPosition (1 ETH minimum)
    ],
    query: {
      enabled: Boolean(address && !(Array.isArray(supportedProperty) && supportedProperty[1])), // Only enable if not already supported
    },
  });

  const { writeContract: setupContract, isPending: isSettingUp } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast.success('Contract setup completed! 🎉');
        setIsLoading(false);
        onSetupComplete?.();
      },
      onError: (error: Error) => {
        toast.error(`Setup failed: ${error.message}`);
        setIsLoading(false);
      },
    },
  });

  const handleSetup = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!simulateData?.request) {
      toast.error('Contract simulation failed. Please try again.');
      return;
    }

    setIsLoading(true);
    setupContract(simulateData.request);
  };

  // Check if setup is needed
  const isSupported = Array.isArray(supportedProperty) && supportedProperty[1] === true;

  if (isSupported) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-sm">✅</span>
          </div>
          <span className="text-sm font-medium text-green-800">
            Contract is properly configured and ready to use!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-amber-800">Initial Setup Required</h3>
          <p className="text-sm text-amber-600 mt-2">
            The PropertyToken needs to be added as a supported property before users can invest.
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">Setup Parameters:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Liquidation Threshold:</span>
              <span className="ml-2 text-gray-600">80%</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Max Leverage:</span>
              <span className="ml-2 text-gray-600">5x</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Minting Fee:</span>
              <span className="ml-2 text-gray-600">1%</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Min Position:</span>
              <span className="ml-2 text-gray-600">1 ETH</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSetup}
          disabled={!isConnected || isLoading || isSettingUp}
          className="w-full bg-amber-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {!isConnected ? (
            'Connect Wallet to Setup'
          ) : isLoading || isSettingUp ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Setting up contract...</span>
            </div>
          ) : (
            'Run Initial Setup'
          )}
        </button>

        <div className="text-xs text-amber-600 text-center">
          <p>⚠️ This is a one-time setup required by the contract owner.</p>
        </div>
      </div>
    </div>
  );
};

export default ContractSetup; 