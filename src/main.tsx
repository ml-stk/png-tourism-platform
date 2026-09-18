import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { KioskMode, SuperAppMode } from './channel/ChannelModes';
import './index.css';
import './design-system.css';

const API_ORIGIN = 'https://png-tourism-platform-api.onrender.com';
const DESTINATION_API = `${API_ORIGIN}/api/v1/public/destinations`;
const DESTINATION_SNAPSHOT = './destinations-live.json';
const DESTINATION_DETAIL_PREFIX = `${DESTINATION_API}/`;
const browserFetch = window.fetch.bind(window);

async function snapshotResponseForDestination(inputUrl: string): Promise<Response> {
  const response = await browserFetch(DESTINATION_SNAPSHOT, { cache: 'no-store', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Published destination snapshot returned HTTP ${response.status}`);
  const snapshot = await response.json();
  const destinationId = decodeURIComponent(inputUrl.slice(DESTINATION_DETAIL_PREFIX.length));
  const items = Array.isArray(snapshot?.data?.items) ? snapshot.data.items : Array.isArray(snapshot?.data) ? snapshot.data : [];
  const item = items.find((candidate: any) => String(candidate?.id) === destinationId);
  if (!item) throw new Error('Destination is not present in the published snapshot');
  return new Response(JSON.stringify({ data: { ...item, slug: item.slug ?? String(item.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-'), contentVersion: Number(item.contentVersion ?? 1), updatedAt: item.updatedAt ?? new Date().toISOString(), freshness: item.freshness ?? 'stale', media: Array.isArray(item.media) ? item.media : [], qrPath: item.qrPath ?? `/destination/${item.id}`, offlineCacheKey: item.offlineCacheKey ?? `destination:${item.id}:v1` } }), { status: 200, headers: { 'content-type': 'application/json' } });
}

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  let inputUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (typeof input === 'string' && input.startsWith('/api/')) { input = `${API_ORIGIN}${input}`; inputUrl = input; }
  else if (input instanceof URL && input.pathname.startsWith('/api/')) { input = new URL(`${API_ORIGIN}${input.pathname}${input.search}`); inputUrl = input.toString(); }
  if (inputUrl === DESTINATION_API) {
    const liveRequest = browserFetch(input, init).then((response) => { if (!response.ok) throw new Error(`Live destination API returned HTTP ${response.status}`); return response; });
    const snapshotRequest = new Promise<Response>((resolve, reject) => { window.setTimeout(() => { browserFetch(DESTINATION_SNAPSHOT, { ...init, cache: 'no-store' }).then((response) => { if (!response.ok) throw new Error(`Published destination snapshot returned HTTP ${response.status}`); resolve(response); }).catch(reject); }, 2500); });
    return Promise.any([liveRequest, snapshotRequest]);
  }
  if (inputUrl.startsWith(DESTINATION_DETAIL_PREFIX)) {
    const liveRequest = browserFetch(input, init).then((response) => { if (!response.ok) throw new Error(`Live destination detail API returned HTTP ${response.status}`); return response; });
    const snapshotRequest = new Promise<Response>((resolve, reject) => { window.setTimeout(() => snapshotResponseForDestination(inputUrl).then(resolve).catch(reject), 2500); });
    return Promise.any([liveRequest, snapshotRequest]);
  }
  return browserFetch(input, init);
};

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => caches?.keys?.())
      .then((keys) => Promise.all((keys || []).filter((key) => key.startsWith('png-tourism-shell-')).map((key) => caches.delete(key))))
      .catch(() => undefined);
  });
}

function renderChannel() {
  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === 'super-app') return <SuperAppMode />;
  if (mode === 'kiosk') return <KioskMode />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(<StrictMode>{renderChannel()}</StrictMode>);
