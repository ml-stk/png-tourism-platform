# Visitor Brand Interface v1

The visitor experience now uses the PNG Tourism Promotion Authority brand mark supplied for the platform and follows the approved visual direction: white editorial navigation, immersive destination hero, forest/ocean palette, large tourism typography, destination cards, journey tools, AI Concierge, and Digital Tourism Passport.

## Brand
- Official PNG Tourism Promotion Authority logo is bundled at `src/assets/png-tpa-logo.png`.
- The logo is rendered in the visitor header and footer.
- Visitor navigation is intentionally separate from the TPA Command Centre workspace.

## Experience structure
1. Branded global visitor navigation.
2. Immersive destination hero with search and journey shortcuts.
3. Featured destinations and governed public destination explorer.
4. Industry experiences and operator discovery.
5. Trip planning with offline-aware local state.
6. Governed AI Concierge.
7. Digital Tourism Passport.
8. TPA Command Centre handoff for authorized operational users.

## Governance
- Visitor destination data comes from published public projection endpoints.
- Visitor engagement uses the existing governed non-PII telemetry boundary.
- AI continues through the governed concierge API; no direct database access is introduced.
- Private/regulatory data remains outside the visitor surface.
- Existing MVP repositories are untouched.

## Imagery
The hero currently references a published PNG Tourism Promotion Authority destination image from the official travel site. Destination media should progressively move to the platform's governed media projection as editorial assets are onboarded.
