import { DomainError } from '../domain/errors';
import type { Destination } from '../domain/types';
import type { DigitalTourismPassport, ItineraryStop, VisitorItinerary, VisitorJourneyRepository } from '../domain/visitor-journey';

export interface VisitorJourneyServiceDeps extends VisitorJourneyRepository {
  listPublishedDestinations(options?: { provinceCode?: Destination['provinceCode']; limit?: number }): Promise<{ items: Destination[]; nextCursor?: string }>;
}

export class VisitorJourneyService {
  constructor(private readonly deps: VisitorJourneyServiceDeps) {}

  async snapshot(itineraryId: string, passportId: string) {
    const [itinerary, passport] = await Promise.all([this.deps.getItinerary(itineraryId), this.deps.getPassport(passportId)]);
    if (!itinerary || !passport) throw new DomainError('NOT_FOUND', 'Visitor journey not found');
    const destinations = await Promise.all(itinerary.stops.map(async stop => this.deps.listPublishedDestinations({ limit: 100 }).then(result => result.items.find(d => d.id === stop.destinationId)).catch(() => undefined)));
    return { itinerary, passport, destinations: destinations.filter((d): d is Destination => Boolean(d)) };
  }

  async addStop(itineraryId: string, destinationId: string, note?: string, now = new Date().toISOString()) {
    const itinerary = await this.requireItinerary(itineraryId);
    const existing = itinerary.stops.find(stop => stop.destinationId === destinationId);
    if (existing) return itinerary;
    const stop: ItineraryStop = { destinationId, order: itinerary.stops.length, addedAt: now, ...(note ? { note } : {}) };
    return this.saveVersioned({ ...itinerary, stops: [...itinerary.stops, stop], version: itinerary.version + 1, updatedAt: now });
  }

  async removeStop(itineraryId: string, destinationId: string, now = new Date().toISOString()) {
    const itinerary = await this.requireItinerary(itineraryId);
    const stops = itinerary.stops.filter(stop => stop.destinationId !== destinationId).map((stop, index) => ({ ...stop, order: index }));
    if (stops.length === itinerary.stops.length) return itinerary;
    return this.saveVersioned({ ...itinerary, stops, version: itinerary.version + 1, updatedAt: now });
  }

  async markVisited(passportId: string, destinationId: string, verified = false, now = new Date().toISOString()) {
    const passport = await this.deps.getPassport(passportId);
    if (!passport) throw new DomainError('NOT_FOUND', 'Digital tourism passport not found');
    const existing = passport.entries.find(entry => entry.destinationId === destinationId);
    const entries = existing
      ? passport.entries.map(entry => entry.destinationId === destinationId ? { ...entry, visitedAt: entry.visitedAt ?? now, verified: entry.verified || verified } : entry)
      : [...passport.entries, { destinationId, visitedAt: now, verified }];
    return this.deps.savePassport({ ...passport, entries, version: passport.version + 1, updatedAt: now }, passport.version).then(saved => {
      if (!saved) throw new DomainError('CONFLICT', 'Passport changed; refresh and retry');
      return saved;
    });
  }

  private async requireItinerary(id: string) {
    const itinerary = await this.deps.getItinerary(id);
    if (!itinerary) throw new DomainError('NOT_FOUND', 'Itinerary not found');
    return itinerary;
  }

  private async saveVersioned(itinerary: VisitorItinerary) {
    const saved = await this.deps.saveItinerary(itinerary, itinerary.version - 1);
    if (!saved) throw new DomainError('CONFLICT', 'Itinerary changed; refresh and retry');
    return saved;
  }
}

export type VisitorJourneyPassport = DigitalTourismPassport;
