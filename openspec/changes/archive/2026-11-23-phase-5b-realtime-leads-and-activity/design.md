# Design

## Context

The Control Room shell (`Shell.tsx`) currently fetches a full snapshot on mount via
`refreshDb()` and re-fetches only when the user triggers a mutation. The `activity_log`
table exists in the schema and is fetched by the snapshot endpoint, but nothing writes to
it yet — `logActivity` in `api.ts` is a no-op stub. `staff.last_seen_at` exists in the
schema but is never written.

See `proposal.md – Why` for motivation.

## Goals / Non-Goals

**Goals:**
- Establish a Supabase Realtime `postgres_changes` channel in `Shell.tsx` that fires on
  `INSERT` to `public.leads`, refreshes the store, and shows a toast.
- Migrate `logActivity` from a client-side stub to a server-side helper called by all
  Phase 4 mutation routes.
- Write `staff.last_seen_at` passively inside `requireStaff`, throttled to 5 min.
- Ship the database migration enabling the `supabase_realtime` publication for `leads`.

**Non-Goals:**
- Active heartbeat interval — not needed; passive presence via API calls is sufficient.
- Realtime subscriptions for deals, payments, or any table other than `leads`.
- A dedicated paginated activity log endpoint — the snapshot's 200-row limit is adequate
  for the current team size.
- Push notifications outside the browser tab.

## Decisions

### Decision 1 — Realtime channel in Shell.tsx, not a separate provider

**Chosen**: Add the channel subscription directly inside `Shell.tsx` with a `useEffect`.

**Why**: `Shell.tsx` already holds the `useDbRefresh` and `toast` hooks. A separate
`RealtimeProvider` would add an indirection for a single subscription.

**Alternative**: A standalone `useLeadRealtime` hook extracted to a file like
`src/lib/control-room/hooks/useLeadRealtime.ts`. Rejected for now — if a second Realtime
subscription is ever needed (e.g. deals), the hook can be extracted then.

### Decision 2 — Server-side activity logging via a shared helper

**Chosen**: Create `src/lib/control-room/server/log-activity.ts` that exports
`serverLogActivity(supabase, staff, action, target?)`. Each Phase 4 mutation route calls
it after its primary write succeeds, using the `supabase` client and `staff` already
returned by `requireStaff`.

**Why**: Reuses the already-authenticated Supabase client. No new auth roundtrip. The
function is `fire-and-forget` (not awaited) so a logging failure can never block a
mutation response.

**Alternative**: A dedicated `/api/control-room/activity` POST endpoint called from the
browser. Rejected — the browser must not write directly to `activity_log` (see spec).

### Decision 3 — Throttle last_seen_at with an in-memory Map

**Chosen**: A module-level `Map<string, number>` keyed by staff id stores the last write
timestamp in the Node.js process. `requireStaff` skips the DB write if `Date.now() -
lastWrite < 5 * 60 * 1000`.

**Why**: Zero DB reads for the throttle check. Simple to reason about.

**Alternative**: Store the throttle state in the DB (read `last_seen_at`, compare, skip
if recent). Rejected — adds an extra round-trip to every request.

**Trade-off**: The in-memory Map is per-process and per-instance. On a multi-instance
deployment a staff member may update `last_seen_at` once per 5 min per instance. This is
acceptable — `last_seen_at` is a soft signal, not a precise presence counter.

### Decision 4 — Realtime channel filter: `schema=public,table=leads`

**Chosen**: Subscribe to `postgres_changes` with `event: 'INSERT'`,
`schema: 'public'`, `table: 'leads'`. No row-level filter.

**Why**: Any new lead is a team-wide event. The staff member who just submitted a form
is irrelevant at this stage.

**Alternative**: Filter by `owner_id` to show only leads assigned to the signed-in staff
member. Rejected — leads arrive unassigned and need to be distributed; the whole team
should see them.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Realtime channel silently fails if publication not applied | Migration is tracked in `supabase/migrations/` and pushed via CLI before deploy. Test with a manual insert in Supabase dashboard. |
| Fire-and-forget logging swallows errors invisibly | `serverLogActivity` logs the error to `console.error` (picked up by Vercel/server logs) before returning. |
| In-memory throttle resets on cold start | Acceptable — worst case is one extra `last_seen_at` write per cold boot per staff member. |
| Toast flood if many leads are inserted at once | Each event fires one toast. With a small team this is not a concern. Rate-limiting toasts is a future UX enhancement if needed. |

## Migration Plan

1. Apply migration `20261123210000_realtime_publication.sql` via `npx supabase db push`.
2. Deploy the updated application code.
3. Verify in the Supabase dashboard that `public.leads` appears in the
   `supabase_realtime` publication.
4. Test by inserting a row via the Supabase table editor; confirm toast appears in the
   running shell.

**Rollback**: Remove `public.leads` from the publication with
`ALTER PUBLICATION supabase_realtime DROP TABLE public.leads;`. No data is lost.
Revert the `Shell.tsx` change to remove the channel subscription.
