# Design: Database Schema, Row Level Security (RLS) & RPC Functions

## Context
See `proposal.md` for motivation. Currently, the database only has the initial `20261118000000_create_leads.sql` migration. In Phase 2, the complete relational schema from `docs/CONTROL_ROOM_HANDOVER.md` Section 6 must be defined with migrations, RLS policies, append-only triggers, and RPC functions.

## Goals / Non-Goals

**Goals:**
- Author sequential, executable Postgres migrations under `supabase/migrations/`.
- Create domain enums (`staff_role`, `lead_status`, `deal_stage`, `payment_direction`, `payment_category`, `campaign_status`, `campaign_template`).
- Extend `leads` and create `lead_submissions`, `deals`, `payments`, `referrers`, `services`, `packages`, `running_costs`, `work_items`, `partners`, `settings`, `message_templates`, `campaigns`, `campaign_recipients`, `birthday_sends`, and `activity_log`.
- Define security definer functions `current_staff_role()` and `has_role()` that read auth JWT claims (`aal = aal2`).
- Attach `forbid_change()` trigger on `payments` and `activity_log` for immutable audit integrity.
- Create multi-statement transactional RPC functions: `convert_lead_to_deal`, `record_payment`, `set_featured_package`, and `log_activity`.
- Seed initial production content from `src/data/` for services, packages, costs, and work items.

**Non-Goals:**
- Wiring the Next.js UI frontend to read these tables (Phase 3 snapshot).
- Wiring button clicks to write to these tables (Phase 4).
- Setting up third-party email providers / Resend (Phase 7).

## Decisions

### 1. Granular SQL Migration Structure
- **Choice**: Separate schema definitions into clean, sequential migration files:
  1. `20261123100000_control_room_types_and_staff.sql` (Enums, staff table, RLS helpers).
  2. `20261123100001_control_room_crm_tables.sql` (Leads extension, submissions, referrers, deals, payments, append-only triggers).
  3. `20261123100002_control_room_content_and_campaigns.sql` (Services, packages, work, partners, templates, settings, campaigns, activity log).
  4. `20261123100003_control_room_rls_and_rpc.sql` (RLS policies on all tables, RPC functions).
  5. `20261123100004_seed_content_data.sql` (Default content seeded from `src/data/`).
- **Rationale**: Modular migration files are easier to test, debug, and review in development, staging, and production environments.

### 2. Double Security Check with `current_staff_role()`
- **Choice**: Define `current_staff_role()` as a `security definer` function that requires `s.status = 'active'` AND `coalesce((auth.jwt() ->> 'aal'), '') = 'aal2'`.
- **Rationale**: If a session is at `aal1` (password verified but TOTP not verified), `current_staff_role()` evaluates to `NULL`, immediately causing all RLS policies to evaluate to `false` and return empty rowsets.

### 3. Append-Only Ledgers
- **Choice**: Attach a `before update or delete` trigger function `forbid_change()` to both `payments` and `activity_log`.
- **Rationale**: Financial receipts and system audit events must never be rewritten or deleted. Correcting entries must be recorded as new rows with opposite payment directions or explicit notes.

### 4. BigInt Naira Currency Convention
- **Choice**: Store money as `bigint` Whole Naira (`check (amount >= 0)`).
- **Rationale**: Eliminates floating-point rounding errors and matches the agency standard where all contract quotes and packages are in whole Naira.

## Risks / Trade-offs

- **[Risk] RLS Hides Rows, Not Columns**
  → *Mitigation*: Sales role can query `deals` rows but must not see `commission_rate`. While RLS grants read access to the deal row, the Phase 3 server snapshot handler strips `commissionRate` before transmitting JSON to the browser.
- **[Risk] Foreign Key Restraints on User Deletion**
  → *Mitigation*: Staff offboarding disables the account (`status = 'disabled'`) and bans the auth user rather than deleting the row, preserving `recorded_by` and `owner_id` relationships.

## Migration Plan
1. Create all migration files under `supabase/migrations/`.
2. Provide a local verification script or SQL runner to validate syntax and table integrity.
3. Test RLS permissions by simulating JWT claims across all 4 roles.
