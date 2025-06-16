import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_CONFIG } from '../contracts/config';
import PropertyInvestment from '@/components/PropertyInvestment';
import PropertyPortfolio from '@/components/PropertyPortfolio';
import PropertyBridge from '@/components/PropertyBridge';
import BridgeHistory from '@/components/BridgeHistory';
import PropertyAutomationStatus from '@/components/PropertyAutomationStatus';
import ChainlinkPriceFeeds from '@/components/ChainlinkPriceFeeds';
import SyntheticPropertyExplainer from '@/components/SyntheticPropertyExplainer';
import ContractSetup from '@/components/ContractSetup';

type TabType = 'overview' | 'properties' | 'portfolio' | 'analytics';

const Home: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Read total supply of property tokens
  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi,
    functionName: 'totalSupply',
  });

  // Read synthetic property token balance
  const { data: syntheticBalance, refetch: refetchSynthetic } = useReadContract({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  // Read synthetic property token symbol
  const { data: syntheticSymbol } = useReadContract({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi,
    functionName: 'symbol',
  });

  if (!mounted) return null;

  const tabs = [
    { id: 'overview', name: 'Overview', description: 'Platform overview & stats' },
    { id: 'properties', name: 'Properties', description: 'Browse & invest in properties' },
    { id: 'portfolio', name: 'Portfolio', description: 'Your real estate portfolio' },
    { id: 'analytics', name: 'Analytics', description: 'Market insights & data' },
  ];

  const syntheticBalanceFormatted = syntheticBalance ? formatEther(syntheticBalance as unknown as bigint) : '0';
  const totalSupplyFormatted = totalSupply ? String(totalSupply) : '0';

  const handleInvestmentSuccess = () => {
    refetchSynthetic();
    refetchSupply();
  };

  return (
    <>
      <Head>
        <title>DREMS - Decentralized Real Estate Management System</title>
        <meta name="description" content="Professional DeFi platform for real estate tokenization with Chainlink integration" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">D</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">DREMS</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live on Fuji</span>
                </div>
                
                {/* Desktop Navigation */}
                <nav className="hidden md:flex space-x-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-green-100 text-green-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="flex items-center space-x-4">
                <ConnectButton />
                
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  {mobileMenuOpen ? '✕' : '☰'}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden border-t border-gray-200 py-4">
                <nav className="flex flex-col space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as TabType);
                        setMobileMenuOpen(false);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-green-100 text-green-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {tab.name}
                      <span className="block text-xs text-gray-500">{tab.description}</span>
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  Decentralized Real Estate Management System
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Tokenize, trade, and manage real estate investments with Chainlink-powered automation
                </p>
              </div>

              {/* Platform Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600">Property Tokens</p>
                      <p className="text-2xl font-bold text-gray-900 truncate" title={totalSupplyFormatted}>
                        {totalSupplyFormatted}
                      </p>
                      <p className="text-xs text-gray-500">Total minted</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-xl">🏠</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Your Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isConnected ? syntheticBalanceFormatted : '0'}
                      </p>
                      <p className="text-xs text-gray-500">{String(syntheticSymbol || 'Tokens')}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-xl">💰</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Network</p>
                      <p className="text-2xl font-bold text-gray-900">Fuji</p>
                      <p className="text-xs text-gray-500">Avalanche Testnet</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-xl">⛰️</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <p className="text-2xl font-bold text-green-900">Live</p>
                      <p className="text-xs text-gray-500">All systems operational</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-xl">✅</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Architecture */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🏗️ Platform Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                    <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-600 text-2xl">🏠</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Property Tokenization</h4>
                    <p className="text-sm text-gray-600">Convert real estate into ERC-20 tokens with collateral backing</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 text-2xl">🌉</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Cross-Chain Bridge</h4>
                    <p className="text-sm text-gray-600">CCIP-powered bridging across Ethereum, Arbitrum, and Optimism</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 text-2xl">🤖</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Automated Management</h4>
                    <p className="text-sm text-gray-600">Chainlink Automation for rent collection and maintenance</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                    <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-yellow-600 text-2xl">📊</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Synthetic Assets</h4>
                    <p className="text-sm text-gray-600">Liquid ERC-20 tokens representing real estate ownership</p>
                  </div>
                </div>
              </div>

              {/* Smart Contract Ecosystem */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">⚙️ Smart Contract Ecosystem</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-indigo-200 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-indigo-600">🏦</span>
                      </div>
                      <h4 className="font-semibold text-gray-900">PropertyToken</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Core ERC-20 contract managing property investments with collateral requirements</p>
                    <div className="text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                      Investment • Collateral • Minting
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-6 border border-teal-200">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-teal-200 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-teal-600">🤖</span>
                      </div>
                      <h4 className="font-semibold text-gray-900">PropertyAutomation</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Chainlink Automation for rent collection, maintenance scheduling, and portfolio rebalancing</p>
                    <div className="text-xs text-teal-700 bg-teal-100 px-2 py-1 rounded">
                      Automation • Scheduling • Management
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-6 border border-rose-200">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-rose-200 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-rose-600">🌉</span>
                      </div>
                      <h4 className="font-semibold text-gray-900">PropertyBridge</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">CCIP-enabled cross-chain bridge for moving property tokens between networks</p>
                    <div className="text-xs text-rose-700 bg-rose-100 px-2 py-1 rounded">
                      CCIP • Cross-Chain • Bridging
                    </div>
                  </div>
                </div>
              </div>

              {/* Getting Started */}
              <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-8 text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">🚀 Ready to Get Started?</h3>
                  <p className="text-lg mb-6 opacity-90">
                    Begin your real estate investment journey with tokenized properties
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setActiveTab('properties')}
                      className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Browse Properties
                    </button>
                    <button
                      onClick={() => setActiveTab('portfolio')}
                      className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/30"
                    >
                      View Portfolio
                    </button>
                  </div>
                </div>
              </div>

              {/* Synthetic Property System Explainer */}
              <SyntheticPropertyExplainer />
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Real Estate Properties</h2>
                <p className="text-gray-600 mt-2">
                  Invest in tokenized real estate and manage cross-chain property transfers
                </p>
              </div>

              {/* Contract Setup - Show first */}
              <ContractSetup />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Investment Section */}
                <PropertyInvestment onSuccess={handleInvestmentSuccess} />
                
                {/* Cross-Chain Bridge Section */}
                <PropertyBridge />
              </div>
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Your Portfolio</h2>
                <p className="text-gray-600 mt-2">Track your real estate investments and cross-chain activities</p>
              </div>
              
              <div className="space-y-8">
                {/* Portfolio Overview */}
                <PropertyPortfolio />
                
                {/* Property Automation Status */}
                <PropertyAutomationStatus />
                
                {/* Bridge History */}
                <BridgeHistory />
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Market Analytics</h2>
                <p className="text-gray-600 mt-2">Real-time market insights and Chainlink data feeds</p>
              </div>
              
              {/* Chainlink Price Feeds */}
              <ChainlinkPriceFeeds />
              
              {/* Property Automation Analytics */}
              <PropertyAutomationStatus />
              
              {/* Future Analytics Placeholder */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 text-2xl">📈</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
                  <p className="text-gray-500 mb-4">
                    Additional analytics features are being developed
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-1">Property Performance</h4>
                      <p className="text-xs">ROI tracking and yield analysis</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-1">Market Trends</h4>
                      <p className="text-xs">Real estate market indicators</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-1">Risk Metrics</h4>
                      <p className="text-xs">Collateral ratios and liquidation risks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-500">
              <p className="mb-2">DREMS Platform - Powered by Chainlink & Avalanche</p>
              <div className="flex justify-center space-x-6 text-sm">
                <a 
                  href="https://testnet.snowtrace.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-700"
                >
                  Snowtrace Explorer
                </a>
                <a 
                  href="https://faucet.avax.network" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-700"
                >
                  AVAX Faucet
                </a>
                <a 
                  href="https://chain.link" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-700"
                >
                  Chainlink
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home; 