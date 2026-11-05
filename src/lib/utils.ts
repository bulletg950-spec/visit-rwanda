import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export const slugify = (s: string) => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const money = (n: number | null | undefined, cur = 'USD') => (n == null ? 'Price to be confirmed' : new Intl.NumberFormat('en', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n));
export const fmtDate = (d: string) => new Date(d).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
export const todayISO = () => new Date().toISOString().slice(0, 10);

export function mapsEmbed(a: { latitude: number | null; longitude: number | null; name: string; district?: string | null }) {
  const q = a.latitude != null && a.longitude != null ? `${a.latitude},${a.longitude}` : encodeURIComponent(`${a.name} ${a.district ?? ''} Rwanda`);
  return `https://www.google.com/maps?q=${q}&output=embed`;
}
export function mapsLink(a: { latitude: number | null; longitude: number | null; name: string; google_maps_url?: string | null }) {
  if (a.google_maps_url) return a.google_maps_url;
  return a.latitude != null ? `https://www.google.com/maps?q=${a.latitude},${a.longitude}` : `https://www.google.com/maps/search/${encodeURIComponent(a.name + ' Rwanda')}`;
}

/** Tiny data hook: runs an async loader, returns data/loading/error + reload. */
export function useData<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    loader().then((d) => { if (live) { setData(d); setError(null); } })
      .catch((e) => { if (live) setError(e?.message ?? 'Something went wrong'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, loading, error, reload: () => setTick((t) => t + 1) };
}

export async function q<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

export async function uploadFile(bucket: 'media' | 'avatars', file: File, folder: string) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
