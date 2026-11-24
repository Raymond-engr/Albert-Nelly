# Tasks: Phase 1 Staff Authentication & 2-Step Verification (MFA)

## 1. Server Infrastructure & Request Proxy

- [x] 1.1 Create `src/proxy.ts` (Next.js 16 session proxy) using `@supabase/ssr` to validate user sessions via `supabase.auth.getUser()`, refresh session cookies, and redirect unauthenticated requests on `/control-room/:path*` to `/control-room/login`. Verify compilation with `npm run typecheck`.
- [x] 1.2 Implement server authorization guard `requireStaff(area, need)` and `handle()` in `src/lib/control-room/server/guard.ts` to enforce authentication, active status, TOTP assurance (`aal2`), and role permissions from `roles.ts`. Verify type safety and export signatures.

## 2. Team Invitation & Auth API Handlers

- [x] 2.1 Implement `POST /api/control-room/team` (Owner only) to validate invited email/role, invoke `auth.admin.inviteUserByEmail`, and record the invited staff member. Verify role access checks.
- [x] 2.2 Implement activation endpoint `POST /api/control-room/me/activate` that validates `aal2` assurance and transitions staff status from `invited` to `active`. Verify unauthorized access returns 401.
- [x] 2.3 Update `src/lib/control-room/api.ts` to wire `auth.signIn` and `auth.signOut` directly to Supabase Auth client calls and deprecate client `switchRole`. Verify compatibility with existing imports.

## 3. Auth UI & MFA Enrollment Screens

- [x] 3.1 Refactor `/control-room/login` ([LoginForm.tsx](file:///Users/ozaveshe/Aws%20Terraform/Albert-Nelly/src/components/control-room/shell/LoginForm.tsx)) to execute real Supabase `signInWithPassword` and handle Step 2 TOTP factor challenges. Verify that valid credentials advance to MFA challenge.
- [x] 3.2 Build MFA enrollment page at `/control-room/mfa` using `auth.mfa.enroll({ factorType: 'totp' })` showing both QR code and secret text with first code verification. Verify enrollment succeeds on test TOTP code.
- [x] 3.3 Build `/control-room/accept-invite` to allow invited staff to set their initial password and advance directly into MFA enrollment. Verify invite token extraction and password submission.
- [x] 3.4 Build `/control-room/forgot-password` and `/control-room/reset-password` recovery screens using `resetPasswordForEmail` and `updateUser({ password })`. Verify password reset flow.

## 4. Protected Layout & Shell Cleanup

- [x] 4.1 Convert `src/app/control-room/(app)/layout.tsx` into an async React Server Component that validates the active `aal2` staff session via `getUser()` and wraps children in a client `StaffProvider`. Verify unauthenticated redirects work seamlessly.
- [x] 4.2 Update `useSession()` in `src/lib/control-room/store.ts` to read authenticated staff from `StaffProvider`. Verify no broken consumers across the 13 dashboard screens.
- [x] 4.3 Remove mock demo controls from `Shell.tsx` and `LoginForm.tsx`: eliminate "View as" select, demo banner, and "Reset demo data" triggers. Verify clean administrative navigation.

## 5. Bootstrap Script & Verification

- [x] 5.1 Implement `scripts/seed-owner.ts` to provision the initial Owner staff account using `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD`, and `SEED_OWNER_NAME` with administrative Supabase credentials. Verify script runs successfully.
- [x] 5.2 Run full validation suite: execute `npm run typecheck && npm run lint && npm run build` and ensure clean passage without errors.
- [x] 5.3 Verify reversible patch creation for Phase 1 (`0008-staff-auth-mfa.patch`) in accordance with `docs/CONTROL_ROOM_HANDOVER.md` and `CLAUDE.md`.
