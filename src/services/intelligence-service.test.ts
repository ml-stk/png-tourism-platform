import { describe, expect, it } from 'vitest';
import { IntelligenceService } from './intelligence-service';
import type { DestinationRepository, ContentRepository, OperatorRepository, ProvinceRepository } from './contracts';

const provinces = [{ id: '1', code: 'NCD' as const, name: 'National Capital District', slug: 'ncd' }];
const ops = [{ id: 'o1', legalName: 'Active Operator', provinceCode: 'NCD' as const, status: 'active' as const, complianceStatus: 'compliant' as const, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }];
const destinations = [{ id: 'd1', name: 'Port Moresby', slug: 'port-moresby', provinceCode: 'NCD' as const, publicationStatus: 'published' as const }];
const content = [{ id: 'c1', type: 'experience' as const, title: 'Experience', slug: 'experience', publicationStatus: 'published' as const, version: 1, updatedAt: '2026-01-01T00:00:00.000Z' }];
const listRepo = <T>(items: T[]) => ({ list: async () => ({ items, nextCursor: undefined }) });
const provinceRepo = (): ProvinceRepository => ({ list: async () => provinces, getByCode: async (code) => provinces.find((province) => province.code === code) ?? null });
const contentRepo = (items: typeof content): ContentRepository => ({ list: async () => ({ items, nextCursor: undefined }), getById: async (id) => items.find((item) => item.id === id) ?? null, save: async (item) => item, update: async (item) => item });

describe('IntelligenceService', () => {
  it('builds governed national KPIs from published/active records', async () => {
    const service = new IntelligenceService({ operators: listRepo(ops) as OperatorRepository, destinations: listRepo(destinations) as DestinationRepository, content: contentRepo(content), provinces: provinceRepo() });
    const snapshot = await service.snapshot('month', new Date('2026-09-01T00:00:00.000Z'));
    expect(snapshot.activeOperators).toBe(1);
    expect(snapshot.compliantOperators).toBe(1);
    expect(snapshot.publishedDestinations).toBe(1);
    expect(snapshot.publishedExperiences).toBe(1);
    expect(snapshot.provincesRepresented).toBe(1);
    expect(snapshot.visitors).toBe(0);
  });

  it('keeps regulatory operator state out of visitor-facing metrics', async () => {
    const service = new IntelligenceService({ operators: listRepo([{ ...ops[0], status: 'suspended' as const, complianceStatus: 'non_compliant' as const }]) as OperatorRepository, destinations: listRepo(destinations) as DestinationRepository, content: contentRepo([]), provinces: provinceRepo() });
    const report = await service.report();
    expect(report.snapshot.activeOperators).toBe(0);
    expect(report.snapshot.compliantOperators).toBe(0);
    expect(report.provenance[0].governed).toBe(true);
  });
});
