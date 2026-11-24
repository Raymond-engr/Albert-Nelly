# Design: Staff Authentication & Two-Step Verification (MFA)

## Context
See `proposal.md` for motivation. Currently `/control-room` uses client-side simulated auth (`localStorage`) and allows arbitrary role-switching via `Shell.tsx`. As defined in `docs/CONTROL_ROOM_HANDOVER.md` Section 5, Phase 1 establishes real staff identity using Supabase Auth (`@supabase/ssr`), mandatory TOTP two-factor authentication (`aal2`), and route-level protection.

## Goals / Non-Goals

**Goals:**
- Implement invite-only staff accounts where only Owners can provision new users.
- Enforce mandatory TOTP MFA (`aal2` assurance) before any Control Room screen or API route can be accessed.
- Create Next.js 16 session proxy (`src/proxy.ts`) to validate tokens and refresh cookies.
- Create reusable server-side guard `requireStaff(area, need)` in `src/lib/control-room/server/guard.ts`.
- Replace mock UI artifacts in `Shell.tsx` and `LoginForm.tsx` with real Supabase Auth actions.
- Provide a CLI seed script (`scripts/seed-owner.ts`) to bootstrap the first Owner account.

**Non-Goals:**
- Public self-registration (signups remain disabled in Supabase).
- Rewriting the 13 CRM dashboard screens (screens continue using seam functions; snapshot/writes follow in Phases 3 and 4).
- Transactional marketing/campaign emails (covered in Phase 7).

## Decisions

### 1. Request Interception with Next.js 16 `proxy.ts`
- **Choice**: Implement `src/proxy.ts` (Next.js 16 convention, matching `/control-room/:path*` and `/api/control-room/:path*`) using `@supabase/ssr` `createServerClient`.
- **Rationale**: Validates auth tokens on every request using `supabase.auth.getUser()` and synchronizes refreshed session cookies back into the response headers. Redirects unauthenticated traffic to `/control-room/login` before route rendering begins.
- **Alternative Considered**: Client-side `useEffect` checks in `Shell.tsx`. Rejected because it leaks unrendered screen skeletons, causes layout flashes, and cannot protect server API handlers.

### 2. Multi-Tier Session Assurance (`aal2`)
- **Choice**: Check authenticator assurance level `currentLevel === 'aal2'` in both the server guard (`requireStaff`) and the login flow before granting access to `/control-room/(app)`.
- **Rationale**: Even with a valid password, access to confidential business data (leads, deal margins, running costs) is blocked until TOTP 6-digit verification succeeds.
- **Alternative Considered**: SMS OTP. Rejected due to cost, delivery failure risks in Nigeria, and security vulnerabilities of SIM swaps. TOTP (Google Authenticator, Authy, Apple Keychain) is offline and resilient.

### 3. Server Guard & Handler Architecture
- **Choice**: Encapsulate authorization logic inside `requireStaff(area: Area, need: "view" | "edit" = "view")` and a `handle()` helper in `src/lib/control-room/server/guard.ts`.
- **Rationale**: Keeps Route Handlers uniform and DRY. Validates session, checks `aal2`, verifies active row in `public.staff`, and executes `can(staff.role, area, need)` from `roles.ts`.
- **Alternative Considered**: Checking permissions solely inside Postgres RLS. Rejected because early HTTP errors (401/403) provide clear API error contracts to frontend callers.

### 4. Staff Context Provider
- **Choice**: Convert `src/app/control-room/(app)/layout.tsx` to an async React Server Component that loads the verified `staff` row and passes it down via a lightweight client `StaffProvider`.
- **Rationale**: Allows `useSession()` in `store.ts` to read the real authenticated staff member while preserving the component signature across all existing dashboard screens.

## Risks / Trade-offs

- **[Risk] Lost Device / TOTP Locked Out**
  → *Mitigation*: Provide an Owner-level action using `auth.admin.mfa.deleteFactor` to reset 2-step verification for an affected team member after verifying identity out-of-band.
- **[Risk] Clock Drift on Authenticator Apps**
  → *Mitigation*: Rely on Supabase Auth's standard TOTP verification window which accounts for standard 30-second time-step variations.
- **[Risk] Demo Mode & Missing Supabase Keys**
  → *Mitigation*: Ensure missing env vars fail gracefully with descriptive developer console warnings rather than unhandled crashes.

## Migration Plan
1. Add `src/proxy.ts` for session handling.
2. Build server guard `src/lib/control-room/server/guard.ts`.
3. Construct auth routes (`/login`, `/mfa`, `/accept-invite`, `/forgot-password`, `/reset-password`).
4. Update `src/app/control-room/(app)/layout.tsx` with `StaffProvider` and clean up demo UI.
5. Create `scripts/seed-owner.ts` and test first Owner sign-in.
