'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Plus, PieChart, ArrowLeft } from 'lucide-react';
import { useAuthenticatedAPI } from '@/lib/api';
import { useAuth, useUser } from '@clerk/nextjs';
import { portfolioAPI } from '@/lib/api';


interface Stock { id:number; symbol:string; name:string; exchange:string; quantity:number; buyPrice:number; currentPrice:number; investedValue:number; currentValue:number; gainLoss:number; gainLossPercent:number; }
interface Portfolio { id:number; name:string; description?:string; stocks:Stock[]; totalInvested:number; currentValue:number; totalGainLoss:number; totalGainLossPercent:number; }

export default function PortfolioPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  //const api = useAuthenticatedAPI();

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');

  //useEffect(() => { fetch(); }, []);
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchPortfolios();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const fetchPortfolios = async () => {
    try {
      //const { getToken } = useAuth();
      const token = await getToken();
      
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${base}/portfolio`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      setPortfolios(data.data || []);
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    if (!name.trim()) return;
    
    try {
      //const { getToken } = useAuth();
      const token = await getToken();
      
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${base}/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create');
      }
      
      setName('');
      setShowAdd(false);
      fetchPortfolios();
    } catch (error: any) {
      console.error('Failed to create:', error);
      alert(error.message || 'Failed to create portfolio');
    }
  };

  // ✅ Loading state
  if (!isLoaded || loading) {
    return (
      <div className="bg-mesh" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div className="skeleton" style={{width:200,height:40}}/>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="bg-mesh" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:20}}>
        <h2 style={{fontSize:20}}>Sign in to view your portfolios</h2>
        <a href="/sign-in" className="btn btn-primary">Sign In</a>
      </div>
    );
  }

  // ✅ Not signed in
  if (!user) {
    return (
      <div className="bg-mesh" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:20}}>
        <h2 style={{fontSize:20}}>Please sign in to view portfolios</h2>
        <a href="/sign-in" className="btn btn-primary">Sign In</a>
      </div>
    );
  }

  return (
    <div className="bg-mesh" style={{minHeight:'100vh'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'32px 24px 80px'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:'.1em',color:'var(--txt-3)',textTransform:'uppercase',marginBottom:6}}>Portfolio</div>
            <h1 style={{fontSize:'clamp(1.6rem,3vw,2.2rem)'}}>Track Your Investments</h1>
          </div>
          <button onClick={()=>setShowAdd(true)} className="btn btn-primary">
            <Plus size={14}/> New Portfolio
          </button>
        </div>

        {/* Create modal */}
        {showAdd && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:24}}>
            <div className="card" style={{width:'100%',maxWidth:420,padding:24}}>
              <h3 style={{marginBottom:16,fontSize:16}}>Create Portfolio</h3>
              <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Long Term Growth" onKeyPress={e=>e.key==='Enter'&&create()} style={{marginBottom:16}}/>
              <div style={{display:'flex',gap:10}}>
                <button onClick={create} className="btn btn-primary" style={{flex:1}}>Create</button>
                <button onClick={()=>{setShowAdd(false);setName('');}} className="btn btn-ghost" style={{flex:1}}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && portfolios.length===0 && (
          <div className="card" style={{padding:64,textAlign:'center'}}>
            <PieChart size={56} style={{margin:'0 auto 20px',color:'var(--txt-3)',opacity:.4}}/>
            <h3 style={{marginBottom:10,fontSize:17}}>No Portfolios Yet</h3>
            <p style={{color:'var(--txt-2)',marginBottom:24,fontSize:14}}>Create your first portfolio to start tracking P&L</p>
            <button onClick={()=>setShowAdd(true)} className="btn btn-primary">
              <Plus size={14}/> Create Portfolio
            </button>
          </div>
        )}

        {/* Portfolios list */}
        <div style={{display:'flex',flexDirection:'column',gap:24}}>
          {portfolios.map(p => {
            const isGain = p.totalGainLossPercent >= 0;
            return (
              <div key={p.id} className="card" style={{overflow:'hidden'}}>
                
                {/* Header */}
                <div style={{background:'linear-gradient(135deg, rgba(20,210,180,0.08), rgba(124,111,247,0.08))',padding:'24px 24px 20px',borderBottom:'1px solid var(--border)'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20}}>
                    <div>
                      <h2 style={{fontSize:18,marginBottom:4}}>{p.name}</h2>
                      {p.description && <p style={{fontSize:13,color:'var(--txt-2)'}}>{p.description}</p>}
                      <span className="badge badge-muted" style={{marginTop:8}}>{p.stocks.length} stocks</span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                    {[
                      {l:'Invested',   v:`₹${p.totalInvested.toLocaleString('en-IN',{maximumFractionDigits:0})}`},
                      {l:'Current',    v:`₹${p.currentValue.toLocaleString('en-IN',{maximumFractionDigits:0})}`},
                      {l:'Total P&L',  v:`${isGain?'+':''}₹${Math.abs(p.totalGainLoss).toLocaleString('en-IN',{maximumFractionDigits:0})}`, c:isGain},
                    ].map(({l,v,c})=>(
                      <div key={l} style={{background:'var(--bg-3)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--border)'}}>
                        <div style={{fontSize:10,color:'var(--txt-3)',marginBottom:6,letterSpacing:'.06em'}}>{l}</div>
                        <div className={c!==undefined?(c?'gain':'loss'):''} style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:16}}>{v}</div>
                        {c!==undefined && (
                          <div className={c?'gain':'loss'} style={{fontSize:11,marginTop:2,display:'flex',alignItems:'center',gap:3}}>
                            {c?<TrendingUp size={10}/>:<TrendingDown size={10}/>}
                            {p.totalGainLossPercent>=0?'+':''}{p.totalGainLossPercent.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stocks table */}
                {p.stocks.length===0 ? (
                  <div style={{padding:40,textAlign:'center',color:'var(--txt-3)',fontSize:13}}>
                    No stocks yet. Add via Prisma Studio: <code style={{background:'var(--bg-2)',padding:'2px 6px',borderRadius:4}}>npx prisma studio</code>
                  </div>
                ) : (
                  <table className="tbl">
                    <thead><tr>
                      <th>Stock</th>
                      <th style={{textAlign:'right'}}>Qty</th>
                      <th style={{textAlign:'right'}}>Buy Price</th>
                      <th style={{textAlign:'right'}}>Current</th>
                      <th style={{textAlign:'right'}}>Invested</th>
                      <th style={{textAlign:'right'}}>Value</th>
                      <th style={{textAlign:'right'}}>P&L</th>
                    </tr></thead>
                    <tbody>
                      {p.stocks.map(s=>{
                        const gain = s.gainLoss >= 0;
                        return (
                          <tr key={s.id}>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:10}}>
                                <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,rgba(20,210,180,.1),rgba(124,111,247,.1))',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                  <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:600,color:'var(--teal)'}}>{s.symbol.slice(0,3)}</span>
                                </div>
                                <div>
                                  <div style={{fontWeight:600,fontSize:13}}>{s.symbol}</div>
                                  <span className="badge badge-muted" style={{fontSize:9}}>{s.exchange}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontSize:13}}>{s.quantity}</td>
                            <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontSize:13}}>₹{s.buyPrice.toFixed(2)}</td>
                            <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontSize:13}}>₹{s.currentPrice.toFixed(2)}</td>
                            <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontSize:13}}>₹{s.investedValue.toFixed(0)}</td>
                            <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontSize:13}}>₹{s.currentValue.toFixed(0)}</td>
                            <td style={{textAlign:'right'}}>
                              <div className={gain?'gain':'loss'} style={{fontFamily:'var(--font-mono)',fontWeight:600,fontSize:13}}>
                                {gain?'+':''}₹{s.gainLoss.toFixed(0)}
                              </div>
                              <div className={gain?'gain':'loss'} style={{fontSize:11}}>
                                ({gain?'+':''}{s.gainLossPercent.toFixed(2)}%)
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

