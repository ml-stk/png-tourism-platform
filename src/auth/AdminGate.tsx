import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { getCurrentSession, signIn, signOut } from './supabase-auth';

type Props={children:ReactNode};

export default function AdminGate({children}:Props){
  const [ready,setReady]=useState(false);
  const [authenticated,setAuthenticated]=useState(false);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const installApiAuth=(token:string)=>{const current=window.fetch.bind(window);const wrapped:typeof window.fetch=(input,init)=>{const url=typeof input==='string'?input:input instanceof URL?input.toString():input.url;if(!url.startsWith('/api/'))return current(input,init);const headers=new Headers(init?.headers??(input instanceof Request?input.headers:undefined));headers.set('Authorization',`Bearer ${token}`);headers.set('Accept','application/json');return current(input,{...init,headers});};window.fetch=wrapped;};
  useEffect(()=>{let cancelled=false;void getCurrentSession().then(session=>{if(cancelled)return;if(session?.access_token){installApiAuth(session.access_token);setAuthenticated(true);}setReady(true);});return()=>{cancelled=true;};},[]);
  const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{const result=await signIn(email,password);installApiAuth(result.session.access_token);setAuthenticated(true);setPassword('');}catch(err){setError(err instanceof Error?err.message:'Unable to sign in');}finally{setBusy(false);}};
  const logout=async()=>{await signOut();setAuthenticated(false);window.location.reload();};
  if(!ready)return <div className="png-shell flex min-h-screen items-center justify-center p-6 text-white"><div className="rounded-2xl border border-white/10 bg-slate-950/80 p-8 text-center shadow-xl"><ShieldCheck className="mx-auto"/><div className="mt-3 font-bold">Checking authority session…</div></div></div>;
  if(!authenticated)return <div className="png-shell flex min-h-screen items-center justify-center p-5 text-white"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/90 p-7 shadow-2xl"><div className="flex items-center gap-3"><span className="png-brand-mark flex h-11 w-11 items-center justify-center rounded-xl font-black">PNG</span><div><div className="text-xs font-bold uppercase tracking-[.18em] text-[#8fd5c8]">Authority workspace</div><h1 className="text-2xl font-black">Sign in</h1></div></div><p className="mt-5 text-sm leading-6 text-slate-300">Use your authorised PNG Tourism Platform account. Visitor features remain public; authority functions require an authenticated Supabase session.</p><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="username" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white outline-none focus:border-[#8fd5c8]"/></label><label className="block text-sm font-semibold">Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white outline-none focus:border-[#8fd5c8]"/></label>{error&&<div role="alert" className="rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}<button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b6477] px-4 py-3 font-bold text-white disabled:opacity-60"><LogIn size={17}/>{busy?'Signing in…':'Sign in to authority workspace'}</button></form></div></div>;
  return <>{children}<button onClick={()=>void logout()} title="Sign out" className="fixed right-5 top-5 z-50 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur"><LogOut size={15}/> Sign out</button></>;
}
