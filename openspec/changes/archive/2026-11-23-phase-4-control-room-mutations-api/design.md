# Design: Control Room Mutation Endpoints & Seam Client Integration

## Context

See `proposal.md` for motivation. The database schema, RLS policies, and RPC functions (`convert_lead_to_deal`, `record_payment`, `set_featured_package`, `log_activity`) were completed in Phase 2. The single snapshot reader endpoint (`GET /api/control-room/snapshot`) and store hydration were completed in Phase 3.

In Phase 4, we replace the in-memory mutations in client seam modules (`leadsApi`, `dealsApi`, `contentApi`, `campaignsApi`, `adminApi`) with real HTTP calls while preserving their signatures so that the UI components remain stable and decoupled.

## Goals / Non-Goals

**Goals:**
- Implement `src/lib/control-room/http.ts` with `call<T>()` and typed `ApiError(status, message, fields)`.
- Mount a global `unhandledrejection` handler in `Shell.tsx` to surface API errors via toasts and handle 409 conflict refreshes.
- Build clean, authenticated Route Handlers under `/api/control-room/...` checking staff permissions (`requireStaff(area, "edit")`).
- Use atomic RPC calls (`convert_lead_to_deal`, `record_payment`, `set_featured_package`) and `log_activity` for state-changing operations.
- Enforce optimistic concurrency on leads and deals using `updatedAt`.
- Rewire seam modules to call endpoints and trigger `await refreshDb()`.

**Non-Goals:**
- Server Actions: Handover Section 8 dictates Route Handlers under `/api/control-room/` to match REST patterns and decouple external/internal consumers.
- Real-time Supabase subscriptions (reserved for Phase 5).
- Public site dynamic revalidation wiring (reserved for Phase 6).

## Decisions

### 1. Seam Signature Preservation & Transparent HTTP Delegation
- **Choice**: Keep the exact signatures in `leads-api.ts`, `deals-api.ts`, etc., replacing the local `dbStore.set` mutations with `await call(...)` followed by `await refreshDb()`.
- **Rationale**: Dozens of dialogs, drawers, and buttons across 13 screens already depend on these functions. Preserving their signatures avoids widespread UI refactoring and regressions.

### 2. Centralized Error Handling via Global Unhandled Rejection
- **Choice**: Instead of wrapping every UI modal call in individual `try/catch` blocks, seam functions throw `ApiError`. `Shell.tsx` listens to `unhandledrejection` on `window`, triggers error toasts, and cancels default error logging for known `ApiError` instances.
- **Rationale**: Minimal code change across screens, unified error presentation, and zero modal state corruption. Modals with a local `saving` flag reset it in a `finally` block.

### 3. Optimistic Concurrency Control
- **Choice**: Lead and deal updates submit their loaded `updatedAt` value. The handler updates with `where id = $id and updated_at = $updatedAt`. If no record is affected, it throws HTTP 409 Conflict.
- **Rationale**: Prevents two team members from overwriting each other's changes in a multi-user environment.

### 4. Direct RPC Calls for Multi-Statement Operations
- **Choice**: Invoke PostgreSQL functions (`convert_lead_to_deal`, `record_payment`, `set_featured_package`, `log_activity`) via `supabase.rpc()`.
- **Rationale**: Guarantees database-level atomicity and enforces append-only triggers without relying on multi-query JavaScript roundtrips.

## Risks / Trade-offs

- **[Risk] Post-mutation Latency from Full Snapshot Refresh**
  → *Mitigation*: The snapshot query runs parallel queries across small tables (<1,000 rows) in under 50ms locally. As leads grow past ~2,000, Section 8.4 specifies adding targeted pagination.
- **[Risk] Unhandled Rejections in Environments without Window**
  → *Mitigation*: The `unhandledrejection` listener is attached only inside `useEffect` on the client in `Shell.tsx`.
- **[Risk] Modal Saving State Hanging on Error**
  → *Mitigation*: Update modals with `saving` state to wrap submissions in `try ... finally { setSaving(false); }`.

## Migration Plan

1. Create `src/lib/control-room/http.ts`.
2. Add global error interception and saving flag safety to `Shell.tsx` and affected modals.
3. Build Route Handlers for leads, deals, payments, content, campaigns, settings, and team.
4. Rewire seam functions in `src/lib/control-room/*-api.ts`.
5. Run full typecheck, lint, and build validation.
