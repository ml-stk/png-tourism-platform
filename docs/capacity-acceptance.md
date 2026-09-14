# NTDP Capacity Acceptance Gate

## Baseline

The NTDP Concept Note establishes an initial capacity baseline of up to **5,000 tourism operators** and approximately **50 Authority staff users**. This gate validates engineering readiness against that baseline; it does not replace production load testing.

## Current implementation evidence

- PostgreSQL persistence is used for the NTDP enterprise modules.
- The analytics warehouse has snapshot, visitor-event, daily-metric, metric-definition and ETL-run structures.
- GIS uses PostGIS-backed assets with spatial indexing and governed layer filtering.
- The API gateway provides client/key control, scopes, per-client rate limits and request logging.
- The current CI pipeline provides build, API smoke and test validation.
- Common administrative list paths have been given supporting indexes in migration `0030_ntdp_capacity_indexes.sql`.

## Capacity risks identified by code review

The current enterprise service still contains several list/read paths without explicit API pagination, including daily metrics, GIS assets, TIA memberships, regulatory licences/inspections/actions and distribution/partner data. At the 5,000-operator baseline these paths may remain operational but can produce unnecessarily large response payloads and database result sets as historical data accumulates.

The capacity gate therefore remains **PARTIALLY VALIDATED** until representative load testing demonstrates acceptable latency, error rate, database utilisation and connection-pool behaviour.

## Required performance test profile

Test at minimum:

1. 5,000 operator records distributed across PNG provinces.
2. 50 concurrent authenticated staff users performing representative registry, compliance, membership, GIS and analytics reads.
3. Public visitor traffic against destination/content/manifest/QR paths concurrently with staff activity.
4. Approved-partner traffic through the API gateway with authentication, scope checks, rate limiting and request logging enabled.
5. Write activity representative of registration, compliance, membership and commerce transactions.
6. Sustained and burst phases sufficient to expose connection-pool, query-plan and payload-growth issues.

## Acceptance evidence

Capture:

- p50/p95/p99 latency by endpoint class
- HTTP error rate and timeout rate
- database CPU/memory/connection utilisation
- connection-pool saturation
- slow-query evidence and query plans for critical paths
- API gateway rate-limit behaviour
- payload sizes for list/read endpoints
- recovery behaviour after load is removed

## Release decision

**Current status: PARTIALLY VALIDATED / EXTERNAL LOAD TEST REQUIRED.**

The repository and database changes improve structural readiness, but no claim of passing the 5,000-operator performance target should be made until an executed load test produces measured evidence. Pagination of high-growth administrative list APIs should be treated as a priority before production scale-up.