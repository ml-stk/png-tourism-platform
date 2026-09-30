import { createApplicationServer } from './application';

if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
  for (const name of ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY']) {
    if (!process.env[name]) throw new Error(`${name} is required`);
  }
}
const port = Number(process.env.PORT || 3000);
const server = createApplicationServer();
server.listen(port, '0.0.0.0', () => console.log(`PNG Tourism Platform API listening on :${port}`));
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
});
