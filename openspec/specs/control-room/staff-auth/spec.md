# control-room/staff-auth Specification

## Purpose
Enforces invite-only access, TOTP Two-Factor Authentication (MFA), session verification, and role guards for agency staff accessing the Control Room.

## Requirements

### Requirement: Invite-only staff enrollment
The system SHALL permit only active Owners to invite new staff members and SHALL reject public self-service account registration.

#### Scenario: Owner invites new team member
- **WHEN** an authenticated Owner submits a valid name, email, and staff role to the team endpoint
- **THEN** the system provisions an invited staff account and sends an invite link to the recipient email

#### Scenario: Non-owner attempts invitation
- **WHEN** a non-owner staff member attempts to send an invitation
- **THEN** the system rejects the request with HTTP 403 Forbidden

### Requirement: Mandatory TOTP Two-Factor Authentication
The system SHALL require all staff users to enroll and verify an authenticator app (TOTP) and attain assurance level aal2 before accessing any protected Control Room data or routes.

#### Scenario: First sign-in without MFA factor
- **WHEN** a staff user authenticates with email and password without an enrolled TOTP factor
- **THEN** the system directs the user to `/control-room/mfa` for QR code enrollment and verification

#### Scenario: Request with insufficient assurance level
- **WHEN** a user with a session at assurance level aal1 attempts to access `/control-room/(app)/*` or `/api/control-room/*`
- **THEN** the system denies access with HTTP 401 Unauthorized or redirects to the second-step MFA challenge

### Requirement: Session verification and token refresh
The system SHALL intercept Control Room web and API requests, validate the user session with Supabase on the server, and write refreshed cookies onto the response.

#### Scenario: Unauthenticated request to Control Room
- **WHEN** an unauthenticated visitor requests any path under `/control-room/*`
- **THEN** the system redirects the request to `/control-room/login`

#### Scenario: Valid verified staff session
- **WHEN** an authenticated staff member with a verified aal2 session visits a Control Room page
- **THEN** the system allows access and attaches refreshed session tokens to the response

### Requirement: Role-based server guard
The system SHALL verify that the authenticated staff account has status active and possesses the required permissions in the target area before processing the request.

#### Scenario: Staff with sufficient role permissions
- **WHEN** an active staff member requests an authorized area or action according to the role permissions matrix
- **THEN** the system grants access and processes the operation

#### Scenario: Staff with insufficient role permissions
- **WHEN** a staff member attempts an operation or area restricted for their role
- **THEN** the system rejects the request with HTTP 403 Forbidden

### Requirement: Staff offboarding and last owner protection
The system SHALL prevent removing or demoting the last active Owner and SHALL disable staff accounts rather than deleting historical database records.

#### Scenario: Attempt to remove last Owner
- **WHEN** an Owner attempts to remove or demote the sole active Owner account
- **THEN** the system refuses the operation with a validation error

#### Scenario: Disabling an offboarded staff member
- **WHEN** an Owner removes a staff member
- **THEN** the system sets staff status to disabled and bans the auth user while preserving existing foreign key references
