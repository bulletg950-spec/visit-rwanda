import { useEffect, useState, FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Menu, X, User, LogOut, Mountain, Mail, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { ConfigBanner } from './ui';

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  return (
    <motion.div aria-hidden style={{ scaleX }} className="pointer-events-none fixed left-0 right-0 top-0 z-[100] h-[3px] origin-left bg-gradient-to-r from-forest-400 via-rwblue-400 to-gold-400 shadow-[0_0_12px_2px_rgba(51,179,230,.7)]" />
  );
}

const links = [
  ['/', 'Home'], ['/destinations', 'Destinations'], ['/packages', 'Packages'], ['/about', 'About Rwanda'], ['/contact', 'Contact'],
] as const;

function Nav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const { user, profile, isStaff, signOut } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => { const f = () => setSolid(window.scrollY > 40); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-6">
      <nav aria-label="Main" className={`glass mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 sm:px-6 ${solid ? 'bg-forest-950/70 shadow-2xl' : ''}`}>
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-wide"><Mountain className="h-5 w-5 text-gold-400" aria-hidden /> VISIT <span className="text-gold-400">RWANDA</span></Link>
        <ul className="hidden items-center gap-1 lg:flex">
          {links.map(([to, label]) => (
            <li key={to}><NavLink to={to} end={to === '/'} className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-white/20 text-gold-300' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>{label}</NavLink></li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              {isStaff && <Link to="/admin" className="btn-glass !py-2">Admin</Link>}
              <Link to="/my-bookings" className="btn-glass !py-2">My bookings</Link>
              <Link to="/profile" aria-label="Profile" className="btn-glass !px-3 !py-2"><User className="h-4 w-4" /> {profile?.full_name?.split(' ')[0] ?? 'Me'}</Link>
              <button aria-label="Sign out" onClick={async () => { await signOut(); nav('/'); }} className="btn-glass !px-3 !py-2"><LogOut className="h-4 w-4" /></button>
            </>
          ) : (
            <><Link to="/login" className="btn-glass !py-2">Sign in</Link><Link to="/destinations" className="btn-gold !py-2">Book now</Link></>
          )}
        </div>
        <button className="btn-glass !px-3 !py-2 lg:hidden" aria-expanded={open} aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </nav>
      {open && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong mx-auto mt-2 max-w-7xl rounded-3xl p-4 lg:hidden">
          <ul className="grid gap-1">
            {links.map(([to, label]) => <li key={to}><NavLink to={to} end={to === '/'} className="block rounded-xl px-4 py-3 hover:bg-white/10">{label}</NavLink></li>)}
            {user ? (<>
              <li><Link className="block rounded-xl px-4 py-3 hover:bg-white/10" to="/my-bookings">My bookings</Link></li>
              <li><Link className="block rounded-xl px-4 py-3 hover:bg-white/10" to="/profile">Profile</Link></li>
              {isStaff && <li><Link className="block rounded-xl px-4 py-3 hover:bg-white/10" to="/admin">Admin dashboard</Link></li>}
              <li><button className="w-full rounded-xl px-4 py-3 text-left hover:bg-white/10" onClick={async () => { await signOut(); nav('/'); }}>Sign out</button></li>
            </>) : (<>
              <li><Link className="block rounded-xl px-4 py-3 hover:bg-white/10" to="/login">Sign in</Link></li>
              <li><Link className="btn-gold mt-1 w-full" to="/signup">Create account</Link></li>
            </>)}
          </ul>
        </motion.div>
      )}
    </header>
  );
}

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    setState('busy');
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim().toLowerCase() });
    if (error && error.code !== '23505') { setState('err'); setMsg('Could not subscribe. Check the email and try again.'); return; }
    setState('ok'); setMsg(error ? "You're already subscribed. Thank you!" : 'Welcome aboard! Watch your inbox.'); setEmail('');
  }
  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row" aria-label="Newsletter subscription">
      <label className="sr-only" htmlFor="nl-email">Email address</label>
      <input id="nl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" />
      <button className="btn-gold shrink-0" disabled={state === 'busy'}>{state === 'busy' ? 'Joining…' : 'Subscribe'}</button>
      {state !== 'idle' && state !== 'busy' && <p role="status" className={`text-xs sm:absolute sm:mt-14 ${state === 'ok' ? 'text-emerald-300' : 'text-red-300'}`}>{msg}</p>}
    </form>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-forest-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl font-bold">VISIT <span className="text-gold-400">RWANDA</span></p>
          <p className="mt-3 max-w-sm text-sm text-white/60">Discover the Land of a Thousand Hills: gorillas, volcanoes, lakes, culture and a warm welcome.</p>
          <div className="mt-6 flex items-center gap-2 text-sm text-white/70"><Mail className="h-4 w-4" /> Stay in the loop</div>
          <div className="mt-3 pb-6 sm:pb-0"><Newsletter /></div>
        </div>
        <div><p className="eyebrow mb-4">Explore</p><ul className="space-y-2 text-sm text-white/70">
          <li><Link to="/destinations">Destinations</Link></li><li><Link to="/packages">Packages</Link></li><li><Link to="/about">About Rwanda</Link></li><li><Link to="/contact">Contact</Link></li></ul></div>
        <div><p className="eyebrow mb-4">Account</p><ul className="space-y-2 text-sm text-white/70">
          <li><Link to="/login">Sign in</Link></li><li><Link to="/my-bookings">My bookings</Link></li><li><Link to="/admin/login">Staff login</Link></li></ul>
          <div className="mt-5 flex gap-3 text-white/60" aria-label="Social media"><Facebook className="h-5 w-5" /><Instagram className="h-5 w-5" /><Twitter className="h-5 w-5" /><Youtube className="h-5 w-5" /></div></div>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs text-white/40">© {new Date().getFullYear()} Visit Rwanda demo platform. Demo content is clearly labelled; verify details with official sources.</p>
    </footer>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return (
    <>
      <ScrollProgress />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-gold-400 focus:p-2 focus:text-black">Skip to content</a>
      <Nav />
      <main id="main"><Outlet /></main>
      <Footer />
      <ConfigBanner />
    </>
  );
}
