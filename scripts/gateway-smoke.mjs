const base = process.env.NTDP_API_BASE || 'https://png-tourism-platform-api.onrender.com';

async function request(path, headers = {}) {
  const response = await fetch(`${base}${path}`, { headers: { Accept: 'application/json', ...headers } });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  console.log(`${path} -> ${response.status}`);
  return { response, body };
}

const publicResult = await request('/api/v1/public/destinations');
if (!publicResult.response.ok) throw new Error(`Public route failed: ${publicResult.response.status}`);

const requestId = `gsat-${Date.now()}`;
const partnerNoKey = await request('/api/v1/partner/destinations', { 'x-request-id': requestId });
if (partnerNoKey.response.status !== 401) throw new Error(`Expected partner route without key to return 401, received ${partnerNoKey.response.status}`);
if (partnerNoKey.body?.requestId !== requestId) throw new Error('Gateway did not preserve the supplied x-request-id on the unauthorized response');

const partnerInvalidKey = await request('/api/v1/partner/destinations', { 'x-api-key': 'pngtp_invalid_acceptance_key', 'x-request-id': `${requestId}-invalid` });
if (partnerInvalidKey.response.status !== 401) throw new Error(`Expected invalid API key to return 401, received ${partnerInvalidKey.response.status}`);
if (partnerInvalidKey.body?.requestId !== `${requestId}-invalid`) throw new Error('Gateway did not preserve the supplied x-request-id for invalid-key rejection');

const unknown = await request('/api/v1/partner/not-registered');
if (![401, 404].includes(unknown.response.status)) throw new Error(`Unexpected status for unregistered partner route: ${unknown.response.status}`);

console.log('GATEWAY SMOKE OK: public access, partner authentication boundary, invalid-key rejection, and request correlation validated.');
console.log('RATE_LIMITED/Retry-After remains covered by the executable service acceptance tests; a live 429 requires a controlled approved test key and is not attempted with production credentials.');
