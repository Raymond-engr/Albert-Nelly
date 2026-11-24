# security/rate-limiting Specification

## Purpose
Protects the public lead-registration endpoint from automated abuse by enforcing a per-IP sliding-window request limit, complementing the existing honeypot and input-validation defenses.

## Requirements

### Requirement: IP-keyed sliding-window rate limit on lead registration
The system SHALL reject `POST /api/leads` requests from an IP address that exceed the configured maximum within the configured time window, returning HTTP 429.

#### Scenario: Request within limit
- **WHEN** an IP address submits fewer requests than `RATE_LIMIT_MAX` within `RATE_LIMIT_WINDOW_MS`
- **THEN** the request is processed normally

#### Scenario: Request exceeding limit
- **WHEN** an IP address submits more requests than `RATE_LIMIT_MAX` within `RATE_LIMIT_WINDOW_MS`
- **THEN** the system responds with HTTP 429 and a `Retry-After` header indicating when the window resets

### Requirement: Configurable rate-limit parameters
The system SHALL read rate-limit thresholds from environment variables `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`, falling back to safe defaults when these variables are absent.

#### Scenario: Variables unset
- **WHEN** `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` are not defined in the environment
- **THEN** the limiter applies defaults of 10 requests per 60-second window

#### Scenario: Variables set
- **WHEN** both variables are present and parse as positive integers
- **THEN** the limiter uses those values instead of the defaults
