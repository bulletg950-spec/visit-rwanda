import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarCheck, FileText, Film, Image as ImageIcon, LayoutDashboard, LogOut, MapPinned, Menu, MessageSquare, Mountain, Package, Settings, ShieldCheck, Star, Tag, Users, X, Globe } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Spinner } from '../../components/ui';

const ALL = ['super_admin', 'admin', 'content_manager', 'booking_manager', 'editor'];
const CONTENT = ['super_admin', 'admin', 'content_manager', 'editor'];
// UI gating only. REAL authorization is enforced by Postgres RLS.
export const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ALL, end: true },
  { to: '/admin/destinations', label: 'Destinations', icon: MapPinned, roles: CONTENT },
  { to: '/admin/attractions', label: 'Tourist Attractions', icon: Mountain, roles: CONTENT },
  { to: '/admin/products', label: 'Product Management', icon: Package, roles: ['super_admin', 'admin', 'content_manager'] },
  { to: '/admin/bookings', label: 'Booking Management', icon: CalendarCheck, roles: ['super_admin', 'admin', 'booking_manager'] },
  { to: '/admin/users', label: 'User Management', icon: Users, roles: ['super_admin', 'admin'] },
  { to: '/admin/gallery', label: 'Image Gallery', icon: ImageIcon, roles: CONTENT },
  { to: '/admin/videos', label: 'Video Management', icon: Film, roles: CONTENT },
  { to: '/admin/reviews', label: 'Reviews Management', icon: Star, roles: CONTENT },
  { to: '/admin/packages', label: 'Tourism Packages', icon: Tag, roles: ['super_admin', 'admin', 'content_manager'] },
  { to: '/admin/messages', label: 'Contact Messages', icon: MessageSquare, roles: ['super_admin', 'admin', 'booking_manager'] },
  { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['super_admin', 'admin', 'booking_manager'] },
  { to: '/admin/content', label: 'Website Content', icon: FileText, roles: CONTENT },
  { to: '/admin/settings', label: 'Settings', icon: Settings, roles: ['super_admin'] },
  { to: '/admin/security', label: 'Security & Roles', icon: ShieldCheck, roles: ['super_admin', 'admin'] },
];
const IDLE_MS = 30 * 60 * 1000;

export function Guard({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { role } = useAuth();
  if (!roles.includes(role)) return <div className="glass rounded-2xl p-8 text-center text-white/70">Your role doesn't have access to this section.</div>;
  return <>{children}</>;
}

export default function AdminLayout() {
  const { user, profile, isStaff, loading, role, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const timer = useRef<number>();

  // Session expiration: sign out after 30 minutes of inactivity
  useEffect(() => {
    if (!isStaff) return;
    const reset = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(async () => { await signOut(); nav('/admin/login?expired=1'); }, IDLE_MS); };
    const ev = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    ev.forEach((e) => window.addEventListener(e, reset, { passive: true })); reset();
    return () => { ev.forEach((e) => window.removeEventListener(e, reset)); window.clearTimeout(timer.current); };
  }, [isStaff]); // eslint-disable-line
  useEffect(() => setOpen(false), [loc.pathname]);

  if (loading) return <div className="min-h-screen bg-forest-950 pt-40"><Spinner /></div>;
  if (!user || !isStaff) return <Navigate to="/admin/login" replace />;

  const items = NAV.filter((n) => n.roles.includes(role));
  const Side = () => (
    <nav aria-label="Admin" className="flex h-full flex-col gap-1 overflow-y-auto p-4">
      <Link to="/admin" className="mb-4 px-3 font-display text-xl font-bold">VISIT <span className="text-gold-400">RWANDA</span><span className="block font-sans text-[10px] font-normal uppercase tracking-[0.3em] text-white/50">Admin console</span></Link>
      {items.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-gradient-to-r from-gold-500/30 to-transparent text-gold-300' : 'text-white/70 hover:bg-white/10'}`}><n.icon className="h-4 w-4" aria-hidden />{n.label}</NavLink>)}
      <Link to="/" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10"><Globe className="h-4 w-4" />View website</Link>
      <button onClick={async () => { await signOut(); nav('/admin/login'); }} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-200 hover:bg-red-500/10"><LogOut className="h-4 w-4" />Logout</button>
    </nav>
  );
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,#154633,transparent_55%),radial-gradient(ellipse_at_bottom_right,#00668f66,transparent_50%)] bg-forest-950">
      <aside className="glass-strong fixed inset-y-0 left-0 z-40 hidden w-64 lg:block"><Side /></aside>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} /><aside className="glass-strong absolute inset-y-0 left-0 w-72"><Side /></aside></div>}
      <div className="lg:pl-64">
        <header className="glass sticky top-0 z-30 flex items-center justify-between px-4 py-3 sm:px-8">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          <p className="hidden text-sm text-white/60 lg:block">Signed in as <b className="text-white">{profile?.full_name}</b></p>
          <span className="badge bg-gold-500/20 text-gold-300">{role.replace('_', ' ')}</span>
        </header>
        <div className="p-4 sm:p-8"><Outlet /></div>
      </div>
    </div>
  );
}
