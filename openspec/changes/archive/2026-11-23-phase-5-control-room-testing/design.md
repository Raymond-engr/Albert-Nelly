# Design: Phase 5 - Control Room Automated Testing Suite

## Context
See proposal.md - Why.
The project currently has no test framework installed. All routes and seams are written in TypeScript strict mode under Next.js 16 App Router. Tests need to execute rapidly, reliably, and deterministically without depending on external cloud services or open ports.

## Goals / Non-Goals

**Goals:**
- Provide a zero-config or low-config Vitest testing harness configured with TypeScript path aliases (`@/*`).
- Create modular mock fixtures for Supabase server client (`createClient`), admin client (`getAdminClient`), and NextRequest objects.
- Test route guards for authentication, MFA assurance levels, and role enforcement.
- Test mutation endpoints for payload validation and error handling.
- Test client HTTP client (`call<T>()`) and error propagation.

**Non-Goals:**
- Full headless browser E2E tests (Playwright) requiring browser binary downloads; unit and route-handler integration tests provide immediate high-value regression prevention.
- Mocking entire external third-party services (e.g. Resend/Postmark) beyond what is needed to verify handler logic.

## Decisions

### Decision 1: Vitest as the Test Runner
- **Choice**: Vitest over Jest.
- **Rationale**: Vitest provides native ESM and TypeScript support out of the box with near-instant startup, sharing configuration semantics and resolving path aliases defined in `tsconfig.json`.
- **Alternative considered**: Jest requires extensive `ts-jest` or Babel transform configuration for Next.js 16 and ESM modules.

### Decision 2: In-Memory Supabase Mocks for Fast, Deterministic Unit & Route Tests
- **Choice**: Mock `@/lib/supabase/server` and `@/lib/supabase/admin` using Vitest mocks.
- **Rationale**: Tests should run in milliseconds without requiring an active Supabase Docker instance or live network connection, making them suitable for fast local development and CI.

## Risks / Trade-offs

- **[Risk]**: Mock drift between mocked Supabase queries and live Postgres behavior.
  - **Mitigation**: Base mock data fixtures strictly on the TypeScript interfaces established in `src/types/control-room.ts` and `src/lib/control-room/server/guard.ts`.
