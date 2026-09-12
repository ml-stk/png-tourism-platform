import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { BadgeCheck, BookOpenCheck, CheckCircle2, Clock3, Download, ShieldCheck, Sparkles } from 'lucide-react';

type VisitState = { visitedAt: string; verified: boolean };
type Destination = { id: string; name: string; provinceCode?: string; province?: string };
type QrData = { targetName: string; verificationUrl: string; dataUrl: string; expiresAt: string };

const passportKey = 'png-tourism:visitor-passport:v2';
const passportEvent = 'png-passport-updated';

function loadVisits(): Record<string, VisitState> { try { const value = localStorage.getItem(passportKey); return value ? JSON.parse(value) as Record<string, VisitState> : {}; } catch { return {}; } }
function saveVisits(value: Record<string, VisitState>) { localStorage.setItem(passportKey, JSON.stringify(value)); window.dispatchEvent(new CustomEvent(passportEvent)); }

async function verifyToken(token: string) {
  const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('/api/v1/public/passport/verify', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ verificationToken: token }), signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || 'Visit verification failed.');
    return payload.data as { verified: boolean; destination: { id: string; name: string; provinceCode: string }; verifiedAt: string; expiresAt: string };
  } finally { window.clearTimeout(timer); }
}

export default function DigitalPassport() {
  const [visits, setVisits] = useState<Record<string, VisitState>>(() => loadVisits());
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [verification, setVerification] = useState<{ status: 'idle' | 'verifying' | 'verified' | 'error'; message: string }>({ status: 'idle', message: '' });
  const [qr, setQr] = useState<QrData | null>(null);
  const [qrLoading, setQrLoading] = useState<string>('');

  useEffect(() => { const onUpdate = () => setVisits(loadVisits()); window.addEventListener(passportEvent, onUpdate); return () => window.removeEventListener(passportEvent, onUpdate); }, []);
  useEffect(() => { fetch('/api/v1/public/destinations', { headers: { accept: 'application/json' } }).then(response => response.ok ? response.json() : Promise.reject()).then(payload => { const items = Array.isArray(payload?.data?.items) ? payload.data.items : Array.isArray(payload?.data) ? payload.data : []; setDestinations(items.map((item: any) => ({ id: String(item.id), name: String(item.name), provinceCode: item.provinceCode, province: item.province }))); }).catch(() => undefined); }, []);

  useEffect(() => {
    const url = new URL(window.location.href); const token = url.searchParams.get('verification'); if (!token) return;
    setVerification({ status: 'verifying', message: 'Verifying this signed destination visit…' });
    void verifyToken(token).then(result => {
      const next = { ...loadVisits(), [result.destination.id]: { visitedAt: result.verifiedAt, verified: true } }; saveVisits(next); setVisits(next);
      setVerification({ status: 'verified', message: `Visit verified for ${result.destination.name}.` });
      url.searchParams.delete('verification'); window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }).catch(error => setVerification({ status: 'error', message: error instanceof Error ? error.message : 'This QR visit could not be verified.' }));
  }, []);

  const createQr = async (destination: Destination) => {
    setQrLoading(destination.id);
    try {
      const response = await fetch(`/api/v1/public/qr/resolve?type=destination&id=${encodeURIComponent(destination.id)}`, { headers: { accept: 'application/json' } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'QR generation failed.');
      const token = payload?.data?.verificationToken;
      if (typeof token !== 'string' || !token) throw new Error('QR verification credential was not returned.');
      const url = new URL(window.location.href); url.searchParams.set('verification', token);
      const verificationUrl = url.toString();
      const dataUrl = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H', margin: 2, width: 320 });
      setQr({ targetName: destination.name, verificationUrl, dataUrl, expiresAt: String(payload.data.expiresAt) });
    } catch (error) { setVerification({ status: 'error', message: error instanceof Error ? error.message : 'QR generation failed.' }); }
    finally { setQrLoading(''); }
  };

  const records = useMemo(() => Object.entries(visits).map(([id, state]) => ({ id, state, destination: destinations.find(item => item.id === id) })), [destinations, visits]);
  const verifiedCount = records.filter(record => record.state.verified).length;

  return <div className="space-y-6">
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#315c2f] via-[#164c48] to-[#082d35] p-7 shadow-2xl sm:p-9">
        <div className="flex items-start justify-between gap-5"><div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/15 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-[#c9ff9c]"><ShieldCheck size={14}/> Visitor record</div><h3 className="mt-4 text-3xl font-black sm:text-4xl">Your Digital Tourism Passport</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Keep a local record of your journey. Verified destination visits are added only when a signed PNG Tourism QR credential is accepted by the public verification service.</p></div><div className="hidden h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10 sm:grid"><BookOpenCheck size={30}/></div></div>
        {verification.status !== 'idle' && <div className={`mt-6 rounded-2xl border p-4 ${verification.status === 'verified' ? 'border-emerald-200/30 bg-emerald-300/10' : verification.status === 'error' ? 'border-rose-200/30 bg-rose-300/10' : 'border-white/10 bg-black/10'}`} role="status"><div className="flex items-center gap-3">{verification.status === 'verified' ? <BadgeCheck className="text-[#c9ff9c]"/> : verification.status === 'error' ? <Clock3/> : <Sparkles className="animate-pulse"/>}<div><div className="font-bold">{verification.status === 'verified' ? 'Verified visit recorded' : verification.status === 'error' ? 'Verification unavailable' : 'Verifying visit'}</div><div className="mt-1 text-sm text-white/65">{verification.message}</div></div></div></div>}
      </section>
      <section className="rounded-[2rem] border border-white/10 bg-[#0a2a31] p-7 shadow-xl sm:p-9"><div className="text-xs font-black uppercase tracking-[.18em] text-[#a8f17a]">Journey progress</div><div className="mt-3 text-5xl font-black">{verifiedCount}</div><div className="mt-1 text-sm text-white/55">verified destination visit{verifiedCount === 1 ? '' : 's'}</div><div className="mt-6 rounded-2xl bg-black/15 p-4 text-sm leading-6 text-white/65">Self-reported visits can be stored for planning, but they are never presented as verified.</div></section>
    </div>

    <section className="rounded-[2rem] border border-white/10 bg-[#08232a] p-6 shadow-xl sm:p-8"><div className="flex items-end justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-[.18em] text-[#a8f17a]">Passport entries</div><h3 className="mt-2 text-2xl font-black">Your journey record</h3></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">Stored on this device</span></div><div className="mt-5 grid gap-3 md:grid-cols-2">{records.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-7 text-sm text-white/55 md:col-span-2">No visits recorded yet. Add destinations to your itinerary, then use a governed destination QR to record a verified visit.</div> : records.map(({ id, state, destination }) => <article key={id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${state.verified ? 'bg-[#a8f17a]/15 text-[#c9ff9c]' : 'bg-white/10 text-white/60'}`}>{state.verified ? <BadgeCheck size={23}/> : <BookOpenCheck size={22}/>}</div><div className="min-w-0 flex-1"><div className="font-bold">{destination?.name ?? 'Published destination'}</div><div className="mt-1 text-xs text-white/45">{destination?.provinceCode ?? destination?.province ?? 'Papua New Guinea'} · {new Date(state.visitedAt).toLocaleString()}</div></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${state.verified ? 'bg-emerald-300/15 text-[#c9ff9c]' : 'bg-white/10 text-white/50'}`}>{state.verified ? 'Verified' : 'Self-reported'}</span></article>)}</div></section>

    <section className="rounded-[2rem] border border-white/10 bg-[#08232a] p-6 shadow-xl sm:p-8"><div><div className="text-xs font-black uppercase tracking-[.18em] text-[#a8f17a]">Destination verification</div><h3 className="mt-2 text-2xl font-black">Create a governed visit QR</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">Generate a signed, time-limited QR for a published destination. Scanning it on the visitor site opens the same passport and records a verified destination visit after server-side validation.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{destinations.map(destination => <button key={destination.id} onClick={() => void createQr(destination)} disabled={qrLoading === destination.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-4 text-left transition hover:border-[#a8f17a]/40 hover:bg-white/[.06] disabled:opacity-50"><div className="font-bold">{destination.name}</div><div className="mt-1 text-xs text-white/45">{destination.provinceCode ?? destination.province ?? 'PNG'}</div><div className="mt-3 text-xs font-bold text-[#b8ff89]">{qrLoading === destination.id ? 'Generating…' : 'Generate QR'}</div></button>)}</div></section>

    {qr && <section className="rounded-[2rem] border border-[#a8f17a]/30 bg-[#e9f5df] p-6 text-slate-900 shadow-2xl sm:p-8"><div className="grid gap-7 md:grid-cols-[auto_1fr] md:items-center"><div className="rounded-3xl bg-white p-4 shadow-lg"><img src={qr.dataUrl} alt={`Digital Passport verification QR for ${qr.targetName}`} className="h-64 w-64"/></div><div><div className="text-xs font-black uppercase tracking-[.18em] text-emerald-800">QR credential ready</div><h3 className="mt-2 text-3xl font-black">{qr.targetName}</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Scan this code with a phone camera to open the visitor-facing Passport verification flow. The credential is signed and expires automatically.</p><div className="mt-4 flex flex-wrap gap-3"><a href={qr.dataUrl} download={`png-passport-${qr.targetName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"><Download size={16}/> Save QR</a><span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-slate-600"><CheckCircle2 size={15} className="text-emerald-700"/> Expires {new Date(qr.expiresAt).toLocaleString()}</span></div><code className="mt-4 block max-w-3xl overflow-x-auto rounded-xl bg-slate-950 p-3 text-[10px] text-white/80">{qr.verificationUrl}</code></div></div></section>}
  </div>;
}
