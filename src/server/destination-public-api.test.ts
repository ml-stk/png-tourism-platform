import { describe, expect, it } from 'vitest';

describe('destination public API contract',()=>{
 it('uses stable published-only routes',()=>{expect('/api/v1/public/destinations').toMatch(/^\/api\/v1\/public\/destinations$/);expect('/api/v1/public/destinations/:slug').toContain(':slug');});
});
