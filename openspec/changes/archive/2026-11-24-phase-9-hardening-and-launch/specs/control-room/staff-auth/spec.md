# Spec Delta

## MODIFIED Requirements

### Requirement: Staff offboarding and last owner protection
The system SHALL prevent removing or demoting the last active Owner and SHALL disable staff accounts rather than deleting historical database records. When a staff account is disabled, the system SHALL also immediately ban the corresponding Supabase Auth user so that any active sessions are invalidated at the same time.

#### Scenario: Attempt to remove last Owner
- **WHEN** an Owner attempts to remove or demote the sole active Owner account
- **THEN** the system refuses the operation with a validation error

#### Scenario: Disabling an offboarded staff member
- **WHEN** an Owner removes a staff member
- **THEN** the system sets staff status to `disabled`, bans the Supabase Auth user via the admin API, and preserves existing foreign key references

#### Scenario: Banned user attempts to access Control Room
- **WHEN** a staff member whose auth user has been banned makes any request to `/api/control-room/*` or `/control-room/(app)/*`
- **THEN** the session is invalid and the request is rejected with HTTP 401 or redirected to login
