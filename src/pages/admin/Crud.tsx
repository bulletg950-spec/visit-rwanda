import { ReactNode, useMemo, useState } from 'react';
import { Check, Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { slugify, uploadFile, useData } from '../../lib/utils';
import { ErrorBox, Img, Spinner } from '../../components/ui';

export type FieldType = 'text' | 'textarea' | 'number' | 'bool' | 'select' | 'date' | 'image' | 'video' | 'list' | 'json' | 'fk';
export interface FieldDef {
  key: string; label: string; type?: FieldType; options?: string[]; required?: boolean; help?: string; wide?: boolean;
  fk?: { table: string; label: string }; default?: unknown; hideInList?: boolean;
}
export interface CrudProps {
  table: string; title: string; fields: FieldDef[]; listCols: string[]; orderBy?: string; asc?: boolean; folder?: string;
  toggles?: string[]; canCreate?: boolean; canDelete?: boolean; searchKey?: string; slugFrom?: string; select?: string; footer?: ReactNode; badgeCols?: string[];
}

function FileField({ f, value, onChange, folder }: { f: FieldDef; value: string; onChange: (v: string) => void; folder: string }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function pick(file?: File) {
    if (!file) return; setBusy(true); setErr('');
    try { onChange(await uploadFile('media', file, folder)); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-2">
      {value && (f.type === 'image' ? <Img src={value} alt="Preview" className="h-40 w-full rounded-xl object-cover" /> : <video src={value} controls className="h-48 w-full rounded-xl bg-black" />)}
      <div className="flex gap-2">
        <label className="btn-glass cursor-pointer !py-2 text-xs">{busy ? 'Uploading…' : value ? 'Replace file' : 'Upload file'}
          <input type="file" className="hidden" accept={f.type === 'image' ? 'image/*' : 'video/*'} onChange={(e) => pick(e.target.files?.[0])} /></label>
        <input className="input !py-2 text-xs" placeholder="…or paste a URL" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
      {err && <p className="text-xs text-red-300">{err}</p>}
    </div>
  );
}

function FkSelect({ f, value, onChange }: { f: FieldDef; value: string; onChange: (v: string) => void }) {
  const { data } = useData(async () => { const { data } = await supabase.from(f.fk!.table).select(`id,${f.fk!.label}`).order(f.fk!.label); return (data ?? []) as unknown as Record<string, string>[]; });
  return <select className="input" value={value} onChange={(e) => onChange(e.target.value)} required={f.required}><option value="">None</option>{data?.map((r) => <option key={r.id} value={r.id}>{r[f.fk!.label]}</option>)}</select>;
}

const toForm = (fields: FieldDef[], row?: Record<string, any>) => {
  const o: Record<string, any> = {};
  fields.forEach((f) => {
    const v = row?.[f.key];
    o[f.key] = f.type === 'list' ? (v ?? []).join(', ') : f.type === 'json' ? JSON.stringify(v ?? (f.default ?? []), null, 2) : f.type === 'bool' ? (v ?? f.default ?? false) : v ?? f.default ?? '';
  });
  return o;
};

export default function Crud(p: CrudProps) {
  const folder = p.folder ?? p.table;
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<Record<string, any> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useData(async () => {
    const { data, error } = await supabase.from(p.table).select(p.select ?? '*').order(p.orderBy ?? 'created_at', { ascending: p.asc ?? false }).limit(500);
    if (error) throw new Error(error.message); return (data ?? []) as unknown as Record<string, any>[];
  }, [p.table]);
  const rows = useMemo(() => (data ?? []).filter((r) => !search || JSON.stringify(Object.values(r)).toLowerCase().includes(search.toLowerCase())), [data, search]);

  const open = (row?: Record<string, any>) => { setErr(''); setEditId(row?.id ?? null); setEdit(toForm(p.fields, row)); };
  async function save() {
    if (!edit) return; setBusy(true); setErr('');
    try {
      const payload: Record<string, any> = {};
      for (const f of p.fields) {
        let v = edit[f.key];
        if (f.type === 'list') v = String(v).split(',').map((s) => s.trim()).filter(Boolean);
        else if (f.type === 'json') { try { v = JSON.parse(v || '[]'); } catch { throw new Error(`${f.label}: invalid JSON`); } }
        else if (f.type === 'number') v = v === '' || v == null ? null : Number(v);
        else if (f.type !== 'bool' && v === '') v = null;
        payload[f.key] = v;
      }
      if (p.slugFrom && !payload.slug) payload.slug = slugify(String(payload[p.slugFrom] ?? ''));
      if (payload.verification_status === 'verified') payload.verified_at = new Date().toISOString();
      const res = editId ? await supabase.from(p.table).update(payload).eq('id', editId) : await supabase.from(p.table).insert(payload);
      if (res.error) throw new Error(res.error.message);
      setEdit(null); reload();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  async function del(r: Record<string, any>) {
    if (!confirm('Delete this item permanently?')) return;
    const { error } = await supabase.from(p.table).delete().eq('id', r.id);
    if (error) alert(error.message); else reload();
  }
  async function toggle(r: Record<string, any>, k: string) {
    const { error } = await supabase.from(p.table).update({ [k]: !r[k] }).eq('id', r.id);
    if (error) alert(error.message); else reload();
  }
  const cell = (r: Record<string, any>, k: string) => {
    const f = p.fields.find((x) => x.key === k); const v = r[k];
    if (p.toggles?.includes(k)) return <button onClick={() => toggle(r, k)} aria-label={`Toggle ${k}`} aria-pressed={!!v} className={`h-6 w-11 rounded-full p-0.5 transition ${v ? 'bg-emerald-500' : 'bg-white/20'}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${v ? 'translate-x-5' : ''}`} /></button>;
    if (f?.type === 'image') return <Img src={v} alt="" className="h-10 w-14 rounded object-cover" />;
    if (typeof v === 'boolean') return v ? <Check className="h-4 w-4 text-emerald-300" /> : <X className="h-4 w-4 text-white/30" />;
    if (p.badgeCols?.includes(k)) return <span className={`badge ${v === 'verified' || v === 'confirmed' ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/15'}`}>{String(v ?? '')}</span>;
    if (Array.isArray(v)) return <span className="text-xs">{v.join(', ')}</span>;
    return <span className="line-clamp-2 max-w-xs">{v == null ? '' : String(v)}</span>;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{p.title}</h1>
        <div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-white/40" /><input className="input !py-2.5 pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" /></div>
          {p.canCreate !== false && <button onClick={() => open()} className="btn-gold !py-2.5"><Plus className="h-4 w-4" /> Add new</button>}</div>
      </div>
      {loading ? <Spinner /> : error ? <ErrorBox msg={error} /> : (
        <div className="glass overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50"><tr>{p.listCols.map((k) => <th key={k} className="px-4 py-3">{p.fields.find((f) => f.key === k)?.label ?? k}</th>)}<th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">{p.listCols.map((k) => <td key={k} className="px-4 py-3 align-middle">{cell(r, k)}</td>)}
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {(r.slug && p.table === 'attractions') && <a href={`/destinations/${r.slug}`} target="_blank" rel="noreferrer" aria-label="Preview public page" className="mr-1 inline-block rounded-lg p-2 hover:bg-white/10"><Eye className="h-4 w-4" /></a>}
                  <button aria-label="Edit" onClick={() => open(r)} className="rounded-lg p-2 hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                  {p.canDelete !== false && <button aria-label="Delete" onClick={() => del(r)} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>}</td></tr>))}
              {!rows.length && <tr><td colSpan={p.listCols.length + 1} className="px-4 py-10 text-center text-white/50">Nothing here yet.</td></tr>}</tbody>
          </table>
        </div>)}
      {p.footer}
      {edit && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={editId ? 'Edit item' : 'New item'}>
          <div className="glass-strong my-8 w-full max-w-3xl rounded-3xl p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl">{editId ? 'Edit' : 'Add'} {p.title.toLowerCase()}</h2><button onClick={() => setEdit(null)} aria-label="Close"><X /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {p.fields.map((f) => {
                const v = edit[f.key]; const set = (x: any) => setEdit({ ...edit, [f.key]: x });
                const wide = f.wide || ['textarea', 'image', 'video', 'json', 'list'].includes(f.type ?? '');
                return (
                  <div key={f.key} className={wide ? 'sm:col-span-2' : ''}>
                    {f.type === 'bool' ? <label className="flex items-center gap-3 pt-6 text-sm"><input type="checkbox" className="h-5 w-5 accent-yellow-500" checked={!!v} onChange={(e) => set(e.target.checked)} />{f.label}</label> : (
                      <label className="block"><span className="label">{f.label}{f.required && ' *'}</span>
                        {f.type === 'textarea' ? <textarea className="input min-h-28" value={v} onChange={(e) => set(e.target.value)} required={f.required} />
                          : f.type === 'json' ? <textarea className="input min-h-28 font-mono text-xs" value={v} onChange={(e) => set(e.target.value)} />
                          : f.type === 'list' ? <input className="input" placeholder="comma, separated, values" value={v} onChange={(e) => set(e.target.value)} />
                          : f.type === 'select' ? <select className="input" value={v} onChange={(e) => set(e.target.value)} required={f.required}>{!f.required && <option value="">-</option>}{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
                          : f.type === 'fk' ? <FkSelect f={f} value={v} onChange={set} />
                          : f.type === 'image' || f.type === 'video' ? <FileField f={f} value={v} onChange={set} folder={folder} />
                          : <input className="input" type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} step={f.type === 'number' ? 'any' : undefined} value={v ?? ''} onChange={(e) => set(e.target.value)} required={f.required} />}
                      </label>)}
                    {f.help && <p className="mt-1 text-xs text-white/40">{f.help}</p>}
                  </div>);
              })}
            </div>
            {err && <div className="mt-4"><ErrorBox msg={err} /></div>}
            <div className="mt-6 flex justify-end gap-3"><button onClick={() => setEdit(null)} className="btn-glass">Cancel</button><button onClick={save} disabled={busy} className="btn-gold">{busy ? 'Saving…' : 'Save'}</button></div>
          </div>
        </div>)}
    </div>
  );
}

