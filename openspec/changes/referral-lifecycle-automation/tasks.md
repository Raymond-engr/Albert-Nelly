# Tasks

## 1. Database Schema & Migration

- [x] 1.1 Add `referrer_id` column and index to `public.leads`, add case-insensitive unique constraint/index `lower(email)` on `public.referrers`, and verify migration applies cleanly
- [x] 1.2 Update `convert_lead_to_deal` RPC function to accept and propagate `p_referrer_id` and `p_commission_rate` to `public.deals`
- [x] 1.3 Update lead and deal TypeScript interfaces and server mappers (`rowToLead`, `rowToDeal`) to include `referrerId`

## 2. API Endpoints & Ingestion

- [x] 2.1 Update `POST /api/leads` to parse `ref` query or body parameter, validate against active referrers, and persist `referrer_id`
- [x] 2.2 Create `POST /api/control-room/leads/[id]/convert-to-referrer` route with role checks, duplicate email check, and activity logging
- [x] 2.3 Update `POST /api/control-room/referrers` route to validate email uniqueness against existing referrers
- [x] 2.4 Update `POST /api/control-room/leads/[id]/convert` route to accept and forward `referrerId` and `commissionRate`
- [x] 2.5 Add automated test suite for lead-to-referrer promotion, duplicate email rejection, and lead attribution in `tests/control-room/referral-lifecycle.test.ts`

## 3. UI Workflows & Commission Lifecycle Clarity

- [x] 3.1 Update `LeadDrawer.tsx` to add "Promote to Referrer" modal and action for `type === "refer"` leads
- [x] 3.2 Add referral link display and one-click copy button (`albertnelly.com/?ref=<id>`) in `ReferrersScreen.tsx`
- [x] 3.3 Update `NewDealModal.tsx` to inherit and display the attached referrer and default commission rate
- [x] 3.4 Enhance `dealBalance` in `src/lib/control-room/metrics.ts` to calculate `commissionPending` for active deals alongside `commissionOwed`
- [x] 3.5 Update `DealDetail.tsx` and `ReferrersScreen.tsx` to clearly display pending vs payable commissions with explanatory badges

## 4. Verification & Hardening

- [x] 4.1 Run `npm run typecheck` and verify 0 TypeScript compiler errors
- [x] 4.2 Run `npm test` and verify all tests pass across all test suites
