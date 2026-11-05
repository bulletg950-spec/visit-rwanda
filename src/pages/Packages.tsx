import { supabase } from '../lib/supabase';
import { Pkg } from '../lib/types';
import { q, useData } from '../lib/utils';
import { Empty, ErrorBox, Reveal, Spinner } from '../components/ui';
import { PackageCard } from './Home';

export default function Packages() {
  const { data, loading, error } = useData(() => q(supabase.from('tourism_packages').select('*').eq('is_published', true).order('is_featured', { ascending: false })) as Promise<Pkg[]>);
  return (
    <div className="section pt-36">
      <p className="eyebrow mb-3">Tourism packages</p><h1 className="h2 mb-10">Curated journeys across Rwanda</h1>
      {loading ? <Spinner /> : error ? <ErrorBox msg={error} /> : !data?.length ? <Empty>No packages published yet.</Empty> : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{data.map((p, i) => <Reveal key={p.id} delay={i * 0.06}><PackageCard p={p} /></Reveal>)}</div>)}
    </div>
  );
}
