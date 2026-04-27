'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Filter, Zap, Target, Award, Gem, DollarSign, BarChart3 } from 'lucide-react';

interface Stock {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  currentPrice: number;
  dayChangePercent: number;
  peRatio: number | null;
  roe: number | null;
  qualityScore: number | null;
  valuationGap: number | null;
}

const PRESETS = [
  { id: 'momentum', label: 'Momentum', icon: Zap, color: 'var(--teal)' },
  { id: 'value', label: 'Value', icon: DollarSign, color: 'var(--green)' },
  { id: 'quality', label: 'Quality', icon: Award, color: 'var(--violet)' },
  { id: 'growth', label: 'Growth', icon: TrendingUp, color: 'var(--amber)' },
  { id: 'dividend', label: 'Dividend', icon: Target, color: 'var(--green)' },
  { id: '52-week-highs', label: '52W Highs', icon: BarChart3, color: 'var(--teal)' },
  { id: 'undervalued', label: 'Undervalued', icon: Gem, color: 'var(--violet)' },
];

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState('momentum');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchPreset(activePreset);
  }, [activePreset]);

  const fetchPreset = async (preset: string) => {
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${base}/screener/${preset}`);
      const data = await res.json();
      setStocks(data.data || []);
      setDescription(data.description || '');
    } catch (error) {
      console.error('Screener error:', error);
    } finally {
      setLoading(false);
    }
  };

  const currency = (exchange: string) => exchange === 'NASDAQ' || exchange === 'NYSE' ? '$' : '₹';

  return (
    <div className="bg-mesh" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: 'var(--txt-3)', textTransform: 'uppercase', marginBottom: 6 }}>
            Stock Screener
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', marginBottom: 8 }}>Find Your Next Investment</h1>
          <p style={{ color: 'var(--txt-2)', fontSize: 14 }}>{description}</p>
        </div>

        {/* Preset Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {PRESETS.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActivePreset(id)}
              className={`btn ${activePreset === id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                ...(activePreset === id ? { borderColor: color } : {}),
              }}
            >
              <Icon size={14} style={{ color: activePreset === id ? 'inherit' : color }} />
              {label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14 }}>
              {stocks.length} Results
            </span>
            <span className="badge badge-muted">{activePreset}</span>
          </div>

          {loading ? (
            <div style={{ padding: 40 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 60, marginBottom: 12 }} />
              ))}
            </div>
          ) : stocks.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--txt-3)' }}>
              No stocks found matching these criteria
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Change</th>
                  <th style={{ textAlign: 'right' }}>P/E</th>
                  <th style={{ textAlign: 'right' }}>ROE</th>
                  <th style={{ textAlign: 'right' }}>Quality</th>
                  <th style={{ textAlign: 'right' }}>Gap</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(stock => {
                  const isUp = stock.dayChangePercent >= 0;
                  return (
                    <tr key={stock.id} onClick={() => window.location.href = `/stocks/${stock.symbol}`}>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{stock.symbol}</span>
                        <br />
                        <span className="badge badge-muted" style={{ fontSize: 9 }}>{stock.exchange}</span>
                      </td>
                      <td style={{ color: 'var(--txt-2)', fontSize: 12 }}>{stock.name}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {currency(stock.exchange)}{Number(stock.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={isUp ? 'gain' : 'loss'} style={{ fontSize: 13, fontWeight: 600 }}>
                          {isUp ? '+' : ''}{Number(stock.dayChangePercent).toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {stock.peRatio ? Number(stock.peRatio).toFixed(1) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {stock.roe ? `${Number(stock.roe).toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {stock.qualityScore ? (
                          <span className={stock.qualityScore >= 7 ? 'badge badge-green' : 'badge badge-amber'}>
                            {stock.qualityScore}/10
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {stock.valuationGap ? (
                          <span className={stock.valuationGap < 0 ? 'gain' : 'loss'} style={{ fontSize: 12 }}>
                            {stock.valuationGap > 0 ? '+' : ''}{stock.valuationGap.toFixed(0)}%
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}