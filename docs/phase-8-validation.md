# Phase 8 Validation Checklist

## Governance

- [x] AI tools are explicitly allowlisted.
- [x] Tool access is limited to published tourism data.
- [x] Regulatory/private requests are refused.
- [x] Unsafe requests are refused.
- [x] Out-of-scope requests are refused.
- [x] Model adapters receive governed tool results, not repository handles.
- [x] Responses carry model/prompt versions and provenance.

## Delivery

- [x] Domain contracts implemented.
- [x] Concierge service implemented.
- [x] Deterministic service tests implemented.
- [x] API endpoint wired through the service boundary.
- [x] Request-size validation implemented at the HTTP boundary.
- [x] API and ADR documentation complete.
- [ ] Public visitor exposure, rate limiting, persisted AI audit, provider integration, and adversarial evaluation remain hardening work.
