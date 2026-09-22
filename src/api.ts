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
