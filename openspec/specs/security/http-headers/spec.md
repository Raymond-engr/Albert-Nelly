# security/http-headers Specification

## Purpose
Governs HTTP response security headers applied to every route in the application, protecting against common browser-based attacks such as MIME sniffing, cross-site scripting, and referrer leakage.

## Requirements

### Requirement: Content-Security-Policy header
The application SHALL include a `Content-Security-Policy` header on every HTTP response that restricts resource origins to self plus explicitly allow-listed external sources.

#### Scenario: CSP present on Showroom page
- **WHEN** a browser requests any public Showroom page
- **THEN** the response includes a `Content-Security-Policy` header

#### Scenario: CSP present on Control Room API response
- **WHEN** a client calls any `/api/control-room/*` endpoint
- **THEN** the response includes a `Content-Security-Policy` header

### Requirement: X-Content-Type-Options header
The application SHALL include `X-Content-Type-Options: nosniff` on every HTTP response to prevent MIME-type sniffing.

#### Scenario: Header present on static asset response
- **WHEN** a browser fetches any application route or asset
- **THEN** the response contains `X-Content-Type-Options: nosniff`

### Requirement: Referrer-Policy header
The application SHALL include `Referrer-Policy: strict-origin-when-cross-origin` on every HTTP response to limit referrer data sent to external origins.

#### Scenario: Header present on cross-origin navigation
- **WHEN** a user navigates from the Showroom to an external URL
- **THEN** the browser sends only the origin (not path or query string) in the Referer header

### Requirement: Permissions-Policy header
The application SHALL include a `Permissions-Policy` header on every HTTP response that disables browser features not required by the application.

#### Scenario: Sensitive feature APIs disabled
- **WHEN** a page is loaded in the browser
- **THEN** the `Permissions-Policy` header restricts access to camera, microphone, and geolocation
