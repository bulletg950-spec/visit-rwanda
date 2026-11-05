import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Sends the booking confirmation email. The caller's JWT is used so RLS guarantees
// users can only trigger emails for their OWN bookings. Secrets stay server-side.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const { reference } = (req.body || {}) as { reference?: string };
  if (!token || !reference) return res.status(400).json({ error: 'Missing token or reference' });

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) return res.status(500).json({ error: 'Server not configured' });

  const supabase = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: b, error } = await supabase
    .from('bookings')
    .select('reference,full_name,email,booking_date,preferred_time,visitors,total_amount,currency,status,attractions(name)')
    .eq('reference', reference)
    .maybeSingle();
  if (error || !b) return res.status(404).json({ error: 'Booking not found' });

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(202).json({ skipped: 'RESEND_API_KEY not set; email not sent' });

  const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
  const attraction = (b as any).attractions?.name ?? 'your experience';
  const total = Number(b.total_amount) > 0 ? `${b.currency} ${Number(b.total_amount).toFixed(2)}` : 'To be confirmed by our team';
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#15181a">
    <h2 style="color:#154633">Your Visit Rwanda booking request</h2>
    <p>Hello ${esc(b.full_name)}, thank you! We received your booking for <b>${esc(attraction)}</b>.</p>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td>Reference</td><td><b>${esc(b.reference)}</b></td></tr>
      <tr><td>Date</td><td>${esc(b.booking_date)} ${esc(b.preferred_time ?? '')}</td></tr>
      <tr><td>Visitors</td><td>${esc(b.visitors)}</td></tr>
      <tr><td>Total</td><td>${esc(total)}</td></tr>
      <tr><td>Status</td><td>${esc(b.status)}</td></tr>
    </table>
    <p>You can view or cancel your booking anytime from <b>My Bookings</b>.</p></div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Visit Rwanda <onboarding@resend.dev>', to: [b.email], subject: `Booking ${b.reference} received`, html }),
  });
  if (!r.ok) return res.status(502).json({ error: 'Email provider error' });
  return res.status(200).json({ sent: true });
}
