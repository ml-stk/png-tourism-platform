# Visitor trip planner

The visitor trip planner is the first responsive product surface built on the visitor journey foundation.

## Boundary

- Only published destination data is presented.
- Destination coordinates are map-ready public data.
- Regulatory, licensing, compliance and private operator data are not exposed.
- Journey state is held behind the visitor journey service/repository boundary.
- The current browser experience uses local persistence for offline continuity; API synchronization remains behind the service boundary.

## UX guarantees

- Add/remove destinations from an ordered itinerary.
- Persist itinerary state locally for offline use.
- Show connected/offline state explicitly.
- Represent visits separately from verification; a visitor marking a destination visited does not make it verified.
- Surface map-ready coordinates without coupling the UI to a map vendor.

## Next integration

Replace the current demo destination adapter with `GET /api/v1` published visitor services and wire itinerary persistence to `/api/v1/visitor/journeys`. A dedicated map adapter can then render the same coordinate contract without changing the visitor domain model.
