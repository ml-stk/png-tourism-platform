import { describe, expect, it } from 'vitest';
import { PostgresMediaRepository } from './media-repository';

describe('PostgresMediaRepository',()=>{
 it('is constructed around the database pool boundary',()=>{const repository=new PostgresMediaRepository({} as any);expect(repository).toBeDefined();expect(typeof repository.create).toBe('function');expect(typeof repository.setPublication).toBe('function');expect(typeof repository.link).toBe('function');});
});
