# Proposal: Phase 2 Database Schema, Row Level Security (RLS) & RPC Functions

## Why
With staff authentication and 2-step verification established in Phase 1, the Control Room requires its real Postgres database architecture. As documented in Phase 2 (Section 6) of `docs/CONTROL_ROOM_HANDOVER.md`, the platform needs persistent database schemas, strict Row Level Security (RLS) enforcing role boundaries directly in PostgreSQL, append-only financial and audit triggers, and transactional RPC functions for complex operations.

## What Changes
- **Postgres Enums & Types**: Define `staff_role`, `lead_status`, `deal_stage`, `payment_direction`, `payment_category`, `campaign_status`, and `campaign_template`.
- **Core Database Tables**:
  - `staff`: Linked to `auth.users`, tracking role, status, and `last_seen_at`.
  - `leads` & `lead_submissions`: Extended with CRM fields (`status`, `source`, `notes`, `tags`, `owner_id`, `deal_id`, `referrer_id`, `consent_at`, `unsubscribed_at`) and submission history.
  - `deals` & `payments`: Whole-Naira contract values and payment entries.
  - `referrers`: Commission rates and status.
  - `services`, `packages`, `running_costs`: Agency offerings and operating costs.
  - `work_items` & `partners`: Published portfolio items and creative partner profiles.
  - `campaigns`, `campaign_recipients`, `birthday_sends`: Outreach tracking.
  - `message_templates`, `settings`, `activity_log`: Global settings and system audit trail.
- **Append-Only Immutability**:
  - Add SQL trigger function `forbid_change()` blocking `UPDATE` or `DELETE` operations on `payments` and `activity_log`.
- **Role Level Security (RLS)**:
  - Implement `current_staff_role()` and `has_role()` helper functions validating active staff status and `aal2` TOTP assurance.
  - Enable RLS and add strict read/write policies on all 16 tables matching `src/lib/control-room/roles.ts`.
- **Transactional RPC Functions**:
  - `convert_lead_to_deal`: Atomic lead status transition, deal creation, and activity logging.
  - `record_payment`: Append-only payment insertion with role validation and audit logging.
  - `set_featured_package`: Atomic update guaranteeing only one featured package.
  - `log_activity`: Append-only activity logger recording staff actions.
- **Content Seed Script**:
  - Migration script to seed `services`, `packages`, `running_costs`, `work_items`, and `partners` from `src/data/`.

## Capabilities

### New Capabilities
- `control-room/data-schema-rls`: Covers the persistent database tables, Postgres enum types, append-only ledger triggers, transactional RPC functions, and Row Level Security policies enforcing staff role access.

### Modified Capabilities
None.

## Impact
- **Public Showroom (`/`)**: Showroom remains fully operational. Public visitors continue to read static fallbacks until Phase 6 switches them to DB content.
- **Control Room (`/control-room`)**: Establishes the authoritative database tables and security constraints ready to be wired to the snapshot endpoint in Phase 3.
- **Database & Supabase**: Adds migration files in `supabase/migrations/` ready to be applied via Supabase CLI (`supabase db push`) or the SQL editor.
