import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import toast from 'react-hot-toast';
import { CONTRACT_CONFIG, SAMPLE_PROPERTIES, PROPERTY_TYPES } from '@/config/contractConfig';

type TabType = 'overview' | 'properties' | 'portfolio' | 'analytics';

const Home: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedProperty, setSelectedProperty] = useState<number>(0);
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Read total supply of property tokens
  const { data: totalSupply, refetch: refetchSupply } = useContractRead({
    address: CONTRACT_CONFIG.PropertyToken.address as `0x${string}`,
    abi: CONTRACT_CONFIG.PropertyToken.abi as any,
    functionName: 'totalSupply',
    watch: true,
  });

  // Read synthetic property token balance
  const { data: syntheticBalance, refetch: refetchSynthetic } = useContractRead({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi as any,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
    watch: true,
  });

  // Read synthetic property token name
  const { data: syntheticName } = useContractRead({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi as any,
    functionName: 'name',
    watch: true,
  });

  // Read synthetic property token symbol
  const { data: syntheticSymbol } = useContractRead({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi as any,
    functionName: 'symbol',
    watch: true,
  });

  // Contract write for synthetic property investment
  const { config: investConfig } = usePrepareContractWrite({
    address: CONTRACT_CONFIG.SyntheticProperty.address as `0x${string}`,
    abi: CONTRACT_CONFIG.SyntheticProperty.abi as any,
    functionName: 'mint',
    args: investmentAmount ? [parseEther(investmentAmount)] : undefined,
    value: investmentAmount ? parseEther(investmentAmount) : undefined,
    enabled: Boolean(investmentAmount && parseFloat(investmentAmount) > 0),
  });

  const { write: invest, isLoading: isInvesting } = useContractWrite({
    ...investConfig,
    onSuccess: () => {
      toast.success('Investment successful! 🏡');
      setInvestmentAmount('');
      setTimeout(() => {
        refetchSynthetic();
        refetchSupply();
      }, 2000);
    },
    onError: (error: Error) => {
      toast.error(`Investment failed: ${error.message}`);
    },
  });

  if (!mounted) return null;

  const tabs = [
    { id: 'overview', name: 'Overview', description: 'Platform overview & stats' },
    { id: 'properties', name: 'Properties', description: 'Browse & invest in properties' },
    { id: 'portfolio', name: 'Portfolio', description: 'Your real estate portfolio' },
    { id: 'analytics', name: 'Analytics', description: 'Market insights & data' },
  ];

  const syntheticBalanceFormatted = syntheticBalance ? formatEther(syntheticBalance as unknown as bigint) : '0';
  const totalSupplyFormatted = totalSupply ? (totalSupply as bigint).toString() : '0';

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

              {/* Contract Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Property Tokens</p>
                      <p className="text-2xl font-bold text-gray-900">{totalSupplyFormatted}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-xl">🏠</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Total tokenized properties</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Your Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {parseFloat(syntheticBalanceFormatted).toFixed(2)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-xl">💎</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{syntheticSymbol || 'sDREMS'} tokens</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Automation</p>
                      <p className="text-2xl font-bold text-green-600">Active</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-xl">⚡</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Chainlink Automation</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Network</p>
                      <p className="text-2xl font-bold text-orange-600">Fuji</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600 text-xl">🔗</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Avalanche Testnet</p>
                </div>
              </div>

              {/* Contract Addresses */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployed Contracts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">PropertyToken</p>
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                      {CONTRACT_CONFIG.PropertyToken.address}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">SyntheticProperty</p>
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                      {CONTRACT_CONFIG.SyntheticProperty.address}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">PropertyAutomation</p>
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                      {CONTRACT_CONFIG.PropertyAutomation.address}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">PropertyBridge</p>
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                      {CONTRACT_CONFIG.PropertyBridge.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">Available Properties</h2>
                <p className="text-lg text-gray-600">Invest in tokenized real estate with synthetic tokens</p>
              </div>

              {/* Sample Investment Interface */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invest in Synthetic Property Tokens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Investment Amount (AVAX)
                      </label>
                      <input
                        type="number"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(e.target.value)}
                        placeholder="0.1"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    
                    <button
                      onClick={() => invest?.()}
                      disabled={!invest || isInvesting || !isConnected}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      {isInvesting ? 'Investing...' : 'Invest in Property Tokens'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">You will receive:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {investmentAmount || '0'} {syntheticSymbol || 'sDREMS'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Token Name:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {syntheticName || 'Synthetic DREMS Property'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Your Balance:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {parseFloat(syntheticBalanceFormatted).toFixed(4)} {syntheticSymbol || 'sDREMS'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">Your Portfolio</h2>
                <p className="text-lg text-gray-600">Manage your real estate investments</p>
              </div>

              {!isConnected ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">👛</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-600 mb-4">Connect your wallet to view your portfolio</p>
                  <ConnectButton />
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Holdings</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">{syntheticName || 'Synthetic DREMS Property'}</p>
                        <p className="text-sm text-gray-600">Property Token Balance</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {parseFloat(syntheticBalanceFormatted).toFixed(4)}
                        </p>
                        <p className="text-sm text-gray-600">{syntheticSymbol || 'sDREMS'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">Platform Analytics</h2>
                <p className="text-lg text-gray-600">Real-time platform metrics and insights</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Properties:</span>
                      <span className="font-medium">{totalSupplyFormatted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Automation:</span>
                      <span className="font-medium text-green-600">✓ Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network:</span>
                      <span className="font-medium">Avalanche Fuji</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Token Balance:</span>
                      <span className="font-medium">{parseFloat(syntheticBalanceFormatted).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wallet:</span>
                      <span className="font-medium text-xs">
                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Info</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 block text-sm">Synthetic Token:</span>
                      <span className="font-medium text-xs">{syntheticSymbol || 'sDREMS'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-sm">Token Name:</span>
                      <span className="font-medium text-xs">{syntheticName || 'Loading...'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Home; 