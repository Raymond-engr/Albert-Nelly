# Delta Spec: control-room/referral-automation

## ADDED Requirements

### Requirement: Promote Referrer Lead to Active Referrer
Staff with `referrers:edit` permission SHALL be able to convert a lead of type `refer` into an active referrer record with a single action, creating a new `public.referrers` record with the lead's contact details and initial commission rate.

#### Scenario: Successful promotion from lead to referrer
- **WHEN** staff calls `POST /api/control-room/leads/[id]/convert-to-referrer` with `{ rate: 10 }` for a lead with `type = "refer"`
- **THEN** a new referrer row is inserted in `public.referrers` with the lead's `name`, `email`, `whatsapp`, and specified rate, the lead's status is updated to `contacted`, an activity log entry is recorded, and the created referrer object is returned.

#### Scenario: Duplicate referrer email rejection
- **WHEN** staff attempts to create or promote a referrer with an email address that already belongs to an existing referrer (case-insensitive)
- **THEN** the request is rejected with HTTP 409 Conflict indicating a referrer with this email already exists, preventing duplicate entries.

#### Scenario: Non-referrer lead cannot be converted to referrer
- **WHEN** staff calls `POST /api/control-room/leads/[id]/convert-to-referrer` for a lead whose type is `hire` or `partner`
- **THEN** the request returns HTTP 422 with an error indicating only referrer leads can be promoted.

### Requirement: Referral Link Attribution on Client Leads
The public leads ingestion endpoint SHALL accept an optional referrer identifier (`ref`) and persist it on the incoming lead record when valid.

#### Scenario: Ingesting client lead with referral link
- **WHEN** a client submits a lead form with `ref` set to an existing referrer ID
- **THEN** the created lead stores `referrer_id` referencing the referrer.

#### Scenario: Ingesting client lead with invalid or non-existent referrer ID
- **WHEN** a client submits a lead form with an unknown or malformed `ref` string
- **THEN** the lead is successfully accepted with `referrer_id` set to null without failing form submission.

### Requirement: Automatic Deal Referrer Attribution
When converting a client lead that has an associated referrer to a deal, the resulting deal SHALL automatically inherit the `referrer_id` and the referrer's default commission rate.

#### Scenario: Convert referred lead to deal
- **WHEN** `convert_lead_to_deal` is executed for a lead with `referrer_id` populated
- **THEN** the created deal has `referrer_id` set to the lead's referrer and `commission_rate` initialized to that referrer's default rate.

### Requirement: Commission Lifecycle Visibility
The system SHALL expose both accrued/pending commission (on active deals) and payable/owed commission (on delivered/closed deals) across Deal, Referrer, and Overview screens.

#### Scenario: Active deal with referrer shows pending commission
- **WHEN** a deal with an agreed price of ₦1,000,000 and 10% commission rate is in stage `in_progress`
- **THEN** the deal details display ₦100,000 as pending commission and ₦0 as currently owed/payable.

#### Scenario: Delivered deal moves pending commission to owed
- **WHEN** the deal is moved to stage `delivered` and ₦0 commission payments have been recorded
- **THEN** the system calculates ₦100,000 as commission owed and displays the "Record commission payment" prompt to authorized roles.
