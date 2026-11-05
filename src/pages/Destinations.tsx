import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Attraction, CATEGORY_LABEL } from '../lib/types';
import { q, useData } from '../lib/utils';
import { Empty, ErrorBox, Reveal, Spinner } from '../components/ui';
import { AttractionCard } from './Home';

const PROVINCES = ['Kigali City', 'Northern', 'Southern', 'Eastern', 'Western'];

export default function Destinations() {
  const [sp, setSp] = useSearchParams();
  const [text, setText] = useState('');
  const province = sp.get('province') ?? '';
  const category = sp.get('category') ?? '';
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const { data, loading, error } = useData(() => q(supabase.from('attractions').select('*').eq('is_published', true).order('is_featured', { ascending: false }).order('name')) as Promise<Attraction[]>);
  const list = useMemo(() => (data ?? []).filter((a) =>
    (!province || a.province === province) && (!category || a.category === category) && (!verifiedOnly || a.verification_status === 'verified') &&
    (!text || `${a.name} ${a.district ?? ''} ${a.short_description ?? ''}`.toLowerCase().includes(text.toLowerCase()))), [data, province, category, verifiedOnly, text]);
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }); };
  return (
    <div className="section pt-36">
      <p className="eyebrow mb-3">Destinations & attractions</p>
      <h1 className="h2 mb-3">Explore Rwanda</h1>
      <p className="mb-8 max-w-2xl text-white/70">A growing directory managed by our team. Items marked “Awaiting verification” are still being checked against official sources.</p>
      <div className="glass mb-10 grid gap-3 rounded-3xl p-4 md:grid-cols-5">
        <div className="relative md:col-span-2"><Search className="absolute left-4 top-3.5 h-4 w-4 text-white/50" aria-hidden /><label className="sr-only" htmlFor="s">Search</label>
          <input id="s" className="input pl-11" placeholder="Search attractions, districts…" value={text} onChange={(e) => setText(e.target.value)} /></div>
        <select aria-label="Province" className="input" value={province} onChange={(e) => set('province', e.target.value)}><option value="">All provinces</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
        <select aria-label="Category" className="input" value={category} onChange={(e) => set('category', e.target.value)}><option value="">All categories</option>{Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <label className="flex items-center gap-2 px-2 text-sm"><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="h-4 w-4 accent-yellow-500" /> Verified only</label>
      </div>
      {loading ? <Spinner /> : error ? <ErrorBox msg={error} /> : !list.length ? <Empty>No attractions match your filters.</Empty> : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((a, i) => <Reveal key={a.id} delay={(i % 6) * 0.05}><AttractionCard a={a} /></Reveal>)}</div>)}
    </div>
  );
}
