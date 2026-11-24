# Delta Spec: control-room/mutations-api

## MODIFIED Requirements

### Requirement: CRM Mutations Endpoints
The server SHALL provide authenticated Route Handlers for mutating leads, creating and advancing deals, and recording append-only payments.

#### Scenario: Lead Status and Details Update
- **WHEN** an authenticated staff member with "sales" or "owner" role sends `PATCH /api/control-room/leads/[id]` with status, notes, tags, or ownerId
- **THEN** the lead record in Supabase is updated, the operation is logged to `activity_log`, and the updated lead is returned

#### Scenario: Convert Lead to Deal
- **WHEN** an authorized staff member sends `POST /api/control-room/leads/[id]/convert` with title, client, service, agreed price, and optional referrer attribution
- **THEN** the atomic RPC `convert_lead_to_deal` is executed, creating a new deal, linking the lead and assigned referrer, logging activity, and returning the deal ID

#### Scenario: Deal Stage and Details Update
- **WHEN** an authorized staff member sends `PATCH /api/control-room/deals/[id]` or `POST /api/control-room/deals/[id]/stage`
- **THEN** the deal is updated in the database, stage transitions are persisted, and activity is recorded

#### Scenario: Record Deal Payment
- **WHEN** an authenticated staff member with "finance" or "owner" role sends `POST /api/control-room/deals/[id]/payments` with amount, direction, category, date, and note
- **THEN** an append-only payment row is inserted via `record_payment` RPC and activity is logged

#### Scenario: Unauthorized Role Payment Refusal
- **WHEN** a staff member with "sales" or "content" role attempts to record a payment
- **THEN** the endpoint returns HTTP 403 Forbidden and no payment is recorded
