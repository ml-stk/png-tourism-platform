import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bot, Camera, Compass, Heart, MapPin, Menu, Mountain, Search, Users, X } from 'lucide-react';
import tpaLogo from './assets/png-tpa-logo.png';
import DestinationExplorer from './visitor/DestinationExplorer';
import AiConcierge from './visitor/AiConcierge';
import VisitorIndustryTripIntegration from './visitor/VisitorIndustryTripIntegration';
import TripPlanner from './visitor/TripPlanner';
import DigitalPassport from './visitor/DigitalPassport';

interface Props { onAdmin: () => void }
interface Destination { id: string; slug: string; name: string; province: string; description: string; media?: Array<{ publicUrl?: string }> }

const heroImage = 'https://papuanewguinea.travel/wp-content/uploads/elementor/thumbs/What-To-Do-In-Milne-Bay-Province-rkffalz60frjn6vrj1z9zkwro2anrnpfia7ub30g4w.webp';
const destinationHeroImages: Record<string, string> = {
  'kokoda-track': 'https://commons.wikimedia.org/wiki/Special:FilePath/OwenStanleyRangeOwersCornerView.jpg',
  'milne-bay': 'https://www.divediscovery.com/images/kenu_kundu_festival_4.jpg',
  rabaul: 'https://img.rezdy.com/PRODUCT_IMAGE/13699/national-mask-festival-rabaul-papua-new-guinea.jpg',
  'sepik-river': 'https://papuanewguinea.travel/wp-content/uploads/2026/01/Life-along-the-Sepik-River-at-dusk-1-768x576.jpg',
  'western-highlands': 'https://peakvisor.com/photo/SD/Papua-New-Guinea-mount-hagen-august-1463442698.jpg',
};
const destinationGuideUrls: Record<string, string> = {
  'kokoda-track': 'https://papuanewguinea.travel/trekking/kokoda-trail/',
  'milne-bay': 'https://papuanewguinea.travel/milne-bay-province/',
  rabaul: 'https://papuanewguinea.travel/east-new-britain-province/',
  'sepik-river': 'https://papuanewguinea.travel/natural-landmarks/sepik-river/',
  'western-highlands': 'https://papuanewguinea.travel/western-highlands-province/',
};
const fallback: Destination[] = [
  { id: 'kokoda', slug: 'kokoda-track', name: 'Kokoda Track', province: 'Oro Province', description: 'Walk in history. Experience the spirit of resilience.' },
  { id: 'milne-bay', slug: 'milne-bay', name: 'Milne Bay', province: 'Milne Bay Province', description: 'World-class diving in the Heart of the Pacific.' },
  { id: 'rabaul', slug: 'rabaul', name: 'Rabaul', province: 'East New Britain Province', description: 'History, culture and natural wonders.' },
  { id: 'sepik', slug: 'sepik-river', name: 'Sepik River', province: 'East Sepik Province', description: 'Ancient cultures. Living traditions.' },
  { id: 'kumul', slug: 'western-highlands', name: 'Western Highlands', province: 'Western Highlands', description: 'Spectacular landscapes. Unique wildlife.' },
];
const primaryJourneys = [
  ['Explore destinations', 'Find places worth the journey.', MapPin, 'destinations'],
  ['Discover experiences', 'Meet operators and local experiences.', Users, 'experiences'],
  ['Plan your trip', 'Build a practical PNG itinerary.', Compass, 'trip'],
  ['Ask AI Concierge', 'Get help finding your next step.', Bot, 'concierge'],
] as const;
const trustSignals = [
  [Compass, 'Pristine nature', 'Mountains, islands, rivers and reef.'],
  [Users, 'Living cultures', 'Hundreds of communities and traditions.'],
  [Mountain, 'Epic adventures', 'Land, sea and sky experiences.'],
  [Heart, 'Welcoming people', 'Travel deeper through local connection.'],
  [Camera, 'Real experiences', 'Discover published tourism supply.'],
] as const;

