import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Deployment-aware asset base:
  // - Cloudflare Workers serves the app at the domain root (/).
  // - GitHub Pages serves the app from /png-tourism-platform/.
  // Keep the Pages-specific path in the workflow instead of hard-coding it
  // here, so the same build configuration works on both platforms.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
});
