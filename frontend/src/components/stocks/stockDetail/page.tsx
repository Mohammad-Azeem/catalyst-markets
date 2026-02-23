'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  Info,
  Star,
  StarOff,
  RefreshCw,
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { stocksAPI } from '@/lib/api';

interface StockDetail {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  volume: number;
  high52Week: number | null;
  low52Week: number | null;
  marketCap: number | null;
  peRatio: number | null;
  dividendYield: number | null;
}

// Lightweight sparkline using SVG — no chart library needed
function Sparkline({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 300;
  const h = 80;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  const fill = `${points} ${w},${h} 0,${h}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-20"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={positive ? '#22c55e' : '#ef4444'}
            stopOpacity="0.3"
          />
          <stop
            offset="100%"
            stopColor={positive ? '#22c55e' : '#ef4444'}
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#grad)" />
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#22c55e' : '#ef4444'}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function StockDetailPage() {
  const params = useParams();
  const symbol = (params?.symbol as string)?.toUpperCase();

  const [stock, setStock] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  // WebSocket real-time price
  const { getPrice, isConnected } = useWebSocket();
  const livePrice = getPrice(symbol);

  useEffect(() => {
    if (symbol) fetchStock();
  }, [symbol]);

  // Track price changes into sparkline history
  useEffect(() => {
    if (livePrice?.price) {
      setPriceHistory((prev) => {
        const next = [...prev, livePrice.price].slice(-30); // keep last 30 ticks
        return next;
      });
    }
  }, [livePrice?.price]);

  const fetchStock = async () => {
    try {
      const res: any = await stocksAPI.getBySymbol(symbol);
      setStock(res.data);
      // Seed history with current price
      if (res.data?.currentPrice) {
        setPriceHistory([Number(res.data.currentPrice)]);
      }
      setLoading(false);
    } catch {
      setError('Stock not found');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">Stock Not Found</p>
          <p className="text-gray-500">Symbol "{symbol}" does not exist in our database.</p>
        </div>
      </div>
    );
  }

  // Use live WebSocket price if available, otherwise DB price
  const displayPrice = livePrice?.price ?? Number(stock.currentPrice);
  const displayChange = livePrice?.change ?? Number(stock.dayChange);
  const displayChangePercent =
    livePrice?.changePercent ?? Number(stock.dayChangePercent);
  const isPositive = displayChangePercent >= 0;

  const metrics = [
    {
      label: '52W High',
      value: stock.high52Week ? `₹${Number(stock.high52Week).toLocaleString()}` : '—',
    },
    {
      label: '52W Low',
      value: stock.low52Week ? `₹${Number(stock.low52Week).toLocaleString()}` : '—',
    },
    {
      label: 'Volume',
      value: stock.volume
        ? `${(Number(stock.volume) / 1_000_000).toFixed(2)}M`
        : '—',
    },
    {
      label: 'Market Cap',
      value: stock.marketCap
        ? `₹${(Number(stock.marketCap) / 10_000_000).toFixed(0)}Cr`
        : '—',
    },
    {
      label: 'P/E Ratio',
      value: stock.peRatio ? Number(stock.peRatio).toFixed(1) : '—',
    },
    {
      label: 'Div. Yield',
      value: stock.dividendYield ? `${Number(stock.dividendYield).toFixed(2)}%` : '—',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">

          {/* Left: Name & Symbol */}
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                <span className="text-blue-700 font-black text-lg">
                  {symbol.substring(0, 2)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{symbol}</h1>
                <p className="text-gray-500 text-sm">{stock.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-3">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                {stock.exchange}
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                {stock.sector}
              </span>
              {/* Live indicator */}
              <div className="flex items-center space-x-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                  }`}
                />
                <span className="text-xs text-gray-400">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Price */}
          <div className="text-right">
            <p className="text-4xl font-black text-gray-900">
              ₹{displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div
              className={`flex items-center justify-end space-x-1 mt-1 ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span className="text-lg font-semibold">
                {isPositive ? '+' : ''}
                {displayChange.toFixed(2)}
              </span>
              <span className="text-lg font-semibold">
                ({isPositive ? '+' : ''}
                {displayChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Sparkline Chart */}
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium flex items-center space-x-1">
              <Activity className="w-4 h-4" />
              <span>Live Price Movement</span>
            </span>
            <span className="text-xs text-gray-400">{priceHistory.length} ticks</span>
          </div>
          {priceHistory.length >= 2 ? (
            <Sparkline data={priceHistory} positive={isPositive} />
          ) : (
            <div className="h-20 flex items-center justify-center text-gray-400 text-sm">
              Waiting for price data...
            </div>
          )}
        </div>

        {/* Watchlist Button */}
        <div className="mt-4 flex space-x-3">
          <button
            onClick={() => setInWatchlist(!inWatchlist)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              inWatchlist
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {inWatchlist ? (
              <Star className="w-4 h-4 fill-current" />
            ) : (
              <StarOff className="w-4 h-4" />
            )}
            <span>{inWatchlist ? 'Watchlisted' : 'Add to Watchlist'}</span>
          </button>

          <button
            onClick={fetchStock}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <span>Key Metrics</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {metrics.map(({ label, value }) => (
            <div
              key={label}
              className="bg-gray-50 rounded-xl p-4 border border-gray-100"
            >
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                {label}
              </p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
          <Info className="w-5 h-5 text-blue-600" />
          <span>About {stock.name}</span>
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {stock.name} is listed on the {stock.exchange} exchange under the{' '}
          {stock.sector} sector. The stock is currently trading at ₹
          {displayPrice.toFixed(2)}, with a day change of{' '}
          {isPositive ? '+' : ''}
          {displayChangePercent.toFixed(2)}%.
        </p>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            ⚠️ Data shown is for informational purposes only. Not SEBI registered
            investment advice. Do your own research before investing.
          </p>
        </div>
      </div>
    </div>
  );
}
