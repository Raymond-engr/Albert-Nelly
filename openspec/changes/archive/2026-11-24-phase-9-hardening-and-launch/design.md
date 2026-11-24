# Design

## Context

The app reaches production readiness after Phase 8 but has four gaps the handover doc (§16) requires closing before go-live:

1. **No HTTP security headers** — `next.config.ts` only sets `poweredByHeader: false` and `images.remotePatterns`. CSP, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` are absent.
2. **No rate limiting on `/api/leads`** — the honeypot and Zod validation resist malformed bots but not volumetric abuse from a valid-looking client.
3. **Unstructured error logging** — `console.error` calls are scattered across route handlers; Vercel Logs ingests them as plain text, making programmatic alerting difficult.
4. **Incomplete staff offboarding** — the team screen sets `status = 'disabled'` on the DB row but does not call `supabase.auth.admin.updateUserById` to ban the auth user, leaving an active session window.

There are no schema migrations in this phase.

## Goals / Non-Goals

**Goals:**
- Apply security headers via `next.config.ts` `headers()` (zero middleware required)
- Add an in-process IP-keyed sliding-window rate limiter to `POST /api/leads`
- Introduce `src/lib/logger.ts` and replace `console.error` calls in route handlers
- Add `PATCH /api/control-room/team/:id/offboard` that atomically disables the staff row and bans the auth user
- Add `scripts/check-permissions.ts` to print the PERMS matrix for manual audit

**Non-Goals:**
- Redis-backed distributed rate limiting (the app runs as a single Vercel serverless function; in-process `Map` is sufficient at current scale)
- Sentry SDK installation (logger accepts `SENTRY_DSN` as a future hook; wiring the full SDK is out of scope)
- Automated accessibility testing (axe integration is a separate task; handover doc notes it as manual for now)
- Database migration, RLS policy changes, or MFA policy enforcement (already implemented in Phases 1–5)

## Decisions

### 1. Security headers via `next.config.ts` `headers()`, not middleware

**Choice:** `headers()` in `next.config.ts`  
**Alternative:** `src/middleware.ts` manipulating response headers  
**Rationale:** `headers()` runs at the CDN/edge cache level in Vercel and is applied before any middleware or route handler. It is static configuration, so it cannot be accidentally bypassed by a handler returning a raw `NextResponse`. Middleware adds latency and an extra file; `headers()` is the Next.js-idiomatic approach for static headers.

### 2. In-process `Map`-based sliding window for rate limiting

**Choice:** a module-level `Map<string, number[]>` keyed by IP, pruned per request  
**Alternative:** `@upstash/ratelimit` with Redis  
**Rationale:** The app is stateless across deployments but each invocation of a Vercel serverless function is long-lived within its lifecycle. An in-process store is zero-dependency, zero-latency, and sufficient for a low-traffic agency site. A Redis-backed limiter can be dropped in by swapping the implementation in `src/lib/rate-limit.ts` without touching the route handler. IP is taken from the `x-forwarded-for` header (Vercel sets this); if the header is absent the limiter treats the request as a single anonymous client.

### 3. `src/lib/logger.ts` shim — no external SDK

**Choice:** a thin wrapper that calls `console.error` with `JSON.stringify` and optionally POSTs to Sentry HTTP API  
**Alternative:** install `@sentry/nextjs` SDK  
**Rationale:** The Sentry SDK rewrites `next.config.ts` via a Sentry plugin and adds ~180 KB to the bundle. For a site at this stage, Vercel's built-in log drain is sufficient. The logger shim costs zero bytes in production unless `SENTRY_DSN` is set, and can be replaced with the full SDK later without touching call sites.

### 4. Offboard route as a separate endpoint, not extending PATCH team/:id

**Choice:** `PATCH /api/control-room/team/:id/offboard`  
**Alternative:** add an `action: 'offboard'` field to the existing `PATCH /api/control-room/team/:id`  
**Rationale:** Offboarding has a materially different security concern (it calls the Supabase Auth admin client) and must recheck the last-owner constraint. Isolating it in its own route handler keeps the guard logic and the auth-ban call co-located and easier to test.

### 5. Permission matrix script uses `tsx`, not a build step

**Choice:** `tsx scripts/check-permissions.ts` (dev-time only)  
**Alternative:** compile to JS with `tsc` and run with `node`  
**Rationale:** `tsx` is already available via Vitest's transform pipeline; no new dependency is needed. The script is never bundled into the app.

## Risks / Trade-offs

- **In-process rate limiter resets on cold start** → Each new Vercel function instance starts with an empty map. At current traffic levels (single-digit concurrent sessions) this is acceptable. If the site scales, replace with Upstash.
- **CSP `script-src` strictness** → A `'self'`-only CSP will break any inline scripts added in the future (e.g., analytics). The initial policy should use `'nonce'` or allow hashes for any inline script. Next.js 16 supports nonce-based CSP via middleware; for the first version a permissive-but-present CSP is better than none.
- **Sentry shim vs. full SDK** → Stack traces captured via the HTTP API omit source maps. Acceptable as a first step; a later phase can install `@sentry/nextjs` and configure source-map upload.

## Migration Plan

1. Update `next.config.ts` — headers take effect on next deployment; no data migration.
2. Add `src/lib/rate-limit.ts` and `src/lib/logger.ts` — imported by modified route handlers.
3. Add `PATCH /api/control-room/team/:id/offboard` route.
4. Update existing team PATCH route and all route handlers to use logger.
5. Add `scripts/check-permissions.ts`.
6. Update `.env.example` with new optional vars.
7. Run `typecheck && lint && test && build` before committing.

Rollback: revert `next.config.ts` headers, remove new files, restore `console.error` calls. No DB state is changed by any of these additions.

## Open Questions

- **CSP nonce vs. static policy**: Next.js 16 nonce-based CSP requires middleware. Should the first version use a strict static policy (possibly breaking third-party embeds) or a looser policy (less secure but future-proof)? Assumption: use a moderate static policy with `'self' https:` for scripts and `'self' data: blob:` for images; tighten per-resource in a follow-up.
