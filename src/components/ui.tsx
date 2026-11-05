import { ReactNode, useRef, useState, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, Clock, ImageOff } from 'lucide-react';
import { isConfigured } from '../lib/supabase';

export function Reveal({ children, delay = 0, className = '', y = 40 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/** 3D tilt on hover */
export function Tilt({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState({ x: 0, y: 0 });
  const move = (e: MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    setS({ x: ((e.clientX - r.left) / r.width - 0.5) * 10, y: ((e.clientY - r.top) / r.height - 0.5) * -10 });
  };
  return (
    <div style={{ perspective: 900 }} className={className}>
      <div ref={ref} onMouseMove={move} onMouseLeave={() => setS({ x: 0, y: 0 })} className="h-full transition-transform duration-200 ease-out will-change-transform"
        style={{ transform: `rotateX(${s.y}deg) rotateY(${s.x}deg)` }}>{children}</div>
    </div>
  );
}

export function Img({ src, alt, className = '' }: { src?: string | null; alt: string; className?: string }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) {
    return (
      <div role="img" aria-label={alt} className={`flex items-center justify-center bg-gradient-to-br from-forest-700 via-forest-800 to-rwblue-700 ${className}`}>
        <ImageOff className="h-8 w-8 text-white/30" aria-hidden />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setBad(true)} className={className} />;
}

export const Spinner = ({ label = 'Loading' }: { label?: string }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-white/70" role="status"><Loader2 className="h-5 w-5 animate-spin" /> {label}…</div>
);
export const ErrorBox = ({ msg }: { msg: string }) => <div role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">{msg}</div>;
export const Empty = ({ children }: { children: ReactNode }) => <div className="glass rounded-2xl p-8 text-center text-white/70">{children}</div>;

export function ConfigBanner() {
  if (isConfigured) return null;
  return <div className="fixed bottom-4 left-4 z-[70] max-w-sm rounded-xl border border-amber-300/50 bg-amber-500/20 p-3 text-xs text-amber-100 backdrop-blur">Supabase isn't configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README).</div>;
}

export function VerifiedBadge({ status, demo }: { status: string; demo?: boolean }) {
  return (
    <span className="flex gap-1.5">
      {status === 'verified'
        ? <span className="badge bg-emerald-400/20 text-emerald-200"><ShieldCheck className="h-3 w-3" /> Verified</span>
        : <span className="badge bg-amber-400/20 text-amber-200"><Clock className="h-3 w-3" /> Awaiting verification</span>}
      {demo && <span className="badge bg-white/15 text-white/80">Demo content</span>}
    </span>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return <span aria-label={`${value.toFixed(1)} out of 5`} className="inline-flex text-gold-400">{[1, 2, 3, 4, 5].map((i) => <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(value) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" /></svg>)}</span>;
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}{error && <span role="alert" className="mt-1 block text-xs text-red-300">{error}</span>}</label>;
}
