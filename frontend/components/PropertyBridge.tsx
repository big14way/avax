import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useSimulateContract } from 'wagmi';
import { formatEther, parseEther, formatUnits, parseUnits } from 'viem';
import toast from 'react-hot-toast';
import { CONTRACT_CONFIG } from '../contracts/config';

const PropertyBridge: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [destinationChain, setDestinationChain] = useState<string>('16015286601757825753'); // Ethereum Sepolia
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Read user's property token balance (ERC20)
  const { data: userTokenBalance } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  // Read bridge fee
  const { data: bridgeFee } = useReadContract({
    address: CONTRACT_CONFIG.PropertyBridge.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyBridge.abi,
    functionName: 'bridgeFee',
  });

  // Check if destination chain is allowed
  const { data: isChainAllowed } = useReadContract({
    address: CONTRACT_CONFIG.PropertyBridge.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyBridge.abi,
    functionName: 'allowlistedDestinationChains',
    args: destinationChain ? [BigInt(destinationChain)] : undefined,
    query: {
      enabled: !!destinationChain,
    },
  });

  // Check current token allowance for bridge
  const { data: tokenAllowance } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'allowance',
    args: address && CONTRACT_CONFIG.PropertyBridge.address ? [
      address,
      CONTRACT_CONFIG.PropertyBridge.address as `0x${string}`
    ] : undefined,
    query: {
      enabled: !!(address && CONTRACT_CONFIG.PropertyBridge.address),
    },
  });

  // Parse token amount for simulation
  const tokenAmountParsed = tokenAmount && tokenAmount !== '' ? parseUnits(tokenAmount, 18) : BigInt(0);
  const hasValidAmount = tokenAmountParsed > BigInt(0);
  const hasSufficientBalance = userTokenBalance && tokenAmountParsed <= (userTokenBalance as bigint);
  const hasAllowance = tokenAllowance && tokenAmountParsed <= (tokenAllowance as bigint);

  // Simulate contract write for bridging
  const { data: simulateData, error: simulateError } = useSimulateContract({
    address: CONTRACT_CONFIG.PropertyBridge.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyBridge.abi,
    functionName: 'bridgePropertyTokens',
    args: hasValidAmount && destinationChain && recipientAddress && hasSufficientBalance && hasAllowance && isChainAllowed ? [
      BigInt(destinationChain),
      recipientAddress as `0x${string}`,
      CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
      tokenAmountParsed
    ] : undefined,
    value: (bridgeFee as bigint) || parseEther('0.001'),
    query: {
      enabled: !!(hasValidAmount && destinationChain && recipientAddress && bridgeFee && hasSufficientBalance && hasAllowance && isChainAllowed),
    },
  });

  const { writeContract } = useWriteContract();

  useEffect(() => {
    if (address) {
      setRecipientAddress(address);
    }
  }, [address]);

  // Enhanced debugging
  useEffect(() => {
    console.log('🔍 Bridge Debug Info:', {
      tokenAmount,
      tokenAmountParsed: tokenAmountParsed.toString(),
      destinationChain,
      recipientAddress,
      userTokenBalance: userTokenBalance?.toString(),
      tokenAllowance: tokenAllowance?.toString(),
      bridgeFee: bridgeFee?.toString(),
      isChainAllowed,
      hasValidAmount,
      hasSufficientBalance,
      hasAllowance,
      simulationEnabled: !!(hasValidAmount && destinationChain && recipientAddress && bridgeFee && hasSufficientBalance && hasAllowance && isChainAllowed),
      simulateError: simulateError?.message,
      simulateData: simulateData ? 'Available' : 'Undefined',
      contractAddresses: {
        bridge: CONTRACT_CONFIG.PropertyBridge.address,
        token: CONTRACT_CONFIG.PropertyToken.address
      }
    });
    
    // Log simulation failure details
    if (simulateError) {
      console.error('🚨 Simulation Error Details:', {
        error: simulateError,
        message: simulateError.message,
        name: simulateError.name
      });
    }
  }, [tokenAmount, tokenAmountParsed, destinationChain, recipientAddress, userTokenBalance, tokenAllowance, bridgeFee, isChainAllowed, hasValidAmount, hasSufficientBalance, hasAllowance, simulateError, simulateData]);

  const handleApprove = async () => {
    try {
      const approveTx = await writeContract({
        address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
        abi: CONTRACT_CONFIG.PropertyToken.abi,
        functionName: 'approve',
        args: [
          CONTRACT_CONFIG.PropertyBridge.address as `0x${string}`,
          BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935') // Max uint256
        ]
      });
      
      toast.success('Approval transaction submitted!');
      console.log('Approve transaction:', approveTx);
    } catch (error) {
      toast.error('Approval failed');
      console.error('Approval error:', error);
    }
  };

  const handleBridge = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!hasValidAmount) {
      toast.error('Please enter a valid token amount');
      return;
    }

    if (!destinationChain || !recipientAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!hasSufficientBalance) {
      toast.error('Insufficient token balance');
      return;
    }

    if (!isChainAllowed) {
      toast.error('Destination chain is not configured. Please contact admin.');
      return;
    }

    if (!hasAllowance) {
      toast.error('Please approve the bridge to spend your tokens first');
      return;
    }

    console.log('🚀 Starting Bridge Transaction:', {
      tokenAmount,
      tokenAmountParsed: tokenAmountParsed.toString(),
      destinationChain,
      recipientAddress,
      bridgeFee: bridgeFee?.toString(),
      userTokenBalance: userTokenBalance?.toString(),
      simulateData,
      simulateError: simulateError?.message
    });

    if (!simulateData?.request) {
      // If simulation fails, try to execute the transaction directly
      console.warn('⚠️ Simulation failed, attempting direct transaction...');
      
      try {
        setIsLoading(true);
        
                 // Calculate a reasonable fee estimate (bridge fee + extra for CCIP)
         const estimatedFee = (bridgeFee as bigint) + parseEther('0.05'); // Bridge fee + 0.05 ETH for CCIP (testnets need more)
        
                 writeContract({
           address: CONTRACT_CONFIG.PropertyBridge.address as `0x${string}`,
           abi: CONTRACT_CONFIG.PropertyBridge.abi,
           functionName: 'bridgePropertyTokens',
           args: [
             BigInt(destinationChain),
             recipientAddress as `0x${string}`,
             CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
             tokenAmountParsed
           ],
           value: estimatedFee,
         }, {
           onSuccess: (hash) => {
             setIsLoading(false); // Reset loading state
             toast.success(`Bridge transaction initiated! Hash: ${hash}`);
             console.log('✅ Bridge transaction hash:', hash);
             
             // Log to bridge history
             if ((window as any).addBridgeTransaction) {
               (window as any).addBridgeTransaction({
                 hash,
                 amount: tokenAmountParsed.toString(),
                 destinationChain,
                 recipient: recipientAddress
               });
             }
             
             // Reset form
             setTokenAmount('');
             setRecipientAddress(address || '');
             // Refresh balances
             setTimeout(() => {
               window.location.reload();
             }, 2000);
           },
           onError: (error) => {
             setIsLoading(false); // Reset loading state
             toast.error(`Bridge failed: ${error.message}`);
             console.error('❌ Bridge error:', error);
           }
         });
        
        return; // Exit early since we're handling the transaction directly
        
      } catch (error) {
        toast.error('Failed to initiate bridge transaction');
        console.error('❌ Direct bridge error:', error);
        setIsLoading(false);
      return;
      }
    }

    try {
      setIsLoading(true);
      
      writeContract(simulateData.request, {
        onSuccess: (hash) => {
          setIsLoading(false); // Reset loading state
          toast.success(`Bridge transaction initiated! Hash: ${hash}`);
          console.log('✅ Bridge transaction hash:', hash);
          
          // Log to bridge history
          if ((window as any).addBridgeTransaction) {
            (window as any).addBridgeTransaction({
              hash,
              amount: tokenAmountParsed.toString(),
              destinationChain,
              recipient: recipientAddress
            });
          }
          
          // Reset form
          setTokenAmount('');
          setRecipientAddress(address || '');
          // Refresh balances
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        },
        onError: (error) => {
          setIsLoading(false); // Reset loading state
          toast.error(`Bridge failed: ${error.message}`);
          console.error('❌ Bridge error:', error);
        }
      });
    } catch (error) {
      toast.error('Failed to initiate bridge transaction');
      console.error('❌ Bridge catch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format user balance for display
  const userBalanceFormatted = userTokenBalance ? formatUnits(userTokenBalance as bigint, 18) : '0';
  const bridgeFeeFormatted = bridgeFee ? formatEther(bridgeFee as bigint) : '0.001';
  const allowanceFormatted = tokenAllowance ? formatUnits(tokenAllowance as bigint, 18) : '0';

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🌉 Cross-Chain Bridge</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Your Property Token Balance: <span className="font-medium">{parseFloat(userBalanceFormatted).toFixed(2)} DREMS</span>
          </p>
          <p className="text-xs text-gray-500">
            Bridge Allowance: {parseFloat(allowanceFormatted).toFixed(2)} DREMS
          </p>
          <p className="text-xs text-blue-600 font-medium">
            Bridge Fee: ~{bridgeFeeFormatted} ETH + ~0.05 ETH (CCIP) = ~{(parseFloat(bridgeFeeFormatted) + 0.05).toFixed(3)} ETH total
          </p>
        </div>

        {/* Status Indicators */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Bridge Status</h4>
          <div className="space-y-1 text-xs">
            <p className={isChainAllowed ? 'text-green-600' : 'text-red-600'}>
              {isChainAllowed ? '✅' : '❌'} Destination Chain: {isChainAllowed ? 'Configured' : 'Not Configured'}
            </p>
            <p className={hasAllowance ? 'text-green-600' : 'text-amber-600'}>
              {hasAllowance ? '✅' : '⚠️'} Token Approval: {hasAllowance ? 'Sufficient' : 'Required'}
            </p>
            <p className={hasSufficientBalance ? 'text-green-600' : 'text-red-600'}>
              {hasSufficientBalance ? '✅' : '❌'} Balance: {hasSufficientBalance ? 'Sufficient' : 'Insufficient'}
            </p>
          </div>
        </div>

        {/* Approval Section */}
        {!hasAllowance && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="font-medium text-amber-900 mb-2">⚠️ Approval Required</h4>
            <p className="text-sm text-amber-800 mb-3">
              You need to approve the bridge to spend your tokens before bridging.
            </p>
            <button
              onClick={handleApprove}
              className="w-full py-2 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Approve Bridge to Spend Tokens
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token Amount to Bridge
          </label>
          <input
            type="number"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            placeholder="Enter amount (e.g., 100)"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {tokenAmount && !hasValidAmount && (
            <p className="text-xs text-red-600 mt-1">Please enter a valid amount</p>
          )}
          {hasValidAmount && !hasSufficientBalance && (
            <p className="text-xs text-red-600 mt-1">Insufficient balance (Available: {parseFloat(userBalanceFormatted).toFixed(2)} DREMS)</p>
          )}
          <div className="mt-1 flex space-x-2">
            <button
              onClick={() => setTokenAmount('100')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
            >
              100
            </button>
            <button
              onClick={() => setTokenAmount('500')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
            >
              500
            </button>
            <button
              onClick={() => setTokenAmount('1000')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
            >
              1000
            </button>
            <button
              onClick={() => userTokenBalance && setTokenAmount(formatUnits(userTokenBalance as bigint, 18))}
              className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200"
            >
              Max
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination Chain
          </label>
          <select
            value={destinationChain}
            onChange={(e) => setDestinationChain(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="16015286601757825753">Ethereum Sepolia</option>
            <option value="3478487238524512106">Arbitrum Sepolia</option>
            <option value="5224473277236331295">Optimism Sepolia</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Bridge Details</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p>Bridge Fee: {bridgeFeeFormatted} AVAX</p>
            <p>Amount: {tokenAmount || '0'} DREMS tokens</p>
            <p>Estimated Gas: ~0.01 AVAX</p>
            <p>Destination: {destinationChain === '16015286601757825753' ? 'Ethereum Sepolia' : 
                           destinationChain === '3478487238524512106' ? 'Arbitrum Sepolia' : 
                           destinationChain === '5224473277236331295' ? 'Optimism Sepolia' : 'Unknown'}</p>
          </div>
        </div>

        <button
          onClick={handleBridge}
          disabled={!isConnected || !hasValidAmount || !destinationChain || !recipientAddress || isLoading || !hasSufficientBalance || !hasAllowance || !isChainAllowed}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            !isConnected || !hasValidAmount || !destinationChain || !recipientAddress || isLoading || !hasSufficientBalance || !hasAllowance || !isChainAllowed
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Bridging...' : 'Bridge Tokens'}
        </button>

        {/* Debug info for simulation issues */}
        {simulateError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="font-medium text-amber-900 mb-2">⚠️ Simulation Issue Detected</h4>
            <p className="text-sm text-amber-800 mb-2">
              The transaction simulation failed, but this might be due to CCIP fee calculation issues. 
              The bridge will attempt to execute directly with estimated fees.
            </p>
            <p className="text-xs text-amber-700">
              Error: {simulateError.message}
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Ensure you have sufficient AVAX for gas fees (~{bridgeFeeFormatted} AVAX + gas)</p>
          <p>• Bridge transactions may take 10-20 minutes to complete</p>
          <p>• Your tokens will be transferred to the destination chain</p>
          <p>• First-time users need to approve the bridge to spend tokens</p>
        </div>
      </div>
    </div>
  );
};

export default PropertyBridge; 