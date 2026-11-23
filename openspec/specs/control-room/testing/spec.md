# control-room/testing Specification

## Purpose
Establishes an automated testing harness for the Control Room to verify authorization rules, mutation API contracts, and client HTTP state seams without requiring active external network connections.

## Requirements

### Requirement: Route Guard and Role Authorization Testing
The test suite must verify that the server guard correctly enforces authentication, session validity, and role permissions.

#### Scenario: Reject unauthenticated requests
- **WHEN** a request is made to a protected Control Room API route without a valid session
- **THEN** the guard MUST throw an HttpError with status 401 ("Sign in to continue.")

#### Scenario: Reject non-admin access to admin-only routes
- **WHEN** a authenticated staff member with role `staff` attempts to access admin-restricted routes (team mutations, system settings)
- **THEN** the guard MUST throw an HttpError with status 403 ("Admin access required.")

#### Scenario: Permit authorized roles to access permitted endpoints
- **WHEN** an authenticated staff member with role `admin` or permitted role calls a mutation endpoint
- **THEN** the guard MUST permit execution and provide the authenticated staff context

### Requirement: Mutation Route Handler Contract Verification
The test suite must verify that Route Handlers validate incoming payloads and return consistent HTTP error codes.

#### Scenario: Validate request payloads and return 400 on invalid input
- **WHEN** a mutation route receives missing required fields or invalid types
- **THEN** the route MUST return HTTP 400 with a descriptive error message

#### Scenario: Return updated entity on successful mutation
- **WHEN** a valid mutation request is processed
- **THEN** the route MUST return HTTP 200 with the mutated record and ok status

### Requirement: Client HTTP Layer and Error Handling Verification
The test suite must verify that `call<T>()` correctly parses error responses and propagates errors to UI callers.

#### Scenario: Parse and extract structured ApiError on non-ok responses
- **WHEN** an API endpoint returns an error payload `{ ok: false, error: "Custom error message" }` with a non-2xx status
- **THEN** `call<T>()` MUST throw an `ApiError` with the status code and extracted message

#### Scenario: Handle network and unexpected failures gracefully
- **WHEN** `fetch` encounters a network error or non-JSON body
- **THEN** `call<T>()` MUST throw an `ApiError` with status 500 and a fallback error message
