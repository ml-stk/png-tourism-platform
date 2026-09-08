# Development Standards

## Architecture

- Domain logic belongs in services/domain modules, not React components.
- UI consumes application services/API contracts and must not encode authorization rules.
- Regulatory data and public content remain separate concerns.
- External integrations are isolated behind adapters.
- AI capabilities access governed services/tools only.

## Security

- Deny by default for protected operations.
- Validate all external input at service boundaries.
- Never trust client-supplied roles, compliance state or publication state.
- Do not place secrets in source control or browser bundles.
- Record security-relevant administrative mutations in the audit stream.

## Data

- Prefer immutable identifiers.
- Preserve historical regulatory records.
- Use explicit status transitions rather than arbitrary strings where lifecycle matters.
- Public search indexes only published records.

## Channels

The web, PWA/mobile, provincial portal and kiosk are consumers of shared services. Business rules must not be duplicated between channels.

## Offline

Offline-capable clients must distinguish cached data from current data, queue writes explicitly and surface synchronization state to users.

## AI

AI responses must be grounded in permitted platform data. Tool calls require explicit authorization boundaries and should produce traceable request metadata.
