# Core Domain Model

The platform separates authoritative regulatory records from publishable tourism content.

## Bounded domains

### Identity & Access
- User
- Role
- Permission
- Organisation membership
- Session

### Industry & Regulation
- Operator
- Registration
- Licence
- Membership
- Compliance record
- Regulatory document

### Destination & Content
- Province
- Destination
- Attraction
- Experience
- Event
- Content item
- Media asset
- Campaign

### Visitor Experience
- Visitor profile (optional/consent-based)
- Saved place
- Itinerary
- Itinerary item
- QR experience
- Visitor enquiry

### Intelligence & Audit
- Metric definition
- Metric observation
- Analytics event
- Audit event

## Key relationships

- A Province contains many Destinations.
- A Destination contains Attractions and Experiences.
- An Operator may have many Registrations, Licences, Memberships and Compliance records.
- An Operator may publish zero or more Business Profiles/content items after regulatory eligibility checks.
- Content may reference Operators, Destinations, Experiences and Events.
- Visitor journeys consume published content through versioned APIs.
- Regulatory and audit data are never treated as public content by default.
- Analytics events reference a source channel and may be aggregated into governed metrics.

## Lifecycle principles

1. Regulatory state is authoritative and changes through controlled workflows.
2. Publication is an explicit editorial operation, not an implicit consequence of registration.
3. Public APIs expose only records that satisfy publication and access rules.
4. Audit events are append-oriented and identify actor, action, target, timestamp and outcome.
5. Soft deletion/archive is preferred where historical or regulatory traceability matters.
6. IDs are opaque and stable across channels.
