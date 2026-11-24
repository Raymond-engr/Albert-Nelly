# control-room/mutations-api Specification

## Purpose
Provides authenticated REST API mutation endpoints and seam client wiring for leads, deals, payments, content items, campaigns, settings, and staff operations in the Control Room.

## Requirements

### Requirement: CRM Mutations Endpoints
The server SHALL provide authenticated Route Handlers for mutating leads, creating and advancing deals, and recording append-only payments.

#### Scenario: Lead Status and Details Update
- **WHEN** an authenticated staff member with "sales" or "owner" role sends `PATCH /api/control-room/leads/[id]` with status, notes, tags, or ownerId
- **THEN** the lead record in Supabase is updated, the operation is logged to `activity_log`, and the updated lead is returned

#### Scenario: Convert Lead to Deal
- **WHEN** an authorized staff member sends `POST /api/control-room/leads/[id]/convert` with title, client, service, and agreed price
- **THEN** the atomic RPC `convert_lead_to_deal` is executed, creating a new deal, linking the lead with status "deal", logging activity, and returning the deal ID

#### Scenario: Deal Stage and Details Update
- **WHEN** an authorized staff member sends `PATCH /api/control-room/deals/[id]` or `POST /api/control-room/deals/[id]/stage`
- **THEN** the deal is updated in the database, stage transitions are persisted, and activity is recorded

#### Scenario: Record Deal Payment
- **WHEN** an authenticated staff member with "finance" or "owner" role sends `POST /api/control-room/deals/[id]/payments` with amount, direction, category, date, and note
- **THEN** an append-only payment row is inserted via `record_payment` RPC and activity is logged

#### Scenario: Unauthorized Role Payment Refusal
- **WHEN** a staff member with "sales" or "content" role attempts to record a payment
- **THEN** the endpoint returns HTTP 403 Forbidden and no payment is recorded

### Requirement: Content and Pricing Mutations
The server SHALL provide authenticated Route Handlers for updating services, packages, school running costs, work items, creative partners, and referral partners.

#### Scenario: Update Service Item
- **WHEN** an authorized staff member sends `PATCH /api/control-room/services/[id]` with price, published state, or copy
- **THEN** the service is updated in PostgreSQL and the public cache path is invalidated

#### Scenario: Set Featured Package
- **WHEN** an authorized staff member sends `POST /api/control-room/packages/[id]/featured`
- **THEN** the `set_featured_package` RPC clears previous featured flags and sets the target package as featured

#### Scenario: Manage Work Items and Partners
- **WHEN** an authorized staff member sends `POST`, `PATCH`, or `DELETE` to `/api/control-room/work/[id]` or `/api/control-room/partners/[id]`
- **THEN** the work item or partner row is created, updated, or removed accordingly, and activity is logged

### Requirement: Campaign and Settings Mutations
The server SHALL provide authenticated Route Handlers for managing campaigns, message templates, general settings, and staff access.

#### Scenario: Campaign Lifecycle Transitions
- **WHEN** an authorized staff member transitions a campaign through `/schedule`, `/send`, or `/draft`
- **THEN** the campaign status is updated with appropriate timestamps and activity is logged

#### Scenario: Prevent Removing Last Active Owner
- **WHEN** an administrator attempts `DELETE /api/control-room/team/[id]` for the sole active Owner
- **THEN** the server rejects the request with HTTP 422 Unprocessable Entity and an explanatory error message

### Requirement: Optimistic Concurrency Protection
The server SHALL reject conflicting updates to leads or deals when the incoming `updatedAt` does not match the current database timestamp.

#### Scenario: Stale Deal Update Conflict
- **WHEN** a client submits a deal edit with an outdated `updatedAt` timestamp
- **THEN** the server returns HTTP 409 Conflict, prompting the client to reload and preserve data integrity

### Requirement: Client Seam HTTP Bridge and Error Interception
The client seam modules SHALL execute remote HTTP requests via a centralized `call` helper and propagate errors to a global toast handler without crashing UI components.

#### Scenario: Transparent Seam Mutation Execution
- **WHEN** a UI modal or screen calls an existing seam function like `dealsApi.move(id, stage)`
- **THEN** the seam function executes `call("POST", ...)`, refreshes the client `dbStore`, and fulfills the promise

#### Scenario: Global API Error Toasting
- **WHEN** a mutation rejects with an `ApiError`
- **THEN** the unhandled rejection interceptor displays a descriptive error toast and refreshes the snapshot on 409 conflicts
