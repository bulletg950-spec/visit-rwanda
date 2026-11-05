import { Link } from 'react-router-dom';
import { Activity, CalendarCheck, CheckCircle2, Clock, MapPinned, Mountain, Users, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Booking } from '../../lib/types';
import { q, useData } from '../../lib/utils';
import { Spinner } from '../../components/ui';

const count = async (table: string, f?: (s: any) => any) => {
  let s: any = supabase.from(table).select('id', { count: 'exact', head: true }); if (f) s = f(s);
  const { count } = await s; return count ?? 0;
};

export default function Dashboard() {
  const { role } = useAuth();
  const canBook = ['super_admin', 'admin', 'booking_manager'].includes(role);
  const canUsers = ['super_admin', 'admin'].includes(role);
  const { data, loading } = useData(async () => {
    const [attr, pub, dest, users, tot, pend, conf, canc] = await Promise.all([
      count('attractions'), count('attractions', (s) => s.eq('is_published', true)), count('destinations', (s) => s.eq('is_published', true)),
      canUsers ? count('profiles') : Promise.resolve(0),
      canBook ? count('bookings') : Promise.resolve(0), canBook ? count('bookings', (s) => s.eq('status', 'pending')) : Promise.resolve(0),
      canBook ? count('bookings', (s) => s.eq('status', 'confirmed')) : Promise.resolve(0), canBook ? count('bookings', (s) => s.eq('status', 'cancelled')) : Promise.resolve(0),
    ]);
    const bookings = canBook ? ((await q(supabase.from('bookings').select('booking_date,visitors,status,attractions(name)').order('created_at', { ascending: false }).limit(1000))) as unknown as Booking[]) : [];
    const logs = ['super_admin', 'admin'].includes(role) ? ((await q(supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(8))) as any[]) : [];
    return { attr, pub, dest, users, tot, pend, conf, canc, bookings, logs };
  });
  if (loading || !data) return <Spinner />;
  const stats = [
    { l: 'Registered users', v: data.users, i: Users, show: canUsers }, { l: 'Attractions', v: data.attr, i: Mountain, show: true }, { l: 'Published destinations', v: data.dest, i: MapPinned, show: true },
    { l: 'Total bookings', v: data.tot, i: CalendarCheck, show: canBook }, { l: 'Pending', v: data.pend, i: Clock, show: canBook }, { l: 'Confirmed', v: data.conf, i: CheckCircle2, show: canBook }, { l: 'Cancelled', v: data.canc, i: XCircle, show: canBook },
    { l: 'Published attractions', v: data.pub, i: Mountain, show: true },
  ].filter((s) => s.show);
  const monthly = Object.entries(data.bookings.filter((b) => b.status !== 'cancelled').reduce<Record<string, number>>((m, b) => { const k = b.booking_date.slice(0, 7); m[k] = (m[k] ?? 0) + b.visitors; return m; }, {})).sort().slice(-12);
  const popular = Object.entries(data.bookings.reduce<Record<string, number>>((m, b) => { const k = b.attractions?.name ?? '?'; m[k] = (m[k] ?? 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = Math.max(1, ...monthly.map((m) => m[1]));
  return (
    <div className="space-y-8"><h1 className="font-display text-3xl">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((s) => <div key={s.l} className="glass liquid rounded-2xl p-5"><s.i className="mb-3 h-5 w-5 text-gold-400" aria-hidden /><p className="text-3xl font-semibold">{s.v}</p><p className="text-xs uppercase tracking-wider text-white/60">{s.l}</p></div>)}</div>
      {canBook && <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 lg:col-span-2"><p className="mb-4 font-semibold">Monthly visitor statistics</p>
          {monthly.length ? <div className="flex h-48 items-end gap-2" role="img" aria-label="Monthly visitors bar chart">{monthly.map(([m, v]) => <div key={m} className="flex flex-1 flex-col items-center gap-1"><span className="text-[10px]">{v}</span><div className="w-full rounded-t bg-gradient-to-t from-rwblue-600 to-gold-400" style={{ height: `${(v / max) * 100}%` }} /><span className="text-[10px] text-white/50">{m.slice(2)}</span></div>)}</div> : <p className="text-sm text-white/50">No bookings yet.</p>}</div>
        <div className="glass rounded-2xl p-6"><p className="mb-4 font-semibold">Popular attractions</p>{popular.length ? <ol className="space-y-2 text-sm">{popular.map(([n, c], i) => <li key={n} className="flex justify-between"><span>{i + 1}. {n}</span><span className="text-gold-300">{c}</span></li>)}</ol> : <p className="text-sm text-white/50">No data yet.</p>}</div></div>}
      {!!data.logs.length && <div className="glass rounded-2xl p-6"><p className="mb-4 flex items-center gap-2 font-semibold"><Activity className="h-4 w-4" /> Recent activity</p><ul className="space-y-2 text-sm">{data.logs.map((l) => <li key={l.id} className="flex justify-between gap-4"><span><span className="badge mr-2 bg-white/10">{l.action}</span>{l.table_name} {l.details?.label && `· ${l.details.label}`}</span><span className="text-xs text-white/50">{l.actor_email} · {new Date(l.created_at).toLocaleString()}</span></li>)}</ul></div>}
      <div className="flex gap-3"><Link to="/admin/attractions" className="btn-gold">Manage attractions</Link>{canBook && <Link to="/admin/bookings" className="btn-glass">View bookings</Link>}</div>
    </div>
  );
}
