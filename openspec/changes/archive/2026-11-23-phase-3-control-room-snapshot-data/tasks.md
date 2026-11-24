# Tasks

## 1. Server Mappers Layer

- [x] 1.1 Create `src/lib/control-room/server/mappers.ts` implementing mapping functions from database snake_case tables to frontend camelCase TypeScript domain types (`rowToLead`, `rowToDeal`, `rowToClient`, `rowToService`, `rowToStaff`, `rowToPayment`, `rowToExpense`, `rowToContract`, `rowToInvoice`, `rowToBrief`, `rowToCampaign`, `rowToAsset`, `rowToTask`, `rowToActivityLog`), handling nullability and JSONB arrays. Verify unit type signatures match `src/lib/control-room/types.ts`.
- [x] 1.2 Implement role-based redaction helpers in `src/lib/control-room/server/mappers.ts` to redact `payments` array for non-financial roles (`sales`, `content`) and redact `commissionRate` on deals. Verify via typecheck.

## 2. Snapshot Route Handler

- [x] 2.1 Create `src/app/api/control-room/snapshot/route.ts` enforcing staff session with `requireStaff("overview")`. Verify unauthorized requests return 401 or 403.
- [x] 2.2 Execute parallel queries (`Promise.all`) across all Control Room Supabase tables using the authenticated Supabase client, apply role-based filtering/redactions, and limit `activity_log` to 200 records. Verify response schema conforms to `{ ok: true, data: Db }`.
- [x] 2.3 Provide graceful error handling and local offline fallback in `src/app/api/control-room/snapshot/route.ts` if Supabase client cannot connect or credentials are unconfigured. Verify endpoint returns valid JSON without 500 crashes.

## 3. Client Store Hydration

- [x] 3.1 Update `src/lib/control-room/store.ts` to replace `seedDb` mock initialization with an empty typed `Db` initial state. Verify types compile cleanly.
- [x] 3.2 Add `status` state (`"loading" | "ready" | "error"`) and `refresh()` function in `src/lib/control-room/store.ts` that fetches `/api/control-room/snapshot` and hydrates the store. Verify state transitions from loading to ready upon successful fetch.
- [x] 3.3 Export `useDbStatus()` and `useDbRefresh()` hooks from `src/lib/control-room/store.ts` for consumption by UI components. Verify exported hooks have accurate TypeScript types.

## 4. UI Shell Integration & Loading States

- [x] 4.1 Update `src/app/control-room/Shell.tsx` to invoke `refresh()` on mount and consume `useDbStatus()`. Verify state reflects network activity.
- [x] 4.2 Add skeleton/spinner loading view in `src/app/control-room/Shell.tsx` while store `status === "loading"`. Verify dashboard does not render broken empty states before data arrives.
- [x] 4.3 Add error state banner with a "Retry" button in `src/app/control-room/Shell.tsx` when `status === "error"`. Verify clicking Retry triggers `refresh()`.

## 5. Verification & Quality Assurance

- [x] 5.1 Run full TypeScript compilation (`npm run typecheck`) and verify zero errors across server route, mappers, store, and UI shell.
- [x] 5.2 Run ESLint (`npm run lint`) and verify code adherence to project rules.
- [x] 5.3 Run Next.js production build (`npm run build`) and verify all pages and routes build successfully.

## Workflow follow-up

- Archive the change after the user runs `/openspec-apply-change` and reviews the implementation.
- Generate commit message and commit changes to git.
