'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

interface Alert {
  id: number;
  stockSymbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  currentPrice: number;
  active: boolean;
  notified: boolean;
}

export default function AlertsPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchAlerts();
  }, [isLoaded, isSignedIn]);

  const fetchAlerts = async () => {
    try {
      const token = await getToken();
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${base}/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAlerts(data.data || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    if (!symbol.trim() || !targetPrice) return;
    try {
      const token = await getToken();
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      await fetch(`${base}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          targetPrice: parseFloat(targetPrice),
          condition,
        }),
      });
      setSymbol('');
      setTargetPrice('');
      setShowAdd(false);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to create alert:', error);
      alert('Failed to create alert');
    }
  };

  const deleteAlert = async (id: number) => {
    try {
      const token = await getToken();
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      await fetch(`${base}/alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="bg-mesh" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: 200, height: 40 }} />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="bg-mesh" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <h2>Sign in to manage price alerts</h2>
        <a href="/sign-in" className="btn btn-primary">Sign In</a>
      </div>
    );
  }

  return (
    <div className="bg-mesh" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: 'var(--txt-3)', textTransform: 'uppercase', marginBottom: 6 }}>
              Price Alerts
            </div>
            <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)' }}>Get Notified</h1>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            <Plus size={14} /> New Alert
          </button>
        </div>

        {showAdd && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
            <div className="card" style={{ width: '100%', maxWidth: 420, padding: 24 }}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>Create Price Alert</h3>
              <input
                className="input"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="Stock Symbol (e.g. RELIANCE)"
                style={{ marginBottom: 12 }}
              />
              <input
                className="input"
                type="number"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                placeholder="Target Price"
                style={{ marginBottom: 12 }}
              />
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  onClick={() => setCondition('ABOVE')}
                  className={`btn ${condition === 'ABOVE' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1 }}
                >
                  Above ₹{targetPrice || '___'}
                </button>
                <button
                  onClick={() => setCondition('BELOW')}
                  className={`btn ${condition === 'BELOW' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1 }}
                >
                  Below ₹{targetPrice || '___'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={createAlert} className="btn btn-primary" style={{ flex: 1 }}>
                  Create
                </button>
                <button onClick={() => { setShowAdd(false); setSymbol(''); setTargetPrice(''); }} className="btn btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="card" style={{ padding: 64, textAlign: 'center' }}>
            <Bell size={56} style={{ margin: '0 auto 20px', color: 'var(--txt-3)', opacity: 0.4 }} />
            <h3 style={{ marginBottom: 10, fontSize: 17 }}>No Alerts Set</h3>
            <p style={{ color: 'var(--txt-2)', marginBottom: 24, fontSize: 14 }}>
              Create price alerts to get notified via email
            </p>
            <button onClick={() => setShowAdd(true)} className="btn btn-primary">
              <Plus size={14} /> Create Alert
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.map(alert => (
              <div key={alert.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: alert.condition === 'ABOVE' ? 'var(--green-lo)' : 'var(--red-lo)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {alert.condition === 'ABOVE' ? <TrendingUp size={20} color="var(--green)" /> : <TrendingDown size={20} color="var(--red)" />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                      {alert.stockSymbol}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--txt-2)' }}>
                      Alert when {alert.condition.toLowerCase()} ₹{alert.targetPrice.toFixed(2)}
                      <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--txt-3)' }}>
                        (Current: ₹{alert.currentPrice?.toFixed(2) || 'N/A'})
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteAlert(alert.id)} className="btn btn-ghost" style={{ padding: '8px 12px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}