'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function AllotmentChecker({ ipoName }: { ipoName: string }) {
  const [pan, setPan] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkAllotment = async () => {
    if (!pan || pan.length !== 10) return alert('Enter valid PAN');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/allotment/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan: pan.toUpperCase(), ipoName }),
      });
      const data = await res.json();
      setResult(data.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{padding:24}}>
      <h3 style={{fontSize:16,marginBottom:16}}>Check Allotment Status</h3>
      <div style={{display:'flex',gap:10,marginBottom:16}}>
        <input
          value={pan}
          onChange={e=>setPan(e.target.value)}
          placeholder="Enter PAN (e.g. ABCDE1234F)"
          maxLength={10}
          style={{flex:1,padding:'10px 14px',borderRadius:8,border:'1px solid var(--border)',background:'var(--bg-2)',color:'var(--txt)'}}
        />
        <button onClick={checkAllotment} disabled={loading} className="btn btn-primary">
          <Search size={14}/> Check
        </button>
      </div>
      {result && (
        <div style={{padding:16,borderRadius:10,background:result.status==='ALLOTTED'?'var(--green-lo)':'var(--red-lo)',border:'1px solid var(--border)'}}>
          <div style={{fontWeight:600,marginBottom:8,color:result.status==='ALLOTTED'?'var(--green)':'var(--red)'}}>
            {result.status}
          </div>
          <div style={{fontSize:13,color:'var(--txt-2)'}}>{result.message}</div>
          {result.shares && <div style={{marginTop:8,fontSize:14,fontWeight:600}}>Shares: {result.shares}</div>}
        </div>
      )}
    </div>
  );
}