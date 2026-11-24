# Tasks: Phase 5 - Control Room Automated Testing Suite

## 1. Testing Infrastructure Setup
- [x] 1.1 Install `vitest` and dependencies in package.json and verify clean install
- [x] 1.2 Create `vitest.config.ts` with path aliases and environment configuration
- [x] 1.3 Add test scripts to `package.json` (`test`, `test:watch`) and verify `npm test` runs

## 2. Test Utilities & Mocks
- [x] 2.1 Create Supabase mock helpers for authenticated staff (`admin` vs `staff` roles)
- [x] 2.2 Create request helper utilities to synthesize `NextRequest` objects for route tests

## 3. Route Guard & Authorization Tests
- [x] 3.1 Write unit tests for `src/lib/control-room/server/guard.ts` verifying 401 unauthenticated and 403 role rejections
- [x] 3.2 Write integration tests for admin-only route handlers verifying role rejection

## 4. Mutation Endpoints & HTTP Client Tests
- [x] 4.1 Write integration tests for leads and deals mutation endpoints verifying validation and response structures
- [x] 4.2 Write unit tests for `src/lib/control-room/http.ts` verifying `call<T>()` and `ApiError` propagation

## 5. Verification & Handover
- [x] 5.1 Execute `npm test` and verify 100% of test suites pass
- [x] 5.2 Execute `npm run typecheck && npm run lint && npm run build` to verify zero regressions across the project
