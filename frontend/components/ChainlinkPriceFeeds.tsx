'use client';

import React, { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

// Chainlink Price Feed ABI (minimal)
const PRICE_FEED_ABI = [
  {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
      { "internalType": "uint80", "name": "roundId", "type": "uint80" },
      { "internalType": "int256", "name": "answer", "type": "int256" },
      { "internalType": "uint256", "name": "startedAt", "type": "uint256" },
      { "internalType": "uint256", "name": "updatedAt", "type": "uint256" },
      { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "description",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Avalanche Fuji Price Feeds
const PRICE_FEEDS = {
  'ETH/USD': '0x86d67c3D38D2bCeE722E601025C25a575021c6EA',
  'AVAX/USD': '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD',
  'BTC/USD': '0x31CF013A08c6Ac228C94551d535d5BAfE19c602a',
} as const;

interface PriceFeedData {
  price: string;
  decimals: number;
  updatedAt: number;
  description: string;
  isStale: boolean;
}

const ChainlinkPriceFeeds: React.FC = () => {
  const [priceData, setPriceData] = useState<Record<string, PriceFeedData>>({});

  // Read ETH/USD price feed
  const { data: ethPriceData } = useReadContract({
    address: PRICE_FEEDS['ETH/USD'],
    abi: PRICE_FEED_ABI,
    functionName: 'latestRoundData',
  });

  const { data: ethDecimals } = useReadContract({
    address: PRICE_FEEDS['ETH/USD'],
    abi: PRICE_FEED_ABI,
    functionName: 'decimals',
  });

  const { data: ethDescription } = useReadContract({
    address: PRICE_FEEDS['ETH/USD'],
    abi: PRICE_FEED_ABI,
    functionName: 'description',
  });

  // Read AVAX/USD price feed
  const { data: avaxPriceData } = useReadContract({
    address: PRICE_FEEDS['AVAX/USD'],
    abi: PRICE_FEED_ABI,
    functionName: 'latestRoundData',
  });

  const { data: avaxDecimals } = useReadContract({
    address: PRICE_FEEDS['AVAX/USD'],
    abi: PRICE_FEED_ABI,
    functionName: 'decimals',
  });

  const { data: avaxDescription } = useReadContract({
    address: PRICE_FEEDS['AVAX/USD'],
    abi: PRICE_FEED_ABI,
    functionName: 'description',
  });

  // Read BTC/USD price feed
  const { data: btcPriceData } = useReadContract({
    address: PRICE_FEEDS['BTC/USD'],
    abi: PRICE_FEED_ABI,
    functionName: 'latestRoundData',
  });

  const { data: btcDecimals } = useReadContract({
    address: PRICE_FEEDS['BTC/USD'],
    abi: PRICE_FEED_ABI,
    functionName: 'decimals',
  });

  const { data: btcDescription } = useReadContract({
    address: PRICE_FEEDS['BTC/USD'],
    abi: PRICE_FEED_ABI,
    functionName: 'description',
  });

  // Process price feed data
  useEffect(() => {
    const processedData: Record<string, PriceFeedData> = {};

    // Process ETH/USD
    if (ethPriceData && ethDecimals && ethDescription) {
      const [, answer, , updatedAt] = ethPriceData as [bigint, bigint, bigint, bigint, bigint];
      const now = Math.floor(Date.now() / 1000);
      // Adjust staleness check for testnet - use 24 hours instead of 1 hour
      const isStale = Math.abs(now - Number(updatedAt)) > 86400; // 24 hour staleness threshold
      
      processedData['ETH/USD'] = {
        price: formatUnits(answer, ethDecimals as number),
        decimals: ethDecimals as number,
        updatedAt: Number(updatedAt),
        description: ethDescription as string,
        isStale,
      };
    }

    // Process AVAX/USD
    if (avaxPriceData && avaxDecimals && avaxDescription) {
      const [, answer, , updatedAt] = avaxPriceData as [bigint, bigint, bigint, bigint, bigint];
      const now = Math.floor(Date.now() / 1000);
      const isStale = Math.abs(now - Number(updatedAt)) > 86400;
      
      processedData['AVAX/USD'] = {
        price: formatUnits(answer, avaxDecimals as number),
        decimals: avaxDecimals as number,
        updatedAt: Number(updatedAt),
        description: avaxDescription as string,
        isStale,
      };
    }

    // Process BTC/USD
    if (btcPriceData && btcDecimals && btcDescription) {
      const [, answer, , updatedAt] = btcPriceData as [bigint, bigint, bigint, bigint, bigint];
      const now = Math.floor(Date.now() / 1000);
      const isStale = Math.abs(now - Number(updatedAt)) > 86400;
      
      processedData['BTC/USD'] = {
        price: formatUnits(answer, btcDecimals as number),
        decimals: btcDecimals as number,
        updatedAt: Number(updatedAt),
        description: btcDescription as string,
        isStale,
      };
    }

    setPriceData(processedData);
  }, [ethPriceData, ethDecimals, ethDescription, avaxPriceData, avaxDecimals, avaxDescription, btcPriceData, btcDecimals, btcDescription]);

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTimeSinceUpdate = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">📊 Chainlink Price Feeds</h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Object.entries(priceData).map(([pair, data]) => (
          <div key={pair} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{pair}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                data.isStale ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {data.isStale ? 'Stale' : 'Fresh'}
              </span>
            </div>
            
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(data.price)}
              </p>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>Updated: {getTimeSinceUpdate(data.updatedAt)}</p>
                <p>Decimals: {data.decimals}</p>
                <p className="text-xs text-gray-500 truncate" title={data.description}>
                  {data.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Property Valuation Impact */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-gray-900 mb-3">🏠 Property Valuation Impact</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Collateral Calculations</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• AVAX price affects collateral requirements</li>
              <li>• ETH price impacts cross-chain valuations</li>
              <li>• Real-time updates ensure accurate ratios</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Automation Triggers</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• Price changes trigger rebalancing</li>
              <li>• Quarterly valuation updates</li>
              <li>• Automated maintenance scheduling</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Price Feed Addresses */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-800 mb-2">📍 Price Feed Contracts</h5>
        <div className="space-y-1 text-xs text-gray-600">
          {Object.entries(PRICE_FEEDS).map(([pair, address]) => (
            <div key={pair} className="flex justify-between">
              <span>{pair}:</span>
              <a
                href={`https://testnet.snowtrace.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono"
              >
                {address.slice(0, 10)}...{address.slice(-6)}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChainlinkPriceFeeds; 