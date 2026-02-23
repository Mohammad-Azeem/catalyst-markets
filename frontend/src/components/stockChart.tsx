'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

interface ChartProps {
  symbol: string;
  exchange: string;
}

const TIMEFRAMES = [
  { label: '1D', range: '1d', interval: '5m' },
  { label: '5D', range: '5d', interval: '15m' },
  { label: '1M', range: '1mo', interval: '1d' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' },
];

//V2 update
// Simple utility to determine currency symbol based on exchange
const getCurrencySymbol = (exchange: string) => {
  return exchange === 'NASDAQ' || exchange === 'NYSE' ? '$' : '₹';
};

export default function StockChart({ symbol, exchange }: ChartProps) {
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create chart
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#0c1018' },
        textColor: '#8897af',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      width: containerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
    });

    // Add candlestick series (v5 API)
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22d47a',
      downColor: '#f05060',
      borderUpColor: '#22d47a',
      borderDownColor: '#f05060',
      wickUpColor: '#22d47a',
      wickDownColor: '#f05060',
    });

    // Add volume histogram (v5 API)
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = { chart, candleSeries, volumeSeries };

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) fetchData();
  }, [symbol, timeframe]);

  const fetchData = async () => {
    if (!chartRef.current) return;

    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(
        `${base}/stocks/${symbol}/historical?range=${timeframe.range}&interval=${timeframe.interval}`
      );
      const json = await res.json();
      const data = json.data || [];

      if (data.length === 0) {
        console.warn('No chart data for', symbol);
        return;
      }

      const candles = data.map((bar: any) => ({
        time: Math.floor(bar.timestamp / 1000),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      }));

      const volumes = data.map((bar: any) => ({
        time: Math.floor(bar.timestamp / 1000),
        value: bar.volume,
        color: bar.close >= bar.open ? 'rgba(34,212,122,0.3)' : 'rgba(240,80,96,0.3)',
      }));

      chartRef.current.candleSeries.setData(candles);
      chartRef.current.volumeSeries.setData(volumes);
      chartRef.current.chart.timeScale().fitContent();
    } catch (err) {
      console.error('Chart fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.label}
            onClick={() => setTimeframe(tf)}
            disabled={loading}
            className={`btn ${tf.label === timeframe.label ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(12,16,24,0.8)',
            zIndex: 10,
            borderRadius: 16,
          }}>
            <div className="skeleton" style={{ width: 100, height: 20 }} />
          </div>
        )}
        <div ref={containerRef} style={{ borderRadius: 16, border: '1px solid var(--border)' }} />
      </div>
    </div>
  );
}