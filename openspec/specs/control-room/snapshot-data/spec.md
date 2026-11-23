# control-room/snapshot-data Specification

## Purpose
Provides a secure snapshot endpoint, server mappers, role-based financial masking, and store hydration lifecycle for the Control Room admin portal.

## Requirements

### Requirement: Unified database snapshot delivery
The system SHALL provide an authenticated endpoint returning all active Control Room collections in a single response payload matching the client domain model.

#### Scenario: Authenticated staff requests snapshot
- **WHEN** an authenticated staff member with a valid aal2 session calls `GET /api/control-room/snapshot`
- **THEN** the system queries database tables in parallel and answers HTTP 200 with the populated collections

#### Scenario: Unauthenticated snapshot request
- **WHEN** an unauthenticated request reaches `/api/control-room/snapshot`
- **THEN** the system rejects the request with HTTP 401 Unauthorized

### Requirement: Role-based data redaction
The system SHALL redact confidential financial rows and commission rates for roles other than Owner and Finance prior to serialization.

#### Scenario: Sales role retrieves snapshot
- **WHEN** an authenticated user with role sales calls `GET /api/control-room/snapshot`
- **THEN** the response payload contains an empty payments array and all deal objects have `commissionRate: null`

#### Scenario: Finance role retrieves snapshot
- **WHEN** an authenticated user with role finance calls `GET /api/control-room/snapshot`
- **THEN** the response payload includes all recorded payment rows and actual deal commission rates

### Requirement: Live store hydration and refresh lifecycle
The system SHALL hydrate the client store from the server snapshot upon mounting and maintain a refresh mechanism for window focus and post-mutation synchronization.

#### Scenario: Initial application shell mount
- **WHEN** the Control Room shell mounts in the browser
- **THEN** the store requests `/api/control-room/snapshot` and transitions status from loading to ready upon receipt

#### Scenario: Snapshot retrieval failure
- **WHEN** a snapshot request fails due to a network interruption or server error
- **THEN** the client shell transitions to an error state and renders a retry action

#### Scenario: Post-mutation store re-synchronization
- **WHEN** any seam mutation completes successfully on the server
- **THEN** the client store automatically executes `refreshDb()` to reflect updated database records across all screens
