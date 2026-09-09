import type { ContentRepository, DestinationRepository, OperatorRepository, ProvinceRepository } from './contracts';
import type { MetricPeriod, ProvincialInsight, TourismInsightReport, TourismKpiSnapshot } from '../domain/intelligence';

export interface IntelligenceServiceDeps { operators: OperatorRepository; destinations: DestinationRepository; content: ContentRepository; provinces: ProvinceRepository; }

export class IntelligenceService {
  constructor(private readonly deps: IntelligenceServiceDeps) {}
  async snapshot(period: MetricPeriod = 'month', now = new Date()): Promise<TourismKpiSnapshot> {
    const [operators, destinations, content, provinces] = await Promise.all([
      this.deps.operators.list({ limit: 1000 }), this.deps.destinations.list({ publicationStatus: 'published', limit: 1000 }), this.deps.content.list({ publicationStatus: 'published', limit: 1000 }), this.deps.provinces.list(),
    ]);
    const activeOperators = operators.items.filter((x) => x.status === 'active');
    const compliantOperators = activeOperators.filter((x) => x.complianceStatus === 'compliant');
    return { generatedAt: now.toISOString(), period, visitors: 0, publishedDestinations: destinations.items.length, activeOperators: activeOperators.length, compliantOperators: compliantOperators.length, publishedExperiences: content.items.filter((x) => x.type === 'experience').length, provincesRepresented: provinces.filter((p) => destinations.items.some((d) => d.provinceCode === p.code)).length };
  }
  async provincial(_period: MetricPeriod = 'month', _now = new Date()): Promise<ProvincialInsight[]> {
    const provinces = await this.deps.provinces.list();
    const [operators, destinations, content] = await Promise.all([this.deps.operators.list({ limit: 1000 }), this.deps.destinations.list({ publicationStatus: 'published', limit: 1000 }), this.deps.content.list({ publicationStatus: 'published', limit: 1000 })]);
    return provinces.map((province) => {
      const ops = operators.items.filter((x) => x.provinceCode === province.code);
      const dests = destinations.items.filter((x) => x.provinceCode === province.code);
      return { provinceCode: province.code, publishedDestinations: dests.length, activeOperators: ops.filter((x) => x.status === 'active').length, compliantOperators: ops.filter((x) => x.status === 'active' && x.complianceStatus === 'compliant').length, publishedExperiences: content.items.filter((x) => x.type === 'experience').length, visitorSignals: 0 };
    });
  }
  async report(period: MetricPeriod = 'month', now = new Date()): Promise<TourismInsightReport> {
    const [snapshot, provinces] = await Promise.all([this.snapshot(period, now), this.provincial(period, now)]);
    return { generatedAt: now.toISOString(), period, snapshot, provinces, trends: [], provenance: [{ source: 'platform', generatedAt: now.toISOString(), governed: true }] };
  }
}
