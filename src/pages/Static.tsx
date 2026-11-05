import { FormEvent, useState } from 'react';
import { Mail, MapPin, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Field, Reveal } from '../components/ui';

export function Contact() {
  const [f, setF] = useState({ name: '', email: '', subject: '', message: '' });
  const [s, setS] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  async function submit(e: FormEvent) {
    e.preventDefault(); setS('busy');
    const { error } = await supabase.from('contact_messages').insert(f);
    setS(error ? 'err' : 'ok'); if (!error) setF({ name: '', email: '', subject: '', message: '' });
  }
  return (
    <div className="section pt-36">
      <p className="eyebrow mb-3">Contact</p><h1 className="h2 mb-8">Plan your trip with us</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <form onSubmit={submit} className="glass-strong space-y-4 rounded-3xl p-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Name"><input required maxLength={120} className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Email"><input required type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field></div>
          <Field label="Subject"><input maxLength={200} className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Field>
          <Field label="Message"><textarea required maxLength={5000} className="input min-h-36" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
          <button className="btn-gold" disabled={s === 'busy'}><Send className="h-4 w-4" /> {s === 'busy' ? 'Sending…' : 'Send message'}</button>
          {s === 'ok' && <p role="status" className="text-emerald-300">Thank you! We'll reply soon.</p>}{s === 'err' && <p role="alert" className="text-red-300">Could not send. Please try again.</p>}
        </form>
        <div className="glass h-fit space-y-4 rounded-3xl p-6 text-sm text-white/80"><p className="flex gap-2"><MapPin className="h-4 w-4 text-gold-400" /> Kigali, Rwanda</p><p className="flex gap-2"><Mail className="h-4 w-4 text-gold-400" /> Use the form and our team will reply by email.</p></div>
      </div>
    </div>
  );
}

const PARKS = ['Volcanoes National Park', 'Akagera National Park', 'Nyungwe National Park', 'Gishwati-Mukura National Park'];
const SECTIONS: [string, string][] = [
  ['History', 'Rwanda was home to a centuries-old kingdom before colonial rule, and gained independence in 1962. The 1994 Genocide against the Tutsi devastated the nation; since then Rwanda has pursued reconciliation, unity and rebuilding, which visitors can learn about at memorials and museums.'],
  ['Geography', 'A landlocked country in East-Central Africa, Rwanda is known as the Land of a Thousand Hills. It features the Virunga volcanoes in the north-west, Lake Kivu on the western border, highland rainforest in the south-west and savannah plains in the east.'],
  ['Culture & traditions', 'Rwandan culture is shaped by music, intore dance, drumming, storytelling, imigongo art and the symbolic Inyambo cattle. Umuganda, monthly community work, reflects a strong spirit of solidarity.'],
  ['People & lifestyle', 'Rwandans are known for hospitality and community values. Agriculture remains central to rural life, while Kigali is a fast-growing, clean and safe modern capital.'],
  ['Languages', 'Kinyarwanda, English, French and Swahili are official or widely used languages. Kinyarwanda is spoken by nearly everyone.'],
  ['Climate & weather', 'Rwanda has a temperate tropical highland climate. Two rainy seasons (about March to May and October to November) alternate with two dry seasons (June to September and December to February), the best times for trekking and safaris.'],
  ['Economy & tourism', 'Tourism is among Rwanda\'s leading foreign-exchange earners, driven by gorilla trekking, conferences and events, and growing cultural and adventure travel.'],
  ['National parks', 'Rwanda has four national parks: Volcanoes, Akagera, Nyungwe and Gishwati-Mukura, each offering a distinct ecosystem and wildlife experience.'],
  ['Wildlife conservation', 'Conservation is a national priority: mountain gorilla numbers have grown, lions and rhinos have returned to Akagera, and communities benefit through tourism revenue sharing.'],
  ['Tourism development', 'Rwanda invests in infrastructure, hospitality training, sustainable tourism and new attractions to welcome more visitors while protecting nature and culture.'],
];

export function About() {
  const [park, setPark] = useState(PARKS[0]);
  return (
    <div className="section pt-36">
      <p className="eyebrow mb-3">About Rwanda</p><h1 className="h2 mb-3">A small country with a giant heart</h1>
      <p className="mb-12 max-w-2xl text-white/70">General background for travellers. Always confirm official entry, health and park requirements before you travel.</p>
      <div className="grid gap-6 md:grid-cols-2">{SECTIONS.map(([t, d], i) => <Reveal key={t} delay={(i % 2) * 0.08}><article className="glass liquid h-full rounded-3xl p-7"><h2 className="font-display text-2xl text-gold-300">{t}</h2><p className="mt-3 leading-relaxed text-white/80">{d}</p></article></Reveal>)}</div>
      <Reveal className="mt-14"><h2 className="mb-4 font-display text-3xl">Interactive map: national parks</h2>
        <div className="mb-4 flex flex-wrap gap-2">{PARKS.map((p) => <button key={p} onClick={() => setPark(p)} aria-pressed={park === p} className={`btn !py-2 ${park === p ? 'bg-gold-400 text-forest-950' : 'glass'}`}>{p}</button>)}</div>
        <div className="glass overflow-hidden rounded-3xl"><iframe title={`Map of ${park}`} loading="lazy" className="h-[420px] w-full border-0" src={`https://www.google.com/maps?q=${encodeURIComponent(park + ' Rwanda')}&output=embed`} /></div></Reveal>
    </div>
  );
}
