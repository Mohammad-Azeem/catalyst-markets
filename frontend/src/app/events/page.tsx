'use client';
import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, DollarSign, FileText } from 'lucide-react';

const ICONS = { EARNINGS: FileText, DIVIDEND: DollarSign, IPO: TrendingUp, RESULT: FileText };
const COLORS = { EARNINGS: 'var(--violet)', DIVIDEND: 'var(--green)', IPO: 'var(--teal)', RESULT: 'var(--amber)' };

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/events/upcoming`)
      .then(r => r.json())
      .then(d => setEvents(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="bg-mesh" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="skeleton" style={{width:200,height:40}}/></div>;

  return (
    <div className="bg-mesh" style={{minHeight:'100vh'}}>
      <div style={{maxWidth:900,margin:'0 auto',padding:'32px 24px 80px'}}>
        <h1 style={{fontSize:'clamp(1.6rem,3vw,2.2rem)',marginBottom:28}}>Upcoming Events</h1>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {events.map(evt => {
            const Icon = ICONS[evt.type as keyof typeof ICONS];
            const color = COLORS[evt.type as keyof typeof COLORS];
            return (
              <div key={evt.id} className="card" style={{padding:20,display:'flex',gap:16,alignItems:'center'}}>
                <div style={{width:40,height:40,borderRadius:10,background:`${color}22`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Icon size={20} style={{color}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>{evt.companyName}</div>
                  <div style={{fontSize:13,color:'var(--txt-2)'}}>{evt.details}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{new Date(evt.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
                  <span className="badge badge-muted">{evt.type}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}