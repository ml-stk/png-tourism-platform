import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Compass, Link2, MapPin, Navigation, Plus, RefreshCw, RotateCcw, Search, Trash2, WifiOff } from 'lucide-react';

type Place = { id: string; name: string; province: string; description: string; latitude: number; longitude: number; heroUrl: string };
type Experience = { id: string; operatorId: string; title: string; summary: string; provinceCode: string; status: 'published' };
type VisitState = { visitedAt: string; verified: boolean };

const API_ORIGIN = 'https://png-tourism-platform-api.onrender.com';
const itineraryKey = 'png-tourism:visitor-itinerary:v3';
const experienceItineraryKey = 'png-tourism:visitor-experience-itinerary:v1';
const passportKey = 'png-tourism:visitor-passport:v2';
const destinationDisplay: Record<string, { name: string; province: string }> = {
  ORO: { name: 'Kokoda Track', province: 'Oro Province' },
  MILNE_BAY: { name: 'Milne Bay', province: 'Milne Bay Province' },
  EAST_NEW_BRITAIN: { name: 'Rabaul', province: 'East New Britain Province' },
  EAST_SEPIK: { name: 'Sepik River', province: 'East Sepik Province' },
  WESTERN_HIGHLANDS: { name: 'Western Highlands', province: 'Western Highlands' },
};
const destinationHeroImages: Record<string, string> = {
  'Kokoda Track': 'https://commons.wikimedia.org/wiki/Special:FilePath/OwenStanleyRangeOwersCornerView.jpg',
  'Milne Bay': 'https://www.divediscovery.com/images/kenu_kundu_festival_4.jpg',
  Rabaul: 'https://img.rezdy.com/PRODUCT_IMAGE/13699/national-mask-festival-rabaul-papua-new-guinea.jpg',
  'Sepik River': 'https://papuanewguinea.travel/wp-content/uploads/2026/01/Life-along-the-Sepik-River-at-dusk-1-768x576.jpg',
  'Western Highlands': 'https://peakvisor.com/photo/SD/Papua-New-Guinea-mount-hagen-august-1463442698.jpg',
};
const destinationExternalUrls: Record<string, string> = {
  'Kokoda Track': 'https://papuanewguinea.travel/trekking/kokoda-trail/',
  'Milne Bay': 'https://papuanewguinea.travel/milne-bay-province/',
  Rabaul: 'https://papuanewguinea.travel/east-new-britain-province/',
  'Sepik River': 'https://papuanewguinea.travel/natural-landmarks/sepik-river/',
  'Western Highlands': 'https://papuanewguinea.travel/western-highlands-province/',
};
const fallbackPlaces: Place[] = [
  { id: '6cd519a1-8187-466e-a92d-9d6973689300', name: 'Kokoda Track', province: 'Oro Province', description: 'Walk in history. Experience the spirit of resilience.', latitude: -9.058, longitude: 147.735, heroUrl: destinationHeroImages['Kokoda Track'] },
  { id: '60bfb94e-1eaa-41e9-95ab-f286acd95d41', name: 'Milne Bay', province: 'Milne Bay Province', description: 'World-class diving in the Heart of the Pacific.', latitude: -10.316, longitude: 150.457, heroUrl: destinationHeroImages['Milne Bay'] },
  { id: 'b3f878f9-d5fa-4296-92e0-caa830a62841', name: 'Rabaul', province: 'East New Britain Province', description: 'History, culture and natural wonders.', latitude: -4.198, longitude: 152.172, heroUrl: destinationHeroImages.Rabaul },
  { id: '189d9d60-03ca-4055-8612-72d40ca42468', name: 'Sepik River', province: 'East Sepik Province', description: 'Ancient cultures. Living traditions.', latitude: -4.2, longitude: 143.5, heroUrl: destinationHeroImages['Sepik River'] },
  { id: 'c23262f7-03ca-431e-b61d-d91eebc1bcb9', name: 'Western Highlands', province: 'Western Highlands', description: 'Spectacular landscapes. Unique wildlife.', latitude: -5.857, longitude: 144.229, heroUrl: destinationHeroImages['Western Highlands'] },
];
function load<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function normalizePlaces(value: unknown): Place[] {
  if (!Array.isArray(value)) return [];
  return value.map((item: any) => {
    const provinceCode = String(item.provinceCode ?? '').trim();
    const display = destinationDisplay[provinceCode];
    const name = display?.name ?? String(item.name);
    return {
      id: String(item.id),
      name,
      province: display?.province ?? String(item.province ?? provinceCode),
      description: String(item.description ?? 'Discover a published destination from Papua New Guinea.'),
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      heroUrl: String(item.media?.[0]?.publicUrl ?? item.heroUrl ?? destinationHeroImages[name] ?? ''),
    };
  }).filter(item => item.id && item.name && Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
}
async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 7000) { const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), timeoutMs); try { return await fetch(input, { ...init, signal: controller.signal }); } finally { window.clearTimeout(timer); } }

