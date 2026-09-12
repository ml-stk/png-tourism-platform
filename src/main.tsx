import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './design-system.css';

const API_ORIGIN = 'https://png-tourism-platform-api.onrender.com';
const DESTINATION_API = `${API_ORIGIN}/api/v1/public/destinations`;
const DESTINATION_SNAPSHOT = '/destinations-live.json';

const browserFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const inputUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // GitLab Pages is static, while the Render API can be slow or unreachable
  // from some visitor networks. Prefer the live API, but after a short grace
  // period race it against the same-origin published snapshot. This prevents
  // the visitor experience from sitting on a 75-second timeout while still
  // using live data whenever the browser can reach the API promptly.
  if (inputUrl === DESTINATION_API) {
    const liveRequest = browserFetch(input, init).then((response) => {
      if (!response.ok) throw new Error(`Live destination API returned HTTP ${response.status}`);
      return response;
    });
    const snapshotRequest = new Promise<Response>((resolve, reject) => {
      window.setTimeout(() => {
        browserFetch(DESTINATION_SNAPSHOT, { ...init, cache: 'no-store' }).then((response) => {
          if (!response.ok) throw new Error(`Published destination snapshot returned HTTP ${response.status}`);
          resolve(response);
        }).catch(reject);
      }, 2500);
    });
    return Promise.any([liveRequest, snapshotRequest]);
  }

  if (typeof input === 'string' && input.startsWith('/api/')) {
    input = `${API_ORIGIN}${input}`;
  } else if (input instanceof URL && input.pathname.startsWith('/api/')) {
    input = new URL(`${API_ORIGIN}${input.pathname}${input.search}`);
  }
  return browserFetch(input, init);
};

// GitLab Pages previously cached an older shell/service-worker bundle. Remove
// any existing registrations and shell caches so the published Vite bundle is
// always loaded from the current Pages deployment while the visitor frontend
// is being stabilized. Offline caching can be reintroduced once the live shell
// and API asset lifecycle is stable.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => caches?.keys?.())
      .then((keys) => Promise.all((keys || []).filter((key) => key.startsWith('png-tourism-shell-')).map((key) => caches.delete(key))))
      .catch(() => undefined);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
