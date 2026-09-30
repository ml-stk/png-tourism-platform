const required = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'NTDP_API_BASE',
  'STAGING_OPERATOR_EMAIL',
  'STAGING_OPERATOR_PASSWORD',
  'STAGING_OPERATOR_ID',
  'STAGING_OTHER_OPERATOR_ID',
  'STAGING_DISABLED_EMAIL',
  'STAGING_DISABLED_PASSWORD',
];

for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const supabaseUrl = process.env.SUPABASE_URL.replace(/\/+$/, '');
const apiBase = process.env.NTDP_API_BASE.replace(/\/+$/, '');
const apiKey = process.env.SUPABASE_PUBLISHABLE_KEY;

async function request(url, init = {}) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
}

async function auth(path, body, accessToken) {
  const response = await request(`${supabaseUrl}${path}`, {
    method: 'POST',
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function signIn(email, password) {
  const { response, payload } = await auth('/auth/v1/token?grant_type=password', { email, password });
  if (!response.ok || typeof payload.access_token !== 'string' || typeof payload.refresh_token !== 'string') {
    throw new Error(`Staging sign-in failed with HTTP ${response.status}`);
  }
  return payload;
}

async function api(path, token) {
  return request(`${apiBase}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

function pass(label) {
  console.log(`PASS ${label}`);
}

const session = await signIn(process.env.STAGING_OPERATOR_EMAIL, process.env.STAGING_OPERATOR_PASSWORD);
pass('real Supabase password sign-in');

const own = await api(`/api/v1/operators/${encodeURIComponent(process.env.STAGING_OPERATOR_ID)}`, session.access_token);
if (own.status !== 200) throw new Error(`Own-operator access expected 200, received ${own.status}`);
pass('operator can access assigned operator');

const other = await api(`/api/v1/operators/${encodeURIComponent(process.env.STAGING_OTHER_OPERATOR_ID)}`, session.access_token);
if (other.status !== 403) throw new Error(`Cross-operator access expected 403, received ${other.status}`);
pass('cross-operator access is denied');

const refreshed = await auth('/auth/v1/token?grant_type=refresh_token', { refresh_token: session.refresh_token });
if (!refreshed.response.ok || typeof refreshed.payload.access_token !== 'string'
    || typeof refreshed.payload.refresh_token !== 'string') {
  throw new Error(`Token refresh failed with HTTP ${refreshed.response.status}`);
}
pass('refresh-token rotation');

const disabled = await signIn(process.env.STAGING_DISABLED_EMAIL, process.env.STAGING_DISABLED_PASSWORD);
const disabledApi = await api('/api/v1/operators', disabled.access_token);
if (disabledApi.status !== 401) {
  throw new Error(`Disabled application user expected API 401, received ${disabledApi.status}`);
}
pass('disabled application account is rejected');

const logout = await auth('/auth/v1/logout?scope=global', undefined, refreshed.payload.access_token);
if (!logout.response.ok) throw new Error(`Global logout failed with HTTP ${logout.response.status}`);
pass('global logout');

const revokedRefresh = await auth('/auth/v1/token?grant_type=refresh_token', {
  refresh_token: refreshed.payload.refresh_token,
});
if (revokedRefresh.response.ok) throw new Error('Refresh token remained usable after global logout');
pass('refresh token rejected after logout');

await auth('/auth/v1/logout?scope=global', undefined, disabled.access_token);
console.log('Real Supabase staging session and operator-scope checks passed. No credentials or tokens were printed.');

