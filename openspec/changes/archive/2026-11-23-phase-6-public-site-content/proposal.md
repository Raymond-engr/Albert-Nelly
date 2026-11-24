# Proposal

## Why

The public showroom website currently reads static mock data from `src/data/*.ts`. Changes made by staff in the Control Room (such as updating service prices, school package features, selected work items, partner logos, or the business WhatsApp contact number) are never reflected on the live website. Phase 6 of the handover document (`docs/CONTROL_ROOM_HANDOVER.md`, Section 10) connects the public showroom to the database so published content updates automatically without code changes or redeployments.

## What Changes

- **Server Reader (`src/lib/site-content.ts`)**: A server-only reader function that fetches published rows from Supabase (`services`, `packages`, `running_costs`, `work_items`, `partners`, and `settings`). Formats price lines using `formatPrice()` from `src/lib/control-room/price.ts`.
- **Zero-Downtime Fallback**: If Supabase is unconfigured, unreachable, or returns an error, the reader seamlessly falls back to the static files in `src/data/` so the showroom never breaks.
- **`SiteContentProvider` & `useSiteContent()` Hook (`src/providers/SiteContentProvider.tsx`)**: Context provider wrapping the showroom tree, making live content available while preserving prop-less slot contracts.
- **Showroom Slot Integration**: Update `Services.tsx`, `Schools.tsx`, `Work.tsx`, `Partners.tsx`, and `WhatsAppFab.tsx` to read from `useSiteContent()`, falling back to static imports.
- **On-Demand Cache Revalidation**: Update Control Room mutation route handlers for `services`, `packages`, `running-costs`, `work`, and `partners` to call `revalidatePath("/")` upon successful writes. Set `export const revalidate = 300` on `src/app/page.tsx` as a safety net.

## Capabilities

### New Capabilities

- `showroom/database-content`: Public Showroom retrieves published content from Supabase on the server, formats prices, provides content via React Context, and falls back gracefully to `src/data/` static content when database queries fail.
- `showroom/cache-revalidation`: Control Room mutation handlers trigger `revalidatePath("/")` whenever public content (services, packages, costs, work, partners) is modified so updates appear live immediately.

### Modified Capabilities

- None. (Previous control-room capabilities remain intact; this targets the public showroom reader layer and wires revalidation into existing handlers).

## Impact

- **Public Showroom**: `src/app/page.tsx` becomes an async Server Component awaiting `getSiteContent()`; passes content to `Showroom`. Slots `Services.tsx`, `Schools.tsx`, `Work.tsx`, `Partners.tsx`, and `WhatsAppFab.tsx` consume dynamic data through `useSiteContent()` while strictly maintaining existing UI behavior, prop-less contracts, and styling.
- **Control Room**: Mutation routes for `services`, `packages`, `running-costs`, `work`, and `partners` call `revalidatePath("/")` after saving.
- **Database**: No schema changes required. Queries execute against existing tables with `published = true` (or `status = 'active'` for partners) utilizing existing `anon` RLS policies and indexes.
- **Dependencies**: No new npm packages required.
