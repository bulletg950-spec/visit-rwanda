import { FormEvent, useState } from 'react';
import Crud, { FieldDef } from './Crud';
import { Guard } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { fmtDate, money, q, uploadFile, useData } from '../../lib/utils';
import { Attraction, Booking, Profile } from '../../lib/types';
import { ErrorBox, Img, Spinner } from '../../components/ui';
import { Download, Trash2 } from 'lucide-react';

const PROV = ['Kigali City', 'Northern', 'Southern', 'Eastern', 'Western'];
const CATS = ['national_park', 'lake', 'mountain', 'adventure', 'wildlife', 'cultural', 'historical', 'museum', 'city', 'recreation', 'landscape'];

export const Destinations = () => <Crud table="destinations" title="Destinations" slugFrom="name" orderBy="display_order" asc toggles={['is_published', 'is_featured']} listCols={['hero_image_url', 'name', 'province', 'is_featured', 'is_published']}
  fields={[{ key: 'name', label: 'Name', required: true }, { key: 'slug', label: 'Slug', help: 'Auto-generated if empty' }, { key: 'province', label: 'Province', type: 'select', options: PROV }, { key: 'tagline', label: 'Tagline' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'hero_image_url', label: 'Hero image', type: 'image' }, { key: 'display_order', label: 'Display order', type: 'number', default: 0 }, { key: 'is_featured', label: 'Featured', type: 'bool' }, { key: 'is_published', label: 'Published', type: 'bool', default: true }]} />;

const attractionFields: FieldDef[] = [
  { key: 'name', label: 'Attraction name', required: true }, { key: 'slug', label: 'Slug', help: 'Auto-generated if empty' },
  { key: 'category', label: 'Category', type: 'select', options: CATS, required: true, default: 'recreation' },
  { key: 'destination_id', label: 'Destination', type: 'fk', fk: { table: 'destinations', label: 'name' } },
  { key: 'short_description', label: 'Short description', type: 'textarea' }, { key: 'description', label: 'Full description', type: 'textarea' },
  { key: 'main_image_url', label: 'Main photograph', type: 'image' },
  { key: 'province', label: 'Province', type: 'select', options: PROV }, { key: 'district', label: 'District' }, { key: 'sector', label: 'Sector' }, { key: 'exact_location', label: 'Exact location' },
  { key: 'latitude', label: 'GPS latitude', type: 'number' }, { key: 'longitude', label: 'GPS longitude', type: 'number' }, { key: 'google_maps_url', label: 'Google Maps URL', wide: true },
  { key: 'contact_phone', label: 'Official phone', help: 'Only enter verified official numbers' }, { key: 'contact_email', label: 'Official email' }, { key: 'website_url', label: 'Official website' },
  { key: 'opening_hours', label: 'Opening hours' }, { key: 'entrance_fee_info', label: 'Entrance fees (text)', type: 'textarea' }, { key: 'entrance_fee_amount', label: 'Per-person price (for booking totals)', type: 'number' }, { key: 'currency', label: 'Currency', default: 'USD' },
  { key: 'activities', label: 'Activities', type: 'list' }, { key: 'accommodation_info', label: 'Accommodation info', type: 'textarea' }, { key: 'facilities', label: 'Facilities', type: 'list' },
  { key: 'accessibility_info', label: 'Accessibility', type: 'textarea' }, { key: 'best_time_to_visit', label: 'Best time to visit' }, { key: 'visit_duration', label: 'Estimated visit duration' }, { key: 'safety_info', label: 'Safety information', type: 'textarea' },
  { key: 'faqs', label: 'FAQs (JSON: [{"q":"","a":""}])', type: 'json', default: [] },
  { key: 'booking_enabled', label: 'Booking available', type: 'bool', default: true }, { key: 'available_times', label: 'Available time slots', type: 'list', default: ['08:00', '10:00', '13:00', '15:00'] },
  { key: 'daily_capacity', label: 'Daily visitor capacity', type: 'number', help: 'Empty = unlimited' }, { key: 'max_group_size', label: 'Max visitors per booking', type: 'number', default: 20 },
  { key: 'cancellation_hours', label: 'Free cancellation (hours before)', type: 'number', default: 48 }, { key: 'cancellation_policy', label: 'Cancellation policy text', type: 'textarea' },
  { key: 'verification_status', label: 'Verification', type: 'select', options: ['awaiting', 'verified'], required: true, default: 'awaiting' }, { key: 'verification_notes', label: 'Verification notes / sources', type: 'textarea' },
  { key: 'is_demo', label: 'Demo content', type: 'bool' }, { key: 'is_featured', label: 'Featured', type: 'bool' }, { key: 'is_published', label: 'Published', type: 'bool' },
];
export const Attractions = () => <Crud table="attractions" title="Tourist Attractions" slugFrom="name" orderBy="name" asc toggles={['is_published', 'is_featured']} badgeCols={['verification_status']} folder="attractions"
  listCols={['main_image_url', 'name', 'category', 'province', 'verification_status', 'is_featured', 'is_published']} fields={attractionFields} />;

