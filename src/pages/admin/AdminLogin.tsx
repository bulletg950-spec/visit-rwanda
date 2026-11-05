import { FormEvent, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Field } from '../../components/ui';
import { OAuthButtons, Shell } from '../Auth';

export default function AdminLogin() {
  const { user, isStaff, loading, signOut } = useAuth();
  const [sp] = useSearchParams();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [reset, setReset] = useState('');
  if (!loading && user && isStaff) return <Navigate to="/admin" replace />;
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false); if (error) setErr(error.message);
  }
  async function forgot() {
    if (!email) return setErr('Enter your email first.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setReset(error ? error.message : 'If this staff account exists, a reset link was sent.');
  }
  return (
    <Shell title="Staff console" sub="Authorised personnel only">
      <ShieldCheck className="mb-4 h-8 w-8 text-gold-400" aria-hidden />
      {sp.get('expired') && <p className="mb-3 rounded-lg bg-amber-400/15 p-2 text-sm text-amber-100">Session expired due to inactivity. Please sign in again.</p>}
      {!loading && user && !isStaff && <div role="alert" className="mb-4 rounded-lg bg-red-500/15 p-3 text-sm text-red-200">This account has no staff access. <button className="underline" onClick={() => signOut()}>Sign out</button></div>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Work email"><input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
        <Field label="Password"><input required type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></Field>
        {err && <p role="alert" className="text-sm text-red-300">{err}</p>}{reset && <p role="status" className="text-sm text-white/80">{reset}</p>}
        <button className="btn-gold w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <button type="button" onClick={forgot} className="w-full text-center text-sm text-white/60 hover:text-gold-300">Forgot password?</button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-white/40"><hr className="flex-1 border-white/15" />Single sign-on<hr className="flex-1 border-white/15" /></div>
      <OAuthButtons redirectTo="/admin" admin />
      <Link to="/" className="mt-6 block text-center text-xs text-white/50">← Back to website</Link>
    </Shell>
  );
}
