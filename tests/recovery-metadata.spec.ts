import { describe, expect, it } from 'vitest';
import { applicationExtensions, databaseFingerprint, validateExtensionMetadata } from '../scripts/database-tools.mjs';

const extensions = [
  { name: 'pgcrypto', version: '1.3', schema: 'public' },
  { name: 'postgis', version: '3.6.2', schema: 'extensions' },
];

describe('Recovery extension dependencies', () => {
  it('accepts the two required extensions in their source schemas', () => {
    expect(() => validateExtensionMetadata(extensions)).not.toThrow();
  });

  it.each([
    undefined,
    [],
    [extensions[0]],
    [extensions[0], extensions[0]],
    [extensions[0], { ...extensions[1], schema: 'extensions"; drop schema public cascade; --' }],
    [extensions[0], { ...extensions[1], version: '' }],
    [extensions[0], null],
  ])('rejects missing, ambiguous or unsafe dependency metadata: %j', invalid => {
    expect(() => validateExtensionMetadata(invalid)).toThrow(/dependency metadata/);
  });

  it('records source versions and schema placement from the catalog', async () => {
    const client = { query: async () => ({ rows: extensions }) };
    expect(await applicationExtensions(client)).toEqual(extensions);
  });

  it('refuses to call an incomplete extension inventory recoverable', async () => {
    const client = { query: async () => ({ rows: [extensions[0]] }) };
    await expect(applicationExtensions(client)).rejects.toThrow(/requires pgcrypto and postgis/);
  });

  it('fingerprints effective ACLs rather than raw catalog serialization', async () => {
    const queries: string[] = [];
    const client = { query: async (sql: string) => {
      queries.push(sql);
      return queries.length === 1 ? { rows: [] } : { rows: [] };
    } };
    await databaseFingerprint(client);
    expect(queries[0]).toContain("aclexplode(coalesce(c.relacl, acldefault('r', c.relowner)))");
    expect(queries[0]).not.toContain("coalesce(c.relacl::text,'')");
  });
});
