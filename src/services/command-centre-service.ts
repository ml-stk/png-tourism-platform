import type { ProvinceCode } from '../domain/types';
import type { MetricPeriod } from '../domain/intelligence';
import type { CommandCentreReport } from '../domain/command-centre';
import { IntelligenceService, type IntelligenceServiceDeps } from './intelligence-service';
import type { VisitorEngagementAnalyticsRepository } from '../persistence/visitor-engagement-repository';

const periodDays: Record<MetricPeriod, number> = { day: 1, week: 7, month: 30, quarter: 90, year: 365 };

export interface CommandCentreServiceDeps extends IntelligenceServiceDeps {
  engagement: VisitorEngagementAnalyticsRepository;
}

export class CommandCentreService {
  private readonly intelligence: IntelligenceService;
  constructor(private readonly deps: CommandCentreServiceDeps) { this.intelligence = new IntelligenceService(deps); }

  async report(period: MetricPeriod = 'month', provinceCode?: ProvinceCode, now = new Date()): Promise<CommandCentreReport> {
    const until = now;
    const since = new Date(now.getTime() - periodDays[period] * 86_400_000);
    const [snapshot, provinces, engagement, engagementByProvince] = await Promise.all([
      this.intelligence.snapshot(period, now),
      this.intelligence.provincial(period, now),
      this.deps.engagement.summarize({ since, until, provinceCode }),
      this.deps.engagement.summarizeByProvince({ since, until }),
    ]);
    const scopedProvinces = provinceCode ? provinces.filter(p => p.provinceCode === provinceCode) : provinces;
    return {
      generatedAt: now.toISOString(), period, ...(provinceCode ? { provinceCode } : {}), snapshot,
      engagement,
      provinces: scopedProvinces.map(p => ({ ...p, engagementSignals: engagementByProvince.get(p.provinceCode) ?? 0 })),
      freshness: [
        { source: 'platform', generatedAt: now.toISOString(), governed: true },
        { source: 'visitor_engagement', generatedAt: now.toISOString(), governed: true },
      ],
    };
  }
}
