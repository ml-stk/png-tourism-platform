import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './design-system.css';

const SERVICE_WORKER_VERSION = '4';
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

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const serviceWorkerUrl = `${import.meta.env.BASE_URL}sw.js?v=${SERVICE_WORKER_VERSION}`;
    navigator.serviceWorker.register(serviceWorkerUrl, { updateViaCache: 'none' }).catch(() => undefined);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
