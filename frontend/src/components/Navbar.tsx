
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart2, Calendar, Briefcase, Star, Menu, X, Bell } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

const links = [
  { href: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stocks',    label: 'Stocks',    icon: BarChart2 },
  { href: '/ipos',      label: 'IPOs',      icon: Calendar },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/watchlist', label: 'Watchlist', icon: Star },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isConnected } = useWebSocket();

  return (
    <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(7,9,15,0.88)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <div style={{ display:'flex', alignItems:'center', height:60, gap:32 }}>

          {/* Logo */}
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', flexShrink:0 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#14d2b4,#7c6ff7)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(20,210,180,0.35)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div style={{ lineHeight:1.1 }}>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:15, color:'var(--txt)', letterSpacing:'-0.02em' }}>Catalyst</div>
              <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.14em', color:'var(--teal)', textTransform:'uppercase' }}>Markets</div>
            </div>
          </Link>

          {/* Desktop links */}
          <div style={{ display:'flex', alignItems:'center', gap:2, flex:1 }} className="nav-links">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 13px', borderRadius:8, fontSize:13, fontWeight: active ? 600 : 400, textDecoration:'none', color: active ? 'var(--teal)' : 'var(--txt-2)', background: active ? 'var(--teal-lo)' : 'transparent', border: active ? '1px solid rgba(20,210,180,0.2)' : '1px solid transparent', transition:'all .15s' }}>
                  <Icon size={13} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 11px', borderRadius:99, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className={isConnected ? 'dot-live' : 'dot-dead'} />
              <span style={{ fontSize:10, fontWeight:600, letterSpacing:'.06em', color: isConnected ? 'var(--teal)' : 'var(--txt-3)' }}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            <button style={{ position:'relative', width:34, height:34, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--txt-2)' }}>
              <Bell size={14} />
              <span style={{ position:'absolute', top:8, right:8, width:5, height:5, borderRadius:'50%', background:'var(--red)' }} />
            </button>
            <Link href="#" className="btn btn-primary btn-sm" style={{ padding:'7px 16px', fontSize:12 }}>Sign In</Link>
            <button onClick={() => setOpen(!open)} className="nav-burger" style={{ width:34, height:34, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', display:'none', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--txt-2)' }}>
              {open ? <X size={15}/> : <Menu size={15}/>}
            </button>
          </div>
          
          <SignedOut>
            <Link href="/sign-in" className="btn btn-primary btn-sm">
              Sign In
            </Link>
            <Link href="/sign-up" className="btn btn-primary btn-sm">
              Sign Up
            </Link>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
          </SignedIn>

        </div>

        {open && (
          <div style={{ padding:'8px 0 14px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 6px', borderRadius:9, fontSize:13, fontWeight: pathname===href ? 600 : 400, textDecoration:'none', color: pathname===href ? 'var(--teal)' : 'var(--txt-2)', background: pathname===href ? 'var(--teal-lo)' : 'transparent' }}>
                <Icon size={15}/>{label}
              </Link>
            ))}
          </div>
        )}
      </div>
      <style>{`@media(max-width:768px){.nav-links{display:none!important}.nav-burger{display:flex!important}}`}</style>
    </nav>
  );
}


/*
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  TrendingUp,
  LayoutDashboard,
  BarChart2,
  Briefcase,
  Star,
  Calendar,
  Menu,
  X,
  Bell,
  User,
} from 'lucide-react';

const navLinks = [
  { href: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stocks',    label: 'Stocks',    icon: BarChart2       },
  { href: '/ipos',      label: 'IPOs',      icon: Calendar        },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase       },
  { href: '/watchlist', label: 'Watchlist', icon: Star            },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          //{  Logo }
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-gray-900 tracking-tight">
                Catalyst
              </span>
              <span className="text-xs text-blue-600 font-semibold tracking-widest uppercase">
                Markets
              </span>
            </div>
          </Link>

          //{ Desktop Nav }
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          //{ Right Side }
          <div className="flex items-center space-x-2">
            //{ Notification Bell }
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            //{ User Avatar — plug Clerk here later }
            <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                Guest
              </span>
            </button>

            //{ Mobile Menu Toggle }
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        //{ Mobile Nav }
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

*/
