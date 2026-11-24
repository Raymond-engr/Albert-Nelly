# email/delivery-provider Specification

## Purpose
Provides a unified email transport layer that manages provider integration, batch delivery, tracking metadata, and mock transport when credentials are unconfigured.

## Requirements

### Requirement: Email Transport Dispatch
The system SHALL deliver transactional and batch emails via the configured email delivery provider when credentials are present, and log to standard output in mock mode when unconfigured.

#### Scenario: Production delivery with provider credentials
- **WHEN** email delivery is requested and valid provider credentials are configured
- **THEN** the system sends the message via the provider API and returns the provider message identifier

#### Scenario: Fallback mock delivery when unconfigured
- **WHEN** email delivery is requested but provider credentials are absent
- **THEN** the system logs the rendered email headers and body to standard output and returns a mock identifier without throwing an error

### Requirement: Batch Dispatch and Rate Limiting
The system SHALL partition large recipient lists into batches respecting provider limits and include list unsubscribe headers.

#### Scenario: Batching large recipient lists
- **WHEN** a dispatch contains more recipients than the provider batch ceiling
- **THEN** the transport partitions requests into compliant batches and returns combined provider identifiers

#### Scenario: Unsubscribe header attachment
- **WHEN** any outbound campaign or recurring email is generated
- **THEN** the transport attaches standard List-Unsubscribe and List-Unsubscribe-Post headers