export default function TripPlanner() {
  const [places, setPlaces] = useState<Place[]>(fallbackPlaces);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [stops, setStops] = useState<Place[]>(() => load(itineraryKey, []));
  const [plannedExperiences, setPlannedExperiences] = useState<string[]>(() => load(experienceItineraryKey, []));
  const [visited, setVisited] = useState<Record<string, VisitState>>(() => load(passportKey, {}));
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('All');
  const [handoff, setHandoff] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { localStorage.setItem(itineraryKey, JSON.stringify(stops)); }, [stops]);
  useEffect(() => { localStorage.setItem(experienceItineraryKey, JSON.stringify(plannedExperiences)); }, [plannedExperiences]);
  useEffect(() => { localStorage.setItem(passportKey, JSON.stringify(visited)); }, [visited]);

  const loadPublishedData = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetchWithTimeout(`${API_ORIGIN}/api/v1/public/destinations`, { headers: { Accept: 'application/json' } }, 75000);
      if (!response.ok) throw new Error(`Destination request returned HTTP ${response.status}`);
      const payload = await response.json() as { data?: { items?: unknown[] } | unknown[] };
      const raw = Array.isArray(payload.data) ? payload.data : payload.data?.items;
      const nextPlaces = normalizePlaces(raw);
      if (!nextPlaces.length) throw new Error('Destination request returned no valid published destinations');
      setPlaces(nextPlaces); setOffline(false);
      setStops(current => current.filter(stop => nextPlaces.some(place => place.id === stop.id)));
      try {
        const response = await fetchWithTimeout(`${API_ORIGIN}/api/v1/industry/experiences`, { headers: { Accept: 'application/json' } }, 8000);
        if (response.ok) {
          const payload = await response.json() as { data?: unknown };
          if (Array.isArray(payload.data)) setExperiences((payload.data as Experience[]).filter(item => item.status === 'published'));
        }
      } catch (experienceError) {
        console.warn('[TripPlanner] optional experiences request failed', experienceError);
      }
    } catch (loadError) {
      const detail = loadError instanceof DOMException && loadError.name === 'AbortError'
        ? 'Live tourism data request timed out.'
        : loadError instanceof Error
          ? loadError.message
          : 'Unknown browser request error.';
      console.error('[TripPlanner] live destination request failed', loadError);
      setPlaces(fallbackPlaces); setOffline(true);
      setError(`Live tourism data is unavailable right now. Showing the governed visitor-safe destination set. (${detail})`);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    void loadPublishedData();
    const on = () => { setOffline(false); void loadPublishedData(); };
    const off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const provinces = useMemo(() => ['All', ...Array.from(new Set(places.map(place => place.province).filter(Boolean)))], [places]);
  const filtered = useMemo(() => places.filter(place => !stops.some(stop => stop.id === place.id) && (province === 'All' || place.province === province) && `${place.name} ${place.province} ${place.description}`.toLowerCase().includes(query.toLowerCase().trim())), [province, query, places, stops]);
  const plannedExperienceRecords = useMemo(() => plannedExperiences.map(id => experiences.find(item => item.id === id)).filter((item): item is Experience => Boolean(item)), [plannedExperiences, experiences]);
  const mapBounds = useMemo(() => { const source = stops.length ? stops : places; const latitudes = source.map(p => p.latitude), longitudes = source.map(p => p.longitude); return { minLat: Math.min(...latitudes), maxLat: Math.max(...latitudes), minLng: Math.min(...longitudes), maxLng: Math.max(...longitudes) }; }, [places, stops]);

  const add = (place: Place) => { setStops(current => [...current, place]); setNotice(`${place.name} added to your journey.`); };
  const remove = (id: string) => setStops(current => current.filter(stop => stop.id !== id));
  const move = (index: number, direction: -1 | 1) => setStops(current => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const reset = () => { setStops([]); setPlannedExperiences([]); setNotice('Journey reset.'); };
  const removeExperience = (id: string) => setPlannedExperiences(current => current.filter(item => item !== id));
  const markVisited = (id: string) => setVisited(current => ({ ...current, [id]: current[id] ?? { visitedAt: new Date().toISOString(), verified: false } }));
  const createHandoff = (place: Place) => {
    const url = destinationExternalUrls[place.name];
    if (!url) { setHandoff(''); setNotice(`No public handoff is configured for ${place.name}.`); return; }
    setHandoff(url);
    setNotice('Shareable HTTPS destination handoff prepared.');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-900 p-7 text-white lg:p-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><Compass size={14}/> VISITOR EXPERIENCE</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">Plan your Papua New Guinea journey.</h2>
            <p className="mt-3 text-slate-300">Discover published destinations, build a route and keep your journey available when connectivity drops.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${offline ? 'bg-amber-100 text-amber-900' : loading ? 'bg-slate-100 text-slate-800' : 'bg-emerald-100 text-emerald-900'}`}>
              {offline ? <><WifiOff size={14}/> Fallback — governed destinations</> : loading ? 'Refreshing live tourism data' : <><CheckCircle2 size={14}/> Connected — live destinations</>}
            </div>
            <button onClick={() => void loadPublishedData()} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/10"><RefreshCw size={14}/> Refresh</button>
          </div>
        </div>
      </section>

      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div>}
      {error && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="text-xl font-bold">Discover destinations</h3><p className="mt-1 text-sm text-slate-500">Live published visitor projection, with governed offline fallback.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{filtered.length} available</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"><Search size={16} className="text-slate-400"/><input aria-label="Search destinations" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search destinations" className="w-full bg-transparent text-sm outline-none"/></label><select aria-label="Filter province" value={province} onChange={event => setProvince(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">{provinces.map(item => <option key={item}>{item}</option>)}</select></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {filtered.map(place => <article key={place.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><div><h4 className="font-bold">{place.name}</h4><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{place.province}</div></div><MapPin size={18} className="text-emerald-700"/></div>{place.heroUrl && <img src={place.heroUrl} alt={`${place.name} destination`} loading="lazy" className="mt-4 h-36 w-full rounded-xl object-cover" onError={event => { event.currentTarget.style.display = 'none'; }} />}<p className="mt-3 text-sm leading-6 text-slate-600">{place.description}</p><div className="mt-4 flex flex-wrap gap-2"><a href={destinationExternalUrls[place.name]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100">Explore destination <Navigation size={15}/></a><button onClick={() => add(place)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"><Plus size={15}/> Add to trip</button><button onClick={() => createHandoff(place)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"><Link2 size={15}/> QR handoff</button></div></article>)}
          </div>
          {loading && <div className="mt-4 text-center text-xs text-slate-400">Refreshing published destination data…</div>}
          {filtered.length === 0 && !loading && <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No published destinations match your search.</div>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
          <div className="flex items-center justify-between"><div><h3 className="text-xl font-bold">Your journey</h3><p className="mt-1 text-sm text-slate-500">{stops.length} destination stop{stops.length === 1 ? '' : 's'} · {plannedExperienceRecords.length} experience{plannedExperienceRecords.length === 1 ? '' : 's'} · offline-capable</p></div>{(stops.length > 0 || plannedExperiences.length > 0) && <button onClick={reset} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><RotateCcw size={13}/> Reset</button>}</div>
          <div className="mt-5 space-y-3">
            {stops.length === 0 && plannedExperienceRecords.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Add a destination or published experience to start your itinerary.</div> : <>
              {stops.map((stop, index) => <div key={stop.id} className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold shadow-sm">{index + 1}</div><div className="min-w-0 flex-1"><div className="font-semibold">{stop.name}</div><div className="text-xs text-slate-500">{stop.province} · {stop.latitude.toFixed(3)}, {stop.longitude.toFixed(3)}</div></div><button onClick={() => move(index, -1)} disabled={index === 0} title="Move up" className="rounded-lg p-2 text-slate-500 disabled:opacity-30"><ArrowUp size={16}/></button><button onClick={() => move(index, 1)} disabled={index === stops.length - 1} title="Move down" className="rounded-lg p-2 text-slate-500 disabled:opacity-30"><ArrowDown size={16}/></button><button onClick={() => markVisited(stop.id)} title="Mark visited" className="rounded-lg p-2 text-slate-500 hover:bg-white"><CheckCircle2 size={16}/></button><button onClick={() => remove(stop.id)} title="Remove" className="rounded-lg p-2 text-slate-500 hover:bg-white"><Trash2 size={16}/></button></div></div>)}
              {plannedExperienceRecords.map(experience => <div key={experience.id} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3"><div className="flex items-center gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-xs font-bold">E</div><div className="min-w-0 flex-1"><div className="font-semibold">{experience.title}</div><div className="text-xs text-slate-500">Published experience · {experience.provinceCode}</div></div><button onClick={() => removeExperience(experience.id)} title="Remove experience" className="rounded-lg p-2 text-slate-500 hover:bg-white"><Trash2 size={16}/></button></div></div>)}
            </>}
          </div>
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="text-sm font-bold">Digital tourism passport</div><p className="mt-1 text-xs leading-5 text-slate-600">Self-reported visits remain unverified unless a governed verification mechanism confirms them.</p><div className="mt-3 space-y-2">{Object.entries(visited).length === 0 ? <div className="text-xs text-slate-500">No visits recorded yet.</div> : Object.entries(visited).map(([id, state]) => <div key={id} className="flex items-center gap-2 text-xs font-semibold"><CheckCircle2 size={14}/> {places.find(place => place.id === id)?.name ?? 'Published destination'} · visited{state.verified ? ' · verified' : ' · not verified'}</div>)}</div></div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6"><div className="flex items-center gap-2"><Navigation size={18} className="text-emerald-700"/><h3 className="text-xl font-bold">Map-ready route</h3></div><p className="mt-1 text-sm text-slate-500">Coordinates come directly from the published destination projection. The preview is intentionally map-provider independent.</p><div className="relative mt-5 h-64 overflow-hidden rounded-2xl bg-slate-100"><div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '32px 32px' }}/>{stops.map((stop, index) => { const x = mapBounds.maxLng === mapBounds.minLng ? 50 : ((stop.longitude - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 80 + 10; const y = mapBounds.maxLat === mapBounds.minLat ? 50 : (1 - (stop.latitude - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * 70 + 15; return <div key={stop.id} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-lg">{index + 1}</div><div className="mt-1 whitespace-nowrap rounded bg-white px-2 py-1 text-[11px] font-semibold shadow">{stop.name}</div></div>; })}{stops.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">Add stops to plot your journey.</div>}</div></section>
      {handoff && <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6"><div className="flex items-center gap-2"><Link2 size={18} className="text-emerald-700"/><h3 className="text-lg font-bold">QR / deep-link handoff</h3></div><p className="mt-2 text-sm text-slate-500">This is a shareable HTTPS handoff that opens the official PNG Tourism destination information page.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><code className="block min-w-0 flex-1 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-white">{handoff}</code><a href={handoff} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Open handoff <Navigation size={15}/></a></div></section>}
    </div>
  );
}
