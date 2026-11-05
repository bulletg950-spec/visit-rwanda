import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Field } from '../components/ui';

const SITE = (import.meta.env.VITE_SITE_URL as string) || window.location.origin;

export function Shell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,#154633,transparent_60%),radial-gradient(ellipse_at_bottom_right,#00668f55,transparent_50%)] px-4 pb-16 pt-32">
      <div className="glass-strong liquid w-full max-w-md rounded-3xl p-8">
        <h1 className="font-display text-3xl">{title}</h1>{sub && <p className="mt-1 text-sm text-white/60">{sub}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function OAuthButtons({ redirectTo, admin }: { redirectTo: string; admin?: boolean }) {
  const [domain, setDomain] = useState('');
  const [err, setErr] = useState('');
  const go = async (provider: Provider, scopes?: string) => {
    setErr('');
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${SITE}${redirectTo}`, scopes } });
    if (error) setErr(error.message);
  };
  const sso = async () => {
    setErr('');
    const { data, error } = await supabase.auth.signInWithSSO({ domain: domain.trim(), options: { redirectTo: `${SITE}${redirectTo}` } });
    if (error) setErr(error.message); else if (data?.url) window.location.href = data.url;
  };
  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        <button type="button" onClick={() => go('google')} className="btn-glass w-full">{admin ? 'Google Workspace' : 'Continue with Google'}</button>
        <button type="button" onClick={() => go('azure', 'email')} className="btn-glass w-full">{admin ? 'Microsoft Entra ID' : 'Continue with Microsoft'}</button>
        {!admin && <button type="button" onClick={() => go('apple')} className="btn-glass w-full">Continue with Apple</button>}
      </div>
      <details className="text-sm text-white/70"><summary className="cursor-pointer py-2">Enterprise SSO</summary>
        <div className="flex gap-2"><input className="input" placeholder="company-domain.com" value={domain} onChange={(e) => setDomain(e.target.value)} aria-label="Company domain" /><button type="button" onClick={sso} disabled={!domain} className="btn-glass">Go</button></div></details>
      {err && <p role="alert" className="text-xs text-red-300">{err}</p>}
    </div>
  );
}

export function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) setErr(error.message === 'Email not confirmed' ? 'Please verify your email first. Check your inbox.' : error.message); else nav(from, { replace: true });
  }
  return (
    <Shell title="Welcome back" sub="Sign in to manage your bookings">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input required type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input required type="password" autoComplete="current-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
        <button className="btn-gold w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <div className="flex justify-between text-sm text-white/70"><Link to="/forgot-password" className="hover:text-gold-300">Forgot password?</Link><Link to="/signup" className="hover:text-gold-300">Create account</Link></div>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-white/40"><hr className="flex-1 border-white/15" />or<hr className="flex-1 border-white/15" /></div>
      <OAuthButtons redirectTo={from} />
    </Shell>
  );
}

export function Signup() {
  const [f, setF] = useState({ full_name: '', email: '', phone: '', pw: '', pw2: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr('');
    if (f.pw.length < 8) return setErr('Password must be at least 8 characters.');
    if (f.pw !== f.pw2) return setErr('Passwords do not match.');
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email: f.email, password: f.pw, options: { emailRedirectTo: `${SITE}/login`, data: { full_name: f.full_name, phone: f.phone } } });
    setBusy(false);
    if (error) return setErr(error.message);
    if (data.session) window.location.href = '/'; else setSent(true);
  }
  if (sent) return <Shell title="Check your inbox"><p className="text-white/80">We sent a verification link to <b>{f.email}</b>. Click it, then <Link className="text-gold-300 underline" to="/login">sign in</Link>.</p></Shell>;
  return (
    <Shell title="Create your account" sub="Book experiences and manage reservations">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name"><input required className="input" value={f.full_name} onChange={set('full_name')} autoComplete="name" /></Field>
        <Field label="Email"><input required type="email" className="input" value={f.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Phone number"><input required type="tel" className="input" value={f.phone} onChange={set('phone')} autoComplete="tel" /></Field>
        <Field label="Password"><input required type="password" minLength={8} className="input" value={f.pw} onChange={set('pw')} autoComplete="new-password" /></Field>
        <Field label="Confirm password"><input required type="password" className="input" value={f.pw2} onChange={set('pw2')} autoComplete="new-password" /></Field>
        {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
        <button className="btn-gold w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="text-center text-sm text-white/70">Already registered? <Link className="text-gold-300" to="/login">Sign in</Link></p>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-white/40"><hr className="flex-1 border-white/15" />or<hr className="flex-1 border-white/15" /></div>
      <OAuthButtons redirectTo="/" />
    </Shell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState(''); const [msg, setMsg] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE}/reset-password` });
    setMsg(error ? error.message : 'If that email exists, a reset link is on its way.');
  }
  return <Shell title="Reset password" sub="We'll email you a secure link"><form onSubmit={submit} className="space-y-4"><Field label="Email"><input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field><button className="btn-gold w-full">Send reset link</button>{msg && <p role="status" className="text-sm text-white/80">{msg}</p>}<Link to="/login" className="block text-center text-sm text-white/70">Back to sign in</Link></form></Shell>;
}

export function ResetPassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [err, setErr] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setErr('At least 8 characters.');
    if (pw !== pw2) return setErr('Passwords do not match.');
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) setErr(error.message); else nav('/login');
  }
  return <Shell title="Choose a new password"><form onSubmit={submit} className="space-y-4"><Field label="New password"><input required type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field><Field label="Confirm password"><input required type="password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></Field>{err && <p role="alert" className="text-sm text-red-300">{err}</p>}<button className="btn-gold w-full">Update password</button></form></Shell>;
}
