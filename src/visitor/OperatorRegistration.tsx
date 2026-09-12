import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Send } from 'lucide-react';

type Province = { code: string; name: string };

export default function OperatorRegistration() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [legalName, setLegalName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/provinces', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(body => setProvinces(Array.isArray(body?.data) ? body.data : []))
      .catch(() => setProvinces([]));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/v1/public/operator-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ legalName: legalName.trim(), tradingName: tradingName.trim() || undefined, provinceCode }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message || 'Registration could not be submitted.');
      setMessage(`Registration received. Reference: ${body?.data?.id || 'pending review'}.`);
      setLegalName(''); setTradingName(''); setProvinceCode('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Registration could not be submitted.'); }
    finally { setSubmitting(false); }
  };

  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-emerald-800"><Building2 size={14}/> Industry onboarding</div><h3 className="mt-3 text-2xl font-bold tracking-tight">Register your tourism business</h3><p className="mt-2 text-sm leading-6 text-slate-600">Submit a business registration for TPA review. New operators enter <strong>pending review</strong> and are never published to visitors until approval and compliance requirements are satisfied.</p></div>
      <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">Public intake only records the minimum registration fields. Regulatory approval and compliance decisions remain protected authority actions.</div>
    </div>
    <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
      <label className="text-sm font-semibold">Legal business name<input required value={legalName} onChange={event => setLegalName(event.target.value)} maxLength={200} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-emerald-200" placeholder="Registered legal entity"/></label>
      <label className="text-sm font-semibold">Trading name <span className="font-normal text-slate-400">(optional)</span><input value={tradingName} onChange={event => setTradingName(event.target.value)} maxLength={200} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-emerald-200" placeholder="Public-facing business name"/></label>
      <label className="text-sm font-semibold">Primary province<select required value={provinceCode} onChange={event => setProvinceCode(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-emerald-200"><option value="">Select province</option>{provinces.map(province => <option key={province.code} value={province.code}>{province.name}</option>)}</select></label>
      <div className="flex items-end"><button disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Send size={16}/>{submitting ? 'Submitting…' : 'Submit registration'}</button></div>
    </form>
    {message && <div role="status" className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 shrink-0" size={19}/><div><strong>Registration submitted.</strong><div className="mt-1">{message} A TPA-authorised reviewer must approve the operator before it can appear in the public tourism ecosystem.</div></div></div>}
    {error && <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
  </section>;
}
