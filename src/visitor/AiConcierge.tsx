import { useMemo, useState } from 'react';
import { Bot, ChevronRight, CircleAlert, Compass, Loader2, MapPin, MessageCircle, Send, ShieldCheck, Sparkles, WifiOff } from 'lucide-react';
import { apiFetch } from '../api';

type Source = { id:string; kind:string; title:string; provenance:string; publicationStatus:'published' };
type Response = { sessionId:string; answer:string; sources:Source[]; modelVersion:string; promptVersion:string; governed:true; refused?:boolean; refusalReason?:string };

type Message = { role:'user'|'assistant'; text:string; sources?:Source[]; refused?:boolean };

const suggestions = [
  'What should I see in Port Moresby?',
  'Find a published tourism experience',
  'Which operators can I explore?',
];

export default function AiConcierge() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [error, setError] = useState('');
  const sessionId = useMemo(() => localStorage.getItem('png-ai-session') || '', []);

  async function ask(text = message) {
    const value = text.trim();
    if (!value || busy) return;
    setMessage(''); setError(''); setMessages(current => [...current, { role:'user', text:value }]); setBusy(true);
    try {
      if (!navigator.onLine) throw new Error('offline');
      const response = await apiFetch('/api/v1/ai/concierge', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ message:value, ...(sessionId ? { sessionId } : {}) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'The Concierge is temporarily unavailable.');
      const data = payload.data as Response;
      if (data.sessionId) localStorage.setItem('png-ai-session', data.sessionId);
      setOffline(false);
      setMessages(current => [...current, { role:'assistant', text:data.answer, sources:data.sources, refused:data.refused }]);
    } catch (e) {
      if ((e as Error).message === 'offline') { setOffline(true); setError('The Concierge needs a connection for a live governed answer. Your saved trip and cached tourism content remain available.'); }
      else setError((e as Error).message);
    } finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-300"><Sparkles size={18}/><span className="text-xs font-bold uppercase tracking-[0.2em]">PNG Tourism Concierge</span></div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">Plan your Papua New Guinea journey with governed AI.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Ask about published destinations, experiences and operators. Recommendations are grounded in the tourism platform's approved public sources.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 lg:w-72"><div className="flex items-center gap-2 font-semibold"><ShieldCheck size={17} className="text-emerald-300"/> Governed assistance</div><p className="mt-2 text-xs leading-5 text-slate-400">Published sources only. Private, regulatory and unpublished information is excluded.</p></div>
      </div>
    </div>

    <div className="grid gap-5 lg:grid-cols-[1.5fr_0.75fr]">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><Bot size={20}/></div><div><h3 className="font-bold">Concierge chat</h3><p className="text-xs text-slate-500">Published tourism guidance</p></div></div>{offline ? <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700"><WifiOff size={14}/> Offline</span> : <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500"/> Live</span>}</div>
        <div className="min-h-[360px] space-y-4 p-5">
          {messages.length === 0 && <div className="flex min-h-[280px] flex-col items-center justify-center text-center"><div className="rounded-full bg-slate-100 p-4"><MessageCircle size={28} className="text-slate-500"/></div><h4 className="mt-4 font-bold">Where would you like to go?</h4><p className="mt-1 max-w-md text-sm text-slate-500">Start with a destination, activity or operator. The Concierge will use governed published tourism sources.</p></div>}
          {messages.map((item, index) => <div key={index} className={item.role === 'user' ? 'ml-auto max-w-[85%] rounded-2xl bg-emerald-700 px-4 py-3 text-sm text-white' : 'max-w-[92%] rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800'}><div className="whitespace-pre-wrap leading-6">{item.text}</div>{item.refused && <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-700"><CircleAlert size={14}/> Governed refusal</div>}{item.sources && item.sources.length > 0 && <div className="mt-4 space-y-2 border-t border-slate-200 pt-3"><div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Sources</div>{item.sources.slice(0,4).map(source => <div key={source.id} className="flex items-center gap-2 text-xs text-slate-600"><Compass size={13}/><span className="font-semibold">{source.title}</span><span className="text-slate-400">· published</span></div>)}</div>}</div>)}
          {busy && <div className="flex max-w-[92%] items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500"><Loader2 size={16} className="animate-spin"/> Checking governed tourism sources…</div>}
          {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}
        </div>
        <div className="border-t border-slate-100 p-4"><div className="flex flex-wrap gap-2 pb-3">{suggestions.map(suggestion => <button key={suggestion} onClick={() => ask(suggestion)} disabled={busy || offline} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{suggestion}</button>)}</div><form onSubmit={e => {e.preventDefault(); ask();}} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2"><input value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask the PNG Tourism Concierge…" disabled={busy || offline} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:text-slate-500"/><button type="submit" disabled={!message.trim() || busy || offline} className="rounded-xl bg-slate-950 p-3 text-white disabled:cursor-not-allowed disabled:opacity-40"><Send size={17}/></button></form></div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-sm font-bold"><MapPin size={17} className="text-emerald-700"/> Journey context</div><p className="mt-2 text-sm leading-6 text-slate-500">Connect the Concierge to your published itinerary and visitor context without exposing private platform records.</p><div className="mt-4 space-y-2 text-xs"><div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Trip planner</span><span className="font-semibold text-emerald-700">Available</span></div><div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Published content</span><span className="font-semibold text-emerald-700">Governed</span></div><div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Offline answers</span><span className="font-semibold text-slate-500">Disabled</span></div></div></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck size={17} className="text-emerald-700"/> Trust & provenance</div><p className="mt-2 text-sm leading-6 text-slate-500">Every live response is produced through the governed Concierge service and can expose its published source references.</p><button className="mt-4 flex items-center gap-1 text-sm font-semibold text-emerald-700">How this works <ChevronRight size={15}/></button></div>
      </aside>
    </div>
  </div>;
}
