'use client';
import { useEffect, useState } from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/news`)
      .then(r => r.json())
      .then(d => setNews(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="bg-mesh" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="skeleton" style={{width:200,height:40}}/></div>;

  return (
    <div className="bg-mesh" style={{minHeight:'100vh'}}>
      <div style={{maxWidth:900,margin:'0 auto',padding:'32px 24px 80px'}}>
        <h1 style={{fontSize:'clamp(1.6rem,3vw,2.2rem)',marginBottom:28}}>Latest News</h1>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {news.map((item, i) => (
            <a key={i} href={item.link} target="_blank" className="card" style={{padding:20,textDecoration:'none',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:15,marginBottom:6,color:'var(--txt)'}}>{item.title}</div>
                <div style={{fontSize:12,color:'var(--txt-3)'}}>
                  <span className="badge badge-muted" style={{marginRight:8}}>{item.source}</span>
                  {new Date(item.pubDate).toLocaleDateString()}
                </div>
              </div>
              <ExternalLink size={16} style={{color:'var(--txt-3)'}}/>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}