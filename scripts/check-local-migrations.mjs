import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { loadMigrationPlan } from './migration-plan.mjs';
import { PGlite } from '@electric-sql/pglite';
import { postgis } from '@electric-sql/pglite-postgis';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import assert from 'node:assert/strict';
import { databaseFingerprint } from './database-tools.mjs';

// This verifier has no network database connection and cannot target production.
const db = new PGlite({ extensions: { postgis, pgcrypto } });
const evidence = { mode: 'embedded-postgres-migration-replay', applied: [], failure: null };
let closed = false;
try {
  await db.waitReady;
  evidence.version = (await db.query('select version() as version')).rows[0].version;
  await db.exec(await readFile('scripts/ci-database-bootstrap.sql', 'utf8'));
  for (const { id: file, source } of await loadMigrationPlan()) {
    try {
      await db.exec(source);
      evidence.applied.push(file);
      console.log(`PASS ${file}`);
    } catch (error) {
      evidence.failure = { file, code: error.code, message: error.message };
      throw new Error(`${file}: ${error.message}`);
    }
  }
  evidence.postgis = (await db.query("select extversion from pg_extension where extname='postgis'")).rows[0].extversion;
  const operatorId = 'f0000000-0000-4000-8000-000000000001';
  await db.query("insert into operators(id,legal_name,province_code,status) values($1,'Local recovery fixture','ORO','draft')", [operatorId]);
  await db.query("update operators set status='pending_review' where id=$1", [operatorId]);
  await assert.rejects(db.query("update operators set status='rejected' where id=$1", [operatorId]), /rejection_reason/);
  await db.query("update operators set status='rejected',rejection_reason='Local validation fixture' where id=$1", [operatorId]);
  const operator = (await db.query('select status,submitted_at,reviewed_at from operators where id=$1', [operatorId])).rows[0];
  assert.equal(operator.status, 'rejected');
  assert.ok(operator.submitted_at && operator.reviewed_at);
  // PGlite does not currently apply ALTER DEFAULT PRIVILEGES to later DDL as native
  // PostgreSQL does, so grant this probe explicitly to ensure RLS is what denies rows.
  await db.exec('grant select on users to anon');
  await db.exec('set role anon');
  try { assert.deepEqual((await db.query('select id from users')).rows, []); }
  finally { await db.exec('reset role'); }
  evidence.lifecycleAndAnonymousAccess = 'passed';
  const before = await databaseFingerprint(db);
  const snapshot = await db.dumpDataDir('none');
  await db.close(); closed = true;
  const restored = new PGlite({ loadDataDir: snapshot, extensions: { postgis, pgcrypto } });
  try {
    await restored.waitReady;
    assert.deepEqual(await databaseFingerprint(restored), before);
    evidence.embeddedRecovery = { status: 'passed', tables: before.tables.length, policies: before.policies.length, snapshotBytes: snapshot.size };
  } finally { await restored.close(); }
  console.log('Embedded replay, lifecycle/access checks and snapshot recovery passed. Native pg_dump/pg_restore and deployed API checks remain required.');
} catch (error) {
  evidence.failure ||= { stage: 'verification', code: error.code, message: error.message };
  throw error;
} finally {
  await mkdir('recovery-evidence', { recursive: true });
  await writeFile('recovery-evidence/embedded-migrations.json', JSON.stringify(evidence, null, 2));
  if (!closed) await db.close();
}
