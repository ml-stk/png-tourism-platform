import { existsSync, writeFileSync } from 'node:fs';

const endpoint = 'https://png-tourism-platform-api.onrender.com/api/v1/public/destinations';
const output = 'public/destinations-live.json';

try {
  const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  const items = Array.isArray(payload?.data) ? payload.data : payload?.data?.items;
  if (!Array.isArray(items) || items.length < 5) throw new Error(`Expected at least 5 destinations, received ${Array.isArray(items) ? items.length : 'invalid payload'}`);
  writeFileSync(output, `${JSON.stringify({ data: items }, null, 2)}\n`);
  console.log(`Published destination snapshot refreshed from live API: ${items.length} destinations`);
} catch (error) {
  if (!existsSync(output)) {
    console.error(`Unable to refresh destination snapshot and no existing snapshot is available: ${error.message}`);
    process.exit(1);
  }
  console.warn(`Live destination snapshot refresh failed; retaining checked-in snapshot: ${error.message}`);
}
