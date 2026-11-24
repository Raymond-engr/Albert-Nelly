# Tasks

## 1. Server Reader Implementation

- [x] 1.1 Create `src/lib/site-content.ts` with `getSiteContent()`:
  - Query Supabase for published `services` (ordered by `position`), format price with `formatPrice()`, and map to `Service`
  - Query Supabase for `packages` and `running_costs` (ordered by `position`), map to `SchoolPackage` and `runningCosts`
  - Query Supabase for published `work_items` (ordered by `position`), map to `WorkItem`
  - Query Supabase for active/published `partners` (ordered by `position`), map names to `partnerTiles: string[]`
  - Query `settings` for `whatsapp_number`, falling back to `site.whatsappNumber`
  - Wrap entire fetch in `try/catch` and return default data from `src/data/` if queries fail or Supabase is unconfigured
- [x] 1.2 Write unit tests in `tests/site-content.test.ts` verifying mapping, price formatting, and static fallback behavior when database query fails

## 2. Content Provider & Slot Wiring

- [x] 2.1 Create `src/providers/SiteContentProvider.tsx` exporting `SiteContentProvider` and `useSiteContent()` hook
- [x] 2.2 Update `src/components/showroom/Showroom.tsx` and `src/components/showroom/Providers.tsx` to accept and provide `content?: SiteContent`
- [x] 2.3 Update `src/app/page.tsx` as an async component awaiting `getSiteContent()`, passing content to `<Showroom />`, and exporting `revalidate = 300`
- [x] 2.4 Update Showroom slots to read from `useSiteContent()`:
  - `src/components/showroom/Services.tsx`: read services from `useSiteContent()`
  - `src/components/showroom/Schools.tsx`: read packages and running costs from `useSiteContent()`
  - `src/components/showroom/Work.tsx`: read work items from `useSiteContent()`
  - `src/components/showroom/Partners.tsx`: read partner tiles from `useSiteContent()`
  - `src/components/showroom/WhatsAppFab.tsx`: read WhatsApp number from `useSiteContent()`

## 3. On-Demand Revalidation

- [x] 3.1 Add `revalidatePath("/")` to mutating route handlers:
  - `src/app/api/control-room/services/[id]/route.ts`
  - `src/app/api/control-room/packages/[id]/route.ts`
  - `src/app/api/control-room/running-costs/route.ts`
  - `src/app/api/control-room/work/route.ts` and `[id]/route.ts`
  - `src/app/api/control-room/partners/route.ts` and `[id]/route.ts`
  - `src/app/api/control-room/settings/route.ts`
- [x] 3.2 Add test assertions in mutation route tests verifying `revalidatePath("/")` is called upon modification

## 4. Verification & Validation

- [x] 4.1 Run `npm run typecheck` to verify no type regressions across Showroom and Control Room
- [x] 4.2 Run `npm run lint` to verify zero ESLint errors or unused imports
- [x] 4.3 Run `npm test -- --run` to verify all existing and new test suites pass
- [x] 4.4 Run `npm run build` to confirm static and dynamic pages build cleanly with Next.js 16
