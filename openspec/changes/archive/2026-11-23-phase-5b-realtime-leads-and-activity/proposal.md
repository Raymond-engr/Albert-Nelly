# Proposal

## Why

Staff have no live awareness of incoming leads — they only see new entries after manually
refreshing the page or navigating away and back. Phase 5 of the Control Room handover
(`docs/CONTROL_ROOM_HANDOVER.md`) prescribes "activity log and live updates" as the
completion milestone for a fully operational Control Room. Without realtime lead
notifications, the team risks delayed follow-up on new enquiries.

## What Changes

- **Supabase Realtime subscription** in `Shell.tsx`: listens for `INSERT` events on
  `public.leads` via `postgres_changes`. On each event the Shell calls `refreshDb()` to
  resync the store and fires a toast notification with the lead's name and service
  interest.
- **Database publication migration**: a new migration enables the `supabase_realtime`
  publication for `public.leads` so the channel receives row-level change events.
- **`logActivity` server-side implementation**: the client-side stub in `api.ts` is
  replaced by a server call. Every mutating route handler (Phase 4 routes) already calls
  the stub; wrapping those calls in the guard means logging happens server-side with the
  authenticated staff identity — the browser never writes to `activity_log` directly.
- **`requireStaff` passive presence update**: after fetching the staff row, `requireStaff`
  touches `staff.last_seen_at` with a 5-minute throttle so the Team screen shows recent
  activity without an active heartbeat.
- **Activity screen live data**: the `/control-room/activity` page already renders
  `ActivityScreen` which reads `db.activityLog` from the store. Since `refreshDb()` is
  called on each realtime lead event, the activity log in the store is always current
  without a dedicated subscription. No new page or route is needed.

## Capabilities

### New Capabilities

- `control-room/realtime-leads`: Browser subscribes to Supabase Realtime for new lead
  inserts; toast + store refresh on each event. Includes the database publication
  migration.
- `control-room/activity-logging`: Server-side `logActivity` implementation writing to
  `public.activity_log`. All Phase 4 mutation routes record an entry with the acting
  staff id, action verb, and optional target.
- `control-room/presence`: `requireStaff` passively updates `staff.last_seen_at` on
  every authenticated API call, throttled to once per 5 minutes per staff member.

### Modified Capabilities

- `control-room/snapshot-data`: The snapshot endpoint already fetches `activity_log`.
  No requirement changes — the fetch is already there and the store already holds
  `activityLog`. This capability is unmodified.

## Impact

- **Control Room (browser)**: `Shell.tsx` gains a Supabase Realtime channel; torn down on
  unmount. Introduces `@supabase/realtime-js` channel API (already bundled with
  `@supabase/ssr` — no new dependency).
- **Control Room (server)**: `src/lib/control-room/server/guard.ts` gains a throttled
  `last_seen_at` write. `src/lib/control-room/server/log-activity.ts` (new file) exposes
  `serverLogActivity(supabase, staff, action, target?)`.
- **Database**: One new migration (`ALTER PUBLICATION supabase_realtime ADD TABLE
  public.leads`). One new `INSERT` path into `activity_log` from every mutating route.
- **Public Showroom**: No impact. Realtime and activity logging are Control Room-only.
- **Dependencies**: None new. `@supabase/ssr` already ships Realtime client support.
