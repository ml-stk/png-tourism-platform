import { Compass, MapPinned, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function VisualExperience({ onExplore, onConcierge }: { onExplore: () => void; onConcierge: () => void }) {
  return <div className="overflow-hidden rounded-[2rem] bg-[#071b2a] text-white shadow-2xl">
    <div className="relative isolate px-6 py-14 sm:px-10 lg:px-14 lg:py-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(15,139,141,.45),transparent_35%),radial-gradient(circle_at_15%_80%,rgba(24,121,78,.35),transparent_35%)]" />
      <div className="max-w-3xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-[#a9e4d8]"><Sparkles size={14}/> Discover Papua New Guinea</div>
        <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Where the Pacific feels extraordinary.</h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">Explore remarkable places, local experiences and trusted tourism operators — with a digital journey designed for Papua New Guinea.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={onExplore} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f4b942] px-5 py-3 font-bold text-[#071b2a] transition hover:-translate-y-0.5"><Compass size={18}/> Explore tourism <ArrowRight size={16}/></button>
          <button onClick={onConcierge} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold backdrop-blur transition hover:bg-white/15"><Sparkles size={18}/> Ask the AI Concierge</button>
        </div>
      </div>
    </div>
    <div className="grid gap-px bg-white/10 sm:grid-cols-3">
      {[['Province-first','Discover local places and experiences'],['Offline-ready','Journeys built for real connectivity conditions'],['Trusted sources','Published tourism information, governed end-to-end']].map(([title,text]) => <div key={title} className="bg-white/[.045] p-5"><div className="flex items-center gap-2 font-bold"><ShieldCheck size={16} className="text-[#f4b942]"/>{title}</div><p className="mt-2 text-sm leading-6 text-slate-300">{text}</p></div>)}
    </div>
    <div className="flex items-center justify-between border-t border-white/10 bg-black/10 px-6 py-4 text-sm text-slate-300 sm:px-10"><span className="inline-flex items-center gap-2"><MapPinned size={16}/> National tourism platform</span><span className="font-semibold text-[#a9e4d8]">PNG Tourism Authority</span></div>
  </div>;
}
