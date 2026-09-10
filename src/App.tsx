import { useState } from 'react';
import { BarChart3, Compass, FileText, LayoutDashboard, Menu, Map, Megaphone, Settings, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import { destinations, operators } from './data';
import TripPlanner from './visitor/TripPlanner';
import IndustryDiscovery from './visitor/IndustryDiscovery';
import VisitorIndustryTripIntegration from './visitor/VisitorIndustryTripIntegration';
import AiConcierge from './visitor/AiConcierge';
import CommandCentre from './command-centre/CommandCentre';
import ActivationHub from './activation/ActivationHub';
import VisualExperience from './VisualExperience';

type View = 'overview' | 'visitor' | 'industry' | 'destinations' | 'activations' | 'insights';
const nav: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Command Centre', icon: LayoutDashboard }, { id: 'visitor', label: 'Visitor Experience', icon: Map },
  { id: 'industry', label: 'Industry Ecosystem', icon: Users }, { id: 'destinations', label: 'Destinations & Content', icon: Compass },
  { id: 'activations', label: 'Campaigns & Events', icon: Megaphone }, { id: 'insights', label: 'Tourism Intelligence', icon: BarChart3 },
];

function App() {
  const [view, setView] = useState<View>('overview'); const [open, setOpen] = useState(false);
  const go = (next: View) => { setView(next); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <div className="png-shell min-h-screen">
    <aside className={`png-sidebar fixed inset-y-0 left-0 z-30 w-72 border-r p-5 text-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between"><button onClick={() => go('overview')} className="flex items-center gap-3 text-left"><span className="png-brand-mark flex h-10 w-10 items-center justify-center rounded-xl font-black">PNG</span><span><span className="block text-xs font-bold uppercase tracking-[.18em] text-[#8fd5c8]">Tourism Authority</span><span className="mt-0.5 block text-lg font-black">Tourism Platform</span></span></button><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button></div>
      <div className="mt-10 space-y-1">{nav.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => go(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${view === item.id ? 'png-nav-active' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Icon size={18}/>{item.label}</button> })}</div>
      <div className="absolute bottom-5 left-5 right-5 png-status rounded-2xl p-4"><div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck size={16} className="text-[#f4b942]"/> Platform status</div><div className="mt-2 text-xs text-slate-300">Governed services online</div><div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#8fd5c8]"><span className="h-2 w-2 rounded-full bg-emerald-400"/> All core modules connected</div></div>
    </aside>
    <main className="lg:pl-72">
      <header className="png-header sticky top-0 z-20 border-b px-5 py-4 backdrop-blur lg:px-8"><div className="flex items-center justify-between"><button className="lg:hidden text-white" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu/></button><div><div className="png-kicker text-xs font-bold uppercase tracking-[.16em]">Papua New Guinea Tourism Authority</div><h1 className="mt-1 text-xl font-black tracking-tight">{nav.find(n => n.id === view)?.label}</h1></div><div className="hidden items-center gap-2 text-sm font-semibold text-slate-300 sm:flex"><Settings size={16}/> Platform Admin</div></div></header>
      <section className="png-content px-4 py-5 sm:px-6 lg:p-8">
        {view === 'overview' && <div className="space-y-8"><VisualExperience onExplore={() => go('visitor')} onConcierge={() => go('visitor')}/><CommandCentre/></div>}
        {view === 'visitor' && <div className="space-y-8"><VisualExperience onExplore={() => window.scrollTo({top:600,behavior:'smooth'})} onConcierge={() => document.getElementById('ai-concierge')?.scrollIntoView({behavior:'smooth'})}/><div id="ai-concierge"><AiConcierge/></div><VisitorIndustryTripIntegration/><TripPlanner/></div>}
        {view === 'industry' && <div className="space-y-8"><PageIntro title="Industry ecosystem" text="Connect visitors with trusted tourism businesses, experiences and enquiry journeys."/><IndustryDiscovery/><IndustryAdmin/></div>}
        {view === 'destinations' && <Destinations/>}{view === 'activations' && <ActivationHub/>}{view === 'insights' && <Insights/>}
      </section>
    </main>
  </div>;
}
function IndustryAdmin() { return <div className="space-y-6"><PageIntro title="Industry administration" text="Operator-facing administration remains separate from the visitor discovery journey."/><div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-100/80 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Operator</th><th className="p-4">Category</th><th className="p-4">Province</th><th className="p-4">Status</th></tr></thead><tbody>{operators.map(o => <tr key={o.id} className="border-t border-slate-100"><td className="p-4 font-semibold">{o.name}</td><td className="p-4 text-slate-600">{o.category}</td><td className="p-4 text-slate-600">{o.province}</td><td className="p-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{o.status}</span></td></tr>)}</tbody></table></div></div> }
function Destinations() { return <div className="space-y-6"><PageIntro title="Destinations & content" text="The content layer powering public discovery, campaigns, provincial channels and future mobile experiences."/><div className="grid gap-5 md:grid-cols-2">{destinations.map(d => <article key={d.id} className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between"><div><h3 className="font-bold">{d.name}</h3><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{d.province}</div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{d.status}</span></div><p className="mt-4 text-sm leading-6 text-slate-600">{d.description}</p></article>)}</div></div> }
function Insights() { return <div className="space-y-6"><PageIntro title="Tourism intelligence" text="The intelligence layer consolidates visitor, industry, destination and governed operational signals into actionable reporting."/><div className="grid gap-5 md:grid-cols-3"><Insight icon={BarChart3} title="Executive intelligence" text="National performance, trends and strategic indicators."/><Insight icon={Map} title="Provincial intelligence" text="Destination activity, operator health and local opportunity signals."/><Insight icon={FileText} title="Regulatory reporting" text="Licensing, compliance, registrations and audit evidence."/></div></div> }
function PageIntro({title,text}:{title:string;text:string}) { return <div><h2 className="png-section-title text-3xl font-black tracking-tight">{title}</h2><p className="mt-2 max-w-3xl text-slate-600">{text}</p></div> }
function Insight({icon:Icon,title,text}:{icon:typeof BarChart3;title:string;text:string}) { return <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm"><Icon className="text-[#0b6477]"/><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div> }
export default App;