export const Products = () => <Crud table="tourism_products" title="Product Management" slugFrom="name" toggles={['is_published', 'is_featured']} listCols={['image_url', 'name', 'product_type', 'price', 'daily_capacity', 'is_published']}
  fields={[{ key: 'name', label: 'Product / experience name', required: true }, { key: 'slug', label: 'Slug' }, { key: 'product_type', label: 'Type', type: 'select', options: ['experience', 'accommodation', 'ticket', 'transport'], required: true, default: 'experience' },
    { key: 'attraction_id', label: 'Attraction', type: 'fk', fk: { table: 'attractions', label: 'name' } }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'image_url', label: 'Image', type: 'image' },
    { key: 'price', label: 'Price per person', type: 'number', help: 'Leave empty = price to be confirmed' }, { key: 'currency', label: 'Currency', default: 'USD' }, { key: 'daily_capacity', label: 'Daily capacity', type: 'number' },
    { key: 'is_demo', label: 'Demo content', type: 'bool' }, { key: 'is_featured', label: 'Featured', type: 'bool' }, { key: 'is_published', label: 'Published', type: 'bool', default: true }]} />;

export const Packages = () => <Crud table="tourism_packages" title="Tourism Packages" slugFrom="title" toggles={['is_published', 'is_featured']} listCols={['image_url', 'title', 'duration_days', 'price_per_person', 'is_featured', 'is_published']}
  fields={[{ key: 'title', label: 'Title', required: true }, { key: 'slug', label: 'Slug' }, { key: 'attraction_id', label: 'Main attraction (enables online booking)', type: 'fk', fk: { table: 'attractions', label: 'name' } }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'image_url', label: 'Image', type: 'image' },
    { key: 'duration_days', label: 'Duration (days)', type: 'number' }, { key: 'price_per_person', label: 'Price per person', type: 'number' }, { key: 'currency', label: 'Currency', default: 'USD' }, { key: 'includes', label: 'Includes', type: 'list' },
    { key: 'is_demo', label: 'Demo content', type: 'bool' }, { key: 'is_featured', label: 'Featured', type: 'bool' }, { key: 'is_published', label: 'Published', type: 'bool', default: true }]} />;

export const Reviews = () => <Crud table="reviews" title="Reviews Management" canCreate={false} select="*, attractions(name)" toggles={['is_approved', 'is_featured']} listCols={['reviewer_name', 'rating', 'comment', 'is_approved', 'is_featured']}
  fields={[{ key: 'reviewer_name', label: 'Reviewer' }, { key: 'rating', label: 'Rating', type: 'number' }, { key: 'title', label: 'Title' }, { key: 'comment', label: 'Comment', type: 'textarea' }, { key: 'is_approved', label: 'Approved (visible publicly)', type: 'bool' }, { key: 'is_featured', label: 'Show as homepage testimonial', type: 'bool' }]} />;

export const Messages = () => (
  <div className="space-y-12">
    <Crud table="contact_messages" title="Contact Messages" canCreate={false} toggles={['is_read']} listCols={['created_at', 'name', 'email', 'subject', 'message', 'is_read']}
      fields={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'subject', label: 'Subject' }, { key: 'message', label: 'Message', type: 'textarea' }, { key: 'is_read', label: 'Read', type: 'bool' }]} />
    <Guard roles={['super_admin', 'admin']}><Crud table="newsletter_subscribers" title="Newsletter Subscribers" canCreate={false} listCols={['email', 'created_at']} fields={[{ key: 'email', label: 'Email' }]} /></Guard>
  </div>
);

