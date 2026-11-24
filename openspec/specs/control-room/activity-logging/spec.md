# control-room/activity-logging Specification

## Purpose
Records every staff-initiated mutation in `public.activity_log` from the server so the
Activity screen shows a reliable, tamper-proof audit trail without any browser-side writes.

## Requirements

### Requirement: Mutations are logged server-side with staff identity
Every successful mutating route handler (POST, PATCH, PUT, DELETE) in
`/api/control-room/` SHALL write a row to `public.activity_log` containing the
acting staff id, an action string, and an optional target string. The browser
SHALL NOT write directly to `activity_log`.

#### Scenario: Successful mutation is logged
- **WHEN** a mutating API route completes without error
- **THEN** a row is inserted into `activity_log` with the staff id, action label, and
  optional target identifier
- **AND** the row is visible in the next snapshot fetch

#### Scenario: Failed mutation is not logged
- **WHEN** a mutating API route returns an error (validation failure, permission denied,
  database constraint)
- **THEN** no row is inserted into `activity_log`

### Requirement: Activity log rows are immutable
Rows in `public.activity_log` SHALL be append-only. No route handler or RLS policy
SHALL permit UPDATE or DELETE on `activity_log` rows by authenticated staff.

#### Scenario: Attempt to delete an activity log row is rejected
- **WHEN** any authenticated request attempts to DELETE a row from `activity_log`
- **THEN** the database or RLS policy rejects the operation
- **AND** the row remains in the table

### Requirement: logActivity client stub is replaced
The `logActivity` export in `src/lib/control-room/api.ts` SHALL become a no-op or be
removed. No browser code SHALL call a function that writes to `activity_log`.

#### Scenario: Client-side logActivity is called
- **WHEN** `logActivity` is invoked from browser code (legacy call sites)
- **THEN** the function does nothing and returns without making a network request
