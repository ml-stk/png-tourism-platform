import { describe, expect, it } from 'vitest';
import { CommandCentreService } from './command-centre-service';

const baseDeps = {
  operators: { list: async () => ({ items: [{ id: 'op-1', legalName: 'A', provinceCode: 'NCD', status: 'active', complianceStatus: 'compliant' }] }) },
  destinations: { list: async () => ({ items: [{ id: 'd-1', name: 'A', slug: 'a', provinceCode: 'NCD', publicationStatus: 'published' }] }) },
  content: { list: async () => ({ items: [{ id: 'c-1', type: 'experience', provinceCode: 'NCD', publicationStatus: 'published' }] }) },
  provinces: { list: async () => [{ code: 'NCD' }] },
};

describe('CommandCentreService', () => {
  it('aggregates governed platform and engagement signals', async () => {
    const service = new CommandCentreService({
      ...baseDeps,
      engagement: {
        record: async () => undefined,
        summarize: async () => ({ totalSignals: 8, experienceViews: 4, savedExperiences: 2, itineraryAdds: 1, qrHandoffs: 1 }),
        summarizeByProvince: async () => new Map([['NCD', 8]]),
      },
    } as never);
    const report = await service.report('month', undefined, new Date('2026-09-10T00:00:00Z'));
    expect(report.snapshot.activeOperators).toBe(1);
    expect(report.snapshot.publishedExperiences).toBe(1);
    expect(report.engagement.totalSignals).toBe(8);
    expect(report.provinces[0].engagementSignals).toBe(8);
    expect(report.freshness.every(item => item.governed)).toBe(true);
  });

  it('scopes the report to a requested province', async () => {
    const service = new CommandCentreService({
      ...baseDeps,
      engagement: { record: async () => undefined, summarize: async () => ({ totalSignals: 0, experienceViews: 0, savedExperiences: 0, itineraryAdds: 0, qrHandoffs: 0 }), summarizeByProvince: async () => new Map() },
    } as never);
    const report = await service.report('week', 'NCD', new Date('2026-09-10T00:00:00Z'));
    expect(report.provinceCode).toBe('NCD');
    expect(report.provinces).toHaveLength(1);
    expect(report.provinces[0].provinceCode).toBe('NCD');
  });
});
