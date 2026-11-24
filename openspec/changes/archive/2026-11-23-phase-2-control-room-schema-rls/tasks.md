# Tasks: Phase 2 Database Schema, Row Level Security (RLS) & RPC Functions

## 1. Postgres Enums & Staff Security Foundation

- [x] 1.1 Create migration `supabase/migrations/20261123100000_control_room_types_and_staff.sql` defining custom enums (`staff_role`, `lead_status`, `deal_stage`, `payment_direction`, `payment_category`, `campaign_status`, `campaign_template`).
- [x] 1.2 Implement `public.staff` table in migration with foreign key to `auth.users(id)`, role, status, timestamps, and define `current_staff_role()` and `has_role()` security definer functions checking `aal2` session assurance.

## 2. CRM Tables & Immutable Financial Ledgers

- [x] 2.1 Create migration `supabase/migrations/20261123100001_control_room_crm_tables.sql` extending `public.leads` with CRM columns (`status`, `source`, `notes`, `tags`, `owner_id`, `deal_id`, `referrer_id`, `consent_at`, `unsubscribed_at`) and create `public.lead_submissions` history table.
- [x] 2.2 Create `public.referrers`, `public.deals`, and `public.payments` tables with whole-Naira `bigint` constraints and link foreign keys between leads, deals, and referrers.
- [x] 2.3 Implement `forbid_change()` trigger function and attach `payments_append_only` trigger on `public.payments` to guarantee immutable accounting entries.

## 3. Content, Campaigns, Settings & Audit Tables

- [x] 3.1 Create migration `supabase/migrations/20261123100002_control_room_content_and_campaigns.sql` defining `services`, `packages` (with single featured partial index), `running_costs`, `work_items`, and `partners` tables.
- [x] 3.2 Define `message_templates`, single-row `settings` table, `campaigns`, `campaign_recipients`, and `birthday_sends` tables.
- [x] 3.3 Create `public.activity_log` table and attach `activity_append_only` trigger with `forbid_change()`.

## 4. Row Level Security Policies & RPC Functions

- [x] 4.1 Create migration `supabase/migrations/20261123100003_control_room_rls_and_rpc.sql` enabling RLS across all 16 tables with granular SELECT, INSERT, UPDATE, and DELETE policies matching `src/lib/control-room/roles.ts`.
- [x] 4.2 Define atomic RPC function `convert_lead_to_deal(p_lead uuid, p_title text, p_client text, p_service text, p_agreed bigint)` checking lead eligibility, creating deal, updating lead status, and logging activity.
- [x] 4.3 Define atomic RPC functions `record_payment(...)`, `set_featured_package(p_id uuid)`, and `log_activity(p_action text, p_target text)`.

## 5. Content Seeding & Schema Validation

- [x] 5.1 Create migration `supabase/migrations/20261123100004_seed_content_data.sql` to populate default services, school packages, running costs, selected work, and partner categories from `src/data/`.
- [x] 5.2 Validate SQL migration scripts syntax and verify TypeScript definitions in `src/lib/control-room/types.ts` remain aligned with all table columns.
- [x] 5.3 Run `npm run typecheck && npm run lint && npm run build` to ensure project remains completely healthy and passes all builds.
