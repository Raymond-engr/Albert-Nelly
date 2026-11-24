# security/structured-logging Specification

## Purpose
Provides a consistent, structured error-logging interface for all server-side route handlers and cron routes, replacing ad-hoc `console.error` calls and enabling log aggregation in Vercel Logs and optional forwarding to external error-tracking services.

## Requirements

### Requirement: Structured JSON error output
The logger SHALL emit error events as single-line JSON objects to stdout, including at minimum the keys `level`, `message`, `timestamp`, and any additional context passed by the caller.

#### Scenario: Error logged in route handler
- **WHEN** a route handler catches an unexpected error and calls `logger.error(message, context)`
- **THEN** a JSON line appears in stdout containing `"level":"error"`, `"message"`, and `"timestamp"`

### Requirement: Optional Sentry forwarding
When `SENTRY_DSN` is set in the environment, the logger SHALL forward error events to the configured Sentry project without blocking the response.

#### Scenario: SENTRY_DSN absent
- **WHEN** `SENTRY_DSN` is not set
- **THEN** the logger writes to stdout only; no Sentry call is made

#### Scenario: SENTRY_DSN present
- **WHEN** `SENTRY_DSN` is set and an error is logged
- **THEN** the logger forwards the event to Sentry in addition to writing to stdout
