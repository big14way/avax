'use client';

import React, { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_CONFIG } from '../contracts/config';

const SyntheticPropertyExplainer: React.FC = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'overview' | 'mechanism' | 'benefits' | 'integration'>('overview');

  // Read synthetic property data
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi,
    functionName: 'totalSupply',
  });

  const { data: userBalance } = useReadContract({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: propertyValue } = useReadContract({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi,
    functionName: 'propertyValue',
  });

  const { data: collateralRatio } = useReadContract({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi,
    functionName: 'collateralRatio',
  });

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">🏗️ Synthetic Property System</h3>
        <div className="text-sm text-gray-600">
          Contract: {CONTRACT_CONFIG.SyntheticProperty.address}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'mechanism', label: 'How It Works' },
          { id: 'benefits', label: 'Benefits' },
          { id: 'integration', label: 'DREMS Integration' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'mechanism' | 'benefits' | 'integration')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Total Supply</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {totalSupply ? formatEther(totalSupply as bigint) : '0'}
                  </p>
                  <p className="text-sm text-purple-700">SynProp Tokens</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-xl">🏗️</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Your Balance</p>
                  <p className="text-2xl font-bold text-green-900">
                    {userBalance ? formatEther(userBalance as bigint) : '0'}
                  </p>
                  <p className="text-sm text-green-700">SynProp Tokens</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">💎</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Property Value</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${propertyValue ? formatEther(propertyValue as bigint) : '0'}
                  </p>
                  <p className="text-sm text-blue-700">USD Value</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">Collateral Ratio</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {collateralRatio ? String(collateralRatio) : '150'}%
                  </p>
                  <p className="text-sm text-orange-700">Safety Buffer</p>
                </div>
                <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-xl">🛡️</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">What are Synthetic Properties?</h4>
            <p className="text-gray-700 mb-4">
              Synthetic Properties are tokenized representations of real estate assets that enable global investment 
              without the traditional barriers of property ownership. They provide exposure to property values through 
              blockchain-based tokens backed by real assets.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 text-2xl">🌍</span>
                </div>
                <h5 className="font-medium text-gray-900">Global Access</h5>
                <p className="text-sm text-gray-600">Invest in properties worldwide</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 text-2xl">⚡</span>
                </div>
                <h5 className="font-medium text-gray-900">Instant Liquidity</h5>
                <p className="text-sm text-gray-600">Trade property exposure 24/7</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 text-2xl">💎</span>
                </div>
                <h5 className="font-medium text-gray-900">Fractional Ownership</h5>
                <p className="text-sm text-gray-600">Own fractions of high-value properties</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works Tab */}
      {activeTab === 'mechanism' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <h4 className="text-lg font-semibold mb-3">🔧 Synthetic Property Mechanism</h4>
            <p className="mb-4 opacity-90">
              Synthetic properties use collateral-backed tokens to track real estate values without direct ownership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-gray-900">1. Collateral Deposit</h5>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Users deposit AVAX or other accepted collateral</li>
                  <li>• Minimum 150% collateralization ratio maintained</li>
                  <li>• Chainlink Price Feeds ensure accurate valuations</li>
                  <li>• Over-collateralization protects against volatility</li>
                </ul>
              </div>

              <h5 className="text-lg font-semibold text-gray-900">3. Price Tracking</h5>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Chainlink Functions fetch real property data</li>
                  <li>• PropertyAutomation updates values quarterly</li>
                  <li>• Market conditions trigger rebalancing</li>
                  <li>• Transparent on-chain price history</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-gray-900">2. Token Minting</h5>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• SynProp tokens minted against collateral</li>
                  <li>• Each token represents $1 of property value</li>
                  <li>• Backed by real estate appreciation data</li>
                  <li>• Redeemable for underlying collateral</li>
                </ul>
              </div>

              <h5 className="text-lg font-semibold text-gray-900">4. Cross-Chain Trading</h5>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• CCIP enables cross-chain transfers</li>
                  <li>• Trade on multiple DEXs and markets</li>
                  <li>• Bridge between Avalanche and Ethereum</li>
                  <li>• Global liquidity pools</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h6 className="font-medium text-yellow-800 mb-2">⚠️ Important: Liquidation Protection</h6>
            <p className="text-sm text-yellow-700">
              If collateral value drops below 120%, positions may be liquidated to maintain system stability. 
              Users receive remaining collateral after covering the synthetic token value.
            </p>
          </div>
        </div>
      )}

      {/* Benefits Tab */}
      {activeTab === 'benefits' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <h4 className="text-lg font-semibold text-green-900 mb-4">📈 For Investors</h4>
              <ul className="space-y-3 text-sm text-green-800">
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>Global Diversification:</strong> Access properties in different markets and regions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>Lower Barriers:</strong> Invest with smaller amounts, no minimum property purchases</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>Instant Liquidity:</strong> Exit positions anytime without lengthy sales processes</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>Passive Income:</strong> Earn from property appreciation without management</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>Transparent Pricing:</strong> Real-time, oracle-based property valuations</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-4">🏢 For Property Owners</h4>
              <ul className="space-y-3 text-sm text-blue-800">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span><strong>Unlock Liquidity:</strong> Access property value without selling</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span><strong>Global Capital:</strong> Attract international investors to your properties</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span><strong>Automated Management:</strong> Chainlink Automation handles operations</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span><strong>Fair Valuation:</strong> Market-driven pricing prevents undervaluation</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span><strong>Reduced Costs:</strong> Lower transaction fees than traditional real estate</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">🌐 Market Impact</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">$2.7T</div>
                <p className="text-sm text-gray-700">Global real estate investment market</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                <p className="text-sm text-gray-700">Trading availability vs traditional markets</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">0.1%</div>
                <p className="text-sm text-gray-700">Trading fees vs 2-6% traditional costs</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DREMS Integration Tab */}
      {activeTab === 'integration' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
            <h4 className="text-lg font-semibold mb-3">🔗 DREMS Platform Integration</h4>
            <p className="opacity-90">
              Synthetic Properties are the bridge between traditional real estate and DeFi, enabling global liquidity 
              and fractional ownership while maintaining exposure to real property values.
            </p>
          </div>

          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h5 className="text-lg font-semibold text-gray-900 mb-4">🔄 Integration Flow</h5>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
                  <div>
                    <h6 className="font-medium text-gray-900">Property Tokenization</h6>
                    <p className="text-sm text-gray-600">Real properties are tokenized as PropertyTokens (DREMS) representing direct ownership</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">2</div>
                  <div>
                    <h6 className="font-medium text-gray-900">Synthetic Creation</h6>
                    <p className="text-sm text-gray-600">SyntheticProperty tokens track property values without direct ownership, enabling broader access</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">3</div>
                  <div>
                    <h6 className="font-medium text-gray-900">Cross-Chain Trading</h6>
                    <p className="text-sm text-gray-600">CCIP bridge enables trading both PropertyTokens and SyntheticProperty across chains</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">4</div>
                  <div>
                    <h6 className="font-medium text-gray-900">Automated Management</h6>
                    <p className="text-sm text-gray-600">PropertyAutomation maintains both token types with rent collection, valuations, and maintenance</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h6 className="font-semibold text-blue-900 mb-3">🏠 PropertyTokens (DREMS)</h6>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Direct property ownership</li>
                  <li>• Receive actual rental income</li>
                  <li>• Voting rights on property decisions</li>
                  <li>• Higher returns but less liquidity</li>
                  <li>• Limited supply per property</li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h6 className="font-semibold text-purple-900 mb-3">🏗️ SyntheticProperty (SynProp)</h6>
                <ul className="space-y-2 text-sm text-purple-800">
                  <li>• Exposure to property values</li>
                  <li>• Instant liquidity and trading</li>
                  <li>• Global accessibility</li>
                  <li>• Lower barrier to entry</li>
                  <li>• Unlimited mintable supply</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
              <h5 className="text-lg font-semibold text-gray-900 mb-3">🎯 Strategic Goals</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h6 className="font-medium text-gray-800 mb-2">Market Expansion</h6>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Attract retail investors with synthetic tokens</li>
                    <li>• Provide institutional-grade property exposure</li>
                    <li>• Enable global property investment</li>
                  </ul>
                </div>
                <div>
                  <h6 className="font-medium text-gray-800 mb-2">Liquidity Solutions</h6>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Create 24/7 tradeable property exposure</li>
                    <li>• Bridge traditional and DeFi markets</li>
                    <li>• Enable arbitrage opportunities</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyntheticPropertyExplainer; 