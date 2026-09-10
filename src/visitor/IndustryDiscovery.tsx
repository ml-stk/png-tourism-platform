import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, CheckCircle2, Link2, MapPin, MessageSquare, Search, Send, WifiOff } from 'lucide-react';

type ProvinceCode = string;
type Profile = { id: string; operatorId: string; displayName: string; description: string; provinceCode: ProvinceCode; categories: string[]; publicContact?: { website?: string; email?: string; phone?: string }; published: boolean; };
type Experience = { id: string; operatorId: string; title: string; summary: string; destinationId?: string; provinceCode: ProvinceCode; status: 'published'; };

const api = '/api/v1/industry';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  const body = await response.json() as { data: T };
  return body.data;
}

export default function IndustryDiscovery() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('All');
  const [selected, setSelected] = useState<Experience | null>(null);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);

  const load = async () => {
    setError('');
    try {
      const [nextProfiles, nextExperiences] = await Promise.all([
        getJson<Profile[]>(`${api}/profiles`),
        getJson<Experience[]>(`${api}/experiences`),
      ]);
      setProfiles(nextProfiles);
      setExperiences(nextExperiences);
      sessionStorage.setItem('png-tourism:industry-cache:v1', JSON.stringify({ profiles: nextProfiles, experiences: nextExperiences }));
    } catch {
      try {
        const cached = sessionStorage.getItem('png-tourism:industry-cache:v1');
        if (cached) {
          const value = JSON.parse(cached) as { profiles: Profile[]; experiences: Experience[] };
          setProfiles(value.profiles); setExperiences(value.experiences);
          setError('Showing the last available industry information.');
        } else setError('Industry discovery is unavailable right now.');
      } catch { setError('Industry discovery is unavailable right now.'); }
    }
  };

  useEffect(() => { void load(); const on = () => { setOffline(false); void load(); }; const off = () => setOffline(true); window.addEventListener('online', on); window.addEventListener('offline', off); return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); }; }, []);

  const profileByOperator = useMemo(() => new Map(profiles.map(profile => [profile.operatorId, profile])), [profiles]);
  const provinces = useMemo(() => ['All', ...Array.from(new Set(experiences.map(item => item.provinceCode)))], [experiences]);
  const filtered = useMemo(() => experiences.filter(item => {
    const profile = profileByOperator.get(item.operatorId);
    const haystack = `${item.title} ${item.summary} ${profile?.displayName ?? ''} ${(profile?.categories ?? []).join(' ')}`.toLowerCase();
    return (province === 'All' || item.provinceCode === province) && haystack.includes(query.trim().toLowerCase());
  }), [experiences, profileByOperator, province, query]);

  const submitLead = async () => {
    if (!selected || !message.trim() || offline) return;
    setError('');
    try {
      const response = await fetch(`${api}/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ operatorId: selected.operatorId, experienceId: selected.id, source: 'visitor', visitorMessage: message.trim() }) });
      if (!response.ok) throw new Error();
      setSubmitted(true); setMessage('');
    } catch { setError('Your enquiry could not be sent. Please try again when connected.'); }
  };

  const handoff = selected ? `pngtourism://experience/${selected.id}` : '';

  if (selected) return <div className="space-y-6">
    <button onClick={() => { setSelected(null); setSubmitted(false); setError(''); }} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={16}/> Back to industry discovery</button>
    <section className="rounded-3xl bg-slate-900 p-7 text-white lg:p-9"><div className="max-w-3xl"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Published tourism experience</div><h2 className="mt-3 text-3xl font-bold lg:text-4xl">{selected.title}</h2><p className="mt-3 text-slate-300">{selected.summary}</p></div></section>
    <div className="grid gap-6 lg:grid-cols-[1fr_.85fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-start gap-3"><Building2 className="mt-1 text-emerald-700"/><div><h3 className="text-xl font-bold">{profileByOperator.get(selected.operatorId)?.displayName ?? 'Tourism operator'}</h3><div className="mt-2 flex items-center gap-2 text-sm text-slate-500"><MapPin size={15}/> {selected.provinceCode}</div></div></div><p className="mt-5 text-sm leading-7 text-slate-600">{profileByOperator.get(selected.operatorId)?.description}</p><div className="mt-5 flex flex-wrap gap-2">{(profileByOperator.get(selected.operatorId)?.categories ?? []).map(category => <span key={category} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{category}</span>)}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-2"><MessageSquare className="text-emerald-700"/><h3 className="text-xl font-bold">Contact operator</h3></div>{submitted ? <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="mb-2" size={20}/><strong>Enquiry sent.</strong><div className="mt-1">Your lead was securely submitted through the tourism platform.</div></div> : <><label className="mt-5 block text-sm font-semibold">Your enquiry<textarea value={message} onChange={event => setMessage(event.target.value)} maxLength={4000} rows={5} placeholder="Ask about availability, pricing, or planning your experience." className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"/></label><button disabled={!message.trim() || offline} onClick={() => void submitLead()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Send size={16}/> {offline ? 'Connect to send enquiry' : 'Send enquiry'}</button></>}</section>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-2"><Link2 className="text-emerald-700"/><h3 className="font-bold">QR / deep-link handoff</h3></div><p className="mt-2 text-sm text-slate-500">Use this public experience reference for QR and app handoff flows. Resolution remains governed by the platform API.</p><code className="mt-3 block overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-white">{handoff}</code></section>
  </div>;

  return <div className="space-y-6">
    <section className="rounded-3xl bg-slate-900 p-7 text-white lg:p-9"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><Building2 size={14}/> INDUSTRY DISCOVERY</div><h2 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">Find tourism experiences across Papua New Guinea.</h2><p className="mt-3 text-slate-300">Discover published experiences from active tourism operators and connect with them directly.</p></div><div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${offline ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>{offline ? <WifiOff size={14}/> : <CheckCircle2 size={14}/>} {offline ? 'Offline — cached discovery' : 'Connected — live discovery'}</div></div></section>
    {error && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6"><div className="grid gap-3 md:grid-cols-[1fr_auto]"><label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"><Search size={16} className="text-slate-400"/><input aria-label="Search experiences" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search operators and experiences" className="w-full bg-transparent text-sm outline-none"/></label><select aria-label="Filter province" value={province} onChange={event => setProvince(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">{provinces.map(item => <option key={item}>{item}</option>)}</select></div><div className="mt-5 flex items-center justify-between"><h3 className="text-xl font-bold">Published experiences</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{filtered.length} available</span></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(item => { const profile = profileByOperator.get(item.operatorId); return <article key={item.id} className="flex flex-col rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><div><h4 className="font-bold">{item.title}</h4><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{profile?.displayName ?? 'Tourism operator'}</div></div><MapPin size={17} className="shrink-0 text-emerald-700"/></div><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{item.summary}</p><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>{item.provinceCode}</span><button onClick={() => setSelected(item)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">View experience</button></div></article>; })}</div>{filtered.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No published experiences match your filters.</div>}</section>
  </div>;
}
