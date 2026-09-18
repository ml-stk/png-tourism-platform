import { useState } from 'react';
import { Bot, Compass, Home, MapPin, Menu, QrCode, Shield, Sparkles, Users, X } from 'lucide-react';
import DestinationExplorer from '../visitor/DestinationExplorer';
import TripPlanner from '../visitor/TripPlanner';
import DigitalPassport from '../visitor/DigitalPassport';
import AiConcierge from '../visitor/AiConcierge';

const MODE_LABELS = { 'super-app': 'Super App', kiosk: 'Kiosk' } as const;
type Mode = keyof typeof MODE_LABELS;

function ModeBar({ mode }: { mode: Mode }) {
  const other = mode === 'kiosk' ? 'super-app' : 'kiosk';
  return <div className="fixed inset-x-0 top-0 z-[70] flex items-center justify-between border-b border-white/10 bg-[#03151b]/95 px-4 py-2 text-white backdrop-blur-xl">
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em]"><span className="rounded-full bg-[#a8f17a]/15 px-2 py-1 text-[#a8f17a]">NTDP demo</span>{MODE_LABELS[mode]} mode</div>
    <a href={`?mode=${other}`} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">Try {MODE_LABELS[other]}</a>
  </div>;
}

export function SuperAppMode() {
  const [tab, setTab] = useState<'home'|'discover'|'plan'|'passport'|'concierge'>('home');
  const tabs = [
    ['home', Home, 'Home'], ['discover', Compass, 'Explore'], ['plan', MapPin, 'Plan'], ['passport', Shield, 'Passport'], ['concierge', Bot, 'Concierge'],
  ] as const;
  return <div className="min-h-screen bg-[#04181d] pb-24 pt-12 text-white">
    <ModeBar mode="super-app" />
    <header className="mx-auto flex max-w-xl items-center justify-between px-5 py-5">
      <div><div className="text-xs font-black uppercase tracking-[.2em] text-[#a8f17a]">Papua New Guinea</div><h1 className="mt-1 text-2xl font-black">Tourism Super App</h1></div>
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><Sparkles size={19}/></div>
    </header>
    <main className="mx-auto max-w-xl px-4">
      {tab === 'home' && <div className="space-y-5">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b6477] to-[#06242b] p-6 shadow-2xl">
          <div className="text-xs font-black uppercase tracking-[.18em] text-[#a8f17a]">Your PNG journey</div><h2 className="mt-3 text-4xl font-black leading-tight">One app for places, plans and trusted travel information.</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">Discover published destinations, build an itinerary and keep key journey information available when connectivity drops.</p>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setTab('discover')} className="rounded-2xl bg-white/10 p-5 text-left"><Compass/><strong className="mt-3 block">Explore PNG</strong><span className="mt-1 block text-xs text-white/55">Destinations & experiences</span></button>
          <button onClick={() => setTab('plan')} className="rounded-2xl bg-white/10 p-5 text-left"><MapPin/><strong className="mt-3 block">Plan a trip</strong><span className="mt-1 block text-xs text-white/55">Build your journey</span></button>
          <button onClick={() => setTab('passport')} className="rounded-2xl bg-white/10 p-5 text-left"><Shield/><strong className="mt-3 block">Digital passport</strong><span className="mt-1 block text-xs text-white/55">Journey moments</span></button>
          <button onClick={() => setTab('concierge')} className="rounded-2xl bg-white/10 p-5 text-left"><Bot/><strong className="mt-3 block">AI Concierge</strong><span className="mt-1 block text-xs text-white/55">Travel assistance</span></button>
        </div>
        <section className="rounded-2xl border border-[#a8f17a]/20 bg-[#a8f17a]/5 p-5"><div className="flex items-start gap-3"><Users className="mt-0.5 text-[#a8f17a]"/><div><strong className="block">Trusted tourism information</strong><p className="mt-1 text-sm leading-6 text-white/60">Visitor-facing content is drawn from governed destination and tourism services.</p></div></div></section>
      </div>}
      {tab === 'discover' && <DestinationExplorer/>}
      {tab === 'plan' && <TripPlanner/>}
      {tab === 'passport' && <DigitalPassport/>}
      {tab === 'concierge' && <AiConcierge/>}
    </main>
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#03151b]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto grid max-w-xl grid-cols-5">{tabs.map(([id, Icon, label]) => <button key={id} onClick={() => setTab(id)} className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold ${tab === id ? 'text-[#a8f17a]' : 'text-white/50'}`}><Icon size={19}/>{label}</button>)}</div></nav>
  </div>;
}

export function KioskMode() {
  const [section, setSection] = useState<'home'|'destinations'|'plan'|'concierge'>('home');
  return <div className="min-h-screen bg-[#04181d] text-white pt-14">
    <ModeBar mode="kiosk" />
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10"><div><div className="text-sm font-black uppercase tracking-[.22em] text-[#a8f17a]">PNG Tourism Information Kiosk</div><h1 className="mt-2 text-4xl font-black sm:text-5xl">Welcome to Papua New Guinea</h1><p className="mt-2 max-w-3xl text-lg text-white/65">Explore destinations, plan a journey and get trusted visitor information.</p></div><div className="hidden rounded-3xl border border-white/10 bg-white/5 p-5 text-center sm:block"><QrCode className="mx-auto" size={48}/><div className="mt-2 text-xs font-bold uppercase tracking-wider text-white/60">Scan to continue</div></div></header>
    <main className="mx-auto max-w-7xl px-5 pb-12 lg:px-10">
      {section === 'home' && <div className="grid gap-5 md:grid-cols-3"><button onClick={() => setSection('destinations')} className="min-h-48 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b6477] to-[#06242b] p-7 text-left shadow-xl"><Compass size={42}/><strong className="mt-6 block text-2xl">Explore destinations</strong><span className="mt-2 block text-white/60">Browse published destinations across PNG.</span></button><button onClick={() => setSection('plan')} className="min-h-48 rounded-3xl border border-white/10 bg-white/5 p-7 text-left shadow-xl"><MapPin size={42}/><strong className="mt-6 block text-2xl">Plan your journey</strong><span className="mt-2 block text-white/60">Build a visitor-safe itinerary.</span></button><button onClick={() => setSection('concierge')} className="min-h-48 rounded-3xl border border-white/10 bg-white/5 p-7 text-left shadow-xl"><Bot size={42}/><strong className="mt-6 block text-2xl">Ask the AI Concierge</strong><span className="mt-2 block text-white/60">Get assistance with your PNG journey.</span></button></div>}
      {section !== 'home' && <div><button onClick={() => setSection('home')} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-base font-bold hover:bg-white/10"><X size={18}/> Kiosk home</button>{section === 'destinations' && <DestinationExplorer/>}{section === 'plan' && <TripPlanner/>}{section === 'concierge' && <AiConcierge/>}</div>}
    </main>
  </div>;
}
