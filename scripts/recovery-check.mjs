import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import assert from 'node:assert/strict';
import { applicationSchemas, applicationExtensions, validateExtensionMetadata, databaseFingerprint, runDatabaseTool } from './database-tools.mjs';

if (!process.env.RECOVERY_ADMIN_URL || !process.env.BACKUP_DIRECTORY) throw new Error('RECOVERY_ADMIN_URL and BACKUP_DIRECTORY are required');
const url = new URL(process.env.RECOVERY_ADMIN_URL);
if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) throw new Error('Recovery checks require an isolated local PostgreSQL server');
const directory = resolve(process.env.BACKUP_DIRECTORY);
const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8'));
validateExtensionMetadata(manifest.extensions);
const archive = resolve(directory, 'application.dump');
if (createHash('sha256').update(await readFile(archive)).digest('hex') !== manifest.sha256) throw new Error('Backup checksum does not match manifest');
const name = `ntdp_restore_${randomUUID().replaceAll('-', '')}`;
const admin = new pg.Client({ connectionString: process.env.RECOVERY_ADMIN_URL });
await admin.connect();
try {
  // Never restore over an existing database. Keep the result for inspection.
  await admin.query(`create database "${name}" template template0`);
  url.pathname = '/' + name;
  const restored = new pg.Client({ connectionString: url.toString() });
  await restored.connect();
  let actual;
  try {
    // Only this newly created database is changed; RESTRICT refuses a nonempty schema.
    await restored.query('drop schema public restrict');
    for (const schema of new Set(manifest.extensions.map(extension => extension.schema))) {
      if (!applicationSchemas.includes(schema)) await restored.query(`create schema "${schema}"`);
    }
    await runDatabaseTool('pg_restore', ['--exit-on-error', '--no-owner', '--dbname', name, archive], url.toString());
    assert.deepEqual(await applicationExtensions(restored), manifest.extensions, 'Restored extension versions/schemas differ');
    actual = await databaseFingerprint(restored);
  } finally { await restored.end(); }
  if (JSON.stringify(actual) !== JSON.stringify(manifest.fingerprint)) {
    await writeFile(resolve(directory, 'restore-mismatch.json'), JSON.stringify({ database: name, expected: manifest.fingerprint, actual }, null, 2), { mode: 0o600 });
    throw new Error(`Restored data, grants or policies differ; inspect restore-mismatch.json and database ${name}`);
  }
  await writeFile(resolve(directory, 'restore-result.json'), JSON.stringify({ verifiedAt: new Date().toISOString(), database: name, tables: actual.tables.length, policies: actual.policies.length, extensions: manifest.extensions, verified: ['table counts', 'row digests', 'table ACLs', 'RLS flags', 'RLS policies', 'extension versions and schemas'], exclusions: manifest.exclusions }, null, 2));
  console.log(`Recovery verified; retained isolated database ${name}`);
} finally { await admin.end(); }
