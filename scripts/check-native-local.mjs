import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve, join, delimiter } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import pg from 'pg';
import { loadMigrationPlan } from './migration-plan.mjs';

if (!process.env.PG_BIN) throw new Error('PG_BIN must point to a local PostgreSQL bin directory with PostGIS installed');
const bin = resolve(process.env.PG_BIN);
const directory = resolve('recovery-evidence', `native-${new Date().toISOString().replaceAll(':', '-')}`);
await mkdir(directory, { recursive: true });
const data = join(directory, 'data');
const password = randomBytes(32).toString('hex');
const probe = createServer();
probe.listen(0, '127.0.0.1');
await once(probe, 'listening');
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const connection = `postgresql://postgres:${password}@127.0.0.1:${port}`;
const pathKey = Object.keys(process.env).find(key => key.toLowerCase() === 'path') || 'PATH';
const env = { ...process.env, [pathKey]: bin + delimiter + process.env[pathKey],
  DATABASE_URL: `${connection}/ntdp_ci`, RECOVERY_ADMIN_URL: `${connection}/postgres`,
  BACKUP_DIRECTORY: join(directory, 'backup'), PGCLIENTENCODING: 'UTF8' };
const executable = name => join(bin, name + (process.platform === 'win32' ? '.exe' : ''));
const evidence = { startedAt: new Date().toISOString(), mode: 'native-local', stages: [], status: 'running' };
let startAttempted = false;
async function run(command, args) {
  await new Promise((resolve, reject) => {
    // pg_ctl's detached Windows server can retain pipe handles after pg_ctl exits.
    const child = spawn(command, args, { env, windowsHide: true, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Local check exited ${code}: ${command}`)));
  });
}
async function stage(name, action) {
  console.log(`CHECK ${name}`);
  evidence.currentStage = name;
  await action();
  evidence.stages.push(name);
  evidence.currentStage = null;
}
async function database(name, action) {
  const db = new pg.Client({ connectionString: `${connection}/${name}` });
  await db.connect();
  try { return await action(db); } finally { await db.end(); }
}
try {
  await stage('initialize isolated cluster', async () => {
    const passwordFile = join(directory, 'init-password.tmp');
    await writeFile(passwordFile, password + '\n', { mode: 0o600, flag: 'wx' });
    try {
      await run(executable('initdb'), ['-D', data, '-U', 'postgres', '--auth=scram-sha-256', '--encoding=UTF8', '--locale=C', `--pwfile=${passwordFile}`]);
    } finally { await unlink(passwordFile); }
  });
  startAttempted = true;
  await stage('start loopback-only server', () => run(executable('pg_ctl'), ['-D', data, '-l', join(directory, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start']));
  await stage('bootstrap disposable database', () => database('postgres', async db => {
    evidence.version = (await db.query('select version() as version')).rows[0].version;
    await db.query('create database ntdp_ci template template0');
    await db.query(await readFile('scripts/ci-database-bootstrap.sql', 'utf8'));
  }));
  await stage('native migration replay', () => run(process.execPath, ['scripts/migrate.mjs']));
  const ledger = () => database('ntdp_ci', async db => (await db.query('select filename,sha256,applied_at from public.ntdp_migrations order by filename')).rows);
  const before = await ledger();
  assert.equal(before.length, (await loadMigrationPlan()).length);
  await stage('repeat migration runner without changes', async () => {
    await run(process.execPath, ['scripts/migrate.mjs']);
    assert.deepEqual(await ledger(), before);
  });
  evidence.migrationEntries = before.length;
  evidence.extensions = await database('ntdp_ci', async db => (await db.query('select e.extname,e.extversion,n.nspname as schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace order by e.extname')).rows);
  await stage('candidate API release checks', () => run(process.execPath, ['scripts/release-check.mjs']));
  await stage('native application backup', () => run(process.execPath, ['scripts/database-backup.mjs']));
  await stage('native isolated restore comparison', () => run(process.execPath, ['scripts/recovery-check.mjs']));
  evidence.recovery = JSON.parse(await readFile(join(env.BACKUP_DIRECTORY, 'restore-result.json'), 'utf8'));
  evidence.status = 'passed';
} catch (error) {
  evidence.status = 'failed';
  evidence.error = error.message.replaceAll(password, '[redacted]');
  process.exitCode = 1;
} finally {
  if (startAttempted) {
    try { await run(executable('pg_ctl'), ['-D', data, '-m', 'fast', '-w', 'stop']); evidence.serverStopped = true; }
    catch (error) { evidence.serverStopped = false; evidence.shutdownError = error.message; process.exitCode = 1; }
  }
  evidence.finishedAt = new Date().toISOString();
  await writeFile(join(directory, 'result.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
  console.log(`Evidence retained in ${directory}. Cluster credentials were ephemeral; no system service was installed.`);
}
