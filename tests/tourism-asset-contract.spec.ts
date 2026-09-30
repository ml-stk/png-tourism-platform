import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { postgis } from '@electric-sql/pglite-postgis';
import { loadMigrationPlan } from '../scripts/migration-plan.mjs';

describe('Tourism asset contract reconciliation', () => {
  const db = new PGlite({ extensions: { pgcrypto, postgis } });
  let provinceId: string;

  beforeAll(async () => {
    await db.waitReady;
    await db.exec(await readFile('scripts/ci-database-bootstrap.sql', 'utf8'));
    const productionShape = await readFile('tests/fixtures/production-tourism-assets.sql', 'utf8');
    for (const migration of await loadMigrationPlan()) {
      await db.exec(migration.id === '0026_registry_tourism_assets.sql' ? productionShape : migration.source);
    }
    provinceId = String((await db.query("select id from public.provinces where code='ORO'")).rows[0].id);
    await db.query(
      "insert into public.operators(id,legal_name,province_code,status) values('a0000000-0000-4000-8000-000000000001','Active fixture','ORO','active'),('a0000000-0000-4000-8000-000000000002','Draft fixture','ORO','draft')",
    );
  }, 60_000);

  afterAll(async () => db.close());

  it('normalizes all three tables to the dual-compatible column contract', async () => {
    for (const table of ['tourism_attractions', 'tourism_products', 'tourism_services']) {
      const result = await db.query<{ column_name: string }>(
        "select column_name from information_schema.columns where table_schema='public' and table_name=$1",
        [table],
      );
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toEqual(expect.arrayContaining([
        'registry_id', 'slug', 'summary', 'province_id', 'province_code', 'status', 'publication_status',
      ]));
    }
  });

  it('uses one unique index for each compatibility identifier', async () => {
    const result = await db.query<{ table_name: string; column_name: string; indexes: number }>(
      `select t.relname as table_name,a.attname as column_name,count(*)::integer as indexes
       from pg_catalog.pg_index i
       join pg_catalog.pg_class t on t.oid=i.indrelid
       join pg_catalog.pg_namespace n on n.oid=t.relnamespace
       join pg_catalog.pg_attribute a on a.attrelid=t.oid and a.attnum=any(i.indkey)
       where n.nspname='public'
         and t.relname in ('tourism_attractions','tourism_products','tourism_services')
         and a.attname in ('registry_id','slug') and i.indisunique and i.indnkeyatts=1
       group by t.relname,a.attname order by t.relname,a.attname`,
    );
    expect(result.rows).toHaveLength(6);
    expect(result.rows.every(row => Number(row.indexes) === 1)).toBe(true);
  });

  it('accepts legacy writes and derives canonical lifecycle and geography fields', async () => {
    const result = await db.query<{ registry_id: string; slug: string; province_code: string; publication_status: string }>(
      `insert into public.tourism_products(operator_id,name,product_type,province_id,status)
       values('a0000000-0000-4000-8000-000000000001','Kokoda Legacy Tour','tour',$1,'submitted')
       returning registry_id,slug,province_code,publication_status`,
      [provinceId],
    );
    expect(result.rows[0]).toMatchObject({ province_code: 'ORO', publication_status: 'review' });
    expect(result.rows[0].registry_id).toMatch(/^PRD-/);
    expect(result.rows[0].slug).toMatch(/^kokoda-legacy-tour-/);
  });

  it('accepts canonical writes and keeps legacy compatibility fields synchronized', async () => {
    const inserted = await db.query<{ id: string; province_id: string; status: string }>(
      `insert into public.tourism_services(operator_id,name,service_type,province_code,publication_status)
       values('a0000000-0000-4000-8000-000000000001','Oro Guide Service','guide','ORO','review')
       returning id,province_id,status`,
    );
    expect(inserted.rows[0]).toMatchObject({ province_id: provinceId, status: 'submitted' });
    const updated = await db.query<{ status: string; publication_status: string }>(
      "update public.tourism_services set publication_status='archived' where id=$1 returning status,publication_status",
      [inserted.rows[0].id],
    );
    expect(updated.rows[0]).toEqual({ status: 'suspended', publication_status: 'archived' });
  });

  it('rejects publication for a non-active operator', async () => {
    await expect(db.query(
      `insert into public.tourism_attractions(operator_id,name,attraction_type,province_code,publication_status)
       values('a0000000-0000-4000-8000-000000000002','Blocked Attraction','attraction','ORO','published')`,
    )).rejects.toThrow(/active operator/);
  });

  it('keeps client roles deny-by-default', async () => {
    const privileges = await db.query<{ grantee: string }>(
      `select grantee from information_schema.role_table_grants
       where table_schema='public' and table_name in ('tourism_attractions','tourism_products','tourism_services')
         and grantee in ('anon','authenticated')`,
    );
    expect(privileges.rows).toHaveLength(0);
  });
});
