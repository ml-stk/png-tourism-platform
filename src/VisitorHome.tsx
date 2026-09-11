import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bot, Compass, MapPin, Menu, Search, ShieldCheck, Users, X } from 'lucide-react';
import tpaLogo from './assets/png-tpa-logo.png';
import DestinationExplorer from './visitor/DestinationExplorer';
import AiConcierge from './visitor/AiConcierge';
import VisitorIndustryTripIntegration from './visitor/VisitorIndustryTripIntegration';
import TripPlanner from './visitor/TripPlanner';
import DestinationDetail from './visitor/DestinationDetail';

type Props = { onAdmin: () => void };
type Destination = { id: string; name: string; province: string; description: string };
const heroImage = 'https://papuanewguinea.travel/wp-content/uploads/elementor/thumbs/What-To-Do-In-Milne-Bay-Province-rkffalz60frjn6vrj1z9zkwro2anrnpfia7ub30g4w.webp';
const fallback: Destination[] = [
  { id: 'kokoda', name: 'Kokoda Track', province: 'Oro Province', description: 'Walk in history. Experience the spirit of resilience.' },
  { id: 'milne-bay', name: 'Milne Bay', province: 'Milne Bay Province', description: 'World-class diving in the heart of the Pacific.' },
  { id: 'rabaul', name: 'Rabaul', province: 'East New Britain Province', description: 'History, culture and natural wonders.' },
  { id: 'sepik', name: 'Sepik River', province: 'East Sepik Province', description: 'Ancient cultures. Living traditions.' },
  { id: 'kumul-country', name: 'Kumul Country', province: 'Western Highlands', description: 'Spectacular landscapes. Unique wildlife.' },
];

