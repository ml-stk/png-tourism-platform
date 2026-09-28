import { forceRefreshSession, getAccessToken, getCurrentSession } from './auth/supabase-auth';

const API_BASE_URL = 'https://png-tourism-platform-api.onrender.com';

async function requestApi(path: string, init: RequestInit, token: string | null) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const session = await getCurrentSession();
  const token = session?.access_token ?? getAccessToken();
  const response = await requestApi(path, init, token);
  if (response.status !== 401 || !token) return response;

  // Supabase access tokens can be revoked or rotated before the client-side
  // expiry timestamp. Refresh once and retry the request with the new token.
  // The refresh helper serializes concurrent refresh-token use.
  const refreshed = await forceRefreshSession();
  const refreshedToken = refreshed?.access_token ?? null;
  if (!refreshedToken || refreshedToken === token) return response;
  return requestApi(path, init, refreshedToken);
}

// Public endpoints must not wait for Supabase session refresh. This keeps
// public reference data such as provinces responsive even when an old or
// expired browser session needs attention.
export async function publicApiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
}
