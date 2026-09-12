import type { ContentItem, Destination, ProvinceCode } from './types';

export type OfflineChannel = 'provincial' | 'kiosk';
export type OfflineRecordKind = 'destination' | 'content';

export interface OfflineRecord {
  id: string;
  kind: OfflineRecordKind;
  version: string;
  updatedAt: string;
  payload: Destination | ContentItem;
}

export interface OfflineManifest {
  schemaVersion: 1;
  generatedAt: string;
  channel: OfflineChannel;
  provinceCode?: ProvinceCode;
  records: OfflineRecord[];
  source: 'public-published-content';
}

export type SyncHealth = 'never_synced' | 'fresh' | 'stale' | 'offline';

export interface SyncState {
  health: SyncHealth;
  lastSuccessfulSyncAt?: string;
  sourceGeneratedAt?: string;
  staleAfterSeconds: number;
}

export interface QrHandoff {
  version: 1;
  targetType: 'destination' | 'content';
  targetId: string;
  uri: string;
  expiresAt?: string;
  verificationToken?: string;
}
