import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Attraction, Booking, Pkg, Product } from '../lib/types';
import { fmtDate, money, q, todayISO, useData } from '../lib/utils';
import { Empty, ErrorBox, Field, Spinner } from '../components/ui';

export default function BookingPage() {
  const { slug } = useParams();
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const { data, loading, error } = useData(async () => {
    const a = (await q(supabase.from('attractions').select('*').eq('slug', slug!).eq('is_published', true).maybeSingle())) as Attraction | null;
    if (!a) return null;
    const [products, packages] = await Promise.all([
      q(supabase.from('tourism_products').select('*').eq('attraction_id', a.id).eq('is_published', true)),
      q(supabase.from('tourism_packages').select('*').eq('attraction_id', a.id).eq('is_published', true)),
    ]);
    return { a, products: products as Product[], packages: packages as Pkg[] };
  }, [slug]);

  const [f, setF] = useState({ full_name: '', email: '', phone: '', nationality: '', date: '', time: '', visitors: 1, choice: '', requests: '' });
  const [remaining, setRemaining] = useState<number | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<Booking | null>(null);
  const upd = (k: string, v: string | number) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => { if (profile) setF((s) => ({ ...s, full_name: s.full_name || profile.full_name || '', email: s.email || profile.email || '', phone: s.phone || profile.phone || '', nationality: s.nationality || profile.nationality || '' })); }, [profile]);
  useEffect(() => { if (data?.a.available_times?.length && !f.time) upd('time', data.a.available_times[0]); }, [data]); // eslint-disable-line

  const [kind, id] = f.choice.split(':');
  const product = kind === 'p' ? data?.products.find((p) => p.id === id) : undefined;
  const pkg = kind === 'k' ? data?.packages.find((p) => p.id === id) : undefined;

  async function check() {
    if (!data || !f.date) return;
    const { data: r, error: e } = await supabase.rpc('get_remaining_capacity', { p_attraction: data.a.id, p_product: product?.id ?? null, p_date: f.date });
    if (e) { setErr(e.message); return; }
    setErr(''); setRemaining(r as number | null);
  }
  useEffect(() => { setRemaining(undefined); if (f.date) check(); }, [f.date, f.choice]); // eslint-disable-line

  const unit = pkg ? pkg.price_per_person : product ? product.price : data?.a.entrance_fee_amount ?? null;
  const cur = pkg?.currency ?? product?.currency ?? data?.a.currency ?? 'USD';
  const total = useMemo(() => (unit == null ? null : unit * f.visitors), [unit, f.visitors]);

  if (loading) return <div className="pt-40"><Spinner /></div>;
  if (error) return <div className="section pt-40"><ErrorBox msg={error} /></div>;
  if (!data || !data.a.booking_enabled) return <div className="section pt-40"><Empty>Booking isn't available for this attraction.</Empty></div>;
  const { a } = data;
  const soldOut = remaining === 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) { nav('/login', { state: { from: `/book/${slug}` } }); return; }
    setBusy(true); setErr('');
    const { data: b, error: ex } = await supabase.rpc('create_booking', {
      p_attraction: a.id, p_product: product?.id ?? null, p_package: pkg?.id ?? null, p_date: f.date, p_time: f.time, p_visitors: f.visitors,
      p_full_name: f.full_name, p_email: f.email, p_phone: f.phone, p_nationality: f.nationality || null,
      p_experience: product?.name ?? pkg?.title ?? 'Standard visit', p_requests: f.requests || null,
    });
    setBusy(false);
    if (ex) { setErr(ex.message); check(); return; }
    const booking = b as Booking;
    setDone(booking);
    const { data: s } = await supabase.auth.getSession();
    fetch('/api/send-confirmation', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token}` }, body: JSON.stringify({ reference: booking.reference }) }).catch(() => undefined);
  }

  if (done) return (
    <div className="section flex justify-center pt-40"><div className="glass-strong liquid w-full max-w-xl rounded-3xl p-10 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-300" />
      <h1 className="mt-4 font-display text-3xl">Booking request received</h1>
      <p className="mt-2 text-white/70">Keep your reference number:</p>
      <p className="my-4 rounded-xl bg-white/10 py-3 font-mono text-2xl tracking-widest text-gold-300">{done.reference}</p>
      <dl className="mb-6 space-y-1 text-left text-sm text-white/80">
        <div className="flex justify-between"><dt>Attraction</dt><dd>{a.name}</dd></div><div className="flex justify-between"><dt>Date</dt><dd>{fmtDate(done.booking_date)} {done.preferred_time}</dd></div>
        <div className="flex justify-between"><dt>Visitors</dt><dd>{done.visitors}</dd></div><div className="flex justify-between"><dt>Total</dt><dd>{done.total_amount > 0 ? money(done.total_amount, done.currency) : 'To be confirmed'}</dd></div>
        <div className="flex justify-between"><dt>Status</dt><dd className="capitalize">{done.status}</dd></div></dl>
      <p className="mb-6 text-xs text-white/50">A confirmation email is on its way (if email delivery is configured).</p>
      <Link to="/my-bookings" className="btn-gold">View my bookings</Link></div></div>
  );

  return (
    <div className="section pt-36">
      <p className="eyebrow mb-3">Book your experience</p><h1 className="h2 mb-8">{a.name}</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <form onSubmit={submit} className="glass-strong space-y-5 rounded-3xl p-6 sm:p-8 lg:col-span-2">
          {!user && <div className="rounded-xl bg-amber-400/15 p-3 text-sm text-amber-100"><Link className="underline" to="/login" state={{ from: `/book/${slug}` }}>Sign in</Link> or <Link className="underline" to="/signup">create an account</Link> to complete your booking.</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><input required className="input" value={f.full_name} onChange={(e) => upd('full_name', e.target.value)} autoComplete="name" /></Field>
            <Field label="Email"><input required type="email" className="input" value={f.email} onChange={(e) => upd('email', e.target.value)} autoComplete="email" /></Field>
            <Field label="Phone"><input required type="tel" className="input" value={f.phone} onChange={(e) => upd('phone', e.target.value)} autoComplete="tel" /></Field>
            <Field label="Nationality"><input className="input" value={f.nationality} onChange={(e) => upd('nationality', e.target.value)} autoComplete="country-name" /></Field>
            <Field label="Selected attraction"><input readOnly className="input opacity-70" value={a.name} /></Field>
            <Field label="Selected experience"><select className="input" value={f.choice} onChange={(e) => upd('choice', e.target.value)}>
              <option value="">Standard visit</option>
              {data.products.map((p) => <option key={p.id} value={`p:${p.id}`}>{p.name} ({money(p.price, p.currency)})</option>)}
              {data.packages.map((p) => <option key={p.id} value={`k:${p.id}`}>Package: {p.title}</option>)}</select></Field>
            <Field label="Booking date"><input required type="date" min={todayISO()} className="input" value={f.date} onChange={(e) => upd('date', e.target.value)} /></Field>
            <Field label="Preferred time"><select className="input" value={f.time} onChange={(e) => upd('time', e.target.value)}>{a.available_times.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label={`Number of visitors (max ${a.max_group_size})`}><input required type="number" min={1} max={a.max_group_size} className="input" value={f.visitors} onChange={(e) => upd('visitors', Math.max(1, Number(e.target.value) || 1))} /></Field>
            <div className="flex items-end"><button type="button" onClick={check} disabled={!f.date} className="btn-glass w-full">Check availability</button></div>
          </div>
          {f.date && remaining !== undefined && (
            <p role="status" className={`rounded-xl p-3 text-sm ${soldOut ? 'bg-red-500/15 text-red-200' : 'bg-emerald-500/15 text-emerald-200'}`}>
              {soldOut ? 'Fully booked or closed on this date. Please choose another day.' : remaining === null ? 'Available on this date.' : `${remaining} place(s) left on this date.`}</p>)}
          <Field label="Special requests"><textarea className="input min-h-24" maxLength={1000} value={f.requests} onChange={(e) => upd('requests', e.target.value)} /></Field>
          {err && <ErrorBox msg={err} />}
          <button className="btn-gold w-full py-4" disabled={busy || soldOut || !f.date || (remaining != null && f.visitors > remaining)}>{busy ? 'Booking…' : user ? 'Confirm booking request' : 'Sign in to book'}</button>
        </form>
        <aside className="glass h-fit space-y-3 rounded-3xl p-6 text-sm lg:sticky lg:top-28">
          <p className="font-display text-xl">Summary</p>
          <div className="flex justify-between"><span>Price per person</span><span>{money(unit, cur)}</span></div>
          <div className="flex justify-between"><span>Visitors</span><span>{f.visitors}</span></div>
          <hr className="border-white/15" />
          <div className="flex justify-between text-lg font-semibold text-gold-300"><span>Total</span><span>{total == null ? 'To be confirmed' : money(total, cur)}</span></div>
          {total == null && <p className="text-xs text-white/50">The price for this experience hasn't been verified yet. Our team will confirm the exact amount.</p>}
          <hr className="border-white/15" />
          <p className="text-xs text-white/60"><b>Cancellation:</b> {a.cancellation_policy || `Free cancellation up to ${a.cancellation_hours} hours before your visit.`}</p>
        </aside>
      </div>
    </div>
  );
}
