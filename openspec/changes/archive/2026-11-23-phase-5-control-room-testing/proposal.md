# Proposal: Phase 5 - Control Room Automated Testing Suite

## Why
The Control Room has completed its foundational architecture: staff authentication with MFA (Phase 1), database schema and RLS policies (Phase 2), snapshot aggregation and store hydration (Phase 3), and 16 mutation Route Handlers with client seams (Phase 4). However, the project currently has zero automated tests. Adding an automated test suite protects against regressions in role permissions (admin vs staff), route handler payload validation, and client HTTP error handling.

## What Changes
- Install and configure **Vitest** configured for Next.js 16 and TypeScript path aliases (`@/*`).
- Create mock test utilities for Supabase server/admin clients and NextRequest builders.
- Implement automated test suites covering:
  - **Route Guards & Authorization** (`src/lib/control-room/server/guard.ts`): unauthenticated access (401), unauthorized role escalation (403), MFA level checks.
  - **Mutation Route Handlers**: input validation (400), entity updates, and audit logging.
  - **Client HTTP Client & Seams** (`src/lib/control-room/http.ts`): structured `ApiError` parsing and error handling.
- Add `test` and `test:watch` scripts to `package.json`.

## Capabilities

### New Capabilities
- `control-room/testing`: Automated testing harness, Supabase mocking utilities, and test suites for Control Room route handlers, authorization guards, and client seams.

### Modified Capabilities
None.

## Impact
- **Dependencies**: Adds `vitest` and `@testing-library/react` to `devDependencies`.
- **Showroom**: Zero impact on public showroom pages.
- **Build & CI**: Integrates fast, deterministic test execution into local developer workflow and CI pipelines.
