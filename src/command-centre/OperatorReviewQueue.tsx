import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';

type Operator = { id: string; legalName: string; tradingName?: string; provinceCode: string; status: string; complianceStatus: string; createdAt: string; updatedAt: string };

export default function OperatorReviewQueue() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/v1/operators?status=pending_review', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(response.status === 401 ? 'Authority sign-in is required to review registrations.' : response.status === 403 ? 'Your authority role does not permit operator review.' : 'Unable to load registration queue.');
      const body = await response.json();
      const items = Array.isArray(body?.data?.items) ? body.data.items : Array.isArray(body?.data) ? body.data : [];
      setOperators(items); setNotice(items.length ? '' : 'No operator registrations are awaiting review.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load registration queue.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const act = async (operator: Operator, action: 'approve' | 'reject' | 'compliance') => {
    setBusy(`${operator.id}:${action}`); setError(''); setNotice('');
    try {
      const body = action === 'reject' ? { reason: window.prompt('Reason for rejection') || '' } : action === 'compliance' ? { status: 'compliant', note: 'Verified during TPA registration review.' } : {};
      if (action === 'reject' && !body.reason) throw new Error('A rejection reason is required.');
      const response = await fetch(`/api/v1/operators/${encodeURIComponent(operator.id)}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) { const payload = await response.json().catch(() => null); throw new Error(payload?.error?.message || 'The operator review action could not be completed.'); }
      setNotice(action === 'approve' ? 'Registration approved. Compliance must still be verified before public publication.' : action === 'reject' ? 'Registration rejected and removed from the pending queue.' : 'Compliance marked as compliant.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'The operator review action could not be completed.'); }
    finally { setBusy(''); }
  };

  return <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm lg:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Regulatory workflow</div><h3 className="mt-1 text-xl font-bold">Operator registration review</h3><p className="mt-1 text-sm text-slate-500">Pending registrations remain private until an authorised reviewer approves them and verifies compliance.</p></div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={15}/> Refresh</button>
    </div>
    {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    {notice && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</div>}
    {loading ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Loading registration queue…</div> : operators.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">{notice || 'No operator registrations are awaiting review.'}</div> : <div className="mt-5 space-y-3">{operators.map(operator => <article key={operator.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="font-bold">{operator.tradingName || operator.legalName}</div>{operator.tradingName && <div className="mt-1 text-sm text-slate-500">Legal entity: {operator.legalName}</div>}<div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-slate-100 px-2.5 py-1">{operator.provinceCode}</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">Pending review</span><span className="rounded-full bg-slate-100 px-2.5 py-1">Compliance: {operator.complianceStatus}</span></div></div><div className="flex flex-wrap gap-2"><button disabled={!!busy} onClick={() => void act(operator, 'approve')} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><CheckCircle2 size={15}/> Approve</button><button disabled={!!busy} onClick={() => void act(operator, 'reject')} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-40"><XCircle size={15}/> Reject</button><button disabled={!!busy} onClick={() => void act(operator, 'compliance')} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-40"><ShieldCheck size={15}/> Verify compliance</button></div></div></article>)}</div>}
  </section>;
}
