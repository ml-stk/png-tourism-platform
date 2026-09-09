import type { Destination, ProvinceCode } from './types';

export interface ItineraryStop {
  destinationId: string;
  order: number;
  addedAt: string;
  note?: string;
}

export interface VisitorItinerary {
  id: string;
  title: string;
  provinceCodes: ProvinceCode[];
  stops: ItineraryStop[];
  version: number;
  updatedAt: string;
  offlineCapable: true;
}

export interface VisitorPassportEntry {
  destinationId: string;
  visitedAt?: string;
  verified: boolean;
}

export interface DigitalTourismPassport {
  id: string;
  entries: VisitorPassportEntry[];
  version: number;
  updatedAt: string;
  offlineCapable: true;
}

export interface VisitorJourneySnapshot {
  itinerary: VisitorItinerary;
  destinations: Destination[];
  passport: DigitalTourismPassport;
}

export interface VisitorJourneyRepository {
  getItinerary(id: string): Promise<VisitorItinerary | null>;
  saveItinerary(itinerary: VisitorItinerary, expectedVersion?: number): Promise<VisitorItinerary | null>;
  getPassport(id: string): Promise<DigitalTourismPassport | null>;
  savePassport(passport: DigitalTourismPassport, expectedVersion?: number): Promise<DigitalTourismPassport | null>;
}
