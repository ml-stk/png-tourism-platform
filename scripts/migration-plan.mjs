import { readdir, readFile } from 'node:fs/promises';

// Recover proven historical prerequisites without editing the original migration files.
// This order is for fresh databases; it is not an adoption plan for production.
const prerequisites = new Map([
  ['0011_featured_destination_hero_media.sql', '20260911120045_seed_featured_destinations.sql'],
  ['0015_registry_publication_integrity.sql', '20260919112411_national_tourism_registry_operator_lifecycle.sql'],
  ['0032_ntdp_security_rls_service_boundaries.sql', [
    '20260915225718_harden_function_search_paths.sql',
    '20260915225725_restrict_gateway_trigger_functions.sql',
    '20260915225738_restrict_postgis_estimated_extent_rpc.sql',
  ]],
]);

export async function loadMigrationPlan() {
  const files = (await readdir('db/migrations')).filter(file => file.endsWith('.sql')).sort();
  const plan = [];
  for (const file of files) {
    const recovered = prerequisites.get(file);
    for (const prerequisite of recovered ? [recovered].flat() : []) {
      plan.push({ id: `recovered/${prerequisite}`, path: `db/recovered/${prerequisite}` });
    }
    plan.push({ id: file, path: `db/migrations/${file}` });
  }
  if ([...prerequisites.keys()].some(file => !files.includes(file))) throw new Error('Migration prerequisite anchor is missing');
  for (const item of plan) item.source = (await readFile(item.path, 'utf8')).replace(/\r\n/g, '\n');
  return plan;
}
