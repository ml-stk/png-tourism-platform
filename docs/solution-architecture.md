# NTDP Solution Architecture

## Logical architecture

```text
                           APPROVED CHANNELS
  +----------------+ +----------------+ +--------------------+
  | Tourism Web    | | Super App/PWA  | | Provincial Portals |
  +--------+-------+ +--------+-------+ +---------+----------+
           |                  |                   |
           +------------------+-------------------+
                              |
                    National API / Gateway
                              |
        +---------------------+----------------------+
        |                                            |
  Application Services                       Access Control
        |                                            |
  +-----+------+-----+------+-----+-----+            |
  | Registry   | GIS | SME  | TIA | Reg |            |
  | Warehouse  |     |      |     |     |            |
  | Distribution | Commerce | Intelligence | AI      |
  +-------------------+------------------------------+
                      |
             Governed Data Boundary
                      |
      +---------------+------------------+
      | PostgreSQL / PostGIS            |
      | Analytics warehouse structures  |
      | Audit and AI audit              |
      +----------------------------------+
                      |
               Integration Layer
       +--------------+---------------+
       | Identity | Payment providers |
       | External agencies | B2B APIs  |
       +------------------------------+

  Kiosks and offline provincial channels consume versioned public
  manifests and never become an alternative source of truth.
```

## Nine modules

The architecture reserves a first-class boundary for all nine Concept Note modules. Operational services share the Registry and publication boundary.

## Data architecture

- Operational PostgreSQL: registry, operators, destinations, content, users, roles and workflows.
- PostGIS: governed tourism geospatial assets and spatial indexing.
- Analytics schema: historical operator snapshots, visitor event facts and metric facts; designed to mature into the national Tourism Data Warehouse.
- Audit: operational and AI audit events.
- Public projection: only explicitly published public tourism information is distributed to visitor channels.

## Access control

Production identity uses signed bearer tokens and server-side role/permission checks. Province and operator scopes are enforced at the service boundary. Anonymous clients can only reach explicitly public endpoints.

## Availability and connectivity

Web/PWA and public APIs remain the primary connected channels. Provincial and kiosk channels use versioned offline manifests. Offline content has explicit freshness/sync semantics. Service-worker caching is not treated as a second content database. Production deployment requires backup, restore, monitoring and recovery testing.

## Hosting direction

The codebase is compatible with managed PostgreSQL/Supabase-style persistence and containerised Node hosting. Final production hosting is subject to PNGTPA/DICT architecture and security review, including sovereignty, resilience, backup, connectivity and operational support.

## Security controls

Production JWT authentication; RBAC/resource scoping; security headers; request body limits; correlation IDs; application rate limiting with a distributed gateway limiter required before horizontal scale; public/private data boundary; audit trails; external secret-manager boundary for payment credentials.

## Technology rationale

TypeScript/React provides a common implementation language. PostgreSQL provides transactional integrity for registry workloads. PostGIS provides the geospatial foundation. Versioned REST APIs provide a controlled integration boundary that can sit behind an API gateway/WAF. PWA/offline patterns address variable connectivity and provincial/kiosk channels.
