# Platform UI Preview

The next-generation PNG Tourism Platform uses GitLab Pages to publish a static preview of the visitor and TPA interfaces from `main`.

## Preview URL

GitLab Pages publishes the application at the project's Pages domain after the `pages` job succeeds. The URL is available from **Deploy > Pages** in GitLab.

## Scope

The preview is intended for visual and interaction review of the frontend. It includes the current:

- Visitor Experience
- AI Tourism Concierge
- Trip Planner and map
- Industry Discovery
- TPA Command Centre
- Campaign and Event workspace
- Tourism Intelligence

The Pages deployment is static. Production API connectivity, PostgreSQL, authentication, and server-side integrations remain separate platform services and are not replaced by this preview.

## Safety boundary

This preview does not modify or deploy the existing PNG Tourism Digital Platform MVP. It is generated exclusively from the `png-tourism-platform` repository.
