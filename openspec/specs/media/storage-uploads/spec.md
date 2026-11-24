# media/storage-uploads Specification

## Purpose
Provides a secure upload preparation endpoint that validates file metadata, enforces size budgets and allowed MIME types, and returns signed storage upload URLs.

## Requirements

### Requirement: Upload URL Generation
The system SHALL provide an authorized endpoint that validates asset metadata and returns a signed upload URL for direct client-to-storage upload.

#### Scenario: Successful signed URL creation for valid screenshot
- **WHEN** an authorized staff member requests an upload URL for a valid image (WebP, PNG, or JPEG) under 500 KB
- **THEN** the system returns a signed upload URL and designated storage path (`work/<id>.webp`)

#### Scenario: Successful signed URL creation for valid logo
- **WHEN** an authorized staff member requests an upload URL for a partner logo (SVG, WebP, or PNG) under 100 KB
- **THEN** the system returns a signed upload URL and designated storage path (`partners/<id>.<ext>`)

### Requirement: File Constraints Enforcement
The system SHALL reject upload requests that violate allowed MIME types or exceed file size constraints.

#### Scenario: File exceeds maximum allowed size
- **WHEN** an upload request specifies a file size exceeding 500 KB for screenshots or 100 KB for logos
- **THEN** the system rejects the request with HTTP 400 and an explanatory error message

#### Scenario: Disallowed file type
- **WHEN** an upload request specifies an unsupported format (e.g. GIF, PDF, or executable)
- **THEN** the system rejects the request with HTTP 400
