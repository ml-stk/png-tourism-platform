# Visitor Industry → Trip Planning Integration

The visitor journey now connects published Industry Ecosystem experiences with local trip-planning state.

## Visitor behavior

- Published experiences are loaded through `/api/v1/industry/experiences` and operator attribution through `/api/v1/industry/profiles`.
- Experiences can be saved locally and added to the visitor journey without direct database access.
- Existing destination itinerary state remains local/offline-capable.
- QR/deep-link handoffs continue to use public experience references; production resolution remains governed by the QR resolver.
- When connectivity is unavailable, cached published experiences can be presented but lead submission is not attempted.

## Engagement boundary

`POST /api/v1/visitor/engagement` accepts a small allowlist of non-PII tourism events: experience views, saves, itinerary additions, destination additions and QR handoffs.

Events contain governed tourism references, province/source context and bounded metadata. They do not accept visitor identity, message content, regulatory fields or arbitrary payloads. Events are stored separately from regulatory data for future Tourism Intelligence aggregation.

## Persistence

Migration `0007_visitor_engagement.sql` creates the append-only engagement event store with indexes for time, province and experience analysis.
