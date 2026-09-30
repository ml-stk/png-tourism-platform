import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { applicationSchemas, applicationExtensions, databaseFingerprint, runDatabaseTool } from './database-tools.mjs';

const source = process.env.DATABASE_URL;
if (!source) throw new Error('DATABASE_URL is required');
const directory = resolve(process.env.BACKUP_DIRECTORY || `backups/${new Date().toISOString().replaceAll(':', '-')}`);
await mkdir(dirname(directory), { recursive: true, mode: 0o700 });
await mkdir(directory, { recursive: false, mode: 0o700 });
const client = new pg.Client({ connectionString: source });
await client.connect();
try {
  await client.query('begin isolation level repeatable read read only');
  const snapshot = await client.query('select pg_export_snapshot() as id');
  const fingerprint = await databaseFingerprint(client);
  const extensions = await applicationExtensions(client);
  const archive = resolve(directory, 'application.dump');
  await runDatabaseTool('pg_dump', ['--format=custom', '--no-owner', '--snapshot', snapshot.rows[0].id, ...applicationSchemas.flatMap(schema => ['--schema', schema]), ...extensions.flatMap(extension => ['--extension', extension.name]), '--file', archive], source);
  await runDatabaseTool('pg_dumpall', ['--roles-only', '--no-role-passwords', '--file', resolve(directory, 'roles.sql')], source);
  await writeFile(resolve(directory, 'manifest.json'), JSON.stringify({
    createdAt: new Date().toISOString(), schemas: applicationSchemas, extensions,
    sha256: createHash('sha256').update(await readFile(archive)).digest('hex'), fingerprint,
    exclusions: ['Supabase auth identities and sessions', 'Supabase storage metadata and object bytes', 'external secrets, provider settings and deployment configuration'],
  }, null, 2), { mode: 0o600 });
  await client.query('commit');
  console.log(`Application schema and data backup: ${directory}`);
  console.log('Scope: application schemas and role definitions without passwords. See manifest exclusions; this is not a complete Supabase project backup.');
} finally { await client.end(); }
