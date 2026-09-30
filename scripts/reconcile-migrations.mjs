import { readFile, writeFile } from 'node:fs/promises';
import { loadMigrationPlan } from './migration-plan.mjs';
import { createHash } from 'node:crypto';
import { parse } from 'pgsql-parser';

const directory = 'review/2026-09-29';
const remote = JSON.parse(await readFile(`${directory}/remote-migration-history.json`, 'utf8'));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['location', 'stmt_location', 'stmt_len'].includes(key))
    .map(([key, item]) => [key, clean(item)]));
}
async function fingerprint(sql) {
  const tree = await parse(sql.replace(/\r\n/g, '\n'));
  // Transaction wrappers differ between console-applied and file-applied scripts.
  const statements = tree.stmts.map(item => item.stmt).filter(item => !item.TransactionStmt).map(clean);
  return { hash: digest(statements), statements: statements.map(digest) };
}
const local = [];
for (const { id: filename, source } of await loadMigrationPlan()) {
  local.push({ filename, ...await fingerprint(source) });
}
const comparison = [];
for (const migration of remote.migrations) {
  const parsed = await fingerprint(migration.statements.join('\n'));
  const matches = local.filter(file => file.hash === parsed.hash).map(file => file.filename);
  const covered = parsed.statements.filter(hash => local.some(file => file.statements.includes(hash))).length;
  comparison.push({ version: migration.version, name: migration.name, matches,
    statements: parsed.statements.length, statementsFoundLocally: covered,
    status: matches.length ? 'same-parsed-statements' : covered === parsed.statements.length ? 'statements-covered-across-local-files' : 'requires-review' });
}
const report = {
  projectRef: remote.projectRef, capturedOn: remote.capturedOn,
  method: 'PostgreSQL parse-tree comparison excluding source offsets and transaction wrappers. Function-body strings remain exact. No semantic equivalence, current-schema equivalence or adoption approval is inferred.',
  localFiles: local.length, remoteMigrations: comparison.length,
  matchedMigrations: comparison.filter(row => row.matches.length).length,
  comparison,
};
await writeFile(`${directory}/migration-reconciliation.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ localFiles: report.localFiles, remoteMigrations: report.remoteMigrations,
  matchedMigrations: report.matchedMigrations,
  coveredAcrossFiles: comparison.filter(row => row.status === 'statements-covered-across-local-files').length,
  reviewRequired: comparison.filter(row => row.status === 'requires-review').map(row => row.name) }, null, 2));
