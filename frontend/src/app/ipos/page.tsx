









'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight } from 'lucide-react';

interface IPO { id:number; companyName:string; issueSizeCr:number; priceBandLow:number; priceBandHigh:number; openDate:string; closeDate:string; lotSize:number; gmpPercent:number|null; retailSubscription:number|null; hniSubscription:number|null; qibSubscription:number|null; totalSubscription:number|null; status:string; advisorVerdict:string|null; }

const VERDICT_STYLE: Record<string, string> = {
  APPLY:   'badge-green',
  NEUTRAL: 'badge-amber',
  AVOID:   'badge-red',
};
const STATUS_STYLE: Record<string,string> = {
  UPCOMING:'badge-teal', OPEN:'badge-green', CLOSED:'badge-muted', LISTED:'badge-violet',
};

export default function IPOsPage() {
  const [ipos,   setIpos]   = useState<IPO[]>([]);
  const [filter, setFilter] = useState('');
  const [loading,setLoading]= useState(true);

  useEffect(()=>{ fetchIPOs(); },[filter]);

  const fetchIPOs = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res  = await fetch(`${base}/ipos${filter?`?status=${filter}`:''}`);
      
      if (!res.ok) throw new Error('Failed to fetch'); // ✅ Add check

      const data = await res.json();
      setIpos(data.data||[]);
    } catch (err) {
      console.error('Failed to fetch IPOs:', err);
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-mesh" style={{minHeight:'100vh'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'32px 24px 80px'}}>

        {/* Header */}
        <div style={{marginBottom:28}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'.1em',color:'var(--txt-3)',textTransform:'uppercase',marginBottom:6}}>IPO Intelligence</div>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
            <h1 style={{fontSize:'clamp(1.6rem,3vw,2.2rem)'}}>IPO Calendar</h1>
            <div style={{display:'flex',gap:6}}>
              {[['','All'],['UPCOMING','Upcoming'],['OPEN','Open'],['CLOSED','Closed']].map(([v,l])=>(
                <button key={v} onClick={()=>setFilter(v)} className={`btn ${filter===v?'btn-primary':'btn-ghost'}`} style={{padding:'7px 16px',fontSize:12}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:20}}>
            {[1,2,3].map(i=><div key={i} className="card" style={{height:280}}><div className="skeleton" style={{height:'100%',borderRadius:18}}/></div>)}
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:20}}>
            {ipos.map(ipo=>{
              const daysLeft=Math.ceil((new Date(ipo.closeDate).getTime()-Date.now())/86400000);
              return (
                <div key={ipo.id} className="card" style={{overflow:'hidden',display:'flex',flexDirection:'column'}}>

                  {/* Card top stripe based on verdict */}
                  <div style={{height:3,background:ipo.advisorVerdict==='APPLY'?'var(--green)':ipo.advisorVerdict==='AVOID'?'var(--red)':'var(--amber)'}}/>

                  <div style={{padding:'20px 20px 0'}}>
                    {/* Title row */}
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,gap:8}}>
                      <div>
                        <h3 style={{fontSize:15,marginBottom:6}}>{ipo.companyName}</h3>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <span className={`badge ${STATUS_STYLE[ipo.status]||'badge-muted'}`}>{ipo.status}</span>
                          {ipo.advisorVerdict&&<span className={`badge ${VERDICT_STYLE[ipo.advisorVerdict]||'badge-muted'}`}>{ipo.advisorVerdict}</span>}
                        </div>
                      </div>
                      {ipo.gmpPercent!==null&&(
                        <div style={{textAlign:'right',flexShrink:0}}>
                          <div style={{fontSize:10,color:'var(--txt-3)',marginBottom:3}}>GMP</div>
                          <div className={Number(ipo.gmpPercent)>=0?'gain':'loss'} style={{display:'flex',alignItems:'center',gap:3,fontFamily:'var(--font-mono)',fontWeight:700,fontSize:16}}>
                            {Number(ipo.gmpPercent)>=0?<TrendingUp size={14}/>:<TrendingDown size={14}/>}
                            {Number(ipo.gmpPercent)>=0?'+':''}{Number(ipo.gmpPercent).toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Key numbers */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
                      {[
                        {l:'Price Band',v:`₹${ipo.priceBandLow}–${ipo.priceBandHigh}`},
                        {l:'Issue Size',v:`₹${ipo.issueSizeCr}Cr`},
                        {l:'Lot Size',  v:`${ipo.lotSize} sh.`},
                      ].map(({l,v})=>(
                        <div key={l} style={{background:'var(--bg-2)',borderRadius:10,padding:'10px 12px'}}>
                          <div style={{fontSize:10,color:'var(--txt-3)',marginBottom:4,letterSpacing:'.04em'}}>{l}</div>
                          <div style={{fontFamily:'var(--font-mono)',fontWeight:600,fontSize:12}}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Dates */}
                    <div style={{display:'flex',gap:16,marginBottom:16,fontSize:12,color:'var(--txt-2)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <Calendar size={12} color="var(--teal)"/>
                        {new Date(ipo.openDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                      </div>
                      <span style={{color:'var(--txt-3)'}}>→</span>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <Calendar size={12} color="var(--red)"/>
                        {new Date(ipo.closeDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                      </div>
                      {daysLeft>0&&daysLeft<10&&(
                        <span className="badge badge-amber">{daysLeft}d left</span>
                      )}
                    </div>

                    {/* Subscription bars */}
                    {ipo.totalSubscription!==null&&ipo.totalSubscription>0&&(
                      <div style={{marginBottom:16}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:11,color:'var(--txt-3)'}}>
                          <span>Subscription</span>
                          <span style={{color:'var(--teal)',fontWeight:600}}>{ipo.totalSubscription.toFixed(2)}x</span>
                        </div>
                        <div style={{display:'flex',gap:4}}>
                          {[['R',ipo.retailSubscription,'var(--teal)'],['HNI',ipo.hniSubscription,'var(--amber)'],['QIB',ipo.qibSubscription,'var(--violet)']].map(([l,v,c])=>(
                            <div key={String(l)} style={{flex:1}}>
                              <div style={{fontSize:9,color:'var(--txt-3)',marginBottom:4,textAlign:'center',letterSpacing:'.05em'}}>{l}</div>
                              <div style={{height:4,borderRadius:99,background:'var(--bg-2)',overflow:'hidden'}}>
                                <div style={{height:'100%',borderRadius:99,background:String(c),width:`${Math.min((Number(v)||0)*8,100)}%`}}/>
                              </div>
                              <div style={{fontSize:9,color:String(c),textAlign:'center',marginTop:3,fontFamily:'var(--font-mono)'}}>{v!==null?`${Number(v).toFixed(1)}x`:'—'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* View Details button */}
                  <div style={{marginTop:'auto',padding:'0 20px 20px'}}>
                    <Link href={`/ipos/${ipo.id}`} className="btn btn-ghost" style={{width:'100%',fontSize:13,padding:'10px'}}>
                      Full Analysis <ArrowUpRight size={13}/>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading&&ipos.length===0&&(
          <div style={{textAlign:'center',padding:'60px 0',color:'var(--txt-3)'}}>
            <Calendar size={48} style={{margin:'0 auto 16px',opacity:.3}}/>
            <p>No IPOs found for this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}


