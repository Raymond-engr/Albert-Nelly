# Proposal

## Why

The application is functionally complete through Phase 8 but is not safe to put in front of real users or clients. Phase 9 closes the gap between "it works" and "it is production-ready" by hardening the server boundary, adding request-level rate limiting, applying HTTP security headers, and providing operational visibility. This is the final step before launch (see §16 of `docs/CONTROL_ROOM_HANDOVER.md`).

## What Changes

- **Rate limiting on `/api/leads`**: an in-memory sliding-window limiter keyed by IP prevents registration abuse and aligns with the existing honeypot/validation defense-in-depth.
- **HTTP security headers via `next.config.ts`**: add `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy` to every response via Next.js `headers()` config (no middleware needed).
- **Structured error logging**: replace bare `console.error` calls in route handlers with a lightweight `src/lib/logger.ts` shim that emits structured JSON to stdout (Vercel Logs ingests this automatically; Sentry can be wired later via `SENTRY_DSN`).
- **Staff offboarding API**: a new `PATCH /api/control-room/team/:id/offboard` route that sets `status = 'disabled'` on the staff row _and_ calls `supabase.auth.admin.updateUserById(id, { ban_duration: 'none' })` to immediately invalidate sessions — with the existing last-owner guard applied.
- **Permission matrix test script**: a Node script `scripts/check-permissions.ts` that imports `PERMS` from `src/lib/control-room/roles.ts`, prints it as a Markdown table to stdout, and exits non-zero if any PERM entry references an Area that is not present in the Area union type. Used manually before SQL policy audits.
- **`.env.example` additions**: document `SENTRY_DSN` (optional), `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`.

## Capabilities

### New Capabilities

- `security/http-headers`: HTTP response security headers applied globally by Next.js config
- `security/rate-limiting`: IP-keyed sliding-window rate limit on the public lead-registration endpoint
- `security/structured-logging`: Structured JSON error logging shim for route handlers and cron routes
- `control-room/offboarding-api`: Server route that disables a staff account and immediately bans the auth user

### Modified Capabilities

- `control-room/staff-auth`: Offboarding now also bans the Supabase Auth user in the same request (new server-side behavior on the existing "disable staff accounts" requirement).

## Impact

**Public Showroom**: Security headers affect all pages; rate limit touches only `POST /api/leads`. No slot API or content changes.

**Control Room**: New offboard route under `/api/control-room/team/:id/offboard`; logger replaces inline `console.error` in all route handlers; permission-matrix script is dev/CI tooling only.

**Database**: No schema migrations. `staff.status = 'disabled'` path already exists; this change adds the companion Supabase Auth ban call.

**Dependencies**: No new runtime packages required. `scripts/check-permissions.ts` runs with `tsx` (already a dev dependency via Vitest's transform pipeline). Rate limiter is an in-process `Map`; a Redis-backed limiter (`@upstash/ratelimit`) would be a future upgrade.

**Environment variables** (new, all optional):
- `SENTRY_DSN` — if set, logger forwards errors to Sentry
- `RATE_LIMIT_MAX` — requests per window per IP (default: `10`)
- `RATE_LIMIT_WINDOW_MS` — window size in ms (default: `60000`)
