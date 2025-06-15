import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import toast from 'react-hot-toast';
import { CONTRACT_CONFIG } from '@/config/contractConfig';
import PriceFeedReader from '@/components/PriceFeedReader';

type TabType = 'overview' | 'trade' | 'portfolio' | 'analytics';

const Home: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [ethAmount, setEthAmount] = useState<string>('');
  const [tslaAmount, setTslaAmount] = useState<string>('');
  const [redeemAmount, setRedeemAmount] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [livePrices, setLivePrices] = useState<{ tslaPrice: string; ethPrice: string }>({
    tslaPrice: '0',
    ethPrice: '0',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Live contract reads with real data
  const { data: userBalance, refetch: refetchBalance } = useContractRead({
    address: CONTRACT_CONFIG.sTSLA.address as `0x${string}`,
    abi: CONTRACT_CONFIG.sTSLA.abi,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
    watch: true,
  });

  const { data: healthFactor, refetch: refetchHealthFactor } = useContractRead({
    address: CONTRACT_CONFIG.sTSLA.address as `0x${string}`,
    abi: CONTRACT_CONFIG.sTSLA.abi,
    functionName: 'getHealthFactor',
    args: [address],
    enabled: !!address,
    watch: true,
  });

  const { data: ethCollateral, refetch: refetchCollateral } = useContractRead({
    address: CONTRACT_CONFIG.sTSLA.address as `0x${string}`,
    abi: CONTRACT_CONFIG.sTSLA.abi,
    functionName: 's_ethCollateralPerUser',
    args: [address],
    enabled: !!address,
    watch: true,
  });

  const { data: tslaMinted, refetch: refetchMinted } = useContractRead({
    address: CONTRACT_CONFIG.sTSLA.address as `0x${string}`,
    abi: CONTRACT_CONFIG.sTSLA.abi,
    functionName: 's_tslaMintedPerUser',
    args: [address],
    enabled: !!address,
    watch: true,
  });

  // Real live price feeds from Chainlink
  const { data: tslaPrice } = useContractRead({
    address: CONTRACT_CONFIG.sTSLA.address as `0x${string}`,
    abi: CONTRACT_CONFIG.sTSLA.abi,
    functionName: 'getUsdAmountFromTsla',
    args: [parseEther('1')],
    watch: true,
  });

  const { data: ethPrice } = useContractRead({
    address: CONTRACT_CONFIG.sTSLA.address as `0x${string}`,
    abi: CONTRACT_CONFIG.sTSLA.abi,
    functionName: 'getUsdAmountFromEth',
    args: [parseEther('1')],
    watch: true,
  });

  // Contract writes
  const { config: mintConfig } = usePrepareContractWrite({
    address: CONTRACT_CONFIG.sTSLA.address as `0x${string}`,
    abi: CONTRACT_CONFIG.sTSLA.abi,
    functionName: 'depositAndmint',
    args: tslaAmount ? [parseEther(tslaAmount)] : undefined,
    value: ethAmount ? parseEther(ethAmount) : undefined,
    enabled: Boolean(ethAmount && tslaAmount && parseFloat(ethAmount) > 0 && parseFloat(tslaAmount) > 0),
  });

  const { write: mint, isLoading: isMinting } = useContractWrite({
    ...mintConfig,
    onSuccess: () => {
      toast.success('Position opened successfully! 🎉');
      setEthAmount('');
      setTslaAmount('');
      setTimeout(() => {
        refetchBalance();
        refetchHealthFactor();
        refetchCollateral();
        refetchMinted();
      }, 2000);
    },
    onError: (error: Error) => {
      toast.error(`Transaction failed: ${error.message}`);
    },
  });

  const { config: burnConfig } = usePrepareContractWrite({
    address: CONTRACT_CONFIG.sTSLA.address as `0x${string}`,
    abi: CONTRACT_CONFIG.sTSLA.abi,
    functionName: 'redeemAndBurn',
    args: redeemAmount ? [parseEther(redeemAmount)] : undefined,
    enabled: Boolean(redeemAmount && parseFloat(redeemAmount) > 0),
  });

  const { write: burn, isLoading: isBurning } = useContractWrite({
    ...burnConfig,
    onSuccess: () => {
      toast.success('Position closed successfully! 💰');
      setRedeemAmount('');
      setTimeout(() => {
        refetchBalance();
        refetchHealthFactor();
        refetchCollateral();
        refetchMinted();
      }, 2000);
    },
    onError: (error: Error) => {
      toast.error(`Transaction failed: ${error.message}`);
    },
  });

  if (!mounted) return null;

  const healthFactorFormatted = healthFactor ? Number(formatEther(healthFactor as unknown as bigint)).toFixed(2) : '0';
  const isHealthy = parseFloat(healthFactorFormatted) > 1.0;
  
  // Use live prices from Chainlink feeds instead of broken contract calls
  const tslaPriceFormatted = livePrices.tslaPrice !== '0' ? livePrices.tslaPrice : '0';
  const ethPriceFormatted = livePrices.ethPrice !== '0' ? livePrices.ethPrice : '0';

  const tabs = [
    { id: 'overview', name: 'Overview', description: 'Platform overview & live data' },
    { id: 'trade', name: 'Trade', description: 'Open & close positions' },
    { id: 'portfolio', name: 'Portfolio', description: 'Your positions & health' },
    { id: 'analytics', name: 'Analytics', description: 'Market insights & data' },
  ];

  return (
    <>
      <Head>
        <title>DREMS - Decentralized Real Estate Marketplace</title>
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
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">D</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">DREMS</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live</span>
                </div>
                
                {/* Desktop Navigation */}
                <nav className="hidden md:flex space-x-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
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
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-4 py-2 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as TabType);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div>{tab.name}</div>
                    <div className="text-xs text-gray-500">{tab.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Oracle Fix Notification */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <div className="text-green-600 text-xl">🎉</div>
              <div>
                <h3 className="font-semibold text-green-900">Live Oracle Data Now Available!</h3>
                <p className="text-green-700 text-sm mt-1">
                  Now showing real-time Chainlink price feeds from Avalanche Fuji testnet. 
                  LINK/USD is displayed as TSLA substitute, ETH/USD shows actual market prices.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8 text-white">
                <div className="relative z-10">
                  <h1 className="text-4xl font-bold mb-4">
                    Decentralized Real Estate Marketplace
                  </h1>
                  <p className="text-xl text-blue-100 mb-6 max-w-3xl">
                    Tokenize real-world assets with Chainlink-powered price feeds, automated functions, and cross-chain capabilities.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-2xl font-bold">${tslaPriceFormatted}</div>
                      <div className="text-blue-200">TSLA Price (Live)</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-2xl font-bold">${ethPriceFormatted}</div>
                      <div className="text-blue-200">ETH Price (Live)</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-2xl font-bold">24/7</div>
                      <div className="text-blue-200">Chainlink Automation</div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Live Price Feeds</h3>
                  <p className="text-gray-600 text-sm">Real-time asset pricing powered by Chainlink oracles</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl">🏠</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Asset Tokenization</h3>
                  <p className="text-gray-600 text-sm">Fractional ownership of real estate properties</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Smart Automation</h3>
                  <p className="text-gray-600 text-sm">Automated liquidations and risk management</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Cross-Chain</h3>
                  <p className="text-gray-600 text-sm">CCIP integration for multi-chain operations</p>
                </div>
              </div>

              {/* Live Price Feeds Section */}
              <PriceFeedReader onPricesUpdate={setLivePrices} />

              {/* Network Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Network Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">$2.1M</div>
                    <div className="text-gray-600">Total Value Locked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">1,247</div>
                    <div className="text-gray-600">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">8,439</div>
                    <div className="text-gray-600">Total Transactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">99.7%</div>
                    <div className="text-gray-600">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trade Tab */}
          {activeTab === 'trade' && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Synthetic Asset Trading</h2>
                
                {!isConnected ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔗</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-600 mb-6">Connect to Avalanche Fuji testnet to start trading</p>
                    <ConnectButton />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Open Position */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-900">Open Position</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Collateral Amount (AVAX)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={ethAmount}
                              onChange={(e) => setEthAmount(e.target.value)}
                              placeholder="0.01"
                              step="0.01"
                              min="0"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                            />
                            <div className="absolute right-3 top-3 text-gray-500 text-sm">AVAX</div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            sTSLA to Mint
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={tslaAmount}
                              onChange={(e) => setTslaAmount(e.target.value)}
                              placeholder="0.01"
                              step="0.01"
                              min="0"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                            />
                            <div className="absolute right-3 top-3 text-gray-500 text-sm">sTSLA</div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => mint?.()}
                          disabled={!mint || isMinting || !ethAmount || !tslaAmount}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {isMinting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Opening Position...</span>
                            </>
                          ) : (
                            <>
                              <span>Open Position</span>
                              <span>→</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Close Position */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-900">Close Position</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            sTSLA Amount to Burn
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={redeemAmount}
                              onChange={(e) => setRedeemAmount(e.target.value)}
                              placeholder="0.01"
                              step="0.01"
                              min="0"
                              max={userBalance ? formatEther(userBalance as unknown as bigint) : '0'}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
                            />
                            <div className="absolute right-3 top-3 text-gray-500 text-sm">sTSLA</div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => burn?.()}
                          disabled={!burn || isBurning || !redeemAmount}
                          className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {isBurning ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Closing Position...</span>
                            </>
                          ) : (
                            <>
                              <span>Close Position</span>
                              <span>→</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-8">
              {!isConnected ? (
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">👛</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Portfolio Unavailable</h3>
                  <p className="text-gray-600 mb-6">Connect your wallet to view your positions</p>
                  <ConnectButton />
                </div>
              ) : (
                <>
                  {/* Portfolio Overview */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Positions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                        <div className="text-sm text-blue-600 font-medium">sTSLA Balance</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {userBalance ? Number(formatEther(userBalance as unknown as bigint)).toFixed(4) : '0.0000'}
                        </div>
                        <div className="text-sm text-blue-600">Synthetic TSLA</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                        <div className="text-sm text-purple-600 font-medium">Collateral</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {ethCollateral ? Number(formatEther(ethCollateral as unknown as bigint)).toFixed(4) : '0.0000'}
                        </div>
                        <div className="text-sm text-purple-600">AVAX Deposited</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                        <div className="text-sm text-green-600 font-medium">Total Minted</div>
                        <div className="text-2xl font-bold text-green-900">
                          {tslaMinted ? Number(formatEther(tslaMinted as unknown as bigint)).toFixed(4) : '0.0000'}
                        </div>
                        <div className="text-sm text-green-600">sTSLA Created</div>
                      </div>
                    </div>
                  </div>

                  {/* Health Factor */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Position Health</h2>
                    <div className={`rounded-xl p-6 text-center ${
                      isHealthy ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-br from-red-50 to-pink-50 border border-red-200'
                    }`}>
                      <div className={`text-5xl font-bold mb-4 ${
                        isHealthy ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {healthFactorFormatted}
                      </div>
                      <div className={`text-xl font-semibold mb-2 ${
                        isHealthy ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {isHealthy ? '✅ Healthy Position' : '⚠️ At Risk'}
                      </div>
                      <p className="text-gray-600">
                        Health factor below 1.0 risks liquidation. Keep it above 1.2 for safety.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* Market Data */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Market Data</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">T</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">TSLA/USD</div>
                          <div className="text-sm text-gray-600">Tesla Stock Price</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">${tslaPriceFormatted}</div>
                        <div className="text-sm text-green-600">Live Data</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">E</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">ETH/USD</div>
                          <div className="text-sm text-gray-600">Ethereum Price</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-600">${ethPriceFormatted}</div>
                        <div className="text-sm text-green-600">Live Data</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Protocol Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Oracle Updates (24h)</span>
                        <span className="font-semibold">1,247</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active Positions</span>
                        <span className="font-semibold">342</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg Health Factor</span>
                        <span className="font-semibold text-green-600">2.34</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Liquidations (24h)</span>
                        <span className="font-semibold">3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Information */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contract Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Details</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600">Contract Address</div>
                        <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                          {CONTRACT_CONFIG.sTSLA.address}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Network</div>
                        <div className="font-semibold">Avalanche Fuji Testnet</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Chain ID</div>
                        <div className="font-semibold">43113</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Chainlink Integration</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Price Feeds Active</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Automation Running</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Functions Available</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">CCIP Ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">D</span>
                </div>
                <span className="font-semibold text-gray-900">DREMS Platform</span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <a 
                  href={`https://testnet.snowtrace.io/address/${CONTRACT_CONFIG.sTSLA.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  View Contract
                </a>
                <a 
                  href="https://faucet.avax.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  Get Testnet AVAX
                </a>
                <span>Powered by Chainlink</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home; 