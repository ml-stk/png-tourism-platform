import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createServer as createPortProbe } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import pg from 'pg';

const connection = new URL(process.env.DATABASE_URL || '');
if (!['localhost', '127.0.0.1', '::1'].includes(connection.hostname) || connection.pathname !== '/ntdp_ci') throw new Error('Release fixtures require the isolated local ntdp_ci database');
const db = new pg.Client({ connectionString: connection.toString() });
await db.connect();
const ids = {
  operatorA: '10000000-0000-4000-8000-000000000001', operatorB: '10000000-0000-4000-8000-000000000002',
  user: '20000000-0000-4000-8000-000000000001', admin: '20000000-0000-4000-8000-000000000002',
  memberA: '30000000-0000-4000-8000-000000000001', memberB: '30000000-0000-4000-8000-000000000002',
};
const identity = createServer((req, res) => {
  res.setHeader('content-type', 'application/json');
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!['operator', 'admin'].includes(token)) { res.statusCode = 401; res.end('{}'); return; }
  res.end(JSON.stringify({ id: token === 'admin' ? ids.admin : ids.user, email: `${token}@release.invalid`, user_metadata: { roles: ['platform_admin'] } }));
});
let server;
try {
  await db.query("insert into provinces(code,name,slug) values('NCD','National Capital District','ncd'),('MOROBE','Morobe','morobe') on conflict(code) do nothing");
  for (const [id, province] of [[ids.operatorA, 'NCD'], [ids.operatorB, 'MOROBE']]) await db.query("insert into operators(id,legal_name,province_code,status,compliance_status) values($1,'Release fixture',$2,'active','compliant') on conflict(id) do nothing", [id, province]);
  for (const [id, name, role, operator] of [[ids.user, 'operator', 'operator', ids.operatorA], [ids.admin, 'admin', 'platform_admin', null]]) {
    await db.query('insert into users(id,external_subject,email,display_name) values($1::uuid,$1::text,$2,$3) on conflict(id) do nothing', [id, `${name}@release.invalid`, name]);
    await db.query('insert into user_roles(user_id,role_id,operator_id) select $1,id,$3 from roles where code=$2 and not exists(select 1 from user_roles where user_id=$1)', [id, role, operator]);
  }
  for (const [id, operator] of [[ids.memberA, ids.operatorA], [ids.memberB, ids.operatorB]]) await db.query("insert into tia_memberships(id,operator_id,status) values($1,$2,'applied') on conflict(id) do nothing", [id, operator]);
  identity.listen(0, '127.0.0.1'); await once(identity, 'listening');
  const portProbe = createPortProbe(); portProbe.listen(0, '127.0.0.1'); await once(portProbe, 'listening');
  const port = portProbe.address().port; await new Promise(resolve => portProbe.close(resolve));
  server = spawn(process.execPath, ['dist-server/server/index.js'], { env: {
    ...process.env, PORT: String(port), NODE_ENV: 'production', SUPABASE_URL: `http://127.0.0.1:${identity.address().port}`,
    SUPABASE_PUBLISHABLE_KEY: 'isolated-release-fixture', CORS_ALLOWED_ORIGIN: 'https://release.invalid', RATE_LIMIT_MAX_REQUESTS: '1000',
  }, stdio: ['ignore', 'pipe', 'inherit'] });
  server.stdout.on('data', data => process.stdout.write(data));
  await Promise.race([once(server.stdout, 'data'), once(server, 'exit').then(() => { throw new Error('Candidate server exited'); })]);
  async function check(path, expected, token, method = 'GET', body) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, expected, `${method} ${path}: ${await response.text()}`);
    console.log(`PASS ${expected} ${method} ${path}`);
  }
  await check('/ready', 200);
  await check('/api/v1/public/destinations', 200);
  await check('/api/v1/public/content', 200);
  await check('/api/v1/public/offline/manifest?channel=kiosk', 200);
  await check('/api/v1/operators', 401);
  await check('/api/v1/operators', 200, 'admin');
  await check(`/api/v1/operators/${ids.operatorB}`, 403, 'operator');
  await check(`/api/v1/operators/${ids.operatorA}`, 200, 'operator');
  await check(`/api/v1/ntdp/membership?operatorId=${ids.operatorA}`, 200, 'operator');
  await check(`/api/v1/ntdp/membership?operatorId=${ids.operatorB}`, 403, 'operator');
  await check('/api/v1/ntdp/membership', 403, 'operator');
  await check(`/api/v1/ntdp/membership/${ids.memberA}`, 403, 'operator', 'PATCH', { status: 'active' });
  await check(`/api/v1/ntdp/membership/${ids.memberB}`, 200, 'admin', 'PATCH', { status: 'active' });
  await check('/api/v1/ntdp/commerce/transactions', 403, 'operator');
  await check('/api/v1/ntdp/commerce/transactions', 201, 'admin', 'POST', { transactionType: 'membership_fee', amount: 10, operatorId: ids.operatorA });
  await check(`/api/v1/industry/profiles/${ids.operatorA}`, 200, 'operator');
  await check('/api/v1/content-studio/media', 201, 'admin', 'POST', { kind: 'image', storageKey: 'release-fixture', altText: 'Release fixture', mimeType: 'image/png', provinceCode: 'NCD' });
  await db.query('update users set is_active=false where id=$1', [ids.admin]);
  await check('/api/v1/content-studio/media', 401, 'admin', 'POST', {});
  await check('/api/v1/ntdp/membership', 401, 'admin');
  await db.query('update users set is_active=true where id=$1', [ids.admin]);
  const unsafeFunctions = await db.query(`select n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where ((n.nspname='gateway' and p.proname=any($1)) or (n.nspname='public' and p.proname='st_estimatedextent'))
      and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))
    order by 1`, [['prevent_api_key_reactivation','prevent_request_log_mutation','revoke_keys_for_revoked_client','validate_client_scope_grant','validate_client_status_transition']]);
  assert.deepEqual(unsafeFunctions.rows, [], `Client roles can execute internal functions: ${JSON.stringify(unsafeFunctions.rows)}`);
  console.log('PASS internal gateway and PostGIS functions are not executable by client roles');
  console.log('Candidate release checks passed against the migrated disposable database.');
} finally {
  if (server && server.exitCode === null) { server.kill(); await once(server, 'exit'); }
  identity.closeAllConnections();
  if (identity.listening) await new Promise(resolve => identity.close(resolve));
  await db.end();
}
