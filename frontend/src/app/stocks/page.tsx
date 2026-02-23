'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Search, SlidersHorizontal } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Stock { id:number; symbol:string; name:string; exchange:string; sector:string; currentPrice:number; dayChange:number; dayChangePercent:number; volume:number; marketCap:number; }

export default function StocksPage() {
  const [stocks, setStocks]   = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchange, setExchange] = useState('');
  const [search, setSearch]   = useState('');
  const { pricesMap, isConnected } = useWebSocket();

  useEffect(() => { fetchStocks(); }, [exchange]);

  const fetchStocks = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res  = await fetch(`${base}/stocks?${exchange?`exchange=${exchange}&`:''}limit=50`);
      
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setStocks(data.data || []);
    } catch (err) {
      console.error('Failed to fetch stocks:', err);
    } finally { setLoading(false); }
  };

  const filtered = stocks.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-mesh" style={{minHeight:'100vh'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'32px 24px 80px'}}>

        {/* Header row */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:'.1em',color:'var(--txt-3)',textTransform:'uppercase',marginBottom:6}}>
              Market Data
            </div>
            <h1 style={{fontSize:'clamp(1.6rem,3vw,2.2rem)'}}>All Stocks</h1>
          </div>

          {/* Live pill */}
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderRadius:99,background:'var(--bg-3)',border:'1px solid var(--border)'}}>
            <div className={isConnected?'dot-live':'dot-dead'}/>
            <span style={{fontSize:11,fontWeight:600,color:isConnected?'var(--teal)':'var(--txt-3)',letterSpacing:'.06em'}}>
              {isConnected?`${filtered.length} STOCKS · LIVE`:'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div style={{display:'flex',gap:10,marginBottom:24,flexWrap:'wrap'}}>
          <div style={{position:'relative',flex:'1',minWidth:220}}>
            <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--txt-3)'}}/>
            <input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search symbol or name..." style={{paddingLeft:34}}/>
          </div>
          <div style={{display:'flex',gap:6}}>
            {['','NSE','NASDAQ'].map(ex=>(
              <button key={ex} onClick={()=>setExchange(ex)} className={`btn ${exchange===ex?'btn-primary':'btn-ghost'}`} style={{padding:'8px 16px',fontSize:12}}>
                <SlidersHorizontal size={12}/> {ex||'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="card-flat" style={{overflow:'hidden'}}>
            {Array.from({length:10}).map((_,i)=>(
              <div key={i} style={{padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
                <div className="skeleton" style={{height:18}}/>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-flat" style={{overflow:'hidden'}}>
            <table className="tbl">
              <thead><tr>
                <th>Symbol</th>
                <th>Company</th>
                <th>Sector</th>
                <th>Exchange</th>
                <th style={{textAlign:'right'}}>Price</th>
                <th style={{textAlign:'right'}}>Change</th>
                <th style={{textAlign:'right'}}>Volume</th>
                <th style={{textAlign:'right'}}>Mkt Cap</th>
              </tr></thead>
              <tbody>
                {filtered.map(s=>{
                  const live=pricesMap.get(s.symbol);
                  const price=live?.price??Number(s.currentPrice);
                  const change=live?.change??Number(s.dayChange);
                  const pct=live?.changePercent??Number(s.dayChangePercent);
                  const up=pct>=0;
                  return (
                    <tr key={s.id} onClick={()=>window.location.href=`/stocks/${s.symbol}`}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,rgba(20,210,180,.1),rgba(124,111,247,.1))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                            <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:600,color:'var(--teal)'}}>{s.symbol.slice(0,3)}</span>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <span style={{fontWeight:600,fontSize:13}}>{s.symbol}</span>
                            {live&&<div className="dot-live" style={{width:5,height:5}}/>}
                          </div>
                        </div>
                      </td>
                      <td style={{color:'var(--txt-2)',fontSize:12,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</td>
                      <td><span className="badge badge-violet" style={{fontSize:9}}>{s.sector?.slice(0,10)}</span></td>
                      <td><span className="badge badge-muted">{s.exchange}</span></td>
                      <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontWeight:600,fontSize:13}}>
                        ₹{price.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}
                      </td>
                      <td style={{textAlign:'right'}}>
                        <div className={up?'gain':'loss'} style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:3,fontWeight:600,fontSize:13}}>
                          {up?<TrendingUp size={12}/>:<TrendingDown size={12}/>}
                          {pct>=0?'+':''}{pct.toFixed(2)}%
                        </div>
                        <div style={{fontSize:11,color:up?'var(--green)':'var(--red)',textAlign:'right'}}>
                          {change>=0?'+':''}{Number(change).toFixed(2)}
                        </div>
                      </td>
                      <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontSize:12,color:'var(--txt-2)'}}>
                        {(Number(s.volume)/1_000_000).toFixed(2)}M
                      </td>
                      <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontSize:12,color:'var(--txt-2)'}}>
                        {s.marketCap?`₹${(Number(s.marketCap)/10_000_000).toFixed(0)}Cr`:'—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length===0&&(
              <div style={{padding:'48px',textAlign:'center',color:'var(--txt-3)'}}>No stocks match your search</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

