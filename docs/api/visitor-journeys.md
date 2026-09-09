# Visitor Journey and Trip Planning

The visitor journey layer provides a client-safe foundation for trip planning and the Digital Tourism Passport.

## Principles

- Itinerary state is versioned for optimistic conflict detection.
- Itinerary and passport state are explicitly offline-capable.
- Destination references resolve only against the governed public visitor boundary.
- Regulatory operator/licensing data is never exposed through visitor journey state.
- The initial implementation keeps visitor state behind a service/repository boundary so local/offline storage can be introduced without changing the domain contract.

## Core operations

- Add or remove a destination from an itinerary.
- Preserve stop ordering and optional visitor notes.
- Mark a destination visited in the Digital Tourism Passport.
- Verify a passport visit when an approved verification mechanism is available.
- Build a journey snapshot from the itinerary, passport and published destinations.

## API direction

Future public endpoints should follow `/api/v1/visitor/journeys` and `/api/v1/visitor/passport` and must enforce published-content visibility. Authentication should not be required for anonymous trip planning; durable cross-device identity can be added later without coupling it to the public content model.
