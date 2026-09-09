import { describe, expect, it } from 'vitest';
import { VisitorJourneyService } from './visitor-journey-service';
import type { Destination } from '../domain/types';
import type { DigitalTourismPassport, VisitorItinerary } from '../domain/visitor-journey';

const destination: Destination = { id: 'd1', name: 'Kokoda', slug: 'kokoda', provinceCode: 'ORO', publicationStatus: 'published', contentVersion: 1, updatedAt: '2026-01-01T00:00:00.000Z' };
const deps = () => {
  let itinerary: VisitorItinerary = { id: 'i1', title: 'PNG highlights', provinceCodes: ['ORO'], stops: [], version: 1, updatedAt: '2026-01-01T00:00:00.000Z', offlineCapable: true };
  let passport: DigitalTourismPassport = { id: 'p1', entries: [], version: 1, updatedAt: '2026-01-01T00:00:00.000Z', offlineCapable: true };
  return {
    getItinerary: async () => itinerary,
    saveItinerary: async (next: VisitorItinerary, expected?: number) => { if (expected !== itinerary.version) return null; itinerary = next; return itinerary; },
    getPassport: async () => passport,
    savePassport: async (next: DigitalTourismPassport, expected?: number) => { if (expected !== passport.version) return null; passport = next; return passport; },
    listPublishedDestinations: async () => ({ items: [destination] }),
  };
};

describe('VisitorJourneyService', () => {
  it('adds and removes itinerary stops with optimistic versioning', async () => {
    const service = new VisitorJourneyService(deps());
    const added = await service.addStop('i1', 'd1', 'Morning walk', '2026-02-01T00:00:00.000Z');
    expect(added.stops[0]).toMatchObject({ destinationId: 'd1', order: 0, note: 'Morning walk' });
    expect(added.version).toBe(2);
    const removed = await service.removeStop('i1', 'd1', '2026-02-02T00:00:00.000Z');
    expect(removed.stops).toEqual([]);
    expect(removed.version).toBe(3);
  });

  it('does not duplicate an itinerary stop', async () => {
    const service = new VisitorJourneyService(deps());
    await service.addStop('i1', 'd1');
    const duplicate = await service.addStop('i1', 'd1');
    expect(duplicate.version).toBe(2);
    expect(duplicate.stops).toHaveLength(1);
  });

  it('records an offline-capable passport visit', async () => {
    const service = new VisitorJourneyService(deps());
    const result = await service.markVisited('p1', 'd1', true, '2026-02-03T00:00:00.000Z');
    expect(result.offlineCapable).toBe(true);
    expect(result.entries).toEqual([{ destinationId: 'd1', visitedAt: '2026-02-03T00:00:00.000Z', verified: true }]);
  });
});
