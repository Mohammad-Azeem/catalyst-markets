'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TrendingUp, TrendingDown, Star, StarOff, RefreshCw } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { stocksAPI } from '@/lib/api';
import StockChart from '@/components/stockChart';  // ✅ Capital S

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

export default function StockDetailPage() {
  const params = useParams();
  const symbol = (params?.symbol as string)?.toUpperCase();
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { getPrice, isConnected } = useWebSocket();
  const livePrice = getPrice(symbol);

  useEffect(() => {
    if (symbol) {
      stocksAPI.getBySymbol(symbol)
        .then((res: any) => {
          setStock(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [symbol]);

  if (loading) {
    return (
      <div className="bg-mesh" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: 200, height: 40 }} />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="bg-mesh" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <h2>Stock Not Found</h2>
        <a href="/stocks" className="btn btn-primary">Back to Stocks</a>
      </div>
    );
  }

  const price = livePrice?.price ?? Number(stock.currentPrice);
  const change = livePrice?.change ?? Number(stock.dayChange);
  const changePct = livePrice?.changePercent ?? Number(stock.dayChangePercent);
  const isUp = changePct >= 0;
  // Determine currency symbol based on exchange
  const currency = stock?.exchange === 'NASDAQ' || stock?.exchange === 'NYSE' ? '$' : '₹';

  return (
    <div className="bg-mesh" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Header */}
        // variable names and currency symbol logic
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h1 style={{ fontSize: 28, marginBottom: 8 }}>{symbol}</h1>
              <p style={{ color: 'var(--txt-2)', marginBottom: 12 }}>{stock.name}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-muted">{stock.exchange}</span>
                <span className="badge badge-violet">{stock.sector}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
                {currency}{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <div className={isUp ? 'gain' : 'loss'} style={{ fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                {isUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>

        {/* ✅ CHART - Correct component name */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 16, fontFamily: 'var(--font-head)' }}>
            Price Chart
          </h2>
          <StockChart symbol={symbol} exchange={stock.exchange} />
        </div>

        {/* Metrics */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 16, fontFamily: 'var(--font-head)' }}>
            Key Metrics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            {[
              { label: '52W High', value: stock.high52Week ? `₹${Number(stock.high52Week).toFixed(0)}` : '—' },
              { label: '52W Low', value: stock.low52Week ? `₹${Number(stock.low52Week).toFixed(0)}` : '—' },
              { label: 'Volume', value: `${(Number(stock.volume) / 1_000_000).toFixed(2)}M` },
              { label: 'Market Cap', value: stock.marketCap ? `₹${(Number(stock.marketCap) / 10_000_000).toFixed(0)}Cr` : '—' },
              { label: 'P/E Ratio', value: stock.peRatio ? Number(stock.peRatio).toFixed(1) : '—' },
              { label: 'Dividend', value: stock.dividendYield ? `${Number(stock.dividendYield).toFixed(2)}%` : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--bg-2)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}