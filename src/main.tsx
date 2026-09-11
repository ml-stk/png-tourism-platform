import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './design-system.css';

const API_ORIGIN = 'https://png-tourism-platform-api.onrender.com';

const browserFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
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
