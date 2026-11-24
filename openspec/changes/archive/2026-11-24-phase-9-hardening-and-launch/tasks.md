# Tasks

## 1. Security Headers

- [x] 1.1 Add a `headers()` export to `next.config.ts` that applies `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy` to all routes (`source: '/(.*)'`); verify with `curl -I http://localhost:3000` that all four headers are present on the Showroom root and on a `/api/control-room/*` response

## 2. Rate Limiting

- [x] 2.1 Create `src/lib/rate-limit.ts` exporting `checkRateLimit(ip: string): { ok: boolean; retryAfterSec: number }` using an in-process `Map<string, number[]>` sliding-window keyed by IP; reads `RATE_LIMIT_MAX` (default 10) and `RATE_LIMIT_WINDOW_MS` (default 60 000) from env; verify with a unit test in `tests/security/rate-limit.test.ts` that (a) requests within limit return `ok: true`, (b) the (N+1)-th request returns `ok: false` with a positive `retryAfterSec`
- [x] 2.2 Add a rate-limit guard at the top of `POST /api/leads` using `checkRateLimit()`: extract IP from `x-forwarded-for` header (fall back to `'anonymous'`), return HTTP 429 with `Retry-After` header when `ok` is false; verify with a route test in `tests/security/leads-rate-limit.test.ts` that exceeding the limit produces 429

## 3. Structured Logging

- [x] 3.1 Create `src/lib/logger.ts` exporting `logger.error(message: string, ctx?: Record<string, unknown>): void` that writes a single-line JSON object `{ level: 'error', message, timestamp, ...ctx }` to stdout via `console.error`; when `process.env.SENTRY_DSN` is set, also fire-and-forget a POST to the Sentry HTTP API; verify with a unit test in `tests/security/logger.test.ts` that the JSON output contains the required keys
- [x] 3.2 Replace all bare `console.error(...)` calls in `src/app/api/` route handlers with `logger.error(...)` (8 occurrences across leads, cron, webhooks, and control-room routes); verify `npm run lint` passes and `npm run typecheck` reports no new errors

## 4. Staff Offboarding Route

- [x] 4.1 Create `PATCH /api/control-room/team/[id]/offboard/route.ts` guarded by `requireStaff('team', 'edit')`; the handler MUST (a) count active Owners and return 422 if the target is the last one, (b) set `staff.status = 'disabled'` via admin client, (c) call `supabase.auth.admin.updateUserById(id, { ban_duration: 'none' })` to ban the auth user; verify with route tests in `tests/team/offboard-route.test.ts` covering success, last-owner guard, and 403 for non-owner callers
- [x] 4.2 Update the `PATCH /api/control-room/team/[id]/route.ts` handler to remove any inline offboarding logic (if present) and delegate to the new route's shared helper; verify existing team route tests still pass

## 5. Permission Matrix Script

- [x] 5.1 Create `scripts/check-permissions.ts` that imports `PERMS` and the `Area` union from `src/lib/control-room/roles.ts`, prints a Markdown table of roles × areas × (view/edit) to stdout, and exits non-zero if any PERM entry references an area not present in the `Area` union; run `npx tsx scripts/check-permissions.ts` and confirm it prints the table and exits 0

## 6. Environment & Documentation

- [x] 6.1 Add `SENTRY_DSN`, `RATE_LIMIT_MAX`, and `RATE_LIMIT_WINDOW_MS` (all optional, with comments) to `.env.example`; verify the file documents every env var introduced in this change

## 7. Integration Verification

- [x] 7.1 Run `npm run typecheck` — zero TypeScript errors
- [x] 7.2 Run `npm run lint` — zero ESLint errors
- [x] 7.3 Run `npm test -- --run` — all test suites pass (existing 62 + new tests added in this change)
- [x] 7.4 Run `npm run build` — Next.js build completes without errors; confirm the security headers appear in the build output summary

## Workflow follow-up

- Run `openspec archive -y phase-9-hardening-and-launch` once all tasks are verified
- Commit: `feat(hardening): Phase 9 — Security headers, rate limiting, structured logging, and staff offboarding`
