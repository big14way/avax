import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import toast from 'react-hot-toast';
import { CONTRACT_CONFIG, TESTING_CONFIG, REGISTERED_PROPERTIES, formatUSD, formatTokenAmount } from '../contracts/config';

interface PropertyInvestmentProps {
  onSuccess?: () => void;
}

const PropertyInvestment: React.FC<PropertyInvestmentProps> = ({ onSuccess }) => {
  const { address, isConnected } = useAccount();
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [testMode, setTestMode] = useState(false);

  // Read contract data using Wagmi V2
  const { data: tokenName } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'name',
  });

  const { data: tokenSymbol } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'symbol',
  });

  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'totalSupply',
  });

  // Get active properties count
  const { data: activePropertiesCount } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'getActivePropertiesCount',
  });

  // Check if selected property exists and is active
  const { data: propertyData, refetch: refetchPropertyData } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'getProperty',
    args: [selectedProperty || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: !!selectedProperty,
    },
  });

  // Get required collateral for investment amount
  const { data: requiredCollateral } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'getRequiredCollateral',
    args: [parseEther(investmentAmount || '0')],
    query: {
      enabled: Boolean(investmentAmount && parseFloat(investmentAmount) > 0),
    },
  });

  // Get user's property token balance
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  // Get user's collateral
  const { data: userCollateral } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'userCollateral',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  // Property registration using Wagmi V2
  const { writeContract: registerProperty } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast.success('Test property registered successfully! 🏠');
        refetchPropertyData();
        setTimeout(() => {
          setSelectedProperty(REGISTERED_PROPERTIES[0].address);
        }, 2000);
      },
      onError: (error: Error) => {
        toast.error(`Registration failed: ${error.message.slice(0, 100)}...`);
      },
    },
  });

  // Investment transaction using Wagmi V2
  const { writeContract: invest, data: investData } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast.success(`Investment of $${investmentAmount} USD submitted! 🏡`);
        setIsLoading(true);
      },
      onError: (error: Error) => {
        toast.error(`Investment failed: ${error.message.slice(0, 100)}...`);
        setIsLoading(false);
      },
    },
  });

  // Wait for transaction confirmation using Wagmi V2
  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash: investData,
    query: {
      enabled: !!investData,
    },
  });

  // Update loading state when transaction completes
  useEffect(() => {
    if (investData && !isWaitingForTx) {
      toast.success(`Successfully invested $${investmentAmount} USD! 🎉`);
      setInvestmentAmount('');
      setIsLoading(false);
      setTestMode(false);
      refetchSupply();
      refetchBalance();
      onSuccess?.();
    }
  }, [investData, isWaitingForTx, investmentAmount, onSuccess, refetchSupply, refetchBalance]);

  const handleInvest = async () => {

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    // Validate minimum investment ($10 USD minimum)
    if (parseFloat(investmentAmount) < 10) {
      toast.error('Minimum investment amount is $10 USD');
      return;
    }

    if (!selectedProperty) {
      toast.error('Please select a property to invest in');
      return;
    }

    // For now, let's skip the property active check and try the investment
    // We'll let the contract handle the validation

    try {
      // Call investment function with proper parameters
      await invest({
        address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
        abi: CONTRACT_CONFIG.PropertyToken.abi,
        functionName: 'investInProperty',
        args: [
          selectedProperty,
          parseEther(investmentAmount), // USD amount in 18 decimals
        ],
        value: (requiredCollateral as bigint) || BigInt(0), // Send required AVAX collateral
      });
    } catch (error) {
      toast.error(`Investment failed: ${error}`);
    }
  };

  const handleTestInvestment = () => {
    const testAmounts = ['10', '25', '50', '100'];
    const randomAmount = testAmounts[Math.floor(Math.random() * testAmounts.length)];
    setInvestmentAmount(randomAmount);
    setTestMode(true);
    toast.success(`Test mode: Set to $${randomAmount} USD investment`);
  };

  const handleRegisterTestProperty = () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    registerProperty({
      address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
      abi: CONTRACT_CONFIG.PropertyToken.abi,
      functionName: 'registerProperty',
      args: [
        REGISTERED_PROPERTIES[0].address, // Property address
        REGISTERED_PROPERTIES[0].id, // Property ID
        REGISTERED_PROPERTIES[0].physicalAddress, // Physical address
        0, // PropertyType.RESIDENTIAL_SINGLE_FAMILY
        parseEther('1000000'), // Initial value: $1,000,000
        parseEther('1000000'), // Total tokens: 1,000,000
        800, // Expected yield: 8%
        parseEther('8000'), // Monthly rent: $8,000
        address, // Property manager
      ],
    });
  };

  // Set default property when component mounts
  useEffect(() => {
    if (!selectedProperty && REGISTERED_PROPERTIES.length > 0) {
      setSelectedProperty(REGISTERED_PROPERTIES[0].address);
    }
  }, [selectedProperty]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Property Investment</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            {String(tokenSymbol || 'PROP')} Token
          </span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            Fuji Testnet
          </span>
        </div>
      </div>

      {/* Contract Information */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-gray-900 mb-3">📊 Contract Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <span className="text-gray-600 block mb-1">Token Name:</span>
            <span className="font-bold text-gray-900">{String(tokenName || 'Loading...')}</span>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <span className="text-gray-600 block mb-1">Total Supply:</span>
            <span className="font-bold text-green-600">{totalSupply ? formatTokenAmount(totalSupply.toString()) : 'Loading...'}</span>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <span className="text-gray-600 block mb-1">Active Properties:</span>
            <span className="font-bold text-blue-600">{activePropertiesCount ? String(activePropertiesCount) : '0'}</span>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <span className="text-gray-600 block mb-1">Your Balance:</span>
            <span className="font-bold text-purple-600">{userBalance ? formatTokenAmount(userBalance.toString()) : '0'} {String(tokenSymbol)}</span>
          </div>
        </div>
      </div>

      {/* Property Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Property
        </label>
                 <select
           value={selectedProperty}
           onChange={(e) => setSelectedProperty(e.target.value)}
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
         >
           <option value="">Choose a property...</option>
           {REGISTERED_PROPERTIES.map((property) => (
             <option key={property.address} value={property.address}>
               {property.id} - {property.physicalAddress} ({formatUSD(property.initialValue)})
             </option>
           ))}
         </select>
        
        {/* Property Status */}
        {selectedProperty && (
          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Status:</strong> {propertyData && Array.isArray(propertyData) && propertyData.length > 1 && propertyData[1] ? '✅ Active' : '❌ Inactive or Not Found'}
              {!(propertyData && Array.isArray(propertyData) && propertyData.length > 1 && propertyData[1]) && (
                <span className="ml-2">
                  <button
                    onClick={handleRegisterTestProperty}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Register Test Property
                  </button>
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Investment Amount */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Investment Amount (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(e.target.value)}
            placeholder="Enter amount (min $10)"
            min="10"
            step="1"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        {/* Quick Amount Buttons */}
        <div className="mt-2 flex space-x-2">
          {TESTING_CONFIG.INVESTMENT_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => setInvestmentAmount(amount.toString())}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              ${amount}
            </button>
          ))}
          <button
            onClick={handleTestInvestment}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            🎲 Random
          </button>
        </div>
      </div>

      {/* Investment Summary */}
      {investmentAmount && parseFloat(investmentAmount) >= 10 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">Investment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Investment Amount:</span>
              <span className="font-medium text-green-900">${investmentAmount} USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Required Collateral:</span>
              <span className="font-medium text-orange-600">
                {requiredCollateral ? `${formatEther(requiredCollateral as bigint)} AVAX` : 'Calculating...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Property:</span>
              <span className="font-medium text-green-900">
                {REGISTERED_PROPERTIES.find(p => p.address === selectedProperty)?.physicalAddress || 'Selected Property'}
              </span>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-orange-100 rounded border border-orange-200">
            <p className="text-xs text-orange-800">
              💡 <strong>How it works:</strong> Investment requires 150% AVAX collateral. 
              For ${investmentAmount} USD investment, you need {requiredCollateral ? formatEther(requiredCollateral as bigint) : '~'} AVAX as collateral + gas fees.
            </p>
          </div>
        </div>
      )}

      {/* Investment Button */}
      <button
        onClick={handleInvest}
        disabled={
          !isConnected || 
          !investmentAmount || 
          parseFloat(investmentAmount) < 10 || 
          !selectedProperty || 
          !propertyData ||
          !(propertyData && Array.isArray(propertyData) && propertyData.length > 1 && propertyData[1]) ||
          isLoading || 
          isWaitingForTx
        }
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          !isConnected || 
          !investmentAmount || 
          parseFloat(investmentAmount) < 10 || 
          !selectedProperty || 
          !propertyData ||
          !(propertyData && Array.isArray(propertyData) && propertyData.length > 1 && propertyData[1]) ||
          isLoading || 
          isWaitingForTx
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {!isConnected 
          ? 'Connect Wallet' 
          : isLoading || isWaitingForTx
          ? 'Processing Investment...'
          : `Invest $${investmentAmount || '0'} USD`
        }
      </button>

      {/* Test Mode Indicator */}
      {testMode && (
        <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            🧪 <strong>Test Mode Active:</strong> Using random investment amount for testing purposes.
          </p>
        </div>
      )}

      {/* Status Messages */}
      {!isConnected && (
        <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-200">
          <p className="text-sm text-red-800">
            ⚠️ Please connect your wallet to start investing in properties.
          </p>
        </div>
      )}

      {isConnected && (!activePropertiesCount || activePropertiesCount === BigInt(0)) && (
        <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            ℹ️ No active properties found. 
            <button
              onClick={handleRegisterTestProperty}
              className="ml-1 text-blue-600 underline hover:text-blue-800"
            >
              Register a test property
            </button> to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertyInvestment; 