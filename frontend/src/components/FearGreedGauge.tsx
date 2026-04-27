'use client';

import { useEffect, useState } from 'react';

interface SentimentData {
  score: number;
  sentiment: string;
  marketMomentum: number;
  volatilityIndex: number;
}

export default function FearGreedGauge() {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSentiment();
  }, []);

  const fetchSentiment = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${base}/sentiment/current`);
      const json = await res.json();
      setData(json.data);
    } catch (error) {
      console.error('Failed to fetch sentiment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <div className="skeleton" style={{ width: 200, height: 200, margin: '0 auto', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!data) return null;

  // Color based on sentiment
  const getColor = (score: number) => {
    if (score <= 25) return '#f05060'; // Extreme Fear - Red
    if (score <= 45) return '#f59e0b'; // Fear - Orange
    if (score <= 55) return '#94a3b8'; // Neutral - Gray
    if (score <= 75) return '#22d47a'; // Greed - Green
    return '#14d2b4'; // Extreme Greed - Teal
  };

  const color = getColor(data.score);
  const rotation = (data.score / 100) * 180 - 90; // -90° to 90°

  return (
    <div className="card" style={{ padding: 32, textAlign: 'center' }}>
      <h3 style={{ fontSize: 16, marginBottom: 24, fontFamily: 'var(--font-head)' }}>
        Market Fear & Greed Index
      </h3>

      {/* Gauge */}
      <div style={{ position: 'relative', width: 200, height: 120, margin: '0 auto 24px' }}>
        {/* Background arc */}
        <svg width="200" height="120" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f05060" />
              <stop offset="25%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="75%" stopColor="#22d47a" />
              <stop offset="100%" stopColor="#14d2b4" />
            </linearGradient>
          </defs>
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
          />
        </svg>

        {/* Needle */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            width: 4,
            height: 70,
            background: color,
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            borderRadius: 2,
            transition: 'transform 1s ease',
            boxShadow: `0 0 10px ${color}`,
          }}
        />

        {/* Center dot */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            width: 12,
            height: 12,
            background: color,
            borderRadius: '50%',
            transform: 'translateX(-50%)',
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      </div>

      {/* Score */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'var(--font-head)', color, marginBottom: 8 }}>
          {data.score}
        </div>
        <div
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 999,
            background: `${color}1a`,
            color,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {data.sentiment.replace('_', ' ')}
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
        <div style={{ background: 'var(--bg-2)', padding: 12, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 4 }}>Market Momentum</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {data.marketMomentum.toFixed(1)}%
          </div>
        </div>
        <div style={{ background: 'var(--bg-2)', padding: 12, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 4 }}>Volatility</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {data.volatilityIndex.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}