import { ChangeEvent, FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Booking } from '../lib/types';
import { fmtDate, money, q, uploadFile, useData } from '../lib/utils';
import { Empty, ErrorBox, Field, Spinner } from '../components/ui';

const STATUS: Record<string, string> = { pending: 'bg-amber-400/20 text-amber-200', confirmed: 'bg-emerald-400/20 text-emerald-200', cancelled: 'bg-red-400/20 text-red-200', completed: 'bg-rwblue-500/30 text-rwblue-300' };

export function MyBookings() {
  const { data, loading, error, reload } = useData(() => q(supabase.from('bookings').select('*, attractions(name,slug,cancellation_hours)').order('created_at', { ascending: false })) as Promise<Booking[]>);
  const [msg, setMsg] = useState('');
  async function cancel(b: Booking) {
    if (!confirm(`Cancel booking ${b.reference}?`)) return;
    const { error: e } = await supabase.rpc('cancel_booking', { p_booking: b.id });
    setMsg(e ? e.message : 'Booking cancelled.'); reload();
  }
  const upcoming = (data ?? []).filter((b) => ['pending', 'confirmed'].includes(b.status));
  const history = (data ?? []).filter((b) => !['pending', 'confirmed'].includes(b.status));
  const Row = ({ b }: { b: Booking }) => (
    <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
      <div><p className="font-mono text-xs text-gold-300">{b.reference}</p><Link to={`/destinations/${b.attractions?.slug}`} className="font-display text-xl hover:text-gold-300">{b.attractions?.name}</Link>
        <p className="text-sm text-white/70">{fmtDate(b.booking_date)} {b.preferred_time} · {b.visitors} visitor(s) · {b.total_amount > 0 ? money(b.total_amount, b.currency) : 'Price to be confirmed'}</p></div>
      <div className="flex items-center gap-3"><span className={`badge capitalize ${STATUS[b.status]}`}>{b.status}</span>
        {['pending', 'confirmed'].includes(b.status) && <button onClick={() => cancel(b)} className="btn-glass !py-2 text-red-200"><XCircle className="h-4 w-4" /> Cancel</button>}</div>
    </div>);
  return (
    <div className="section pt-36">
      <p className="eyebrow mb-3">My account</p><h1 className="h2 mb-8">My bookings</h1>
      {msg && <p role="status" className="mb-4 rounded-xl bg-white/10 p-3 text-sm">{msg}</p>}
      {loading ? <Spinner /> : error ? <ErrorBox msg={error} /> : !data?.length ? <Empty>No bookings yet. <Link to="/destinations" className="text-gold-300 underline">Find an experience</Link></Empty> : (
        <div className="space-y-10">
          <div><h2 className="mb-3 font-display text-2xl">Upcoming & active</h2><div className="space-y-3">{upcoming.length ? upcoming.map((b) => <Row key={b.id} b={b} />) : <Empty>Nothing upcoming.</Empty>}</div></div>
          <div><h2 className="mb-3 font-display text-2xl">Booking history</h2><div className="space-y-3">{history.length ? history.map((b) => <Row key={b.id} b={b} />) : <Empty>No past bookings.</Empty>}</div></div>
        </div>)}
    </div>
  );
}

export function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [f, setF] = useState({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '', nationality: profile?.nationality ?? '' });
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  async function save(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('profiles').update(f).eq('id', user!.id);
    setMsg(error ? error.message : 'Profile saved.'); refreshProfile();
  }
  async function avatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5_000_000) return setMsg('Choose an image under 5 MB.');
    try { const url = await uploadFile('avatars', file, user!.id); await supabase.from('profiles').update({ avatar_url: url }).eq('id', user!.id); refreshProfile(); setMsg('Photo updated.'); } catch (x) { setMsg((x as Error).message); }
  }
  async function changePw(e: FormEvent) {
    e.preventDefault(); if (pw.length < 8) return setMsg('Password must be at least 8 characters.');
    const { error } = await supabase.auth.updateUser({ password: pw }); setMsg(error ? error.message : 'Password updated.'); setPw('');
  }
  return (
    <div className="section max-w-3xl pt-36">
      <p className="eyebrow mb-3">Account settings</p><h1 className="h2 mb-8">Your profile</h1>
      {msg && <p role="status" className="mb-4 rounded-xl bg-white/10 p-3 text-sm">{msg}</p>}
      <div className="glass-strong space-y-8 rounded-3xl p-8">
        <div className="flex items-center gap-5">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-forest-700">{profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-3xl">{(profile?.full_name ?? '?')[0]}</span>}
            <label className="absolute inset-x-0 bottom-0 flex cursor-pointer justify-center bg-black/60 py-1"><Camera className="h-4 w-4" /><span className="sr-only">Upload profile photo</span><input type="file" accept="image/*" onChange={avatar} className="hidden" /></label></div>
          <div><p className="text-lg font-semibold">{profile?.full_name}</p><p className="text-sm text-white/60">{user?.email}</p><p className="text-xs text-white/50">{user?.email_confirmed_at ? '✓ Email verified' : 'Email not verified'}</p></div>
        </div>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input className="input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
          <Field label="Phone"><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Nationality"><input className="input" value={f.nationality} onChange={(e) => setF({ ...f, nationality: e.target.value })} /></Field>
          <div className="flex items-end"><button className="btn-gold w-full">Save profile</button></div>
        </form>
        <form onSubmit={changePw} className="flex items-end gap-3 border-t border-white/10 pt-6"><div className="flex-1"><Field label="New password"><input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field></div><button className="btn-glass">Change password</button></form>
        <Link to="/my-bookings" className="btn-glass w-full">View booking history</Link>
      </div>
    </div>
  );
}
