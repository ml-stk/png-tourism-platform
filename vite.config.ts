import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages serves this application from /png-tourism-platform/.
  // Keep the asset base explicit so the published artifact cannot fall back
  // to repository-root/source paths.
  base: '/png-tourism-platform/',
  plugins: [react(), tailwindcss()],
});