export default function VisitorHome({ onAdmin }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>(fallback);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/v1/public/destinations', { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('destination request failed')))
      .then((payload: { data?: { items?: unknown[] } }) => {
        const items = Array.isArray(payload.data?.items) ? payload.data.items : [];
        const mapped = items.slice(0, 5).map((item) => {
          const d = item as Record<string, unknown>;
          const name = typeof d.name === 'string' ? d.name : 'Destination';
          return { id: typeof d.id === 'string' ? d.id : name, slug: typeof d.slug === 'string' ? d.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, province: typeof d.provinceCode === 'string' ? d.provinceCode : typeof d.province === 'string' ? d.province : '', description: typeof d.description === 'string' ? d.description : 'Discover a published destination from Papua New Guinea.', media: Array.isArray(d.media) ? d.media as Array<{ publicUrl?: string }> : [] } satisfies Destination;
        });
        if (mapped.length) setDestinations(mapped);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return destinations;
    return destinations.filter((d) => `${d.name} ${d.province} ${d.description}`.toLowerCase().includes(term));
  }, [destinations, query]);
  const scroll = (id: string) => { setMobileOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const heroFor = (destination: Destination) => destination.media?.[0]?.publicUrl || destinationHeroImages[destination.slug] || heroImage;
  const guideFor = (destination: Destination) => destinationGuideUrls[destination.slug] || 'https://papuanewguinea.travel/where-to-go/';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#031217] text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#031217]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <a href="#top" aria-label="PNG Tourism Promotion Authority home" className="shrink-0 rounded-xl bg-white px-3 py-2 shadow-lg"><img src={tpaLogo} alt="Papua New Guinea Tourism Promotion Authority" className="h-10 w-[170px] object-contain sm:h-11 sm:w-[195px]" /></a>
          <nav className={`${mobileOpen ? 'absolute left-3 right-3 top-[72px] flex' : 'hidden'} flex-col gap-1 rounded-2xl border border-white/10 bg-[#06252c] p-3 shadow-2xl lg:static lg:flex lg:flex-row lg:items-center lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>
            {[['Destinations', 'destinations'], ['Experiences', 'experiences'], ['Plan your trip', 'trip'], ['AI Concierge', 'concierge'], ['About PNG', 'about']].map(([label, id]) => <button key={id} onClick={() => scroll(id)} className="rounded-full px-3 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">{label}</button>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => scroll('destinations')} className="hidden rounded-full p-2 text-white/80 hover:bg-white/10 sm:block" aria-label="Search destinations"><Search size={20} /></button>
            <button onClick={() => scroll('destinations')} className="hidden rounded-full border border-[#b8ff89]/60 bg-[#164d31] px-5 py-2.5 text-sm font-bold shadow-lg hover:bg-[#21683f] sm:block">Explore PNG</button>
            <button onClick={() => setMobileOpen((open) => !open)} className="rounded-full p-2 hover:bg-white/10 lg:hidden" aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
          <div className="hidden w-[145px] shrink-0 font-serif text-lg font-bold italic leading-none text-white lg:block">A million<br />different journeys</div>
        </div>
      </header>

      <main id="top">
        <section className="relative min-h-[720px] overflow-hidden border-b border-white/10 pt-20">
          <img src={heroImage} alt="Milne Bay, Papua New Guinea" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,18,23,.88)_0%,rgba(2,18,23,.45)_52%,rgba(2,18,23,.12)_100%)]" /><div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,18,23,.96)_0%,transparent_34%,rgba(2,18,23,.25)_100%)]" />
          <div className="relative mx-auto flex min-h-[640px] max-w-[1500px] items-end px-5 pb-14 sm:px-8 lg:px-20"><div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] backdrop-blur-md"><MapPin size={14} /> Milne Bay Province</div>
            <h1 className="max-w-5xl text-6xl font-black leading-[.9] tracking-[-.055em] sm:text-7xl lg:text-[88px]">Discover<br /><span className="text-[#d5ffa5]">Papua New Guinea</span></h1>
            <p className="mt-6 max-w-3xl text-xl font-medium leading-8 text-white/90 sm:text-2xl">Extraordinary people. Breathtaking places. A million different journeys.</p>
            <div className="mt-8 flex max-w-2xl overflow-hidden rounded-full border border-white/70 bg-white p-1.5 shadow-2xl"><Search className="m-3 shrink-0 text-slate-700" size={22} /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && scroll('destinations')} placeholder="Search destinations, experiences or provinces..." aria-label="Search destinations, experiences or provinces" className="min-w-0 flex-1 bg-transparent px-2 text-base text-slate-800 outline-none placeholder:text-slate-500" /><button onClick={() => scroll('destinations')} className="rounded-full bg-[#195b35] px-7 py-3 font-bold text-white hover:bg-[#257443]">Search</button></div>
          </div></div>
        </section>

        <section className="border-b border-white/10 bg-[#061f25] px-5 py-8 sm:px-8 lg:px-14"><div className="mx-auto grid max-w-[1500px] gap-3 sm:grid-cols-2 lg:grid-cols-4">{primaryJourneys.map(([title, text, Icon, id]) => <button key={id} onClick={() => scroll(id)} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#b8ff89]/40 hover:bg-white/[.06]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#b8ff89]/10 text-[#b8ff89]"><Icon size={21} /></span><span className="min-w-0"><strong className="block text-base">{title}</strong><small className="mt-1 block text-sm text-white/55">{text}</small></span><ArrowRight className="ml-auto shrink-0 text-white/30 transition group-hover:translate-x-1 group-hover:text-[#b8ff89]" size={17} /></button>)}</div></section>

        <section id="destinations" className="bg-[#061f25] px-5 py-14 sm:px-8 lg:px-14"><div className="mx-auto max-w-[1500px]">
          <div className="flex items-end justify-between gap-5"><div><div className="text-xs font-black uppercase tracking-[.22em] text-[#b8ff89]">Explore PNG</div><h2 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Featured Destinations</h2></div><button onClick={() => scroll('destination-explorer')} className="hidden items-center gap-2 text-sm font-bold text-[#b8ff89] sm:flex">View all <ArrowRight size={17} /></button></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{filtered.map((destination) => <a key={destination.id} href={guideFor(destination)} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b3038] shadow-xl transition duration-300 hover:-translate-y-1 hover:border-[#b8ff89]/50"><div className="relative aspect-[1.35] overflow-hidden"><img src={heroFor(destination)} alt={destination.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#061f25] via-transparent to-transparent" /><span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold backdrop-blur">{destination.province}</span></div><div className="p-4"><h3 className="text-lg font-black">{destination.name}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-white/60">{destination.description}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#b8ff89]">Explore destination <ArrowRight size={14} /></span></div></a>)}</div>
          <div id="destination-explorer" className="mt-10"><DestinationExplorer /></div>
        </div></section>

        <section id="experiences" className="border-t border-white/10 bg-[#04181d] px-5 py-16 sm:px-8 lg:px-14"><div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><div className="text-xs font-black uppercase tracking-[.2em] text-[#b8ff89]">Go beyond the postcard</div><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Find experiences worth remembering.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-white/60">Connect with published tourism experiences, local operators and the people who make every journey different.</p></div><VisitorIndustryTripIntegration /></div></section>
        <section id="trip" className="border-t border-white/10 bg-[#06242b] px-5 py-16 sm:px-8 lg:px-14"><div className="mx-auto max-w-[1500px]"><TripPlanner /></div></section>
        <section id="concierge" className="border-t border-white/10 bg-[#04181d] px-5 py-16 sm:px-8 lg:px-14"><div className="mx-auto max-w-[1200px]"><AiConcierge /></div></section>
        <section id="passport" className="border-t border-white/10 bg-[#061f25] px-5 py-16 sm:px-8 lg:px-14"><div className="mx-auto max-w-[1200px]"><DigitalPassport /></div></section>
        <section id="about" className="border-t border-white/10 bg-[#03151b] px-5 py-12 sm:px-8 lg:px-14"><div className="mx-auto flex max-w-[1500px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="rounded-xl bg-white px-3 py-2"><img src={tpaLogo} alt="PNG Tourism Promotion Authority" className="h-11 w-[180px] object-contain" /></div><p className="max-w-xl text-sm leading-6 text-white/55">The national tourism platform connecting visitors, destinations, tourism businesses and trusted public information across Papua New Guinea.</p></div><button onClick={onAdmin} className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold hover:bg-white/10">TPA Command Centre</button></div></section>
        <section className="border-t border-white/10 bg-[#021217]"><div className="mx-auto grid max-w-[1500px] gap-0 sm:grid-cols-2 lg:grid-cols-5">{trustSignals.map(([Icon, title, text]) => <div key={title} className="flex items-center gap-4 border-white/10 p-7 sm:border-r"><Icon className="shrink-0 text-[#b8ff89]" size={31} /><div><strong className="block text-base">{title}</strong><span className="text-sm text-white/45">{text}</span></div></div>)}</div></section>
      </main>
    </div>
  );
}
