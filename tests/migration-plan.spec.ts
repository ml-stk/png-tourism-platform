import { beforeAll, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { loadMigrationPlan } from '../scripts/migration-plan.mjs';

const recoveredMigrationChecksums = new Map([
  ['20260911120045_seed_featured_destinations.sql', 'f26aedbee13b40333b5ecf0a1e13632134c755b999cd88ab31f08b11b1294eb3'],
  ['20260915225718_harden_function_search_paths.sql', 'e746279968ba5d16b8ff5fe17bcbb26f1886fc6f10f2fdaeef90a74240caab59'],
  ['20260915225725_restrict_gateway_trigger_functions.sql', '90012111bb69e024e5d805c1251a7f4aedb546a2307ccd94fe18a808f29b071b'],
  ['20260915225738_restrict_postgis_estimated_extent_rpc.sql', 'f0cc395ab74f84b64cc1940e33be0142390d345bb1c3c62eca9a657b8bbb5bf5'],
  ['20260919112411_national_tourism_registry_operator_lifecycle.sql', 'bda7eb4da77d1d7de13938613f6cb3672727a53ebb1a4323886dfd51ede334d8'],
]);

describe('Fresh-database migration reconstruction', () => {
  let plan: Awaited<ReturnType<typeof loadMigrationPlan>>;
  beforeAll(async () => {
    plan = await loadMigrationPlan();
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

  it('preserves the reviewed recovery migration contents', () => {
    for (const item of plan.filter(item => item.id.startsWith('recovered/'))) {
      const file = item.id.slice('recovered/'.length);
      const checksum = createHash('sha256').update(item.source.trim()).digest('hex');
      expect(checksum, file).toBe(recoveredMigrationChecksums.get(file));
    }
    expect(plan.filter(item => item.id.startsWith('recovered/'))).toHaveLength(recoveredMigrationChecksums.size);
  });
});
