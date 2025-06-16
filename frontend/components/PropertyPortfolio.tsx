import React from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther, formatUnits } from 'viem';
import { CONTRACT_CONFIG } from '../contracts/config';

const PropertyPortfolio: React.FC = () => {
  const { address, isConnected } = useAccount();

  // Read synthetic property token balance
  const { data: syntheticBalance } = useReadContract({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  // Read DREMS property token balance (the main investment token)
  const { data: propertyTokenBalance } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  // Read synthetic property token name and symbol
  const { data: syntheticName } = useReadContract({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi,
    functionName: 'name',
  });

  const { data: syntheticSymbol } = useReadContract({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi,
    functionName: 'symbol',
  });

  // Read property token name and symbol
  const { data: propertyTokenName } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'name',
  });

  const { data: propertyTokenSymbol } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'symbol',
  });

  // Read total supply
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi,
    functionName: 'totalSupply',
  });

  // Read property token total supply
  const { data: propertyTokenTotalSupply } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'totalSupply',
  });

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">🏠</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Your Property Portfolio</h3>
          <p className="text-gray-500 mb-4">Connect your wallet to view your real estate investments</p>
        </div>
      </div>
    );
  }

  const balanceFormatted = syntheticBalance ? formatEther(syntheticBalance as unknown as bigint) : '0';
  const totalSupplyFormatted = totalSupply ? formatEther(totalSupply as unknown as bigint) : '0';
  const portfolioPercentage = totalSupply && syntheticBalance ? 
    ((Number(formatEther(syntheticBalance as unknown as bigint)) / Number(formatEther(totalSupply as unknown as bigint))) * 100).toFixed(2) : '0';

  // Property token calculations
  const propertyBalanceFormatted = propertyTokenBalance ? formatUnits(propertyTokenBalance as bigint, 18) : '0';
  const propertyTotalSupplyFormatted = propertyTokenTotalSupply ? formatUnits(propertyTokenTotalSupply as bigint, 18) : '0';
  const propertyPortfolioPercentage = propertyTokenTotalSupply && propertyTokenBalance ? 
    ((Number(formatUnits(propertyTokenBalance as bigint, 18)) / Number(formatUnits(propertyTokenTotalSupply as bigint, 18))) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Your Property Portfolio</h3>
          <div className="text-right">
            <p className="text-sm text-gray-500">Wallet</p>
            <p className="text-xs font-mono text-gray-400">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
            </p>
          </div>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* DREMS Property Tokens */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">DREMS Tokens</p>
                <p className="text-2xl font-bold text-green-900">
                  {parseFloat(propertyBalanceFormatted).toFixed(2)}
                </p>
                <p className="text-sm text-green-700">
                  {String(propertyTokenSymbol || 'DREMS')}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">🏠</span>
              </div>
            </div>
          </div>

          {/* Synthetic Holdings */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Synthetic Tokens</p>
                <p className="text-2xl font-bold text-blue-900">
                  {parseFloat(balanceFormatted).toFixed(4)}
                </p>
                <p className="text-sm text-blue-700">
                  {String(syntheticSymbol || 'SYNTH')}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">💎</span>
              </div>
            </div>
          </div>

          {/* Portfolio Share */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Portfolio Share</p>
                <p className="text-2xl font-bold text-purple-900">
                  {propertyPortfolioPercentage}%
                </p>
                <p className="text-sm text-purple-700">of DREMS supply</p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
            </div>
          </div>

          {/* Automation Status */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Automation</p>
                <p className="text-2xl font-bold text-orange-900">
                  Active
                </p>
                <p className="text-sm text-orange-700">Chainlink Keepers</p>
              </div>
              <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-xl">🤖</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PropertyAutomation Information */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="text-xl font-bold text-gray-900 mb-4">🤖 Property Automation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center mb-2">
              <span className="text-teal-600 text-lg mr-2">💰</span>
              <h5 className="font-semibold text-teal-900">Rent Collection</h5>
            </div>
            <p className="text-sm text-teal-700">Automated monthly rent collection and distribution to token holders</p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center mb-2">
              <span className="text-indigo-600 text-lg mr-2">📈</span>
              <h5 className="font-semibold text-indigo-900">Valuation Updates</h5>
            </div>
            <p className="text-sm text-indigo-700">Quarterly property valuation updates using Chainlink price feeds</p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center mb-2">
              <span className="text-amber-600 text-lg mr-2">🔧</span>
              <h5 className="font-semibold text-amber-900">Maintenance</h5>
            </div>
            <p className="text-sm text-amber-700">Automated maintenance scheduling and insurance claim processing</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-semibold mb-1">PropertyAutomation Contract</h5>
              <p className="text-sm opacity-90">Chainlink Automation handles all property management tasks</p>
            </div>
            <div className="text-right">
              <a 
                href={`https://testnet.snowtrace.io/address/${CONTRACT_CONFIG.PropertyAutomation?.address || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-200 text-sm underline"
              >
                View Contract
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Property Holdings */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 className="text-xl font-bold text-gray-900 mb-4">🏠 Property Holdings</h4>
        
        {(parseFloat(propertyBalanceFormatted) > 0 || parseFloat(balanceFormatted) > 0) ? (
          <div className="space-y-4">
            {/* DREMS Property Tokens */}
            {parseFloat(propertyBalanceFormatted) > 0 && (
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                      <span className="text-green-600">🏠</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">
                        {String(propertyTokenName || 'DREMS Property Token')}
                      </h5>
                      <p className="text-sm text-gray-600">
                        Primary real estate investment tokens
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-900">
                      {parseFloat(propertyBalanceFormatted).toFixed(2)} {String(propertyTokenSymbol)}
                    </p>
                    <p className="text-sm text-green-700">
                      {propertyPortfolioPercentage}% of total supply
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Synthetic Property Tokens */}
            {parseFloat(balanceFormatted) > 0 && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600">💎</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">
                        {String(syntheticName || 'Synthetic Property Tokens')}
                      </h5>
                      <p className="text-sm text-gray-600">
                        Liquid synthetic real estate assets
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-900">
                      {parseFloat(balanceFormatted).toFixed(4)} {String(syntheticSymbol)}
                    </p>
                    <p className="text-sm text-blue-700">
                      {portfolioPercentage}% of synthetic supply
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Progress Bar */}
            <div className="bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
                style={{ width: `${Math.min(parseFloat(propertyPortfolioPercentage), 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Your share of the DREMS property ecosystem ({propertyPortfolioPercentage}%)
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📈</span>
            </div>
            <h5 className="text-lg font-semibold text-gray-900 mb-2">No investments yet</h5>
            <p className="text-gray-500 mb-4">
              Start building your real estate portfolio by making your first investment
            </p>
            <button
              onClick={() => window.location.hash = '#properties'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Properties
            </button>
          </div>
        )}
      </div>

      {/* Contract Info */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h5 className="font-semibold text-gray-900 mb-2">Contract Information</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Synthetic Property Contract:</span>
            <a 
              href={`https://testnet.snowtrace.io/address/${CONTRACT_CONFIG.SyntheticProperty.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-mono"
            >
              {CONTRACT_CONFIG.SyntheticProperty.address.slice(0, 10)}...
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Network:</span>
            <span className="text-gray-900 font-medium">Avalanche Fuji Testnet</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyPortfolio; 