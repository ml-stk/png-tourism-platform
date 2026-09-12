const base = 'https://png-tourism-platform-api.onrender.com';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, attempt = 1) {
  try {
    const response = await fetch(`${base}${path}`, { headers: { Accept: 'application/json' } });
    const text = await response.text();
    console.log(`${path} -> ${response.status} ${text.slice(0, 1000)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return text;
  } catch (error) {
    console.log(`${path} attempt ${attempt} failed: ${error.message}`);
    if (attempt >= 3) throw error;
    await sleep(10000);
    return request(path, attempt + 1);
  }
}

await request('/health');
const body = JSON.parse(await request('/api/v1/public/destinations'));
const items = Array.isArray(body.data) ? body.data : body.data?.items;
if (!Array.isArray(items) || items.length < 5) {
  throw new Error(`Expected at least 5 published destinations, received ${Array.isArray(items) ? items.length : 'invalid payload'}`);
}
console.log(`LIVE API OK: ${items.length} published destinations returned`);
