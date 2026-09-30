import { spawn } from 'node:child_process';

export const applicationSchemas = ['public', 'analytics', 'gis', 'commerce', 'distribution', 'gateway'];
export function validateExtensionMetadata(extensions) {
  if (!Array.isArray(extensions) || extensions.length !== 2 ||
      extensions.some(extension => !extension || typeof extension.schema !== 'string' ||
        !/^[a-z_][a-z0-9_]*$/.test(extension.schema) || typeof extension.version !== 'string' || !extension.version) ||
      extensions.map(extension => extension.name).sort().join(',') !== 'pgcrypto,postgis') {
    throw new Error('A new backup with valid pgcrypto/postgis dependency metadata is required');
  }
}
export async function applicationExtensions(client) {
  const result = await client.query(`select e.extname as name, e.extversion as version, n.nspname as schema
    from pg_extension e join pg_namespace n on n.oid=e.extnamespace
    where e.extname=any($1) order by e.extname`, [['pgcrypto', 'postgis']]);
  if (result.rows.length !== 2) throw new Error('Application backup/recovery requires pgcrypto and postgis');
  return result.rows;
}
export function databaseEnvironment(connectionString) {
  const url = new URL(connectionString);
  return { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432', PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: url.searchParams.get('sslmode') || process.env.PGSSLMODE || 'prefer' };
}

export function runDatabaseTool(command, args, connectionString) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env: databaseEnvironment(connectionString), stdio: ['ignore', 'pipe', 'pipe'] });
    let error = '';
    child.stdout.resume();
    child.stderr.on('data', data => { error += data; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} failed (${code}): ${error}`)));
  });
}

export async function databaseFingerprint(client) {
  const tables = await client.query(`select n.nspname as schema, c.relname as name, c.relrowsecurity as rls,
    coalesce((select string_agg((case when acl.grantee=0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end)
      || ':' || acl.privilege_type || ':' || acl.is_grantable::text, ','
      order by case when acl.grantee=0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end,
        acl.privilege_type, acl.is_grantable::text)
      from aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl), '') as acl
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname=any($1) and c.relkind='r' and c.relname <> 'spatial_ref_sys' order by 1,2`, [applicationSchemas]);
  const result = [];
  for (const table of tables.rows) {
    const ident = value => '"' + value.replaceAll('"', '""') + '"';
    const records = await client.query(`select count(*)::text as count, md5(coalesce(string_agg(digest, '' order by digest),'')) as digest from (select md5(to_jsonb(t)::text) as digest from ${ident(table.schema)}.${ident(table.name)} t) rows`);
    result.push({ ...table, ...records.rows[0] });
  }
  const policies = await client.query('select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname=any($1) order by 1,2,3', [applicationSchemas]);
  return { tables: result, policies: policies.rows };
}
