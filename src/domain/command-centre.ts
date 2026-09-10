import type { MetricPeriod, ProvincialInsight, TourismKpiSnapshot } from './intelligence';
import type { ProvinceCode } from './types';

export interface EngagementSummary {
  totalSignals: number;
  experienceViews: number;
  savedExperiences: number;
  itineraryAdds: number;
  qrHandoffs: number;
}

export interface CommandCentreProvinceInsight extends ProvincialInsight {
  engagementSignals: number;
}

export interface CommandCentreReport {
  generatedAt: string;
  period: MetricPeriod;
  provinceCode?: ProvinceCode;
  snapshot: TourismKpiSnapshot;
  engagement: EngagementSummary;
  provinces: CommandCentreProvinceInsight[];
  freshness: { generatedAt: string; source: 'platform' | 'visitor_engagement'; governed: true }[];
}
