# NTDP Channel Contract

## Purpose

Define the shared contract between the NTDP platform services and every presentation channel: Website, Super App, Provincial Tourism Portals, Kiosks and approved third-party platforms.

## Principle

The National Tourism Registry and governed platform services remain authoritative. Channels consume published records and must not create competing tourism master records.

## Channel model

| Channel | Primary role | Data posture |
|---|---|---|
| Website | Public discovery and trip planning | Public published records; resilient snapshot fallback |
| Super App | Rich visitor journey and future commerce | Same public contract plus authenticated/personal capabilities where approved |
| Provincial Portals | Provincial discovery and administration | Province-scoped published data and authorized provincial functions |
| Kiosks | Public assisted/self-service discovery | Public published data; aggressively cached/offline-capable presentation |
| Third-party platforms | Controlled distribution | Versioned, rate-limited, explicitly approved public/partner data |

## Contract requirements

### Public content

The shared public contract must support, at minimum:

- destinations and attractions
- tourism operators and services
- experiences/products
- province and location metadata
- descriptions and media references
- publication/governance status
- accessibility and visitor-safety information where approved
- map/geospatial references
- contact/enquiry pathways

### API behaviour

- Version all externally consumed APIs.
- Return predictable envelopes and error structures.
- Expose only records approved for the requesting channel.
- Support pagination and bounded result sets.
- Apply rate limiting and abuse protection.
- Include provenance/publication metadata where useful.
- Never expose internal database identifiers or operational-only fields unless explicitly part of the contract.

### Resilience

Website and kiosk channels must tolerate intermittent connectivity. Public published content should have a cache/snapshot strategy. Kiosks require a stronger offline-first profile than the website.

### Security

- Separate public read access from staff/operator mutations.
- Protect authority workflows with authenticated roles.
- Keep secrets and privileged credentials server-side.
- Audit privileged changes.
- Apply CORS only for approved origins/channels.

## Super App boundary

The Super App should consume the same destination/operator/content APIs as the Website. App-specific services may add identity, saved journeys, notifications, personalization and commerce, but must not duplicate the authoritative tourism registry.

## Kiosk boundary

Kiosk mode should be a dedicated presentation profile over the same public contract. It should support large touch targets, simplified navigation, accessibility, location-aware discovery where permitted, content caching and graceful operation when the network is unavailable.

## Provincial portal boundary

Provincial portals should use province-scoped views of the authoritative registry. Provincial publishing and administrative permissions must remain governed by the central platform's authorization and publication model.

## Third-party boundary

Third-party consumers should use explicit API versions and approved scopes. Distribution must be governed by publication status, partner entitlement, rate limits and auditability.

## Implementation sequence

1. Stabilize the current Website public API consumption.
2. Define canonical schemas and API versions.
3. Add contract tests to CI.
4. Introduce channel capability metadata and scopes.
5. Build Super App integration against the contract.
6. Build Kiosk mode against the same contract with offline-first behaviour.
7. Extend the model for provincial portals and approved third parties.
