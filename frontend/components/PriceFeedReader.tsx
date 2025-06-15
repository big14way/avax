import React from 'react';
import { useContractRead } from 'wagmi';

// Avalanche Fuji Testnet Chainlink Price Feed Addresses
const PRICE_FEEDS = {
  LINK_USD: '0x79c91fd4F8b3DaBEe17d286EB11cEE4D83521775', // Using LINK/USD as TSLA substitute
  ETH_USD: '0x86d67c3D38D2bCeE722E601025C25a575021c6EA',  // Real ETH/USD feed
};

// Chainlink AggregatorV3Interface ABI (minimal)
const AGGREGATOR_V3_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

// Type for Chainlink latestRoundData response
type LatestRoundData = [bigint, bigint, bigint, bigint, bigint];

interface PriceFeedReaderProps {
  onPricesUpdate?: (prices: { tslaPrice: string; ethPrice: string }) => void;
}

export const PriceFeedReader: React.FC<PriceFeedReaderProps> = ({ onPricesUpdate }) => {
  const formatPrice = (price: bigint): string => {
    // Chainlink price feeds have 8 decimals
    const priceWithDecimals = Number(price) / 1e8;
    return priceWithDecimals.toFixed(2);
  };

  // Read LINK/USD price (using as TSLA substitute)
  const { data: linkPriceData } = useContractRead({
    address: PRICE_FEEDS.LINK_USD as `0x${string}`,
    abi: AGGREGATOR_V3_ABI,
    functionName: 'latestRoundData',
    watch: true,
  });

  // Read ETH/USD price
  const { data: ethPriceData } = useContractRead({
    address: PRICE_FEEDS.ETH_USD as `0x${string}`,
    abi: AGGREGATOR_V3_ABI,
    functionName: 'latestRoundData',
    watch: true,
  });

  // Update parent component when prices change
  React.useEffect(() => {
    if (linkPriceData && ethPriceData) {
      const linkPrice = formatPrice((linkPriceData as LatestRoundData)[1]);
      const ethPrice = formatPrice((ethPriceData as LatestRoundData)[1]);
      onPricesUpdate?.({ tslaPrice: linkPrice, ethPrice });
    }
  }, [linkPriceData, ethPriceData, onPricesUpdate]);

  const linkPrice = linkPriceData ? formatPrice((linkPriceData as LatestRoundData)[1]) : '0';
  const ethPrice = ethPriceData ? formatPrice((ethPriceData as LatestRoundData)[1]) : '0';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        🔗 Live Chainlink Price Feeds
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">${linkPrice}</div>
          <div className="text-sm text-gray-600">LINK/USD (as TSLA)</div>
          <div className="text-xs text-gray-400 mt-1">
            {linkPriceData ? 'Live Feed' : 'Connecting...'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">${ethPrice}</div>
          <div className="text-sm text-gray-600">ETH/USD</div>
          <div className="text-xs text-gray-400 mt-1">
            {ethPriceData ? 'Live Feed' : 'Connecting...'}
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500 text-center">
        ⚡ Data updates automatically from Chainlink oracles on Avalanche Fuji
      </div>
    </div>
  );
};

export default PriceFeedReader; 