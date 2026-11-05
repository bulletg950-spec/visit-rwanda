import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronDown, Pause, Play, Volume2, VolumeX, MapPin, Star, Quote, Compass, TreePine, Waves, Landmark, Mountain, Hotel, Globe2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Attraction, CATEGORY_LABEL, Destination, Pkg, Product, Review } from '../lib/types';
import { money, q, useData } from '../lib/utils';
import { Empty, Img, Reveal, Spinner, Stars, Tilt } from '../components/ui';
import { Newsletter } from '../components/Layout';

const WORDS = ['Discover Rwanda.', 'Explore Rwanda.', 'Experience Rwanda.', 'Feel Rwanda.', 'Love Rwanda.'];

function Hero() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const vid = useRef<HTMLVideoElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, 180]);
  const { data: video } = useData(async () => {
    const r = await q(supabase.from('website_videos').select('video_url,poster_url,title').eq('kind', 'homepage').eq('is_published', true)
      .order('is_featured', { ascending: false }).order('created_at', { ascending: false }).limit(1));
    return (r as { video_url: string; poster_url: string | null; title: string }[])[0] ?? null;
  });
  useEffect(() => { const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2600); return () => clearInterval(t); }, []);
  const toggle = () => { const v = vid.current; if (!v) return; if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); } };
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden" aria-label="Welcome">
      <motion.div style={{ y }} className="absolute inset-0 -top-20 -bottom-20">
        {video ? (
          <video ref={vid} key={video.video_url} className="h-full w-full object-cover" src={video.video_url} poster={video.poster_url ?? undefined} autoPlay muted={muted} loop playsInline preload="metadata" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_20%_20%,#2a6e50,transparent_50%),radial-gradient(ellipse_at_80%_30%,#00668f,transparent_50%),linear-gradient(#0a261b,#06170f)]" />
        )}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-forest-950" />
      <div className="relative z-10 mx-auto max-w-5xl px-5 text-center">
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="eyebrow mb-5">Welcome to</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.9 }} className="font-display text-5xl font-bold leading-[1.05] sm:text-7xl lg:text-8xl">
          RWANDA <span className="mt-2 block text-3xl font-medium italic text-gradient sm:text-5xl lg:text-6xl">The Land of a Thousand Hills</span>
        </motion.h1>
        <div className="mt-8 h-10 overflow-hidden text-2xl font-light text-white/90 sm:text-3xl" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.span key={i} className="block" initial={{ y: 36, opacity: 0, filter: 'blur(6px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} exit={{ y: -36, opacity: 0, filter: 'blur(6px)' }} transition={{ duration: 0.55 }}>{WORDS[i]}</motion.span>
          </AnimatePresence>
        </div>
        <p className="mt-3 text-sm uppercase tracking-[0.4em] text-white/70">Discover. Explore. Experience.</p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/destinations" className="btn-gold px-8 py-4">Explore Destinations <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/destinations" className="btn-glass px-8 py-4">Book Your Experience</Link>
        </motion.div>
      </div>
      {video && (
        <div className="absolute bottom-8 right-5 z-10 flex gap-2 sm:right-10">
          <button onClick={toggle} aria-label={playing ? 'Pause video' : 'Play video'} className="glass rounded-full p-3">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
          <button onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute video' : 'Mute video'} className="glass rounded-full p-3">{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
        </div>
      )}
      <ChevronDown className="absolute bottom-8 left-1/2 z-10 h-6 w-6 -translate-x-1/2 animate-float text-white/70" aria-hidden />
    </section>
  );
}

function Heading({ eyebrow, title, to, cta = 'View all' }: { eyebrow: string; title: string; to?: string; cta?: string }) {
  return (
    <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow mb-3">{eyebrow}</p><h2 className="h2 max-w-2xl">{title}</h2></div>
      {to && <Link to={to} className="btn-glass">{cta} <ArrowRight className="h-4 w-4" /></Link>}
    </Reveal>
  );
}

