import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, CheckCircle2, Compass, ExternalLink, Image as ImageIcon, Link2, MapPin, Plus, ShieldCheck, WifiOff } from 'lucide-react';

type Media = { id: string; publicUrl?: string; altText: string; caption?: string };
type Destination = { id: string; slug: string; name: string; provinceCode: string; description?: string; contentVersion: number; updatedAt: string; freshness: 'fresh' | 'stale'; media: Media[]; qrPath: string; offlineCacheKey: string; latitude?: number; longitude?: number };
type Props = { destinationId: string; onBack: () => void };

const itineraryKey = 'png-tourism:visitor-destination-itinerary:v1';
const passportKey = 'png-tourism:visitor-destination-passport:v1';

function load(key: string): string[] { try { return JSON.parse(localStorage.getItem(key) || '[]') as string[]; } catch { return []; } }
function emit(destination: Destination, eventType: string) {
  if (!navigator.onLine) return;
  void fetch('/api/v1/visitor/engagement', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventType, source: 'web', destinationId: destination.id, provinceCode: destination.provinceCode, metadata: { contentVersion: destination.contentVersion } }) }).catch(() => undefined);
}

export default function DestinationDetail({ destinationId, onBack }: Props) {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [saved, setSaved] = useState(() => load(itineraryKey));
  const [visited, setVisited] = useState(() => load(passportKey));
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let alive = true;
    fetch(`/api/v1/public/destinations/${encodeURIComponent(destinationId)}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(x => { if (alive) { setDestination(x.data); emit(x.data, 'experience_view'); } })
      .catch(() => setOffline(true))
      .finally(() => alive && setLoading(false));
    const on = () => setOffline(false); const off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { alive = false; window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [destinationId]);

  useEffect(() => localStorage.setItem(itineraryKey, JSON.stringify(saved)), [saved]);
  useEffect(() => localStorage.setItem(passportKey, JSON.stringify(visited)), [visited]);

  const inTrip = useMemo(() => saved.includes(destinationId), [saved, destinationId]);
  const hasVisited = useMemo(() => visited.includes(destinationId), [visited, destinationId]);

  if (loading) return <section className="rounded-[2rem] bg-[#071b2a] p-8 text-white">Loading published destination…</section>;
  if (!destination) return <section className="rounded-[2rem] border border-white/10 bg-[#071b2a] p-8 text-white"><button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={16}/> Back to destinations</button><h2 className="text-2xl font-black">Destination unavailable</h2><p className="mt-2 text-slate-300">This destination is not available in the governed public projection. Unpublished content is never shown here.</p></section>;

  const addToTrip = () => { if (!inTrip) { setSaved(current => [...current, destinationId]); emit(destination, 'destination_added_to_itinerary'); setNotice('Destination added to your journey.'); } };
  const markVisited = () => { if (!hasVisited) { setVisited(current => [...current, destinationId]); setNotice('Visit saved locally as unverified.'); } };
  const ai = () => { sessionStorage.setItem('png-tourism:ai-context', JSON.stringify({ destinationId: destination.id, destinationName: destination.name, provinceCode: destination.provinceCode })); emit(destination, 'qr_handoff_created'); setNotice('Destination context prepared for AI Concierge.'); document.getElementById('ai-concierge')?.scrollIntoView({ behavior: 'smooth' }); };
  const qr = () => { const uri = `pngtourism://destination/${destination.id}`; navigator.clipboard?.writeText(uri).catch(() => undefined); setNotice(`QR/deep-link ready: ${uri}`); emit(destination, 'qr_handoff_created'); };

  return <section className="space-y-6">
    <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"><ArrowLeft size={16}/> All destinations</button>
    {offline && <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"><WifiOff size={16}/> Offline mode — showing only visitor-safe cached state.</div>}
    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#071b2a] text-white shadow-2xl">
      <div className="grid lg:grid-cols-[1.25fr_.75fr]">
        <div className="min-h-[300px] bg-gradient-to-br from-[#0b6477] to-[#071b2a] p-5 sm:p-8">
          {destination.media.length ? <div className="grid gap-3 sm:grid-cols-2">{destination.media.slice(0, 4).map((m, i) => <figure key={m.id} className={`${i === 0 ? 'sm:col-span-2' : ''} overflow-hidden rounded-2xl border border-white/10 bg-white/5`}><div className="aspect-[16/9]">{m.publicUrl ? <img src={m.publicUrl} alt={m.altText} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center"><ImageIcon size={42} className="text-white/30"/></div>}</div>{m.caption && <figcaption className="p-3 text-xs text-slate-300">{m.caption}</figcaption>}</figure>)}</div> : <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10"><ImageIcon size={56} className="text-white/30"/></div>}
        </div>
        <div className="p-6 sm:p-8 lg:p-10"><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[.16em] text-[#8fd5c8]"><MapPin size={14}/>{destination.provinceCode}</span><span className="text-xs font-semibold text-slate-400">v{destination.contentVersion} · {destination.freshness}</span></div><h1 className="mt-4 text-4xl font-black tracking-tight">{destination.name}</h1><p className="mt-4 text-sm leading-7 text-slate-300">{destination.description || 'Discover a published destination from Papua New Guinea.'}</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={addToTrip} disabled={inTrip} className="inline-flex items-center gap-2 rounded-xl bg-[#f4b942] px-4 py-3 text-sm font-black text-[#071b2a] disabled:opacity-60">{inTrip ? <CheckCircle2 size={16}/> : <Plus size={16}/>} {inTrip ? 'In your journey' : 'Add to journey'}</button><button onClick={markVisited} disabled={hasVisited} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold disabled:opacity-60"><CheckCircle2 size={16}/> {hasVisited ? 'Visit saved' : 'Passport check-in'}</button></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><button onClick={ai} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#8fd5c8]/30 bg-[#0b6477]/30 px-4 py-3 text-sm font-bold"><Bot size={17}/> Ask Concierge</button><button onClick={qr} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold"><Link2 size={17}/> QR / deep link</button></div></div>
      </div>
    </article>
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{notice}</div>}
    <div className="grid gap-5 md:grid-cols-3"><Info icon={<ShieldCheck size={18}/>} title="Governed source" text="Published visitor projection only; private and regulatory records stay behind server boundaries."/><Info icon={<Compass size={18}/>} title="Journey-ready" text="The same destination reference can flow into itinerary, passport and QR experiences."/><Info icon={<ExternalLink size={18}/>} title="Freshness aware" text={`Published version ${destination.contentVersion} was updated ${new Date(destination.updatedAt).toLocaleDateString()}.`}/></div>
    <div id="ai-concierge" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">AI Concierge handoff context is prepared without exposing direct database access. Continue in the Concierge panel to ask about this destination.</div>
  </section>;
}
function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-[#0b6477]">{icon}<span className="font-black text-slate-900">{title}</span></div><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>; }
