import type { ID, ProvinceCode } from './types';
import type { MediaAsset } from './content-studio';

export interface DestinationProjection {
  id: ID;
  slug: string;
  name: string;
  provinceCode: ProvinceCode;
  description?: string;
  latitude?: number;
  longitude?: number;
  contentVersion: number;
  updatedAt: string;
  freshness: 'fresh' | 'stale';
  content?: { id: ID; title: string; summary?: string; body?: string; version: number; updatedAt: string };
  media: Array<Pick<MediaAsset, 'id' | 'kind' | 'publicUrl' | 'altText' | 'caption' | 'width' | 'height' | 'version' | 'updatedAt'>>;
  qrPath: string;
  offlineCacheKey: string;
  provenance: { source: 'governed-content'; generatedAt: string; published: true };
}
