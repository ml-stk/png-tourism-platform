import { useEffect, useState } from 'react';
import { ArrowUpRight, Image as ImageIcon, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import { destinations as fallback } from '../data';

type Destination = { id: string; slug: string; name: string; provinceCode: string; description?: string; contentVersion: number; updatedAt: string; freshness: 'fresh' | 'stale'; media: Array<{ id: string; publicUrl?: string; altText: string; caption?: string }>; qrPath: string; offlineCacheKey: string };
const API_BASE = 'https://png-tourism-platform-api.onrender.com';
const destinationGuideUrls: Record<string, string> = {
  'kokoda-track': 'https://papuanewguinea.travel/trekking/kokoda-trail/',
  'milne-bay': 'https://papuanewguinea.travel/milne-bay-province/',
  rabaul: 'https://papuanewguinea.travel/east-new-britain-province/',
  'sepik-river': 'https://papuanewguinea.travel/natural-landmarks/sepik-river/',
  'western-highlands': 'https://papuanewguinea.travel/western-highlands-province/',
};
const fallbackMedia: Record<string, string> = {
  'kokoda-track': 'https://commons.wikimedia.org/wiki/Special:FilePath/OwenStanleyRangeOwersCornerView.jpg',
  'milne-bay': 'https://www.divediscovery.com/images/kenu_kundu_festival_4.jpg',
  rabaul: 'https://img.rezdy.com/PRODUCT_IMAGE/13699/national-mask-festival-rabaul-papua-new-guinea.jpg',
  'sepik-river': 'https://papuanewguinea.travel/wp-content/uploads/2026/01/Life-along-the-Sepik-River-at-dusk-1-768x576.jpg',
  'western-highlands': 'https://peakvisor.com/photo/SD/Papua-New-Guinea-mount-hagen-august-1463442698.jpg',
};
function withFallbackMedia(d: Destination): Destination { if (d.media?.length || !fallbackMedia[d.slug]) return d; return { ...d, media: [{ id: `fallback-${d.slug}`, publicUrl: fallbackMedia[d.slug], altText: `${d.name}, Papua New Guinea` }] }; }
function governedFallback(): Destination[] { return fallback.filter(d => d.status === 'Published').map(d => { const slug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'); return withFallbackMedia({ id: d.id, slug, name: d.name, provinceCode: d.province, description: d.description, contentVersion: 1, updatedAt: new Date().toISOString(), freshness: 'fresh', media: [], qrPath: `/destination/${d.name}`, offlineCacheKey: `destination:${d.id}:v1` }); }); }
export default function DestinationExplorer() {
  const [data, setData] = useState<Destination[]>([]); const [loading, setLoading] = useState(true); const [source, setSource] = useState<'live' | 'snapshot' | 'fallback'>('live');
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/public/destinations`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const payload = await response.json();
      const items = Array.isArray(payload?.data?.items) ? payload.data.items : Array.isArray(payload?.data) ? payload.data : [];
      if (!items.length) throw new Error('empty destination projection');
      setData(items.map(withFallbackMedia)); setSource('live');
    } catch {
      try {
        const response = await fetch('./destinations-live.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('snapshot unavailable');
        const payload = await response.json();
        const items = Array.isArray(payload?.data) ? payload.data : [];
        if (!items.length) throw new Error('empty snapshot');
        setData(items.map((d: any) => withFallbackMedia({ id: d.id, slug: d.slug ?? d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: d.name, provinceCode: d.provinceCode ?? d.province ?? '', description: d.description, contentVersion: d.contentVersion ?? 1, updatedAt: d.updatedAt ?? new Date().toISOString(), freshness: 'fresh', media: Array.isArray(d.media) ? d.media : [], qrPath: `/destination/${d.name}`, offlineCacheKey: `destination:${d.id}:v1` }))); setSource('snapshot');
      } catch { setData(governedFallback()); setSource('fallback'); }
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const guideFor = (d: Destination) => destinationGuideUrls[d.slug] || 'https://papuanewguinea.travel/where-to-go/';
  return <section className="rounded-[2rem] border border-white/10 bg-[#071b2a] p-5 text-white shadow-2xl sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="text-xs font-bold uppercase tracking-[.18em] text-[#8fd5c8]">Explore PNG</div><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Destinations, published and trusted.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Open the official destination guide for media, travel information, experiences and local tourism options.</p></div><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold hover:bg-white/10"><RefreshCw size={16}/> Refresh</button></div>{source === 'snapshot' && <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">Live tourism data is temporarily unavailable. Showing the last verified visitor-safe destination snapshot.</div>}{source === 'fallback' && <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">Live tourism data is temporarily unavailable. Showing the governed visitor-safe destination set.</div>}{loading ? <div className="mt-8 text-sm text-slate-300">Loading published destinations…</div> : data.length === 0 ? <div className="mt-8 rounded-2xl bg-white/5 p-8 text-center text-slate-300">No published destinations are available yet.</div> : <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.map(d => <article key={d.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.06]"><div className="aspect-[16/9] bg-gradient-to-br from-[#0b6477] to-[#071b2a]">{d.media[0]?.publicUrl ? <img src={d.media[0].publicUrl} alt={d.media[0].altText} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-white/30"><ImageIcon size={40}/></div>}</div><div className="p-5"><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1 text-xs font-bold text-[#8fd5c8]"><MapPin size={13}/>{d.provinceCode}</span><span className="text-[11px] font-semibold text-slate-400">v{d.contentVersion} · {d.freshness}</span></div><h3 className="mt-3 text-xl font-black">{d.name}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{d.description || 'Discover a published destination from Papua New Guinea.'}</p><div className="mt-5 flex items-center justify-between"><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400"><ShieldCheck size={14} className="text-[#f4b942]"/> Governed source</span><a href={guideFor(d)} className="inline-flex items-center gap-1 text-sm font-bold text-white hover:text-[#8fd5c8]">Explore destination <ArrowUpRight size={15}/></a></div></div></article>)}</div>}</section>;
}
