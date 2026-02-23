'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Plus, Star, X, Search } from 'lucide-react';
import { watchlistAPI } from '@/lib/api';

interface Stock { id:number; symbol:string; name:string; exchange:string; currentPrice:number; dayChangePercent:number; }
interface Watchlist { id:number; name:string; stocks:Stock[]; stockCount:number; }

export default function WatchlistPage() {
  const [lists, setLists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [selectedId, setSelectedId] = useState<number|null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');

  useEffect(()=>{ fetch(); },[]);

  const fetch = async () => {
    try {
      const res: any = await watchlistAPI.getAll();
      setLists(res.data||[]);
    } finally { setLoading(false); }
  };

  const create = async () => {
    if (!name.trim()) return;
    try {
      await watchlistAPI.create({name});
      setName('');
      setShowAdd(false);
      fetch();
    } catch { alert('Failed'); }
  };

  const addStock = async () => {
    if (!symbol.trim()||!selectedId) return;
    try {
      await watchlistAPI.addStock(selectedId, symbol.toUpperCase());
      setSymbol('');
      setShowStock(false);
      setSelectedId(null);
      fetch();
    } catch(e:any) { alert(e.message||'Failed'); }
  };

  const remove = async (wid:number, sid:number) => {
    if (!confirm('Remove?')) return;
    try {
      await watchlistAPI.removeStock(wid, sid);
      fetch();
    } catch { alert('Failed'); }
  };

  return (
    <div className="bg-mesh" style={{minHeight:'100vh'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'32px 24px 80px'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:'.1em',color:'var(--txt-3)',textTransform:'uppercase',marginBottom:6}}>Watchlist</div>
            <h1 style={{fontSize:'clamp(1.6rem,3vw,2.2rem)'}}>Track Your Favorites</h1>
          </div>
          <button onClick={()=>setShowAdd(true)} className="btn btn-primary">
            <Plus size={14}/> New Watchlist
          </button>
        </div>

        {/* Create list modal */}
        {showAdd && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:24}}>
            <div className="card" style={{width:'100%',maxWidth:420,padding:24}}>
              <h3 style={{marginBottom:16,fontSize:16}}>Create Watchlist</h3>
              <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Tech Stocks" onKeyPress={e=>e.key==='Enter'&&create()} style={{marginBottom:16}}/>
              <div style={{display:'flex',gap:10}}>
                <button onClick={create} className="btn btn-primary" style={{flex:1}}>Create</button>
                <button onClick={()=>{setShowAdd(false);setName('');}} className="btn btn-ghost" style={{flex:1}}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Add stock modal */}
        {showStock && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:24}}>
            <div className="card" style={{width:'100%',maxWidth:420,padding:24}}>
              <h3 style={{marginBottom:16,fontSize:16}}>Add Stock</h3>
              <div style={{position:'relative',marginBottom:12}}>
                <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--txt-3)'}}/>
                <input className="input" value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="Enter symbol (e.g. RELIANCE)" onKeyPress={e=>e.key==='Enter'&&addStock()} style={{paddingLeft:36}}/>
              </div>
              <p style={{fontSize:12,color:'var(--txt-3)',marginBottom:16}}>Try: RELIANCE, TCS, INFY, AAPL, MSFT</p>
              <div style={{display:'flex',gap:10}}>
                <button onClick={addStock} className="btn btn-primary" style={{flex:1}}>Add</button>
                <button onClick={()=>{setShowStock(false);setSymbol('');setSelectedId(null);}} className="btn btn-ghost" style={{flex:1}}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && lists.length===0 && (
          <div className="card" style={{padding:64,textAlign:'center'}}>
            <Star size={56} style={{margin:'0 auto 20px',color:'var(--txt-3)',opacity:.4}}/>
            <h3 style={{marginBottom:10,fontSize:17}}>No Watchlists Yet</h3>
            <p style={{color:'var(--txt-2)',marginBottom:24,fontSize:14}}>Create a watchlist to track your favorite stocks</p>
            <button onClick={()=>setShowAdd(true)} className="btn btn-primary">
              <Plus size={14}/> Create Watchlist
            </button>
          </div>
        )}

        {/* Lists */}
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          {lists.map(w=>(
            <div key={w.id} className="card" style={{overflow:'hidden'}}>

              {/* Header */}
              <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <Star size={18} className="gain" style={{fill:'currentColor'}}/>
                  <div>
                    <h3 style={{fontSize:15,marginBottom:2}}>{w.name}</h3>
                    <span className="badge badge-muted">{w.stockCount} stocks</span>
                  </div>
                </div>
                <button onClick={()=>{setSelectedId(w.id);setShowStock(true);}} className="btn btn-ghost btn-sm">
                  <Plus size={12}/> Add Stock
                </button>
              </div>

              {/* Stocks */}
              {w.stocks.length===0 ? (
                <div style={{padding:32,textAlign:'center',color:'var(--txt-3)',fontSize:13}}>
                  No stocks yet. Click "Add Stock" to get started.
                </div>
              ) : (
                <div style={{padding:12}}>
                  {w.stocks.map(s=>{
                    const up = s.dayChangePercent >= 0;
                    return (
                      <div key={s.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 12px',borderRadius:10,transition:'background .12s',cursor:'pointer'}}
                        onClick={()=>window.location.href=`/stocks/${s.symbol}`}
                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.03)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>

                        <div style={{display:'flex',alignItems:'center',gap:12,flex:1}}>
                          <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,rgba(20,210,180,.1),rgba(124,111,247,.1))',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <span style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:600,color:'var(--teal)'}}>{s.symbol.slice(0,3)}</span>
                          </div>
                          <div>
                            <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{s.symbol}</div>
                            <div style={{fontSize:11,color:'var(--txt-3)'}}>{s.name.split(' ').slice(0,3).join(' ')}</div>
                          </div>
                        </div>

                        <div style={{display:'flex',alignItems:'center',gap:16}}>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontFamily:'var(--font-mono)',fontWeight:600,fontSize:14,marginBottom:2}}>
                              ₹{s.currentPrice.toFixed(2)}
                            </div>
                            <div className={up?'gain':'loss'} style={{fontSize:12,display:'flex',alignItems:'center',justifyContent:'flex-end',gap:3}}>
                              {up?<TrendingUp size={11}/>:<TrendingDown size={11}/>}
                              {up?'+':''}{s.dayChangePercent.toFixed(2)}%
                            </div>
                          </div>

                          <button onClick={(e)=>{e.stopPropagation();remove(w.id,s.id);}} style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--txt-3)',transition:'all .15s'}}
                            onMouseEnter={e=>(e.currentTarget.style.background='var(--red-lo)',e.currentTarget.style.color='var(--red)')}
                            onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.04)',e.currentTarget.style.color='var(--txt-3)')}>
                            <X size={14}/>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
