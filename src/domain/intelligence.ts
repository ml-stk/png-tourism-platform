import type { ProvinceCode } from './types';

export type MetricPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type MetricSource = 'platform' | 'operator' | 'visitor' | 'campaign' | 'external';

export interface MetricPoint {
  key: string;
  value: number;
  period: string;
  source: MetricSource;
  provinceCode?: ProvinceCode;
}

export interface TourismKpiSnapshot {
  generatedAt: string;
  period: MetricPeriod;
  visitors: number;
  publishedDestinations: number;
  activeOperators: number;
  compliantOperators: number;
  publishedExperiences: number;
  provincesRepresented: number;
}

export interface ProvincialInsight {
  provinceCode: ProvinceCode;
  publishedDestinations: number;
  activeOperators: number;
  compliantOperators: number;
  publishedExperiences: number;
  visitorSignals: number;
}

export interface TourismInsightReport {
  generatedAt: string;
  period: MetricPeriod;
  snapshot: TourismKpiSnapshot;
  provinces: ProvincialInsight[];
  trends: MetricPoint[];
  provenance: { source: MetricSource; generatedAt: string; governed: true }[];
}
