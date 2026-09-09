import type { ProvinceCode } from '../domain/types';
import type { OfflineChannel, OfflineManifest, OfflineRecord, QrHandoff, SyncState } from '../domain/offline';
import type { ContentRepository, DestinationRepository } from './contracts';

export interface OfflineServiceDeps {
  destinations: DestinationRepository;
  content: ContentRepository;
}

export interface OfflineManifestOptions {
  channel: OfflineChannel;
  provinceCode?: ProvinceCode;
  limit?: number;
  now?: Date;
}

const DEFAULT_STALE_AFTER_SECONDS = 24 * 60 * 60;

export class OfflineService {
  constructor(private readonly deps: OfflineServiceDeps) {}

  async buildManifest(options: OfflineManifestOptions): Promise<OfflineManifest> {
    if (options.channel === 'provincial' && !options.provinceCode) {
      throw new Error('Province code is required for provincial offline manifests');
    }

    const limit = Math.min(Math.max(options.limit ?? 500, 1), 1000);
    const now = options.now ?? new Date();
    const provinceCode = options.channel === 'provincial' ? options.provinceCode : undefined;
    const [destinations, content] = await Promise.all([
      this.deps.destinations.list({ provinceCode, limit }),
      this.deps.content.list({ publicationStatus: 'published', limit }),
    ]);

    const records: OfflineRecord[] = [
      ...destinations.items
        .filter((item) => item.publicationStatus === 'published' && (!provinceCode || item.provinceCode === provinceCode))
        .map((item) => ({ id: item.id, kind: 'destination' as const, version: `${item.id}:${item.publicationStatus}`, updatedAt: now.toISOString(), payload: item })),
      ...content.items
        .filter((item) => item.publicationStatus === 'published')
        .map((item) => ({ id: item.id, kind: 'content' as const, version: `${item.id}:${item.version}`, updatedAt: now.toISOString(), payload: item })),
    ];

    return {
      schemaVersion: 1,
      generatedAt: now.toISOString(),
      channel: options.channel,
      ...(provinceCode ? { provinceCode } : {}),
      records,
      source: 'public-published-content',
    };
  }

  syncState(lastSuccessfulSyncAt?: string, now = new Date(), staleAfterSeconds = DEFAULT_STALE_AFTER_SECONDS): SyncState {
    if (!lastSuccessfulSyncAt) return { health: 'never_synced', staleAfterSeconds };
    const ageSeconds = Math.max(0, (now.getTime() - new Date(lastSuccessfulSyncAt).getTime()) / 1000);
    return { health: ageSeconds > staleAfterSeconds ? 'stale' : 'fresh', lastSuccessfulSyncAt, staleAfterSeconds };
  }

  offlineState(lastSuccessfulSyncAt?: string, _now = new Date(), staleAfterSeconds = DEFAULT_STALE_AFTER_SECONDS): SyncState {
    return { health: 'offline', ...(lastSuccessfulSyncAt ? { lastSuccessfulSyncAt } : {}), staleAfterSeconds };
  }

  createQrHandoff(targetType: QrHandoff['targetType'], targetId: string, expiresAt?: Date): QrHandoff {
    if (!targetId.trim()) throw new Error('QR handoff target is required');
    return {
      version: 1,
      targetType,
      targetId,
      uri: `pngtourism://handoff/${targetType}/${encodeURIComponent(targetId)}`,
      ...(expiresAt ? { expiresAt: expiresAt.toISOString() } : {}),
    };
  }
}
