# Design: Snapshot Data Endpoint & Store Hydration

## Context
See `proposal.md` for motivation. In Phase 2, all 16 database tables and RLS policies were established in `supabase/migrations/`. In Phase 3, we connect the client dashboard to this real data via a single snapshot endpoint (`GET /api/control-room/snapshot`) and update `src/lib/control-room/store.ts` to consume it.

## Goals / Non-Goals

**Goals:**
- Implement `GET /api/control-room/snapshot` using `requireStaff("overview")` and the authenticated user's Supabase client.
- Build pure, server-side mappers in `src/lib/control-room/server/mappers.ts` transforming database rows to TypeScript domain types.
- Strip sensitive financial fields (`payments`, `commissionRate`) for unauthorized roles (Sales and Content).
- Replace `seedDb` in `src/lib/control-room/store.ts` with empty initial state and integrate `refresh()`.
- Add loading skeleton and error retry UI in `Shell.tsx`.
- Deprecate mock `demo.ts`.

**Non-Goals:**
- Pagination for leads and activity logs (as documented in handover 8.4, pagination is deferred until ~2,000+ rows).
- Mutation Route Handlers (`PATCH`, `POST`, `DELETE` for deals, payments, services, etc.—these are Phase 4).

## Decisions

### 1. Single Snapshot Pattern over Fragmented REST Calls
- **Choice**: Deliver the entire database snapshot in one parallel query response (`GET /api/control-room/snapshot`).
- **Rationale**: For an agency team handling hundreds of active records, a single snapshot keeps roundtrips minimal, eliminates client state drift between screens, and allows all existing client-side filters and metrics in `metrics.ts` to function without code modification.
- **Alternative Considered**: Individual endpoints per collection (`/api/leads`, `/api/deals`, etc.). Rejected for Phase 3 because it would require rewriting all 13 screens to manage individual fetch lifecycles simultaneously.

### 2. Parallel RLS-Enforced Queries
- **Choice**: Use `Promise.all` across Supabase table queries with the user's cookie-authenticated client (`supabase.from("...").select(...)`).
- **Rationale**: PostgreSQL queries run concurrently, and Row Level Security ensures that if a role is denied access to a table, Supabase returns an empty data array rather than an uncaught exception.

### 3. Server Mappers Layer
- **Choice**: Encapsulate transformations in `src/lib/control-room/server/mappers.ts` (`rowToLead`, `rowToDeal`, `rowToService`, etc.).
- **Rationale**: Isolates database naming conventions (snake_case, ISO date representations, JSONB structures) from frontend TypeScript camelCase types.

### 4. Resilient Store Lifecyle with Status Enum
- **Choice**: Extend `store.ts` with a `status: "loading" | "ready" | "error"` and export `useDbStatus()`.
- **Rationale**: Allows `Shell.tsx` to display skeleton loaders during cold loads and a retry prompt on network disconnects without throwing unhandled React render errors.

## Risks / Trade-offs

- **[Risk] Payload Growth Over Time**
  → *Mitigation*: The activity log query is capped to `.limit(200)`. When leads exceed 2,000 rows, Phase 9 / handover Section 8.4 plans cursor pagination.
- **[Risk] Development Without Live Supabase Instance**
  → *Mitigation*: Ensure `snapshot` falls back to static seed data if Supabase environment variables are missing during local offline development.

## Migration Plan
1. Implement `src/lib/control-room/server/mappers.ts`.
2. Create `src/app/api/control-room/snapshot/route.ts`.
3. Update `src/lib/control-room/store.ts` to implement `refresh()` and status tracking.
4. Enhance `Shell.tsx` with loading and error boundaries.
5. Verify end-to-end data flow with typecheck, lint, and build.
