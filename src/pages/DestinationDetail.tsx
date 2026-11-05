import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { Accessibility, CalendarCheck, ChevronLeft, ChevronRight, Clock, ExternalLink, Globe, Mail, MapPin, Phone, Ticket, Timer, ShieldAlert, Sun, Hotel, Wrench, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Attraction, CATEGORY_LABEL, Pkg, Product, Review } from '../lib/types';
import { mapsEmbed, mapsLink, money, q, useData } from '../lib/utils';
import { Empty, ErrorBox, Img, Reveal, Spinner, Stars, VerifiedBadge } from '../components/ui';
import { AttractionCard } from './Home';

const Info = ({ icon: I, title, children }: { icon: typeof Clock; title: string; children?: React.ReactNode }) =>
  children ? <div className="glass liquid rounded-2xl p-5"><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-300"><I className="h-4 w-4" aria-hidden /> {title}</p><div className="text-sm leading-relaxed text-white/80">{children}</div></div> : null;
const Pending = <span className="text-white/50">Awaiting verification</span>;

function Carousel({ images }: { images: { id: string; url: string; alt_text: string | null }[] }) {
  const [i, setI] = useState(0);
  if (!images.length) return null;
  const go = (d: number) => setI((n) => (n + d + images.length) % images.length);
  return (
    <div className="glass relative overflow-hidden rounded-3xl" role="region" aria-roledescription="carousel" aria-label="Photo gallery">
      <AnimatePresence mode="wait"><motion.img key={images[i].id} src={images[i].url} alt={images[i].alt_text ?? 'Gallery photograph'} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="aspect-video w-full object-cover" /></AnimatePresence>
      {images.length > 1 && <>
        <button aria-label="Previous photo" onClick={() => go(-1)} className="glass absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2"><ChevronLeft /></button>
        <button aria-label="Next photo" onClick={() => go(1)} className="glass absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2"><ChevronRight /></button>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">{images.map((im, n) => <button key={im.id} aria-label={`Photo ${n + 1}`} onClick={() => setI(n)} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-6 bg-gold-400' : 'w-1.5 bg-white/60'}`} />)}</div></>}
    </div>
  );
}

function ReviewsBlock({ a, reviews, reload }: { a: Attraction; reviews: Review[]; reload: () => void }) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('reviews').insert({ attraction_id: a.id, user_id: user!.id, reviewer_name: profile?.full_name ?? 'Traveller', rating, title: title || null, comment: comment || null });
    if (error) setMsg({ ok: false, t: error.code === '23505' ? 'You already reviewed this attraction.' : error.message });
    else { setMsg({ ok: true, t: 'Thanks! Your review will appear after moderation.' }); setComment(''); setTitle(''); reload(); }
  }
  return (
    <section aria-label="Reviews" className="mt-16">
      <div className="mb-6 flex items-center gap-4"><h2 className="font-display text-3xl">Reviews & ratings</h2>{reviews.length > 0 && <span className="flex items-center gap-2"><Stars value={avg} size={18} /><span className="text-sm text-white/70">{avg.toFixed(1)} ({reviews.length})</span></span>}</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">{!reviews.length ? <Empty>No reviews yet.</Empty> : reviews.map((r) => (
          <div key={r.id} className="glass rounded-2xl p-5"><Stars value={r.rating} />{r.title && <p className="mt-2 font-semibold">{r.title}</p>}<p className="mt-1 text-sm text-white/80">{r.comment}</p><p className="mt-3 text-xs text-gold-300">{r.reviewer_name}</p></div>))}</div>
        <div className="glass rounded-2xl p-6">
          {user ? (
            <form onSubmit={submit} className="space-y-3"><p className="font-semibold">Write a review</p>
              <div role="radiogroup" aria-label="Rating" className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star`} onClick={() => setRating(n)}><Stars value={n <= rating ? 5 : 0} size={26} /></button>)}</div>
              <input className="input" placeholder="Title (optional)" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
              <textarea className="input min-h-28" required maxLength={2000} placeholder="Share your experience" value={comment} onChange={(e) => setComment(e.target.value)} />
              <button className="btn-gold">Submit review</button>{msg && <p role="status" className={`text-sm ${msg.ok ? 'text-emerald-300' : 'text-red-300'}`}>{msg.t}</p>}</form>
          ) : <p className="text-sm text-white/70"><Link className="text-gold-300 underline" to="/login">Sign in</Link> to leave a review.</p>}
        </div>
      </div>
    </section>
  );
}

export default function DestinationDetail() {
  const { slug } = useParams();
  const [open, setOpen] = useState<number | null>(0);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 120]);
  const { data, loading, error, reload } = useData(async () => {
    const a = (await q(supabase.from('attractions').select('*').eq('slug', slug!).eq('is_published', true).maybeSingle())) as Attraction | null;
    if (!a) return null;
    const [images, videos, products, packages, reviews, related] = await Promise.all([
      q(supabase.from('attraction_images').select('id,url,alt_text').eq('attraction_id', a.id).eq('is_published', true).order('display_order')),
      q(supabase.from('attraction_videos').select('id,title,video_url,poster_url').eq('attraction_id', a.id).eq('is_published', true).order('display_order')),
      q(supabase.from('tourism_products').select('*').eq('attraction_id', a.id).eq('is_published', true)),
      q(supabase.from('tourism_packages').select('*').eq('attraction_id', a.id).eq('is_published', true)),
      q(supabase.from('reviews').select('*').eq('attraction_id', a.id).eq('is_approved', true).order('created_at', { ascending: false })),
      q(supabase.from('attractions').select('*').eq('is_published', true).neq('id', a.id).or(`province.eq.${a.province},category.eq.${a.category}`).limit(3)),
    ]);
    return { a, images: images as any[], videos: videos as any[], products: products as Product[], packages: packages as Pkg[], reviews: reviews as Review[], related: related as Attraction[] };
  }, [slug]);

  if (loading) return <div className="pt-40"><Spinner /></div>;
  if (error) return <div className="section pt-40"><ErrorBox msg={error} /></div>;
  if (!data) return <div className="section pt-40"><Empty>Attraction not found. <Link className="text-gold-300 underline" to="/destinations">Back to destinations</Link></Empty></div>;
  const { a, images, videos, products, packages, reviews, related } = data;
  document.title = `${a.name} | Visit Rwanda`;

  return (
    <>
      <section className="relative flex min-h-[75vh] items-end overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0 -top-16 -bottom-16"><Img src={a.main_image_url} alt={a.name} className="h-full w-full object-cover" /></motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/50 to-black/30" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-14 sm:px-8">
          <div className="mb-4 flex flex-wrap items-center gap-2"><span className="badge glass">{CATEGORY_LABEL[a.category]}</span><VerifiedBadge status={a.verification_status} demo={a.is_demo} /></div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="font-display text-5xl font-bold sm:text-7xl">{a.name}</motion.h1>
          <p className="mt-3 flex items-center gap-2 text-white/80"><MapPin className="h-4 w-4" /> {[a.sector, a.district, a.province].filter(Boolean).join(', ') || 'Rwanda'}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Reveal><h2 className="font-display text-3xl">About this place</h2><p className="mt-4 whitespace-pre-line leading-relaxed text-white/80">{a.description ?? a.short_description}</p></Reveal>
            <Carousel images={images} />
            {videos.length > 0 && <div className="grid gap-4 md:grid-cols-2">{videos.map((v) => <figure key={v.id} className="glass overflow-hidden rounded-2xl"><video controls preload="none" poster={v.poster_url ?? undefined} src={v.video_url} className="aspect-video w-full bg-black" /><figcaption className="p-3 text-sm">{v.title}</figcaption></figure>)}</div>}
            {a.activities.length > 0 && <Reveal><h3 className="mb-3 font-display text-2xl">Activities</h3><ul className="flex flex-wrap gap-2">{a.activities.map((x) => <li key={x} className="badge glass !px-4 !py-2 !text-sm">{x}</li>)}</ul></Reveal>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Info icon={Clock} title="Opening hours">{a.opening_hours || Pending}</Info>
              <Info icon={Ticket} title="Entrance fees">{a.entrance_fee_info || Pending}{a.entrance_fee_amount != null && <p className="mt-1 font-semibold text-gold-300">{money(a.entrance_fee_amount, a.currency)}</p>}</Info>
              <Info icon={Sun} title="Best time to visit">{a.best_time_to_visit || Pending}</Info>
              <Info icon={Timer} title="Visit duration">{a.visit_duration || Pending}</Info>
              <Info icon={Hotel} title="Accommodation">{a.accommodation_info || Pending}</Info>
              <Info icon={Wrench} title="Facilities">{a.facilities.length ? a.facilities.join(' · ') : Pending}</Info>
              <Info icon={Accessibility} title="Accessibility">{a.accessibility_info || Pending}</Info>
              <Info icon={ShieldAlert} title="Safety">{a.safety_info || Pending}</Info>
            </div>
            {a.faqs?.length > 0 && <Reveal><h3 className="mb-3 font-display text-2xl">Frequently asked questions</h3><div className="space-y-2">{a.faqs.map((f, i) => (
              <div key={i} className="glass rounded-2xl"><button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between p-4 text-left font-medium">{f.q}{open === i ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button>{open === i && <p className="px-4 pb-4 text-sm text-white/75">{f.a}</p>}</div>))}</div></Reveal>}
            {(products.length > 0 || packages.length > 0) && <Reveal><h3 className="mb-3 font-display text-2xl">Experiences & packages</h3><div className="grid gap-4 sm:grid-cols-2">
              {products.map((p) => <div key={p.id} className="glass rounded-2xl p-5"><p className="font-semibold">{p.name}</p><p className="mt-1 text-sm text-white/70">{p.description}</p><p className="mt-3 text-gold-300">{money(p.price, p.currency)}</p></div>)}
              {packages.map((p) => <div key={p.id} className="glass rounded-2xl p-5"><p className="font-semibold">{p.title}</p><p className="mt-1 text-sm text-white/70">{p.description}</p><p className="mt-3 text-gold-300">{p.price_per_person == null ? 'Price on request' : `${money(p.price_per_person, p.currency)} / person`}</p></div>)}</div></Reveal>}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="glass overflow-hidden rounded-3xl">
              <iframe title={`Map of ${a.name}`} src={mapsEmbed(a)} loading="lazy" className="h-64 w-full border-0" referrerPolicy="no-referrer-when-downgrade" />
              <div className="space-y-2 p-5 text-sm">
                {a.exact_location && <p className="text-white/80">{a.exact_location}</p>}
                {a.latitude != null && <p className="text-xs text-white/50">GPS: {a.latitude}, {a.longitude}</p>}
                <a href={mapsLink(a)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold-300 underline">Open in Google Maps <ExternalLink className="h-3 w-3" /></a>
              </div>
            </div>
            <div className="glass space-y-3 rounded-3xl p-5 text-sm">
              <p className="font-display text-lg">Contact</p>
              {a.contact_phone ? <a className="flex items-center gap-2 hover:text-gold-300" href={`tel:${a.contact_phone}`}><Phone className="h-4 w-4" />{a.contact_phone}</a> : <p className="flex items-center gap-2 text-white/50"><Phone className="h-4 w-4" /> Phone awaiting verification</p>}
              {a.contact_email ? <a className="flex items-center gap-2 hover:text-gold-300" href={`mailto:${a.contact_email}`}><Mail className="h-4 w-4" />{a.contact_email}</a> : <p className="flex items-center gap-2 text-white/50"><Mail className="h-4 w-4" /> Email awaiting verification</p>}
              {a.website_url ? <a className="flex items-center gap-2 hover:text-gold-300" href={a.website_url} target="_blank" rel="noreferrer noopener"><Globe className="h-4 w-4" />Official website</a> : <p className="flex items-center gap-2 text-white/50"><Globe className="h-4 w-4" /> Website awaiting verification</p>}
            </div>
          </aside>
        </div>

        <ReviewsBlock a={a} reviews={reviews} reload={reload} />

        {related.length > 0 && <section className="mt-16" aria-label="Related attractions"><h2 className="mb-6 font-display text-3xl">You might also like</h2><div className="grid gap-6 md:grid-cols-3">{related.map((r) => <AttractionCard key={r.id} a={r} />)}</div></section>}
      </div>

      {a.booking_enabled && (
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
          <Link to={`/book/${a.slug}`} className="glass-strong liquid inline-flex items-center gap-2 rounded-full border-gold-400/60 px-8 py-4 font-semibold text-gold-300 shadow-[0_0_40px_rgba(201,162,75,.35)] transition hover:scale-105"><CalendarCheck className="h-5 w-5" /> BOOK NOW</Link>
        </motion.div>
      )}
    </>
  );
}
