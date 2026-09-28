import { getAccessToken, getCurrentSession } from './auth/supabase-auth';

const API_BASE_URL = 'https://png-tourism-platform-api.onrender.com';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const session = await getCurrentSession();
  const token = session?.access_token ?? getAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}

// Public endpoints must not wait for Supabase session refresh. This keeps
// public reference data such as provinces responsive even when an old or
// expired browser session needs attention.
export async function publicApiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}
