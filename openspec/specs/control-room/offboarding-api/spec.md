# control-room/offboarding-api Specification

## Purpose
Provides a server-side route that an Owner can call to disable a staff member's application account and immediately invalidate their active Supabase Auth session, completing the offboarding workflow without leaving a window of continued access.

## Requirements

### Requirement: Disable staff account and ban auth user atomically
The system SHALL set `staff.status = 'disabled'` and call the Supabase Auth admin API to ban the user in the same request, so the former staff member loses both database access and session validity.

#### Scenario: Successful offboard
- **WHEN** an Owner submits a valid offboard request for an active staff member who is not the last active Owner
- **THEN** the staff row's `status` is set to `disabled`, the Supabase Auth user is banned, and HTTP 200 is returned

#### Scenario: Attempt to offboard last active Owner
- **WHEN** an Owner attempts to offboard the last active Owner account
- **THEN** the system returns HTTP 422 and leaves both the staff row and auth user unchanged

### Requirement: Last-owner guard on offboard endpoint
The system SHALL refuse the offboard request when it would leave zero active Owner accounts, returning a descriptive error.

#### Scenario: Two Owners exist
- **WHEN** an Owner offboards another Owner while at least one more active Owner remains
- **THEN** the offboard proceeds and the caller receives HTTP 200

#### Scenario: Only one Owner exists
- **WHEN** an Owner attempts to offboard themselves or the only other Owner
- **THEN** the system returns HTTP 422 with a message explaining why the action is refused
