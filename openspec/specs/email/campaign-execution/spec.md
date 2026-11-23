# email/campaign-execution Specification

## Purpose
Handles campaign recipient resolution, dispatch execution, and recipient-level delivery tracking within the Control Room.

## Requirements

### Requirement: Campaign Recipient Resolution
The system SHALL resolve eligible campaign recipients filtered by audience types, active status, consent, and unsubscription state.

#### Scenario: Audience filtering for campaign
- **WHEN** campaign execution is initiated
- **THEN** only leads whose type matches target audience, consent is true, unsubscribed_at is null, and status is not archived are selected

#### Scenario: Duplicate suppression
- **WHEN** multiple leads share an identical email address
- **THEN** recipient resolution selects exactly one lead per distinct email address

### Requirement: Campaign Dispatch Execution
The system SHALL record recipient tracking rows, update campaign status to sending, dispatch batches, and record final sent status.

#### Scenario: Executing campaign send
- **WHEN** an authorized staff member triggers campaign send
- **THEN** the system inserts rows into campaign_recipients, dispatches messages with provider tags, and updates campaign status to sent
