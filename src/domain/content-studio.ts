import type { ID, ProvinceCode, PublicationStatus } from './types';

export type MediaKind = 'image' | 'video' | 'document';

export interface MediaAsset {
  id: ID;
  kind: MediaKind;
  storageKey: string;
  publicUrl?: string;
  altText: string;
  caption?: string;
  width?: number;
  height?: number;
  mimeType: string;
  byteSize?: number;
  checksum?: string;
  provinceCode?: ProvinceCode;
  publicationStatus: PublicationStatus;
  version: number;
  updatedAt: string;
}

export interface ContentVersionSnapshot {
  id: ID;
  contentId: ID;
  version: number;
  title: string;
  summary?: string;
  body?: string;
  mediaAssetIds: ID[];
  createdAt: string;
  createdBy: ID;
}

/** Storage is intentionally represented as governed metadata; upload execution belongs behind a future object-storage adapter. */
export interface MediaStorageBoundary {
  createAsset(input: Omit<MediaAsset, 'id' | 'updatedAt'>): Promise<MediaAsset>;
  deleteAsset(id: ID): Promise<void>;
}
