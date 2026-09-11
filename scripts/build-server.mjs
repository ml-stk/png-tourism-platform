import { build } from 'esbuild';

await build({
  entryPoints: ['src/server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  outfile: 'dist-server/server/index.js',
  sourcemap: true,
  target: 'node20',
});
