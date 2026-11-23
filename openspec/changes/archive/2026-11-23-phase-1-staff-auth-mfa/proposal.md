# Proposal: Phase 1 Staff Authentication & 2-Step Verification (MFA)

## Why
Currently, the Control Room at `/control-room` operates on mock client-side state with a simulated login form and arbitrary role switching in `localStorage`. To transition the admin portal into a secure, production-grade operating system for Albert Nelly, real staff authentication with strict invite-only access and mandatory TOTP Two-Factor Authentication (MFA assurance level `aal2`) must be established as specified in Phase 1 of `docs/CONTROL_ROOM_HANDOVER.md`.

## What Changes
- **Invite-Only Access**: Public sign-ups are strictly disabled; staff accounts are provisioned exclusively via Owner invitations (`POST /api/control-room/team`).
- **Two-Step Verification (TOTP MFA)**: Every staff member must enroll an authenticator app (TOTP QR code & secret). All data and route access requires verified `aal2` session assurance.
- **Session Refresh & Server Guard**:
  - Add Next.js 16 request proxy (`src/proxy.ts`) using `@supabase/ssr` to validate user sessions and refresh auth tokens on `/control-room/:path*` and `/api/control-room/:path*`.
  - Add server guard `requireStaff(area, need)` in `src/lib/control-room/server/guard.ts` to enforce authentication, `aal2` assurance, active staff status, and role-based permissions (`can()`).
- **Auth Flow Screens**:
  - Update `/control-room/login` with real Supabase password authentication and step-2 TOTP verification.
  - Implement `/control-room/mfa` for first-time TOTP enrollment and challenge verification.
  - Implement `/control-room/accept-invite` for password setup following invite links.
  - Implement `/control-room/forgot-password` and `/control-room/reset-password` recovery flows.
- **Shell & Layout Protection**:
  - Convert `src/app/control-room/(app)/layout.tsx` to a server component verifying active `aal2` staff sessions before rendering.
  - Remove prototype demo artifacts: delete role switcher dropdown, "View as" menu, and "Reset demo data" banner from `Shell.tsx` and `LoginForm.tsx`.
- **First Owner Bootstrap**:
  - Provide `scripts/seed-owner.ts` to provision the initial Owner account using administrative Supabase credentials.

## Capabilities

### New Capabilities
- `control-room/staff-auth`: Covers staff invite acceptance, password authentication, TOTP MFA enrollment and verification, session refresh in `proxy.ts`, server-side `requireStaff()` guard, and account lifecycle states (`invited`, `active`, `disabled`).

### Modified Capabilities
None (initial specification for the project).

## Impact
- **Public Showroom (`/`)**: No breaking changes. Public visitors are completely isolated from staff auth. Showroom remains prop-less and accessible.
- **Control Room (`/control-room`)**: Unauthenticated or unverified (`aal1`) visitors are blocked and redirected to `/control-room/login`. Prototype mock role switcher is replaced with authenticated `StaffProvider` context.
- **Backend & Database**: Introduces `public.staff` table dependency (Phase 2 schema readiness) and requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` in environment.
- **Dependencies**: Uses existing `@supabase/ssr` and `@supabase/supabase-js`. May introduce `tsx` as dev dependency for running the seed script if not already present.
