'use client';

interface Props {
  symbol: string;
  currentPrice: number;
  fairValue: number | null;
  valuationGap: number | null;
  qualityScore: number | null;
  moatRating: string | null;
}

export default function ValuationCard({ symbol, currentPrice, fairValue, valuationGap, qualityScore, moatRating }: Props) {
  if (!fairValue || valuationGap === null) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12, fontFamily: 'var(--font-head)' }}>Valuation</h3>
        <p style={{ color: 'var(--txt-3)', fontSize: 14 }}>Valuation data not available</p>
      </div>
    );
  }

  const getValuationLabel = (gap: number) => {
    if (gap < -20) return { label: 'Undervalued', color: 'var(--green)' };
    if (gap < -10) return { label: 'Slightly Undervalued', color: 'var(--green)' };
    if (gap < 10) return { label: 'Fairly Valued', color: 'var(--txt-2)' };
    if (gap < 20) return { label: 'Slightly Overvalued', color: 'var(--amber)' };
    return { label: 'Overvalued', color: 'var(--red)' };
  };

  const { label, color } = getValuationLabel(valuationGap);

  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 20, fontFamily: 'var(--font-head)' }}>Valuation Analysis</h3>

      {/* Gauge */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: 'var(--txt-3)', marginBottom: 8 }}>Current vs Fair Value</div>
        <div style={{ fontSize: 36, fontWeight: 800, color, marginBottom: 4 }}>
          {valuationGap > 0 ? '+' : ''}{valuationGap.toFixed(0)}%
        </div>
        <div style={{ 
          display: 'inline-block', 
          padding: '4px 12px', 
          borderRadius: 999, 
          background: `${color}22`, 
          color, 
          fontSize: 12, 
          fontWeight: 600 
        }}>
          {label}
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--bg-2)', padding: 14, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 6 }}>Current Price</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            ₹{currentPrice.toFixed(2)}
          </div>
        </div>
        <div style={{ background: 'var(--bg-2)', padding: 14, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 6 }}>Fair Value</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            ₹{fairValue.toFixed(2)}
          </div>
        </div>
        {qualityScore && (
          <div style={{ background: 'var(--bg-2)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 6 }}>Quality Score</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{qualityScore}/10</div>
          </div>
        )}
        {moatRating && (
          <div style={{ background: 'var(--bg-2)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 6 }}>Moat Rating</div>
            <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{moatRating}</div>
          </div>
        )}
      </div>
    </div>
  );
}