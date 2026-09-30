import { beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { loadMigrationPlan } from '../scripts/migration-plan.mjs';

describe('Fresh-database migration reconstruction', () => {
  let plan: Awaited<ReturnType<typeof loadMigrationPlan>>;
  let history: { migrations: { version: string; statements: string[] }[] };
  beforeAll(async () => {
    plan = await loadMigrationPlan();
    history = JSON.parse(await readFile('review/2026-09-29/remote-migration-history.json', 'utf8'));
  }, 60_000);

  it('places recovered prerequisites before their consumers without duplicate IDs', () => {
    const ids = plan.map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.indexOf('recovered/20260911120045_seed_featured_destinations.sql')).toBeLessThan(ids.indexOf('0011_featured_destination_hero_media.sql'));
    expect(ids.indexOf('recovered/20260919112411_national_tourism_registry_operator_lifecycle.sql')).toBeLessThan(ids.indexOf('0015_registry_publication_integrity.sql'));
    for (const id of [
      'recovered/20260915225718_harden_function_search_paths.sql',
      'recovered/20260915225725_restrict_gateway_trigger_functions.sql',
      'recovered/20260915225738_restrict_postgis_estimated_extent_rpc.sql',
    ]) {
      expect(ids.indexOf(id)).toBeGreaterThan(ids.indexOf('0031_ntdp_api_gateway_key_lifecycle.sql'));
      expect(ids.indexOf(id)).toBeLessThan(ids.indexOf('0032_ntdp_security_rls_service_boundaries.sql'));
    }
  });

  it('preserves the recovered production statements exactly except line endings and outer whitespace', () => {
    for (const item of plan.filter(item => item.id.startsWith('recovered/'))) {
      const version = item.id.split('/')[1].split('_')[0];
      const original = history.migrations.find(migration => migration.version === version);
      expect(original).toBeDefined();
      expect(item.source.trim()).toBe(original.statements.join('\n').replace(/\r\n/g, '\n').trim());
    }
  });
});
