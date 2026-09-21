const SUPABASE_URL='https://yxhatvvgietyvjhlqoqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_6Uvf7P0AQzyTEyJeMRIe8Q_jrGNDOx9';
const SESSION_KEY='png-tourism-supabase-session';

type SupabaseSession={access_token:string;refresh_token:string;expires_at:number;user?:{id:string;email?:string}};

type AuthResult={session:SupabaseSession;error?:string};

function readSession():SupabaseSession|null{try{const raw=localStorage.getItem(SESSION_KEY);if(!raw)return null;const session=JSON.parse(raw) as SupabaseSession;if(!session.access_token||!session.refresh_token)return null;return session;}catch{return null;}}
function saveSession(session:SupabaseSession){localStorage.setItem(SESSION_KEY,JSON.stringify(session));}
export function clearSupabaseSession(){localStorage.removeItem(SESSION_KEY);}
export function getAccessToken(){return readSession()?.access_token??null;}
function isExpired(session:SupabaseSession){return session.expires_at<=Math.floor(Date.now()/1000)+60;}
async function authRequest(path:string,body:Record<string,string>):Promise<AuthResult>{const response=await fetch(`${SUPABASE_URL}${path}`,{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify(body)});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(typeof payload?.msg==='string'?payload.msg:typeof payload?.error_description==='string'?payload.error_description:'Authentication request failed');const expiresIn=Number(payload.expires_in??3600);const session:SupabaseSession={access_token:String(payload.access_token),refresh_token:String(payload.refresh_token),expires_at:Math.floor(Date.now()/1000)+expiresIn,user:payload.user?{id:String(payload.user.id),email:typeof payload.user.email==='string'?payload.user.email:undefined}:undefined};saveSession(session);return{session};}
export async function signIn(email:string,password:string){if(!email.trim()||!password)throw new Error('Email and password are required');return authRequest('/auth/v1/token?grant_type=password',{email:email.trim(),password});}
export async function refreshSession():Promise<SupabaseSession|null>{const current=readSession();if(!current)return null;if(!isExpired(current))return current;try{return (await authRequest('/auth/v1/token?grant_type=refresh_token',{refresh_token:current.refresh_token})).session;}catch{clearSupabaseSession();return null;}}
export async function getCurrentSession(){return refreshSession();}
export async function signOut(){const token=getAccessToken();clearSupabaseSession();if(!token)return;await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:'POST',headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}}).catch(()=>undefined);}
export {SUPABASE_URL};
