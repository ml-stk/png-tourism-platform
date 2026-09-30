import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { postgis } from '@electric-sql/pglite-postgis';
import { loadMigrationPlan } from './migration-plan.mjs';
import { schemaContractQuery } from './schema-contract-query.mjs';

const db = new PGlite({ extensions: { pgcrypto, postgis } });
try {
  await db.waitReady;
  await db.exec(await readFile('scripts/ci-database-bootstrap.sql', 'utf8'));
  for (const migration of await loadMigrationPlan()) await db.exec(migration.source);
  // PGlite does not materialize the bootstrap's default privileges on later DDL.
  // Apply the equivalent Supabase grants before comparing effective ACLs.
  await db.exec(`grant all privileges on all tables in schema public to anon, authenticated, service_role;
    grant all privileges on all sequences in schema public to anon, authenticated, service_role;
    grant execute on all functions in schema public to service_role;`);
  const contract = (await db.query(schemaContractQuery)).rows[0].contract;
  await mkdir('review/2026-09-30', { recursive: true });
  await writeFile('review/2026-09-30/local-schema-contract.json', JSON.stringify(contract, null, 2) + '\n');
  console.log(`Captured ${contract.relations.length} relations, ${contract.functions.length} functions, ${contract.triggers.length} triggers and ${contract.policies.length} policies.`);
} finally {
  await db.close();
}
