# Visitor Destination Detail v1

The destination detail experience is the visitor-facing continuation of the governed destination public projection.

## Boundary

- Reads only `/api/v1/public/destinations/:id`.
- Renders published visitor-safe content and media only.
- Keeps itinerary/passport state in visitor-local storage until a governed journey sync service is introduced.
- Uses the existing visitor engagement endpoint for non-PII destination/QR handoff signals.
- AI handoff stores destination context in session storage; the Concierge remains the governed AI boundary.

## Visitor actions

1. Open a destination from discovery.
2. Review media, province, description, version and freshness.
3. Add the destination to the local journey.
4. Save a passport visit as explicitly unverified.
5. Prepare AI Concierge context.
6. Prepare a QR/deep-link reference.

## Safety

Offline mode never substitutes private or regulatory records. If the public projection cannot be loaded, the detail view fails closed rather than inventing destination content. Engagement telemetry contains no visitor identity fields.