export function AttractionCard({ a }: { a: Attraction }) {
  return (
    <Tilt className="h-full">
      <Link to={`/destinations/${a.slug}`} className="group glass liquid relative block h-full overflow-hidden rounded-3xl">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Img src={a.main_image_url} alt={a.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 to-transparent" />
          <span className="badge glass absolute left-3 top-3">{CATEGORY_LABEL[a.category] ?? a.category}</span>
          {a.verification_status === 'verified' && <span className="badge absolute right-3 top-3 bg-emerald-400/90 text-forest-950">Verified</span>}
        </div>
        <div className="p-5">
          <h3 className="font-display text-xl font-medium">{a.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-white/60"><MapPin className="h-3 w-3" /> {[a.district, a.province && `${a.province}`].filter(Boolean).join(', ') || 'Rwanda'}</p>
          <p className="mt-3 line-clamp-2 text-sm text-white/70">{a.short_description}</p>
        </div>
      </Link>
    </Tilt>
  );
}

function CategoryRail({ eyebrow, title, cats, icon: Icon }: { eyebrow: string; title: string; cats: string[]; icon: typeof Compass }) {
  const { data, loading } = useData(() => q(supabase.from('attractions').select('*').in('category', cats).eq('is_published', true).order('is_featured', { ascending: false }).limit(4)) as Promise<Attraction[]>, [cats.join()]);
  return (
    <section className="section" aria-label={title}>
      <Heading eyebrow={eyebrow} title={title} to={`/destinations?category=${cats[0]}`} />
      {loading ? <Spinner /> : !data?.length ? <Empty><Icon className="mx-auto mb-2 h-6 w-6" />Experiences coming soon.</Empty> : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{data.map((a, i) => <Reveal key={a.id} delay={i * 0.08}><AttractionCard a={a} /></Reveal>)}</div>
      )}
    </section>
  );
}

function Testimonials() {
  const { data } = useData(() => q(supabase.from('reviews').select('*').eq('is_approved', true).eq('is_featured', true).limit(6)) as Promise<Review[]>);
  const items = data ?? [];
  return (
    <section className="section" aria-label="Testimonials">
      <Heading eyebrow="Traveller stories" title="Loved by visitors from around the world" />
      {!items.length ? <Empty>Be the first to share your Rwanda story after your visit.</Empty> : (
        <div className="grid gap-6 md:grid-cols-3">{items.map((r, i) => (
          <Reveal key={r.id} delay={i * 0.1}><figure className="glass liquid h-full rounded-3xl p-7">
            <Quote className="h-8 w-8 text-gold-400" aria-hidden /><Stars value={r.rating} />
            <blockquote className="mt-3 text-white/85">{r.comment}</blockquote>
            <figcaption className="mt-5 text-sm font-semibold text-gold-300">{r.reviewer_name ?? 'Traveller'}</figcaption></figure></Reveal>))}
        </div>)}
    </section>
  );
}

export default function Home() {
  const dest = useData(() => q(supabase.from('destinations').select('*').eq('is_published', true).order('display_order')) as Promise<Destination[]>);
  const pop = useData(() => q(supabase.from('attractions').select('*').eq('is_published', true).eq('is_featured', true).limit(6)) as Promise<Attraction[]>);
  const hotels = useData(() => q(supabase.from('tourism_products').select('*').eq('product_type', 'accommodation').eq('is_published', true).limit(3)) as Promise<Product[]>);
  const pkgs = useData(() => q(supabase.from('tourism_packages').select('*').eq('is_published', true).order('is_featured', { ascending: false }).limit(3)) as Promise<Pkg[]>);
  const gallery = useData(() => q(supabase.from('attraction_images').select('id,url,alt_text').eq('is_published', true).order('created_at', { ascending: false }).limit(8)) as Promise<{ id: string; url: string; alt_text: string | null }[]>);
  const vids = useData(() => q(supabase.from('website_videos').select('id,title,video_url,poster_url').in('kind', ['gallery', 'destination']).eq('is_published', true).order('is_featured', { ascending: false }).limit(3)) as Promise<{ id: string; title: string; video_url: string; poster_url: string | null }[]>);
  const content = useData(() => q(supabase.from('homepage_content').select('*').in('key', ['intro', 'travel_info'])) as Promise<{ key: string; title: string; body: string; data: { items?: { t: string; d: string }[] } }[]>);
  const intro = content.data?.find((c) => c.key === 'intro');
  const travel = content.data?.find((c) => c.key === 'travel_info');

  return (
    <>
      <Hero />
      <section className="section" aria-label="Introduction">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal><p className="eyebrow mb-3">Welcome</p><h2 className="h2">{intro?.title ?? 'The Land of a Thousand Hills'}</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/75">{intro?.body ?? 'Rwanda is a green, welcoming country of volcanoes, lakes and rainforest.'}</p>
            <Link to="/about" className="btn-glass mt-8">More about Rwanda <ArrowRight className="h-4 w-4" /></Link></Reveal>
          <Reveal delay={0.15} className="grid grid-cols-2 gap-4">
            {[[TreePine, 'Parks', '4 National Parks'], [Mountain, 'Volcanoes', 'Virunga range'], [Waves, 'Lakes', 'Lake Kivu & more'], [Landmark, 'Culture', 'Living heritage']].map(([Icon, t, d], i) => {
              const I = Icon as typeof Compass; return (
              <div key={i} className="glass liquid animate-float rounded-3xl p-6" style={{ animationDelay: `${i * 0.7}s` }}><I className="mb-3 h-7 w-7 text-gold-400" aria-hidden /><p className="font-display text-lg">{t as string}</p><p className="text-xs text-white/60">{d as string}</p></div>); })}
          </Reveal>
        </div>
      </section>

      <section className="section" aria-label="Featured destinations">
        <Heading eyebrow="Featured destinations" title="Five provinces, endless discoveries" to="/destinations" />
        {dest.loading ? <Spinner /> : !dest.data?.length ? <Empty>No destinations published yet.</Empty> : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{dest.data.map((d, i) => (
            <Reveal key={d.id} delay={i * 0.08}><Tilt><Link to={`/destinations?province=${encodeURIComponent(d.province ?? '')}`} className="group glass liquid relative block aspect-[4/5] overflow-hidden rounded-3xl">
              <Img src={d.hero_image_url} alt={d.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6"><h3 className="font-display text-2xl">{d.name}</h3><p className="mt-1 text-sm text-white/70">{d.tagline}</p></div></Link></Tilt></Reveal>))}</div>)}
      </section>

      <section className="section" aria-label="Popular attractions">
        <Heading eyebrow="Popular attractions" title="Rwanda's most loved places" to="/destinations" />
        {pop.loading ? <Spinner /> : !pop.data?.length ? <Empty>No featured attractions yet.</Empty> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{pop.data.map((a, i) => <Reveal key={a.id} delay={i * 0.08}><AttractionCard a={a} /></Reveal>)}</div>)}
      </section>

      <CategoryRail eyebrow="Wildlife" title="Discover Rwanda's wildlife" cats={['national_park', 'wildlife']} icon={TreePine} />
      <CategoryRail eyebrow="Adventure" title="Adventure experiences" cats={['adventure', 'mountain']} icon={Mountain} />
      <CategoryRail eyebrow="Culture" title="Cultural experiences" cats={['cultural', 'museum', 'historical']} icon={Landmark} />
      <CategoryRail eyebrow="Landscapes" title="Beautiful lakes and landscapes" cats={['lake', 'landscape']} icon={Waves} />

      <section className="section" aria-label="Accommodation">
        <Heading eyebrow="Stay" title="Featured hotels & accommodation" />
        {!hotels.data?.length ? <Empty><Hotel className="mx-auto mb-2 h-6 w-6" />Partner accommodation coming soon.</Empty> : (
          <div className="grid gap-6 md:grid-cols-3">{hotels.data.map((h, i) => (
            <Reveal key={h.id} delay={i * 0.1}><div className="glass liquid overflow-hidden rounded-3xl"><Img src={h.image_url} alt={h.name} className="aspect-video w-full object-cover" />
              <div className="p-5"><h3 className="font-display text-xl">{h.name}</h3><p className="mt-2 line-clamp-2 text-sm text-white/70">{h.description}</p>
                <p className="mt-3 flex items-center justify-between text-sm"><span className="text-gold-300">{money(h.price, h.currency)}</span>{h.is_demo && <span className="badge bg-white/15">Demo</span>}</p></div></div></Reveal>))}</div>)}
      </section>

      <section className="section" aria-label="Packages">
        <Heading eyebrow="Packages" title="Popular tourism packages" to="/packages" />
        {!pkgs.data?.length ? <Empty>Packages coming soon.</Empty> : (
          <div className="grid gap-6 md:grid-cols-3">{pkgs.data.map((p, i) => <Reveal key={p.id} delay={i * 0.1}><PackageCard p={p} /></Reveal>)}</div>)}
      </section>

      <section className="section" aria-label="Gallery">
        <Heading eyebrow="Gallery" title="Rwanda through the lens" />
        {!gallery.data?.length && !vids.data?.length ? <Empty>Photos and videos will appear here once published.</Empty> : (
          <>
            <div className="columns-2 gap-4 md:columns-4">{gallery.data?.map((g, i) => (
              <Reveal key={g.id} delay={(i % 4) * 0.05} className="mb-4"><div className="overflow-hidden rounded-2xl"><Img src={g.url} alt={g.alt_text ?? 'Rwanda photograph'} className="w-full transition duration-700 hover:scale-110" /></div></Reveal>))}</div>
            {!!vids.data?.length && <div className="mt-8 grid gap-4 md:grid-cols-3">{vids.data.map((v) => (
              <figure key={v.id} className="glass overflow-hidden rounded-2xl"><video controls preload="none" poster={v.poster_url ?? undefined} src={v.video_url} className="aspect-video w-full bg-black" /><figcaption className="p-3 text-sm">{v.title}</figcaption></figure>))}</div>}
          </>)}
      </section>

      <Testimonials />

      <section className="section" aria-label="Travel information">
        <Heading eyebrow="Plan your trip" title="Travel information" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(travel?.data?.items ?? []).map((it, i) => (
          <Reveal key={it.t} delay={i * 0.07}><div className="glass liquid h-full rounded-3xl p-6"><Globe2 className="mb-3 h-6 w-6 text-rwblue-300" aria-hidden /><p className="font-display text-lg">{it.t}</p><p className="mt-1 text-sm text-white/70">{it.d}</p></div></Reveal>))}</div>
        {travel?.body && <p className="mt-6 text-sm text-white/50">{travel.body}</p>}
      </section>

      <section className="section" aria-label="Newsletter">
        <Reveal><div className="glass-strong liquid relative overflow-hidden rounded-[2rem] p-10 text-center sm:p-16">
          <Star className="mx-auto mb-4 h-8 w-8 text-gold-400" aria-hidden /><h2 className="h2">Get Rwanda in your inbox</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">Travel inspiration, new experiences and seasonal tips. No spam.</p>
          <div className="mt-8 flex justify-center pb-6"><Newsletter /></div></div></Reveal>
      </section>
    </>
  );
}

export function PackageCard({ p }: { p: Pkg }) {
  return (
    <Tilt className="h-full"><div className="glass liquid flex h-full flex-col overflow-hidden rounded-3xl">
      <Img src={p.image_url} alt={p.title} className="aspect-video w-full object-cover" />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-2"><h3 className="font-display text-xl">{p.title}</h3>{p.is_demo && <span className="badge bg-white/15">Demo</span>}</div>
        <p className="mt-2 text-sm text-white/70">{p.description}</p>
        {!!p.includes?.length && <ul className="mt-3 flex flex-wrap gap-1.5">{p.includes.map((x) => <li key={x} className="badge bg-white/10">{x}</li>)}</ul>}
        <div className="mt-auto flex items-center justify-between pt-5"><span className="text-sm text-white/60">{p.duration_days ? `${p.duration_days} days` : ''}</span><span className="font-semibold text-gold-300">{p.price_per_person == null ? 'Price on request' : `${money(p.price_per_person, p.currency)} / person`}</span></div>
        {p.attraction_id ? null : <Link to="/contact" className="btn-gold mt-4">Enquire</Link>}
      </div></div></Tilt>
  );
}
