import type { ContentItem, ProvinceCode, PublicationStatus } from './types';

export type ActivationType = 'event' | 'campaign';

export interface TourismEvent {
  id: string;
  title: string;
  slug: string;
  provinceCode: ProvinceCode;
  summary?: string;
  startsAt: string;
  endsAt: string;
  venue?: string;
  publicationStatus: PublicationStatus;
  version: number;
  updatedAt: string;
}

export interface TourismCampaign {
  id: string;
  title: string;
  slug: string;
  provinceCode?: ProvinceCode;
  summary?: string;
  linkedContentIds: string[];
  publicationStatus: PublicationStatus;
  version: number;
  updatedAt: string;
}

export interface ActivationListItem {
  id: string;
  type: ActivationType;
  title: string;
  slug: string;
  provinceCode?: ProvinceCode;
  summary?: string;
  publicationStatus: PublicationStatus;
  version: number;
  updatedAt: string;
}

export function toActivationItem(item: ContentItem): ActivationListItem | null {
  if (item.type !== 'event' && item.type !== 'campaign') return null;
  return { id: item.id, type: item.type, title: item.title, slug: item.slug, provinceCode: item.provinceCode, summary: item.summary, publicationStatus: item.publicationStatus, version: item.version, updatedAt: item.updatedAt };
}