export default function VisitorHome({ onAdmin }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>(fallback);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/public/destinations')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('unavailable')))
      .then(x => {
        const items = Array.isArray(x.data?.items) ? x.data.items : Array.isArray(x.data) ? x.data : [];
        if (items.length) setDestinations(items.slice(0, 5).map((d: any) => ({
          id: d.id,
          name: d.name,
          province: d.provinceCode,
          description: d.description || 'Discover a published destination from Papua New Guinea.',
        })));
      })
      .catch(() => undefined);
  }, []);

  const filtered = useMemo(
    () => destinations.filter(d => `${d.name} ${d.province} ${d.description}`.toLowerCase().includes(query.toLowerCase().trim())),
    [destinations, query],
  );
  const scroll = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (selectedDestination) return (
    <div className="min-h-screen bg-[#071b2a] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <button onClick={() => setSelectedDestination(null)} className="mb-5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">← Back to PNG</button>
        <DestinationDetail destinationId={selectedDestination} onBack={() => setSelectedDestination(null)} />
      </div>
    </div>
  );

  return <div className="min-h-screen overflow-x-hidden bg-[#071b2a] text-white">
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#061824]/90 shadow-xl backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center gap-5 px-4 py-2.5 sm:px-6 lg:px-10">
        <a href="#top" aria-label="Papua New Guinea Tourism Promotion Authority home" className="shrink-0 rounded-xl bg-white px-2.5 py-1.5 shadow-lg ring-1 ring-black/10">
          <img src={tpaLogo} alt="Papua New Guinea Tourism Promotion Authority" className="block h-9 w-[150px] object-contain sm:h-10 sm:w-[175px]" />
        </a>
        <nav className={`${mobileOpen ? 'absolute left-3 right-3 top-[calc(100%+8px)] flex rounded-2xl border border-white/10 bg-[#082331] p-3 shadow-2xl' : 'hidden'} flex-col gap-1 lg:static lg:flex lg:flex-row lg:items-center lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>
          {[['Destinations','destinations'],['Experiences','experiences'],['Plan Your Trip','trip'],['Digital Passport','passport'],['AI Concierge','concierge'],['About PNG','about']].map(([label,id]) => <button key={id} onClick={() => scroll(id)} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white">{label}</button>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => scroll('destinations')} aria-label="Search destinations" className="hidden rounded-full p-2 text-slate-200 hover:bg-white/10 sm:block"><Search size={19}/></button>
          <button onClick={() => scroll('destinations')} className="hidden rounded-full bg-[#2f6b38] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-black/20 hover:bg-[#3c7d43] sm:block">Explore PNG <span className="ml-1">⌄</span></button>
          <button onClick={() => setMobileOpen(v => !v)} className="rounded-xl p-2 text-white hover:bg-white/10 lg:hidden" aria-label="Menu">{mobileOpen ? <X/> : <Menu/>}</button>
        </div>
      </div>
    </header>

    <main id="top">
      <section className="relative min-h-[650px] overflow-hidden border-b border-white/10 bg-[#082633]">
        <img src={heroImage} alt="Milne Bay, Papua New Guinea" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(16,139,141,.25),transparent_28%),linear-gradient(90deg,rgba(3,19,29,.94)_0%,rgba(3,25,35,.62)_45%,rgba(3,25,35,.20)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071b2a] via-[#071b2a]/10 to-transparent" />
        <div className="relative mx-auto flex min-h-[650px] max-w-[1500px] items-end px-5 pb-16 pt-24 lg:px-20">
          <div className="max-w-4xl text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] backdrop-blur"><MapPin size={14}/> Milne Bay Province · The Last Frontier</div>
            <h1 className="max-w-4xl text-5xl font-black leading-[.92] tracking-[-.05em] sm:text-7xl lg:text-8xl">Discover<br/>Papua New Guinea</h1>
            <p className="mt-6 max-w-3xl text-lg font-medium leading-7 text-white/90 sm:text-xl">Extraordinary people. Breathtaking places. A million different journeys.</p>
            <div className="mt-8 flex max-w-2xl overflow-hidden rounded-full bg-white p-1.5 shadow-2xl ring-1 ring-white/20">
              <Search className="m-3 shrink-0 text-slate-500" size={20}/>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && scroll('destinations')} placeholder="Search destinations, experiences or provinces..." className="min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-800 outline-none sm:text-base"/>
              <button onClick={() => scroll('destinations')} className="rounded-full bg-[#2f6b38] px-6 py-3 text-sm font-black text-white sm:px-8">Search</button>
            </div>
          </div>
          <div className="absolute right-5 top-1/2 hidden w-80 -translate-y-1/2 rounded-3xl border border-white/15 bg-[#082c3b]/85 p-4 text-white shadow-2xl backdrop-blur-xl xl:block">
            {[
              ['Explore Destinations','From mountains to islands',MapPin,'destinations'],
              ['Plan Your Journey','Build your PNG experience',Users,'trip'],
              ['Digital Passport','Collect your journey moments',ShieldCheck,'passport'],
              ['AI Concierge','Your PNG travel companion',Bot,'concierge'],
            ].map(([title,text,Icon,id]: any) => <button key={title} onClick={() => scroll(id)} className="flex w-full items-center gap-4 rounded-2xl p-3 text-left hover:bg-white/10"><span className="rounded-xl bg-white/10 p-2.5"><Icon size={22}/></span><span><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-xs text-slate-300">{text}</span></span></button>)}
          </div>
        </div>
      </section>

      <section id="destinations" className="relative bg-[#071b2a] px-5 py-14 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex items-end justify-between gap-5">
            <div><div className="text-xs font-black uppercase tracking-[.2em] text-[#8fd5c8]">Explore PNG</div><h2 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Featured Destinations</h2><p className="mt-3 max-w-2xl text-slate-400">Go beyond the postcard. Discover places, cultures and journeys across the country.</p></div>
            <button onClick={() => document.getElementById('destination-explorer')?.scrollIntoView({behavior:'smooth'})} className="hidden items-center gap-2 text-sm font-black text-[#b9e6d7] hover:text-white sm:inline-flex">View all destinations <ArrowRight size={17}/></button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filtered.map((d, i) => <button key={d.id} onClick={() => setSelectedDestination(d.id)} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0c2b3a] text-left shadow-xl transition hover:-translate-y-1 hover:border-[#8fd5c8]/40 hover:bg-[#103444] hover:shadow-2xl">
              <div className={`relative flex aspect-[1.35] items-end bg-gradient-to-br ${['from-emerald-900 via-teal-700 to-cyan-500','from-cyan-900 via-sky-700 to-blue-500','from-slate-800 via-emerald-700 to-lime-500','from-amber-950 via-orange-700 to-rose-500','from-green-950 via-lime-800 to-yellow-500'][i % 5]} p-4`}><div className="absolute inset-0 bg-black/10 transition group-hover:bg-transparent"/><span className="relative rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-bold text-white backdrop-blur">{d.province}</span></div>
              <div className="p-4"><h3 className="text-lg font-black">{d.name}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{d.description}</p><div className="mt-4 flex items-center justify-between text-xs font-bold text-[#8fd5c8]">Explore destination <ArrowRight size={14}/></div></div>
            </button>)}
          </div>
          <div id="destination-explorer" className="mt-10"><DestinationExplorer onOpen={setSelectedDestination}/></div>
        </div>
      </section>

      <section id="experiences" className="border-y border-white/10 bg-[#0a2635] px-5 py-16 lg:px-12">
        <div className="mx-auto max-w-[1500px]"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><div className="text-xs font-black uppercase tracking-[.2em] text-[#8fd5c8]">Go beyond the postcard</div><h2 className="mt-3 text-4xl font-black tracking-tight">A million different ways to experience PNG.</h2><p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Connect with published tourism experiences, local operators and the people who make every journey different.</p></div><VisitorIndustryTripIntegration/></div></div>
      </section>

      <section id="trip" className="bg-[#061824] px-5 py-16 lg:px-12"><div className="mx-auto max-w-[1500px]"><div className="mb-8 max-w-2xl"><div className="text-xs font-black uppercase tracking-[.2em] text-[#8fd5c8]">Build your journey</div><h2 className="mt-3 text-4xl font-black">Your PNG, your way.</h2><p className="mt-3 text-slate-400">Plan ahead, save your journey and keep essential visitor information available when connectivity is limited.</p></div><TripPlanner/></div></section>

      <section id="concierge" className="bg-[#071b2a] px-5 py-16 lg:px-12"><div className="mx-auto max-w-[1200px]"><div className="mb-8 max-w-2xl"><div className="text-xs font-black uppercase tracking-[.2em] text-[#8fd5c8]">Your digital travel companion</div><h2 className="mt-3 text-4xl font-black">Meet the PNG AI Concierge.</h2><p className="mt-3 text-slate-300">Ask questions, discover published places and experiences, and move from inspiration to itinerary without leaving the journey.</p></div><AiConcierge/></div></section>

      <section id="passport" className="bg-[#0a2635] px-5 py-16 lg:px-12"><div className="mx-auto max-w-[1200px] rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#315c2f] via-[#164c48] to-[#0b2f3f] p-8 text-white shadow-2xl sm:p-12"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em]"><ShieldCheck size={14}/> Digital Tourism Passport</div><h2 className="mt-4 text-4xl font-black">Collect the moments that make your journey yours.</h2><p className="mt-4 max-w-2xl leading-7 text-white/80">Keep your itinerary and visit records available offline. Verification remains explicit and governed.</p></div><div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/15 bg-black/10"><Compass size={52}/></div></div></div></section>

      <section id="about" className="border-t border-white/10 bg-[#05131d] px-5 py-12 lg:px-12"><div className="mx-auto flex max-w-[1500px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"><div><div className="inline-flex rounded-2xl bg-white px-3 py-2 shadow-lg"><img src={tpaLogo} alt="Papua New Guinea Tourism Promotion Authority" className="h-12 w-[185px] object-contain"/></div><p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">The national tourism platform connecting visitors, destinations, tourism businesses and trusted public information across Papua New Guinea.</p></div><button onClick={onAdmin} className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10">TPA Command Centre</button></div></section>
    </main>
  </div>;
}