export const WebsiteContent = () => <Crud table="homepage_content" title="Website Content" orderBy="key" asc toggles={['is_published']} listCols={['key', 'title', 'is_published']}
  fields={[{ key: 'key', label: 'Key (intro, travel_info …)', required: true }, { key: 'title', label: 'Title' }, { key: 'body', label: 'Body', type: 'textarea' }, { key: 'image_url', label: 'Image', type: 'image' }, { key: 'data', label: 'Extra data (JSON)', type: 'json', default: {} }, { key: 'is_published', label: 'Published', type: 'bool', default: true }]} />;

export const Availability = () => <Crud table="availability" title="Availability & Closures" orderBy="date" listCols={['date', 'attraction_id', 'capacity', 'is_closed', 'note']}
  fields={[{ key: 'attraction_id', label: 'Attraction', type: 'fk', fk: { table: 'attractions', label: 'name' }, required: true }, { key: 'product_id', label: 'Product (optional)', type: 'fk', fk: { table: 'tourism_products', label: 'name' } }, { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'capacity', label: 'Capacity override', type: 'number' }, { key: 'is_closed', label: 'Closed', type: 'bool' }, { key: 'note', label: 'Note' }]} />;

/* ---------------- Videos ---------------- */
export function Videos() {
  return (
    <div className="space-y-12">
      <Crud table="website_videos" title="Video Management" orderBy="display_order" asc toggles={['is_featured', 'is_published']} listCols={['poster_url', 'title', 'kind', 'display_order', 'is_featured', 'is_published']}
        footer={<p className="mt-3 text-xs text-white/50">The homepage hero automatically plays the newest featured video of type “homepage”. Large files: use compressed MP4 (H.264). Supabase Free caps uploads at 50 MB.</p>}
        fields={[{ key: 'title', label: 'Title', required: true }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'kind', label: 'Placement', type: 'select', options: ['homepage', 'destination', 'gallery'], required: true, default: 'homepage' },
          { key: 'video_url', label: 'Video', type: 'video', required: true }, { key: 'poster_url', label: 'Poster image', type: 'image' }, { key: 'attraction_id', label: 'Attraction (optional)', type: 'fk', fk: { table: 'attractions', label: 'name' } },
          { key: 'display_order', label: 'Display order', type: 'number', default: 0 }, { key: 'is_featured', label: 'Featured', type: 'bool' }, { key: 'is_published', label: 'Published', type: 'bool', default: true }]} />
      <Crud table="attraction_videos" title="Destination Videos" orderBy="display_order" asc toggles={['is_published']} listCols={['title', 'attraction_id', 'display_order', 'is_published']}
        fields={[{ key: 'attraction_id', label: 'Attraction', type: 'fk', fk: { table: 'attractions', label: 'name' }, required: true }, { key: 'title', label: 'Title', required: true }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'video_url', label: 'Video', type: 'video', required: true }, { key: 'poster_url', label: 'Poster', type: 'image' }, { key: 'display_order', label: 'Display order', type: 'number', default: 0 }, { key: 'is_published', label: 'Published', type: 'bool', default: true }]} />
    </div>
  );
}

