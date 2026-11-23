# Design

## Context

The public Showroom currently imports static data directly from `src/data/services.ts`, `src/data/packages.ts`, `src/data/work.ts`, `src/data/referral.ts`, and `src/data/site.ts`. When staff update pricing or items in the Control Room, the changes only exist in the Supabase database and are never displayed on the public website.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Provide a `server-only` reader `src/lib/site-content.ts` that queries Supabase for published items using the `anon` client (falling back to static data if unavailable).
- Add `src/providers/SiteContentProvider.tsx` supplying `useSiteContent()` hook.
- Update `src/app/page.tsx` to fetch dynamic content and pass it into `Showroom`.
- Wire `Services`, `Schools`, `Work`, `Partners`, and `WhatsAppFab` slots to use `useSiteContent()`.
- Add `revalidatePath("/")` to mutating routes (`services`, `packages`, `running-costs`, `work`, `partners`, `settings`).
- Set `export const revalidate = 300` on `src/app/page.tsx`.

**Non-Goals:**
- Do not alter the slot contract (`docs/SLOTS.md`). Slots remain completely prop-less functions (`() => JSX.Element`).
- Do not delete `src/data/`. Static files remain the permanent baseline and runtime fallback.
- Do not migrate showroom variants (`/one` through `/four`) in this phase; they continue using static data until explicitly swapped into main.

## Decisions

### Decision 1: Query with createBrowserClient / public anon role vs createAdminClient
**Chosen**: Query with the anonymous Supabase client (`anon` key) from `@/lib/supabase/client` or a lightweight `createClient` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
**Why**: RLS policies for `services`, `packages`, `running_costs`, `work_items`, and `partners` specifically permit `anon` access for published rows. This adheres to least-privilege security without requiring service role secrets in public reading paths.

### Decision 2: Context Provider for Prop-Less Slots
**Chosen**: `SiteContentProvider` placed in `ShowroomProviders`.
**Why**: Ground rule #1 in `docs/SLOTS.md` states: *"Slots are prop-less: `<Services />`, not `<Services data={...} />`. They read their data from hooks or data/."* Passing content via context allows slots to stay prop-less while reading live database content.

### Decision 3: Formatting Prices on the Server
**Chosen**: `formatPrice(p: PriceDisplay)` from `src/lib/control-room/price.ts` runs inside `src/lib/site-content.ts` on the server before passing the formatted strings to the frontend.
**Why**: The public `Service.price` and `SchoolPackage.price` types in `src/types/content.ts` expect simple `string` values. By running `formatPrice` on the server, existing Showroom components require zero changes to their price rendering logic.

### Decision 4: Revalidation Strategy
**Chosen**: On-demand `revalidatePath("/")` inside the mutation handlers, paired with `export const revalidate = 300` in `src/app/page.tsx`.
**Why**: Delivers instant updates to site visitors when staff save changes in the Control Room, with ISR 5-minute background refresh as a safety net.

## Risks / Trade-offs

- **[Risk] Database latency on page load** → Mitigated by Next.js static caching and ISR (`revalidate = 300` + on-demand revalidation). The page is built statically or cached, not queried on every single HTTP hit.
- **[Risk] Supabase down or unconfigured** → Mitigated by a `try/catch` wrapper in `getSiteContent()` returning the full static `src/data/` defaults.
- **[Risk] Missing fields or malformed records** → Mitigated by runtime defensive mapping with fallbacks for each content type.
