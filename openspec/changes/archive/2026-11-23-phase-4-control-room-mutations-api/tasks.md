# Tasks

## 1. Client HTTP Infrastructure & Error Interception

- [x] 1.1 Create `src/lib/control-room/http.ts` implementing `ApiError` class and `call<T>(method, url, body)` with typed responses and error deserialization. Verify type signatures.
- [x] 1.2 Add `unhandledrejection` listener in `src/components/control-room/shell/Shell.tsx` to intercept `ApiError`, display error toast, and call `refreshDb()` on HTTP 409 conflicts. Verify handler logic.
- [x] 1.3 Update modals with `saving` state (`NewDealModal.tsx`, `RecordPaymentModal.tsx`) to guarantee reset in `try ... finally`. Verify compilation.

## 2. CRM Mutation Endpoints & Seams

- [x] 2.1 Implement `PATCH /api/control-room/leads/[id]` (optimistic concurrency, tags/status updates) and `POST /api/control-room/leads/[id]/convert` calling `convert_lead_to_deal` RPC. Verify handler responses.
- [x] 2.2 Rewire `src/lib/control-room/leads-api.ts` to invoke lead endpoints and call `refreshDb()`. Verify preservation of existing function signatures.
- [x] 2.3 Implement `POST /api/control-room/deals`, `PATCH /api/control-room/deals/[id]`, and `POST /api/control-room/deals/[id]/stage` enforcing staff role checks and activity logging. Verify handler responses.
- [x] 2.4 Implement `POST /api/control-room/deals/[id]/payments` executing `record_payment` RPC and strictly restricting access to `owner` and `finance`. Verify 403 on non-finance roles.
- [x] 2.5 Rewire `src/lib/control-room/deals-api.ts` to invoke deal and payment endpoints and call `refreshDb()`. Verify types match domain contracts.

## 3. Content, Services & Pricing Mutations

- [x] 3.1 Implement Route Handlers for services (`PATCH /api/control-room/services/[id]`), packages (`PATCH /api/control-room/packages/[id]`, `POST /api/control-room/packages/[id]/featured`), and running costs (`PUT /api/control-room/running-costs`). Verify endpoints handle payload schemas.
- [x] 3.2 Implement Route Handlers for portfolio work items (`/api/control-room/work`), partners (`/api/control-room/partners`), and referrers (`/api/control-room/referrers`). Verify handlers enforce validation.
- [x] 3.3 Rewire `src/lib/control-room/content-api.ts` to dispatch HTTP calls to content endpoints and call `refreshDb()`. Verify seam signatures remain identical.

## 4. Campaigns, Settings & Team Mutations

- [x] 4.1 Implement Route Handlers for campaigns (`POST, PATCH, DELETE /api/control-room/campaigns/[id]`, `/schedule`, `/send`, `/draft`). Verify lifecycle validation.
- [x] 4.2 Rewire `src/lib/control-room/campaigns-api.ts` to call campaign endpoints and call `refreshDb()`. Verify compilation.
- [x] 4.3 Implement Route Handlers for settings (`PATCH /api/control-room/settings`), message templates (`PATCH /api/control-room/templates/[id]`), and team role update / member deletion (`PATCH, DELETE /api/control-room/team/[id]`) with last active owner guardrail. Verify validation rules.
- [x] 4.4 Rewire `src/lib/control-room/admin-api.ts` to call settings and team endpoints and call `refreshDb()`. Verify signatures.

## 5. Verification & Quality Assurance

- [x] 5.1 Run full TypeScript compilation (`npm run typecheck`) and verify zero errors across all endpoints and seams.
- [x] 5.2 Run ESLint (`npm run lint`) and verify clean code formatting.
- [x] 5.3 Run Next.js production build (`npm run build`) and verify all static and dynamic routes compile successfully.

## Workflow follow-up

- Archive the change after the user runs `/openspec-apply-change` and reviews the implementation.
- Generate commit message and commit changes to git.