/* ---------------- Gallery (multi upload) ---------------- */
export function Gallery() {
  const [attr, setAttr] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const atts = useData(() => q(supabase.from('attractions').select('id,name').order('name')) as Promise<{ id: string; name: string }[]>);
  const imgs = useData(async () => { let s = supabase.from('attraction_images').select('*, attractions(name)').order('created_at', { ascending: false }).limit(200); if (attr) s = s.eq('attraction_id', attr); return (await q(s)) as any[]; }, [attr]);
  async function upload(files: FileList | null) {
    if (!files?.length || !attr) return; setBusy(true); setErr('');
    try {
      for (const file of Array.from(files)) {
        const url = await uploadFile('media', file, `gallery/${attr}`);
        const { error } = await supabase.from('attraction_images').insert({ attraction_id: attr, url, alt_text: file.name.replace(/\.[^.]+$/, '') });
        if (error) throw new Error(error.message);
      }
      imgs.reload();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  const patch = async (id: string, v: object) => { await supabase.from('attraction_images').update(v).eq('id', id); imgs.reload(); };
  const del = async (id: string) => { if (confirm('Delete this image?')) { await supabase.from('attraction_images').delete().eq('id', id); imgs.reload(); } };
  const setMain = async (a: string, url: string) => { await supabase.from('attractions').update({ main_image_url: url }).eq('id', a); alert('Set as main photograph.'); };
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Image Gallery</h1>
      <div className="glass mb-6 flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <select className="input max-w-xs" value={attr} onChange={(e) => setAttr(e.target.value)} aria-label="Attraction"><option value="">All attractions</option>{atts.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <label className={`btn-gold cursor-pointer ${!attr ? 'pointer-events-none opacity-40' : ''}`}>{busy ? 'Uploading…' : 'Upload images'}<input type="file" multiple accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} /></label>
        {!attr && <span className="text-xs text-white/50">Select an attraction to upload</span>}
      </div>
      {err && <ErrorBox msg={err} />}
      {imgs.loading ? <Spinner /> : <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{imgs.data?.map((i) => (
        <div key={i.id} className="glass overflow-hidden rounded-2xl"><Img src={i.url} alt={i.alt_text ?? ''} className="aspect-square w-full object-cover" />
          <div className="space-y-2 p-3 text-xs"><p className="truncate text-white/60">{i.attractions?.name}</p>
            <div className="flex items-center justify-between"><label className="flex items-center gap-1"><input type="checkbox" checked={i.is_published} onChange={() => patch(i.id, { is_published: !i.is_published })} className="accent-yellow-500" /> Published</label>
              <button onClick={() => del(i.id)} aria-label="Delete image" className="text-red-300"><Trash2 className="h-4 w-4" /></button></div>
            <button onClick={() => setMain(i.attraction_id, i.url)} className="text-gold-300 underline">Use as main photo</button></div></div>))}
        {!imgs.data?.length && <p className="col-span-full text-center text-white/50">No images yet.</p>}</div>}
    </div>
  );
}

/* ---------------- Bookings ---------------- */
export function Bookings() {
  const [status, setStatus] = useState(''); const [text, setText] = useState('');
  const { data, loading, error, reload } = useData(() => q(supabase.from('bookings').select('*, attractions(name,slug,cancellation_hours)').order('created_at', { ascending: false }).limit(500)) as Promise<Booking[]>);
  const setSt = async (id: string, s: string) => { const { error } = await supabase.from('bookings').update({ status: s, cancelled_at: s === 'cancelled' ? new Date().toISOString() : null }).eq('id', id); if (error) alert(error.message); reload(); };
  const rows = (data ?? []).filter((b) => (!status || b.status === status) && (!text || `${b.reference} ${b.full_name} ${b.email} ${b.attractions?.name}`.toLowerCase().includes(text.toLowerCase())));
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-3xl">Booking Management</h1>
        <div className="flex gap-2"><input className="input !py-2.5" placeholder="Search reference, name…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search bookings" />
          <select className="input !py-2.5" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">All statuses</option>{['pending', 'confirmed', 'cancelled', 'completed'].map((s) => <option key={s}>{s}</option>)}</select></div></div>
      {loading ? <Spinner /> : error ? <ErrorBox msg={error} /> : (
        <div className="glass overflow-x-auto rounded-2xl"><table className="w-full text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50"><tr>{['Reference', 'Guest', 'Attraction', 'Date', 'Visitors', 'Total', 'Status'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>{rows.map((b) => (<tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
            <td className="px-4 py-3 font-mono text-xs text-gold-300">{b.reference}</td><td className="px-4 py-3">{b.full_name}<br /><span className="text-xs text-white/50">{b.email} · {b.phone}</span></td>
            <td className="px-4 py-3">{b.attractions?.name}<br /><span className="text-xs text-white/50">{b.experience}</span></td><td className="px-4 py-3">{fmtDate(b.booking_date)} {b.preferred_time}</td><td className="px-4 py-3">{b.visitors}</td>
            <td className="px-4 py-3">{b.total_amount > 0 ? money(b.total_amount, b.currency) : 'TBC'}</td>
            <td className="px-4 py-3"><select aria-label="Change status" className="input !py-1.5 text-xs" value={b.status} onChange={(e) => setSt(b.id, e.target.value)}>{['pending', 'confirmed', 'cancelled', 'completed'].map((s) => <option key={s}>{s}</option>)}</select></td></tr>))}
            {!rows.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-white/50">No bookings.</td></tr>}</tbody></table></div>)}
      <div className="mt-12"><Availability /></div>
    </div>
  );
}

/* ---------------- Users ---------------- */
export function UsersAdmin() {
  const { data, loading, error } = useData(() => q(supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500)) as Promise<Profile[]>);
  const [text, setText] = useState('');
  const rows = (data ?? []).filter((u) => !text || `${u.full_name} ${u.email}`.toLowerCase().includes(text.toLowerCase()));
  return (
    <div><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-3xl">User Management</h1><input className="input max-w-xs !py-2.5" placeholder="Search users…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search users" /></div>
      {loading ? <Spinner /> : error ? <ErrorBox msg={error} /> : <div className="glass overflow-x-auto rounded-2xl"><table className="w-full text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50"><tr>{['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
        <tbody>{rows.map((u) => <tr key={u.id} className="border-b border-white/5"><td className="px-4 py-3">{u.full_name}</td><td className="px-4 py-3">{u.email}</td><td className="px-4 py-3">{u.phone}</td><td className="px-4 py-3"><span className="badge bg-white/10">{u.role}</span></td><td className="px-4 py-3">{u.is_active ? 'Active' : 'Disabled'}</td><td className="px-4 py-3">{fmtDate(u.created_at)}</td></tr>)}</tbody></table></div>}
      <p className="mt-3 text-xs text-white/40">Roles and account status are changed by a Super Admin under Security & Roles.</p></div>
  );
}

/* ---------------- Security & roles ---------------- */
export function Security() {
  const users = useData(() => q(supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(300)) as Promise<Profile[]>);
  const roles = useData(() => q(supabase.from('roles').select('*')) as Promise<{ name: string; description: string; permissions: string[] }[]>);
  const logs = useData(() => q(supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(100)) as Promise<any[]>);
  const [msg, setMsg] = useState('');
  const upd = async (id: string, patch: object) => { const { error } = await supabase.from('profiles').update(patch).eq('id', id); setMsg(error ? error.message : 'Updated.'); users.reload(); };
  return (
    <div className="space-y-10"><h1 className="font-display text-3xl">Security & Roles</h1>{msg && <p role="status" className="rounded-xl bg-white/10 p-3 text-sm">{msg}</p>}
      <section><h2 className="mb-3 font-display text-xl">Role definitions</h2><div className="grid gap-3 md:grid-cols-3">{roles.data?.map((r) => <div key={r.name} className="glass rounded-2xl p-4"><p className="font-semibold text-gold-300">{r.name}</p><p className="text-xs text-white/60">{r.description}</p></div>)}</div></section>
      <section><h2 className="mb-3 font-display text-xl">Assign roles <span className="text-xs font-normal text-white/50">(Super Admin only; enforced by the database)</span></h2>
        <div className="glass overflow-x-auto rounded-2xl"><table className="w-full text-left text-sm"><tbody>{users.data?.map((u) => <tr key={u.id} className="border-b border-white/5"><td className="px-4 py-3">{u.full_name}<br /><span className="text-xs text-white/50">{u.email}</span></td>
          <td className="px-4 py-3"><select aria-label={`Role for ${u.full_name}`} className="input !py-1.5 text-xs" value={u.role} onChange={(e) => upd(u.id, { role: e.target.value })}>{roles.data?.map((r) => <option key={r.name}>{r.name}</option>)}</select></td>
          <td className="px-4 py-3"><button onClick={() => upd(u.id, { is_active: !u.is_active })} className="btn-glass !py-1.5 text-xs">{u.is_active ? 'Disable account' : 'Enable account'}</button></td></tr>)}</tbody></table></div></section>
      <section><h2 className="mb-3 font-display text-xl">Audit log</h2><div className="glass max-h-96 overflow-auto rounded-2xl"><table className="w-full text-left text-xs"><tbody>{logs.data?.map((l) => <tr key={l.id} className="border-b border-white/5"><td className="px-4 py-2 text-white/50">{new Date(l.created_at).toLocaleString()}</td><td className="px-4 py-2">{l.actor_email}</td><td className="px-4 py-2"><span className="badge bg-white/10">{l.action}</span> {l.table_name}</td><td className="px-4 py-2 text-white/60">{l.details?.label}</td></tr>)}{!logs.data?.length && <tr><td className="px-4 py-6 text-center text-white/50">No activity yet.</td></tr>}</tbody></table></div></section>
    </div>
  );
}

/* ---------------- Settings ---------------- */
export function SettingsPage() {
  const { data, loading, reload } = useData(() => q(supabase.from('homepage_content').select('*').eq('key', 'site_settings').maybeSingle()) as Promise<{ id: string; data: Record<string, any> } | null>);
  const [f, setF] = useState<Record<string, any> | null>(null); const [msg, setMsg] = useState('');
  const cur = f ?? data?.data ?? {};
  async function save(e: FormEvent) {
    e.preventDefault();
    const payload = { key: 'site_settings', title: 'Site settings', data: cur, is_published: false };
    const { error } = data ? await supabase.from('homepage_content').update({ data: cur }).eq('id', data.id) : await supabase.from('homepage_content').insert(payload);
    setMsg(error ? error.message : 'Settings saved.'); reload();
  }
  if (loading) return <Spinner />;
  return (
    <div className="max-w-2xl"><h1 className="mb-6 font-display text-3xl">Settings</h1>
      <form onSubmit={save} className="glass-strong space-y-4 rounded-3xl p-6">
        {[['site_name', 'Site name'], ['contact_email', 'Public contact email'], ['currency', 'Default currency'], ['default_cancellation_hours', 'Default cancellation window (hours)']].map(([k, l]) => (
          <label key={k} className="block"><span className="label">{l}</span><input className="input" value={cur[k] ?? ''} onChange={(e) => setF({ ...cur, [k]: e.target.value })} /></label>))}
        <button className="btn-gold">Save settings</button>{msg && <p role="status" className="text-sm">{msg}</p>}
        <p className="text-xs text-white/40">Per-attraction cancellation windows, prices and capacity are set in Tourist Attractions.</p></form></div>
  );
}

/* ---------------- Reports ---------------- */
export function Reports() {
  const { data, loading } = useData(() => q(supabase.from('bookings').select('*, attractions(name)').order('created_at', { ascending: false }).limit(2000)) as Promise<Booking[]>);
  if (loading) return <Spinner />;
  const rows = data ?? [];
  const by = (fn: (b: Booking) => string) => Object.entries(rows.reduce<Record<string, number>>((m, b) => { const k = fn(b); m[k] = (m[k] ?? 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
  const csv = () => {
    const head = ['reference', 'guest', 'email', 'attraction', 'date', 'visitors', 'total', 'currency', 'status'];
    const lines = rows.map((b) => [b.reference, b.full_name, b.email, b.attractions?.name, b.booking_date, b.visitors, b.total_amount, b.currency, b.status].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bookings.csv'; a.click();
  };
  const Bars = ({ items }: { items: [string, number][] }) => { const max = Math.max(1, ...items.map((i) => i[1])); return <div className="space-y-2">{items.slice(0, 8).map(([k, v]) => <div key={k}><div className="flex justify-between text-xs"><span>{k}</span><span>{v}</span></div><div className="h-2 rounded bg-white/10"><div className="h-2 rounded bg-gradient-to-r from-rwblue-500 to-gold-400" style={{ width: `${(v / max) * 100}%` }} /></div></div>)}{!items.length && <p className="text-sm text-white/50">No data yet.</p>}</div>; };
  return (
    <div><div className="mb-6 flex items-center justify-between"><h1 className="font-display text-3xl">Reports & Analytics</h1><button onClick={csv} className="btn-gold"><Download className="h-4 w-4" /> Export CSV</button></div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass rounded-2xl p-5"><p className="mb-3 font-semibold">By status</p><Bars items={by((b) => b.status)} /></div>
        <div className="glass rounded-2xl p-5"><p className="mb-3 font-semibold">Top attractions</p><Bars items={by((b) => b.attractions?.name ?? '?')} /></div>
        <div className="glass rounded-2xl p-5"><p className="mb-3 font-semibold">By nationality</p><Bars items={by((b) => b.nationality || 'Unknown')} /></div>
        <div className="glass rounded-2xl p-5 md:col-span-3"><p className="mb-3 font-semibold">Bookings by month</p><Bars items={by((b) => b.booking_date.slice(0, 7))} /></div></div></div>
  );
}
