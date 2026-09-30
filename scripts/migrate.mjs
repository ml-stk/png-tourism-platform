import { loadMigrationPlan } from './migration-plan.mjs';
import { createHash } from 'node:crypto';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('select pg_advisory_lock(74819362)');
  const ledger = await client.query("select to_regclass('public.ntdp_migrations') as name");
  if (!ledger.rows[0].name) {
    const existing = await client.query("select count(*)::int as count from information_schema.tables where table_schema in ('public','analytics','gis','commerce','distribution','gateway') and table_type='BASE TABLE' and table_name <> 'spatial_ref_sys'");
    if (existing.rows[0].count > 0) throw new Error('Existing database has no NTDP migration ledger. Reconcile deployed history before adopting this runner.');
    await client.query('create table public.ntdp_migrations (filename text primary key, sha256 text not null, applied_at timestamptz not null default now())');
    await client.query('alter table public.ntdp_migrations enable row level security');
    await client.query('revoke all on public.ntdp_migrations from public, anon, authenticated');
  }
  for (const { id: file, source } of await loadMigrationPlan()) {
    const hash = createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex');
    const previous = await client.query('select sha256 from public.ntdp_migrations where filename=$1', [file]);
    if (previous.rowCount) {
      if (previous.rows[0].sha256 !== hash) throw new Error(`Applied migration changed: ${file}`);
      continue;
    }
    const sql = source.replace(/^\s*(?:begin|commit)\s*;\s*$/gim, '');
    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('insert into public.ntdp_migrations(filename,sha256) values($1,$2)', [file, hash]);
      await client.query('commit');
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query('rollback');
      throw new Error(`Migration ${file} failed: ${error.message}`);
    }
  }
} finally {
  await client.end();
}
