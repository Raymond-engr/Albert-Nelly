# Tasks

## 1. Database Migration — Realtime Publication

- [x] 1.1 Create `supabase/migrations/20261123210000_realtime_publication.sql` with:
  `ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;`
- [x] 1.2 Run `npx supabase db push` and confirm the migration applies cleanly
- [x] 1.3 Verify in Supabase dashboard (Database → Publications → supabase_realtime) that
  `public.leads` appears in the table list

## 2. Server-Side Activity Logging

- [x] 2.1 Create `src/lib/control-room/server/log-activity.ts` exporting
  `serverLogActivity(supabase, staff, action: string, target?: string): void`.
  The function inserts a row into `activity_log` with `{ staff_id: staff.id, action,
  target, at: new Date().toISOString() }`. It is fire-and-forget: awaited internally
  with a `.catch(err => console.error("[activity]", err))`, not awaited by callers.
- [x] 2.2 Add `serverLogActivity` calls to all 16 Phase 4 mutation route handlers
  (`src/app/api/control-room/`). Call it after the primary write succeeds, passing the
  `supabase` and `staff` objects already returned by `requireStaff`. Use descriptive
  action strings: e.g. `"lead.update"`, `"deal.stage.move"`, `"payment.record"`.
- [x] 2.3 Convert `logActivity` in `src/lib/control-room/api.ts` to a no-op
  (`export function logActivity(_action: string, _target = "") {}`). Remove the
  localStorage write inside it.

## 3. Passive Presence — `requireStaff` Update

- [x] 3.1 Add a module-level throttle map to `src/lib/control-room/server/guard.ts`:
  `const seenAt = new Map<string, number>();`
- [x] 3.2 After the staff row is fetched and validated in `requireStaff`, check if
  `Date.now() - (seenAt.get(staff.id) ?? 0) > 5 * 60 * 1000`. If so, update
  `seenAt` for the staff id and fire (without awaiting) a Supabase update:
  `supabase.from("staff").update({ last_seen_at: new Date().toISOString() }).eq("id", staff.id).catch(...)`.
- [x] 3.3 Ensure the presence update failure path logs the error but does not throw or
  affect the returned `{ supabase, staff, user }` object.

## 4. Realtime Subscription in Shell

- [x] 4.1 In `src/components/control-room/shell/Shell.tsx`, import `createClient` from
  `@/lib/supabase/client` and `useDbRefresh` + `toast` from their respective modules.
- [x] 4.2 Add a `useEffect` (runs once on mount) that:
  1. Creates a Supabase browser client.
  2. Calls `supabase.channel("leads-realtime").on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (payload) => { ... }).subscribe()`.
  3. In the callback: calls `refreshDb()` and shows a toast:
     `toast.info(\`New lead: \${payload.new?.name ?? "someone"} — \${payload.new?.service ?? ""}\`)`.
  4. Returns a cleanup function: `() => { supabase.removeChannel(channel) }`.
- [x] 4.3 Confirm the subscription only activates when the Shell renders (i.e., the user
  already has an `aal2` session — the `(app)/layout.tsx` guard ensures this).

## 5. Team Screen — Display `last_seen_at`

- [x] 5.1 Check `src/components/control-room/team/` to see if `last_seen_at` is already
  displayed. If not, add a "Last seen" column or row item showing the value from
  `db.staff` using `formatRelativeTime` (or a simple date formatter from
  `src/lib/control-room/dates.ts`). Show "Never" when `lastSeen` is null.
- [x] 5.2 Confirm the snapshot mapper (`rowToStaff` in
  `src/lib/control-room/server/mappers.ts`) already maps `last_seen_at → lastSeen` on
  the `Staff` type. If not, add the mapping.

## 6. Verification

- [x] 6.1 Run `npm run typecheck` — zero errors
- [x] 6.2 Run `npm run lint` — zero errors
- [x] 6.3 Run `npm test -- --run` — all 18 tests pass
- [x] 6.4 Add a Vitest unit test for `serverLogActivity`: verify it calls
  `supabase.from("activity_log").insert(...)` with correct fields and that a thrown
  insert error does not propagate.
- [x] 6.5 Add a Vitest unit test for the `requireStaff` throttle: verify `last_seen_at`
  update is called on the first invocation and skipped on a second invocation within 5
  minutes.
- [x] 6.6 Run `npm run build` — clean build
- [ ] 6.7 Manual smoke test: open the Control Room, insert a row into `public.leads` via
  the Supabase table editor, confirm toast appears and leads list refreshes automatically.
