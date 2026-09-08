import { useState } from 'react';
import { BarChart3, Compass, FileText, LayoutDashboard, Menu, Map, Settings, ShieldCheck, Users, X } from 'lucide-react';
import { destinations, metrics, operators } from './data';

type View = 'overview' | 'industry' | 'destinations' | 'insights';

const nav: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Command Centre', icon: LayoutDashboard },
  { id: 'industry', label: 'Industry Ecosystem', icon: Users },
  { id: 'destinations', label: 'Destinations & Content', icon: Compass },
  { id: 'insights', label: 'Tourism Intelligence', icon: BarChart3 },
];

function App() {
  const [view, setView] = useState<View>('overview');
  const [open, setOpen] = useState(false);

  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <aside className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-200 bg-white p-5 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between">
        <div><div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">PNG TPA</div><div className="mt-1 text-lg font-bold">Tourism Platform</div></div>
        <button className="lg:hidden" onClick={() => setOpen(false)}><X /></button>
      </div>
      <div className="mt-10 space-y-1">{nav.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => { setView(item.id); setOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${view === item.id ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={18}/>{item.label}</button> })}</div>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-slate-900 p-4 text-white"><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={16}/> Platform status</div><div className="mt-2 text-xs text-slate-300">Architecture foundation online</div></div>
    </aside>

    <main className="lg:pl-72">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:px-8"><div className="flex items-center justify-between"><button className="lg:hidden" onClick={() => setOpen(true)}><Menu/></button><div><div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Papua New Guinea Tourism Authority</div><h1 className="mt-1 text-xl font-bold">{nav.find(n => n.id === view)?.label}</h1></div><div className="flex items-center gap-2 text-sm text-slate-500"><Settings size={16}/> Platform Admin</div></div></header>
      <section className="mx-auto max-w-7xl p-5 lg:p-8">{view === 'overview' && <Overview/>}{view === 'industry' && <Industry/>}{view === 'destinations' && <Destinations/>}{view === 'insights' && <Insights/>}</section>
    </main>
  </div>;
}

function Overview() { return <div className="space-y-8"><div className="rounded-3xl bg-slate-900 p-7 text-white lg:p-9"><div className="max-w-3xl"><div className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">NEXT-GENERATION DIGITAL TOURISM PLATFORM</div><h2 className="text-3xl font-bold tracking-tight lg:text-4xl">One connected platform for visitors, industry and tourism intelligence.</h2><p className="mt-4 max-w-2xl text-slate-300">A new foundation for destination discovery, operator services, content, analytics and TPA regulatory operations.</p></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map(m => <div key={m.label} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-sm text-slate-500">{m.label}</div><div className="mt-2 text-3xl font-bold">{m.value}</div><div className="mt-2 text-xs font-semibold text-emerald-700">{m.change}</div></div>)}</div><div className="grid gap-6 lg:grid-cols-2"><Panel title="Priority workstreams"><Work title="Visitor experience" text="Web, mobile/PWA, kiosk, QR handoffs and offline journeys."/><Work title="Industry ecosystem" text="Operator profiles, licensing, services, leads and partner connectivity."/><Work title="Content & campaigns" text="Destinations, events, experiences, media and campaign publishing."/><Work title="Tourism intelligence" text="Executive dashboards, provincial insights and operational reporting."/></Panel><Panel title="Platform guardrails"><Work title="Security by design" text="RBAC, auditability, least privilege and integration boundaries."/><Work title="API-first" text="Shared platform services rather than separate channel silos."/><Work title="Offline-first" text="Designed for PNG connectivity realities across visitor and provincial channels."/><Work title="AI-ready" text="AI concierge and intelligence capabilities built on governed platform data."/></Panel></div></div> }
function Industry() { return <div className="space-y-6"><PageIntro title="Industry ecosystem" text="A single industry layer connecting tourism businesses with TPA services and visitor demand."/><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Operator</th><th className="p-4">Category</th><th className="p-4">Province</th><th className="p-4">Status</th></tr></thead><tbody>{operators.map(o => <tr key={o.id} className="border-t border-slate-100"><td className="p-4 font-semibold">{o.name}</td><td className="p-4 text-slate-600">{o.category}</td><td className="p-4 text-slate-600">{o.province}</td><td className="p-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{o.status}</span></td></tr>)}</tbody></table></div></div> }
function Destinations() { return <div className="space-y-6"><PageIntro title="Destinations & content" text="The content layer that powers public discovery, campaigns, provincial channels and future mobile experiences."/><div className="grid gap-5 md:grid-cols-2">{destinations.map(d => <article key={d.id} className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-start justify-between"><div><h3 className="font-bold">{d.name}</h3><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{d.province}</div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{d.status}</span></div><p className="mt-4 text-sm leading-6 text-slate-600">{d.description}</p></article>)}</div></div> }
function Insights() { return <div className="space-y-6"><PageIntro title="Tourism intelligence" text="The intelligence layer will consolidate visitor, industry, destination and regulatory signals into actionable reporting."/><div className="grid gap-5 md:grid-cols-3"><Insight icon={BarChart3} title="Executive intelligence" text="National performance, trends and strategic indicators."/><Insight icon={Map} title="Provincial intelligence" text="Destination activity, operator health and local opportunity signals."/><Insight icon={FileText} title="Regulatory reporting" text="Licensing, compliance, registrations and audit evidence."/></div><div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><BarChart3 className="mx-auto text-slate-400"/><h3 className="mt-3 font-bold">Analytics pipeline next</h3><p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">The UI foundation is in place. The next implementation step is to connect governed platform data and replace demo metrics with live services.</p></div></div> }
function Panel({title,children}:{title:string;children:React.ReactNode}) { return <div className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-bold">{title}</h3><div className="mt-5 space-y-4">{children}</div></div> }
function Work({title,text}:{title:string;text:string}) { return <div><div className="font-semibold text-slate-800">{title}</div><div className="mt-1 text-sm leading-6 text-slate-500">{text}</div></div> }
function PageIntro({title,text}:{title:string;text:string}) { return <div><h2 className="text-3xl font-bold tracking-tight">{title}</h2><p className="mt-2 max-w-3xl text-slate-600">{text}</p></div> }
function Insight({icon:Icon,title,text}:{icon:typeof BarChart3;title:string;text:string}) { return <div className="rounded-2xl border border-slate-200 bg-white p-6"><Icon className="text-emerald-700"/><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div> }

export default App;
