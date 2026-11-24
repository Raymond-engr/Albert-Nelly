# Proposal: Control Room Mutation Endpoints & Seam Client Integration (Phase 4)

## Why

In Phase 2, the underlying Supabase database tables, RLS policies, and RPC functions were deployed. In Phase 3, the Control Room was wired to read real database snapshots via `GET /api/control-room/snapshot`.

However, all user actions (editing leads, moving deals, recording payments, editing services and packages, updating settings, managing team members) currently write to the local mock `dbStore` in the browser. When the page reloads, these mutations are lost or desynchronized from the database.

Phase 4 bridges this gap (Handover Section 8: "Make the buttons write"). It replaces the in-memory seam bodies with authenticated HTTP Route Handlers backed by Supabase transactions, atomic RPC calls, role-level authorization, and activity logging, while preserving existing client seam function signatures and form behavior.

## What Changes

- **Client HTTP Client & Global Error Interceptor (`src/lib/control-room/http.ts`)**:
  - Introduce `call<T>(method, url, body)` handling JSON serialization, status checking, and throwing typed `ApiError(status, message, fields)`.
  - Add global unhandled promise rejection listener in `Shell.tsx` to display error toasts and trigger snapshot `refreshDb()` on 409 conflicts without crashing components.
- **Seam Client Rewiring**:
  - Rewire `leadsApi`, `dealsApi`, `contentApi`, `campaignsApi`, and `adminApi` to dispatch HTTP requests to `/api/control-room/...` and trigger `refreshDb()` upon completion.
  - Retain function signatures so UI modals and components require zero rewrites.
- **Backend Mutation Route Handlers (`src/app/api/control-room/...`)**:
  - **CRM Endpoints**:
    - `PATCH /api/control-room/leads/[id]` (update lead metadata, status, tags, owner)
    - `POST /api/control-room/leads/[id]/convert` (convert lead to deal via `convert_lead_to_deal` RPC)
    - `POST /api/control-room/deals` (create new deal)
    - `PATCH /api/control-room/deals/[id]` (update deal details, notes, stage)
    - `POST /api/control-room/deals/[id]/stage` (move deal pipeline column)
    - `POST /api/control-room/deals/[id]/payments` (record append-only payment via `record_payment` RPC)
  - **Content & Pricing Endpoints**:
    - `PATCH /api/control-room/services/[id]` (edit pricing, description, publish state)
    - `PATCH /api/control-room/packages/[id]` (edit package details, tier)
    - `POST /api/control-room/packages/[id]/featured` (set featured tier via `set_featured_package` RPC)
    - `PUT /api/control-room/running-costs` (batch update school running costs)
    - `POST`, `PATCH`, `DELETE /api/control-room/work/[id]` (manage portfolio work items)
    - `POST`, `PATCH`, `DELETE /api/control-room/partners/[id]` (manage creative partners)
    - `POST`, `PATCH /api/control-room/referrers/[id]` (manage referral partners)
  - **Campaigns & Settings Endpoints**:
    - `POST`, `PATCH`, `DELETE /api/control-room/campaigns/[id]` (manage campaigns)
    - `POST /api/control-room/campaigns/[id]/schedule` & `/send` & `/draft` (lifecycle transitions)
    - `PATCH /api/control-room/settings` (WhatsApp number, discount rates, commission limits)
    - `PATCH /api/control-room/templates/[id]` (message templates)
    - `PATCH /api/control-room/team/[id]` & `DELETE /api/control-room/team/[id]` (role modifications and staff removal guardrails)
- **Concurrency & Validation**:
  - Implement optimistic concurrency detection with `updatedAt` for lead and deal edits returning 409 conflict when stale.
  - Strict server-side payload validation for amounts, status enums, string bounds, and roles.

## Capabilities

### New Capabilities
- `control-room/mutations-api`: Authenticated REST API mutation routes for leads, deals, payments, content, campaigns, settings, and team management with role-based validation, RPC execution, and activity logging.

### Modified Capabilities
- `control-room/snapshot-data`: Snapshot client store updates seamlessly following remote mutations via `refreshDb()` triggers.

## Impact

- **Public Showroom**: No breaking changes. Public lead submission remains unaffected.
- **Control Room Admin Portal**: All dashboard screens (Leads, Deals, Services, Packages, Work, Partners, Referrers, Campaigns, Team, Settings) become persistent against live PostgreSQL database.
- **Database**: Executes append-only records for payments and activity log, leverages atomic RPCs (`convert_lead_to_deal`, `record_payment`, `set_featured_package`), and enforces Row Level Security.
- **Dependencies**: Uses existing `@supabase/ssr` client and native Fetch API.
