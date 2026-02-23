'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowUpRight, Zap, Shield, BarChart2, ChevronRight } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Stock { 
  id:number; 
  symbol:string; 
  name:string; 
  exchange:string; 
  currentPrice:number; 
  dayChangePercent:number; 
  sector:string; 
}

interface IPO   { 
  id:number; 
  companyName:string; 
  closeDate:string; 
  gmpPercent:number|null; 
  priceBandHigh:number; 
}


  
export default function HomePage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [ipos,   setIpos]   = useState<IPO[]>([]);
  const { pricesMap, isConnected } = useWebSocket();

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    fetch(`${base}/stocks?limit=8`).then(r=>r.json()).then(d=>setStocks(d.data||[])).catch(err=>console.error('Failed to fetch stocks:', err));
    fetch(`${base}/ipos?status=UPCOMING`).then(r=>r.json()).then(d=>setIpos((d.data||[]).slice(0,4))).catch(err=>console.error('Failed to fetch IPOs:', err));
  }, []);

  return (
    <div className="bg-mesh" style={{minHeight:'100vh'}}>

      {/* Hero */}
      <section className="bg-hero grid-lines" style={{padding:'72px 24px 56px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div className="anim-up" style={{maxWidth:740,margin:'0 auto',position:'relative'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'5px 16px',borderRadius:99,background:'var(--teal-lo)',border:'1px solid rgba(20,210,180,0.25)',marginBottom:28}}>
            <div className={isConnected?'dot-live':'dot-dead'}/>
            <span style={{fontSize:11,fontWeight:600,color:'var(--teal)',letterSpacing:'.07em'}}>LIVE · NSE & NASDAQ</span>
          </div>
          <h1 style={{fontSize:'clamp(2.2rem,5.5vw,3.7rem)',marginBottom:20}}>
            Your Edge in <span className="grad-text">Indian Markets</span>
          </h1>
          <p style={{fontSize:16,color:'var(--txt-2)',maxWidth:500,margin:'0 auto 36px',lineHeight:1.75}}>
            Real-time prices, IPO GMP tracking, and portfolio analytics built for Indian retail investors.
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/stocks" className="btn btn-primary" style={{fontSize:14,padding:'11px 26px'}}>
              Explore Markets <ArrowUpRight size={15}/>
            </Link>
            <Link href="/ipos" className="btn btn-ghost" style={{fontSize:14,padding:'11px 26px'}}>
              IPO Calendar <ChevronRight size={15}/>
            </Link>
          </div>
        </div>
      </section>

      <div style={{maxWidth:1280,margin:'0 auto',padding:'0 24px 80px'}}>

        {/* Stats bar */}
        <div className="anim-up-1" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0,borderRadius:16,overflow:'hidden',border:'1px solid var(--border)',marginBottom:40}}>
          {[
            {l:'Stocks Tracked',v:'25+',       c:'var(--teal)'},
            {l:'Live Updates',  v:'Every 10s',  c:'var(--green)'},
            {l:'IPOs Active',   v:`${ipos.length||3}`,c:'var(--amber)'},
            {l:'Exchanges',     v:'NSE+NASDAQ', c:'var(--violet)'},
          ].map(({l,v,c},i)=>(
            <div key={l} style={{background:'var(--bg-3)',padding:'18px 20px',textAlign:'center',borderRight:i<3?'1px solid var(--border)':'none'}}>
              <div style={{fontSize:20,fontFamily:'var(--font-head)',fontWeight:800,color:c,marginBottom:4}}>{v}</div>
              <div style={{fontSize:11,color:'var(--txt-3)',letterSpacing:'.04em'}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 356px',gap:24,alignItems:'start'}}>

          {/* Stocks table */}
          <div className="card anim-up-2" style={{overflow:'hidden'}}>
            <div style={{padding:'18px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div className={isConnected?'dot-live':'dot-dead'}/>
                <span style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:14}}>Live Prices</span>
              </div>
              <Link href="/stocks" style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--teal)',textDecoration:'none'}}>
                All stocks <ArrowUpRight size={12}/>
              </Link>
            </div>
            <table className="tbl">
              <thead><tr>
                <th>Symbol</th><th>Company</th><th>Exch.</th>
                <th style={{textAlign:'right'}}>Price</th>
                <th style={{textAlign:'right'}}>Change</th>
              </tr></thead>
              <tbody>
                {stocks.length===0
                  ? Array.from({length:6}).map((_,i)=>(
                      <tr key={i}>
                        <td colSpan={5}>
                          <div className="skeleton" style={{height:18,margin:'4px 0'}}/>
                        </td>
                      </tr>
                    ))
                  : stocks.map(s=>{
                      const live=pricesMap.get(s.symbol);
                      const price=live?.price??Number(s.currentPrice);
                      const pct=live?.changePercent??Number(s.dayChangePercent);
                      const up=pct>=0;
                      // currency based on exchange 
                      const currency = s.exchange === 'NASDAQ' || s.exchange === 'NYSE' ? '$' : '₹';

                      return (
                        <tr key={s.id} onClick={()=>window.location.href=`/stocks/${s.symbol}`}>
                          <td>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,rgba(20,210,180,.12),rgba(124,111,247,.12))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                <span style={{fontFamily:'var(--font-mono)',fontSize:10,fontWeight:600,color:'var(--teal)'}}>{s.symbol.slice(0,3)}</span>
                              </div>
                              <span style={{fontWeight:600,fontSize:13}}>{s.symbol}</span>
                            </div>
                          </td>
                          <td style={{color:'var(--txt-2)',fontSize:12}}>{s.name.split(' ').slice(0,2).join(' ')}</td>
                          <td><span className="badge badge-muted">{s.exchange}</span></td>
                          <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontWeight:600,fontSize:13}}>
                            {currency}{price.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}
                          </td>
                          <td style={{textAlign:'right'}}>
                            <span className={up?'gain':'loss'} style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:3,fontWeight:600,fontSize:13}}>
                              {up?<TrendingUp size={12}/>:<TrendingDown size={12}/>}
                              {pct>=0?'+':''}{pct.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>

          {/* Right column */}
          <div style={{display:'flex',flexDirection:'column',gap:18}}>

            {/* IPO panel */}
            <div className="card anim-up-2" style={{overflow:'hidden'}}>
              <div style={{padding:'18px 20px 14px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:14}}>IPO Calendar</span>
                <Link href="/ipos" style={{fontSize:12,color:'var(--teal)',textDecoration:'none'}}>View all →</Link>
              </div>
              <div style={{padding:'8px 10px'}}>
                {ipos.length===0
                  ? <p style={{color:'var(--txt-3)',textAlign:'center',padding:'20px 0',fontSize:13}}>No upcoming IPOs</p>
                  : ipos.map(ipo=>(
                      <Link key={ipo.id} href={`/ipos/${ipo.id}`} style={{display:'block',padding:'11px 10px',borderRadius:10,textDecoration:'none',transition:'background .12s'}}
                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.04)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                          <span style={{fontWeight:600,fontSize:13,color:'var(--txt)'}}>{ipo.companyName}</span>
                          {ipo.gmpPercent!==null&&(
                            <span className={Number(ipo.gmpPercent)>=0?'badge badge-green':'badge badge-red'}>
                              {Number(ipo.gmpPercent)>=0?'+':''}{Number(ipo.gmpPercent).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <div style={{fontSize:11,color:'var(--txt-3)'}}>
                          ₹{ipo.priceBandHigh} · Closes {new Date(ipo.closeDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                        </div>
                      </Link>
                    ))
                }
              </div>
            </div>

            {/* Feature tiles */}
            {[
              {icon:Zap,      c:'var(--teal)',  t:'Real-Time Prices',  d:'WebSocket pushes every 10s — NSE & NASDAQ'},
              {icon:BarChart2,c:'var(--amber)', t:'IPO Intelligence',  d:'GMP + AI Apply / Avoid verdict'},
              {icon:Shield,   c:'var(--violet)',t:'Portfolio P&L',     d:'Multi-portfolio gain/loss tracking'},
            ].map(({icon:Icon,c,t,d})=>(
              <div key={t} className="card" style={{padding:'15px 17px',display:'flex',gap:13,alignItems:'flex-start'}}>
                <div style={{width:34,height:34,borderRadius:9,background:`${c}1a`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Icon size={15} color={c}/>
                </div>
                <div>
                  <div style={{fontFamily:'var(--font-head)',fontWeight:600,fontSize:13,marginBottom:3}}>{t}</div>
                  <div style={{fontSize:12,color:'var(--txt-3)',lineHeight:1.5}}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@media(max-width:900px){.main-grid{grid-template-columns:1fr!important}}@media(max-width:580px){.stats-grid{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </div>
  );
}

