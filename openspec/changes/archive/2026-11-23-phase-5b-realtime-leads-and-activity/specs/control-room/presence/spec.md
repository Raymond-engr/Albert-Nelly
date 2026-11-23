# Spec Delta

## Purpose

Tracks when each staff member last interacted with the Control Room by recording a
`last_seen_at` timestamp on every authenticated server request, with throttling to avoid
excessive database writes.

## ADDED Requirements

### Requirement: requireStaff updates last_seen_at passively
`requireStaff` SHALL update `staff.last_seen_at` to the current UTC timestamp after
verifying the staff row, throttled to at most one write per 5 minutes per staff member.

#### Scenario: First request within a 5-minute window
- **WHEN** `requireStaff` is called and the staff member's `last_seen_at` is null or more
  than 5 minutes in the past
- **THEN** `staff.last_seen_at` is updated to the current UTC timestamp

#### Scenario: Subsequent request within the throttle window
- **WHEN** `requireStaff` is called and the staff member's `last_seen_at` was updated
  less than 5 minutes ago
- **THEN** `staff.last_seen_at` is NOT updated (write is skipped)
- **AND** the request is not delayed by the skipped write

#### Scenario: Presence update failure does not block the request
- **WHEN** the `last_seen_at` update fails (e.g., transient database error)
- **THEN** `requireStaff` continues and the calling route handler is not affected
- **AND** the error is logged server-side but not surfaced to the browser

### Requirement: last_seen_at is visible on the Team screen
The Team screen SHALL display each staff member's `last_seen_at` value from the snapshot
data so owners can see when each person last used the Control Room.

#### Scenario: Staff member has been seen recently
- **WHEN** a staff member made a request within the last 24 hours
- **THEN** the Team screen shows a human-readable relative time (e.g. "2 hours ago")

#### Scenario: Staff member has never been seen
- **WHEN** a staff member's `last_seen_at` is null
- **THEN** the Team screen shows "Never" or equivalent
