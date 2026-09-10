import { useEffect, useMemo, useState } from 'react';
import { Bookmark, CheckCircle2, Link2, MapPin, Plus, WifiOff } from 'lucide-react';

type Experience = { id: string; operatorId: string; title: string; summary: string; provinceCode: string; status: 'published' };
type Profile = { operatorId: string; displayName: string; provinceCode: string; published: boolean };

const cacheKey = 'png-tourism:industry-trip-cache:v1';
const savedKey = 'png-tourism:saved-industry-experiences:v1';
const itineraryKey = 'png-tourism:visitor-experience-itinerary:v1';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return (await response.json() as { data: T }).data;
}

function record(eventType: string, experience: Experience) {
  void fetch('/api/v1/visitor/engagement', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ eventType, source: 'web', experienceId: experience.id, operatorId: experience.operatorId, provinceCode: experience.provinceCode }),
  }).catch(() => undefined);
}

export default function VisitorIndustryTripIntegration() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [saved, setSaved] = useState<string[]>(() => read<string[]>(savedKey, []));
  const [planned, setPlanned] = useState<string[]>(() => read<string[]>(itineraryKey, []));
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [nextExperiences, nextProfiles] = await Promise.all([
          getJson<Experience[]>('/api/v1/industry/experiences'),
          getJson<Profile[]>('/api/v1/industry/profiles'),
        ]);
        setExperiences(nextExperiences.filter(item => item.status === 'published'));
        setProfiles(nextProfiles.filter(item => item.published));
        sessionStorage.setItem(cacheKey, JSON.stringify({ experiences: nextExperiences, profiles: nextProfiles }));
        setError('');
      } catch {
        const cached = read<{ experiences: Experience[]; profiles: Profile[] } | null>(cacheKey, null);
        if (cached) { setExperiences(cached.experiences.filter(item => item.status === 'published')); setProfiles(cached.profiles.filter(item => item.published)); setError('Showing the last available industry experiences.'); }
        else setError('Industry experiences are unavailable right now.');
      }
    };
    void load();
    const on = () => { setOffline(false); void load(); };
    const off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const profileByOperator = useMemo(() => new Map(profiles.map(profile => [profile.operatorId, profile])), [profiles]);
  const toggleSaved = (experience: Experience) => {
    setSaved(current => { const next = current.includes(experience.id) ? current.filter(id => id !== experience.id) : [...current, experience.id]; localStorage.setItem(savedKey, JSON.stringify(next)); return next; });
    if (!saved.includes(experience.id)) record('experience_saved', experience);
  };
  const addToTrip = (experience: Experience) => {
    setPlanned(current => { if (current.includes(experience.id)) return current; const next = [...current, experience.id]; localStorage.setItem(itineraryKey, JSON.stringify(next)); return next; });
    if (!planned.includes(experience.id)) record('experience_added_to_itinerary', experience);
  };
  const handoff = (experience: Experience) => { record('qr_handoff_created', experience); window.location.hash = `industry-experience/${experience.id}`; };

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Trip planning integration</div><h3 className="mt-1 text-xl font-bold">Add industry experiences to your journey</h3><p className="mt-1 text-sm text-slate-500">Published operator experiences can be saved alongside your destination plan and retained offline.</p></div><div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${offline ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>{offline ? <WifiOff size={14}/> : <CheckCircle2 size={14}/>} {offline ? 'Offline' : 'Connected'}</div></div>
    {error && <div role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}
    <div className="mt-5 grid gap-4 md:grid-cols-2">{experiences.slice(0, 6).map(experience => { const profile = profileByOperator.get(experience.operatorId); const isSaved = saved.includes(experience.id); const isPlanned = planned.includes(experience.id); return <article key={experience.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-bold">{experience.title}</h4><div className="mt-1 text-xs font-semibold text-slate-500">{profile?.displayName ?? 'Tourism operator'} · {experience.provinceCode}</div></div><MapPin size={17} className="shrink-0 text-emerald-700"/></div><p className="mt-3 text-sm leading-6 text-slate-600">{experience.summary}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => addToTrip(experience)} disabled={isPlanned} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Plus size={14}/> {isPlanned ? 'In journey' : 'Add to journey'}</button><button onClick={() => toggleSaved(experience)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"><Bookmark size={14} className={isSaved ? 'fill-current' : ''}/> {isSaved ? 'Saved' : 'Save'}</button><button onClick={() => handoff(experience)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"><Link2 size={14}/> QR</button></div></article>; })}</div>
    {experiences.length === 0 && !error && <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No published industry experiences are currently available.</div>}
    <div className="mt-4 text-xs text-slate-500">{planned.length} industry experience{planned.length === 1 ? '' : 's'} planned · {saved.length} saved. Engagement signals contain only governed tourism references.</div>
  </section>;
}

function read<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key) ?? sessionStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
