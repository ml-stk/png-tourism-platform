# Industry Ecosystem v1

The industry ecosystem connects active tourism operators with governed visitor experiences without exposing regulatory records.

## Boundaries

- Public profiles contain only explicitly published operator-facing information.
- Experiences use the industry service boundary and cannot bypass the governed publication path.
- Leads are created against active operators and remain operator-scoped.
- Province filtering is explicit for public discovery.
- Regulatory licensing, compliance, suspension reasons, and private operator records remain outside the visitor surface.
- AI access continues through governed tools and public source kinds only.

## Service operations

`IndustryEcosystemService.publicProfiles()` and `publicExperiences()` provide visitor discovery.

Operator-facing profile/experience mutations use optimistic versions and require an active operator. Experience publication is deliberately delegated to the existing governed content publication workflow.

`createLead()` provides a visitor/referral handoff to an active operator. Operator lead retrieval is scoped to the operator identity.

Future HTTP endpoints should remain under `/api/v1/industry` and `/api/v1/leads`, with server-side authentication, RBAC, resource scoping, validation, audit for regulatory/security mutations, and published-only public reads.
