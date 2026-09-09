import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Compass, MapPin, Navigation, Plus, RotateCcw, Trash2, WifiOff } from 'lucide-react';

type Place = { id: string; name: string; province: string; description: string; latitude: number; longitude: number };
type Stop = Place & { note?: string };

const places: Place[] = [
  { id: 'kokoda', name: 'Kokoda Track', province: 'Oro', description: 'Trekking and wartime heritage across the Owen Stanley Range.', latitude: -8.877, longitude: 147.736 },
  { id: 'milne-bay', name: 'Milne Bay', province: 'Milne Bay', description: 'Marine, island and cultural experiences across the province.', latitude: -10.313, longitude: 150.458 },
  { id: 'sepik', name: 'Sepik River', province: 'East Sepik', description: 'River journeys, villages, carving traditions and cultural tourism.', latitude: -4.215, longitude: 143.513 },
];

const storageKey = 'png-tourism:visitor-itinerary:v1';

export default function TripPlanner() {
  const [stops, setStops] = useState<Stop[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as Stop[]; } catch { return []; }
  });
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [visited, setVisited] = useState<Record<string, { verified: boolean }>>({});

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(stops));
  }, [stops]);

  useEffect(() => {
    const on = () => setOffline(false); const off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const remaining = useMemo(() => places.filter(place => !stops.some(stop => stop.id === place.id)), [stops]);
  const mapBounds = useMemo(() => {
    const source = stops.length ? stops : places;
    const latitudes = source.map(p => p.latitude); const longitudes = source.map(p => p.longitude);
    return { minLat: Math.min(...latitudes), maxLat: Math.max(...latitudes), minLng: Math.min(...longitudes), maxLng: Math.max(...longitudes) };
  }, [stops]);

  const add = (place: Place) => setStops(current => [...current, place]);
  const remove = (id: string) => setStops(current => current.filter(stop => stop.id !== id));
  const reset = () => setStops([]);
  const markVisited = (id: string) => setVisited(current => ({ ...current, [id]: { verified: false } }));

  return <div className="space-y-6">
    <section className="rounded-3xl bg-slate-900 p-7 text-white lg:p-9">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><Compass size={14}/> VISITOR EXPERIENCE</div><h2 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">Plan your Papua New Guinea journey.</h2><p className="mt-3 text-slate-300">Save published destinations, build a route and keep your journey available when connectivity drops.</p></div>
        <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${offline ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>{offline ? <WifiOff size={14}/> : <CheckCircle2 size={14}/>} {offline ? 'Offline — saved locally' : 'Connected — journey synced locally'}</div>
      </div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
        <div className="flex items-center justify-between"><div><h3 className="text-xl font-bold">Discover destinations</h3><p className="mt-1 text-sm text-slate-500">Published visitor content only.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{remaining.length} available</span></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">{remaining.map(place => <article key={place.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><div><h4 className="font-bold">{place.name}</h4><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{place.province}</div></div><MapPin size={18} className="text-emerald-700"/></div><p className="mt-3 text-sm leading-6 text-slate-600">{place.description}</p><button onClick={() => add(place)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"><Plus size={15}/> Add to trip</button></article>)}</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
        <div className="flex items-center justify-between"><div><h3 className="text-xl font-bold">Your journey</h3><p className="mt-1 text-sm text-slate-500">{stops.length} stop{stops.length === 1 ? '' : 's'} · saved for offline use</p></div>{stops.length > 0 && <button onClick={reset} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><RotateCcw size={13}/> Reset</button>}</div>
        <div className="mt-5 space-y-3">{stops.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Add a destination to start your itinerary.</div> : stops.map((stop, index) => <div key={stop.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold shadow-sm">{index + 1}</div><div className="min-w-0 flex-1"><div className="font-semibold">{stop.name}</div><div className="text-xs text-slate-500">{stop.province} · {stop.latitude.toFixed(3)}, {stop.longitude.toFixed(3)}</div></div><button onClick={() => markVisited(stop.id)} title="Mark visited" className="rounded-lg p-2 text-slate-500 hover:bg-white"><CheckCircle2 size={16}/></button><button onClick={() => remove(stop.id)} title="Remove" className="rounded-lg p-2 text-slate-500 hover:bg-white"><Trash2 size={16}/></button></div>)}</div>
        {stops.length > 0 && <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="text-sm font-bold">Digital tourism passport</div><p className="mt-1 text-xs leading-5 text-slate-600">Visited status is recorded locally. Verification is shown separately and is never implied by a self-reported visit.</p><div className="mt-3 space-y-2">{stops.filter(s => visited[s.id]).map(s => <div key={s.id} className="flex items-center gap-2 text-xs font-semibold"><CheckCircle2 size={14}/> {s.name} · visited, not verified</div>)}</div></div>}
      </section>
    </div>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6"><div className="flex items-center gap-2"><Navigation size={18} className="text-emerald-700"/><h3 className="text-xl font-bold">Map-ready route</h3></div><p className="mt-1 text-sm text-slate-500">Coordinates are from the published destination model and are ready for a map adapter.</p><div className="relative mt-5 h-64 overflow-hidden rounded-2xl bg-slate-100"><div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '32px 32px' }}/>{stops.map((stop, index) => { const x = mapBounds.maxLng === mapBounds.minLng ? 50 : ((stop.longitude - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 80 + 10; const y = mapBounds.maxLat === mapBounds.minLat ? 50 : (1 - (stop.latitude - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * 70 + 15; return <div key={stop.id} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-lg">{index + 1}</div><div className="mt-1 whitespace-nowrap rounded bg-white px-2 py-1 text-[11px] font-semibold shadow">{stop.name}</div></div>; })}{stops.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">Add stops to plot your journey.</div>}</div></section>
  </div>;
}
