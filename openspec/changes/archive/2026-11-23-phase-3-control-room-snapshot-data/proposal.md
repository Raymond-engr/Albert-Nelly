# Proposal: Phase 3 Control Room Snapshot Data & Live Store Integration

## Why
With staff authentication (Phase 1) and database schemas with RLS policies (Phase 2) established, the 13 Control Room dashboard screens must stop using mock seed data from `localStorage` (`demo.ts`) and begin rendering live database records. As specified in Phase 3 of `docs/CONTROL_ROOM_HANDOVER.md`, a unified `GET /api/control-room/snapshot` endpoint will hydrate the client-side `Db` store with real Postgres data while strictly enforcing role-based financial masking.

## What Changes
- **Snapshot Route Handler (`GET /api/control-room/snapshot`)**:
  - Implements server-side snapshot endpoint protected by `requireStaff("overview")`.
  - Executes parallel queries across all database tables using the authenticated user's Supabase client (respecting Postgres RLS).
  - Returns empty collections for areas disallowed by the user's role.
- **Row Mappers (`src/lib/control-room/server/mappers.ts`)**:
  - Transforms snake_case database records into camelCase domain models (`Db`, `Lead`, `Deal`, `Payment`, `ServiceItem`, `PackageTier`, etc.).
- **Role-Based Data Redaction**:
  - Excludes `payments` collection and sets `Deal.commissionRate = null` for roles other than `owner` and `finance`.
  - Limits activity log to the newest 200 items.
- **Store Hydration & Lifecycle (`src/lib/control-room/store.ts`)**:
  - Replaces `seedDb` with an empty initial `Db` state and eliminates `localStorage` dependency for business entities.
  - Adds `refresh()` mechanism that fetches `/api/control-room/snapshot` on initial mount, on window focus, and after future mutations.
  - Adds loading, ready, and error states with skeleton/retry UI in `Shell.tsx`.
- **Cleanup**:
  - Deprecates `demo.ts` and removes residual mock reset utilities.

## Capabilities

### New Capabilities
- `control-room/snapshot-data`: Covers the server snapshot endpoint, row-to-domain mappers, role-based data masking, and client store hydration lifecycle for the Control Room.

### Modified Capabilities
None.

## Impact
- **Public Showroom (`/`)**: No impact. Public showroom continues rendering uninterrupted.
- **Control Room (`/control-room`)**: All 13 dashboard screens render live database rows fetched from Supabase via `/api/control-room/snapshot`.
- **Backend & Database**: No schema changes; consumes the tables and RLS policies created in Phase 2.
