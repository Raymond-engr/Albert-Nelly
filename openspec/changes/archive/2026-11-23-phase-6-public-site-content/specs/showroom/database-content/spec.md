# Spec Delta

## Purpose

Enables the public showroom website to dynamically fetch published services, school packages, running costs, selected projects, partner entities, and WhatsApp contact settings from the database while maintaining a seamless fallback to static data files when database connectivity is unavailable.

## ADDED Requirements

### Requirement: Server reader fetches published content
The system SHALL provide a server-only reader function that queries Supabase for published services, school packages, running costs, work items, active partners, and settings.

#### Scenario: Successful query for published services
- **WHEN** the server reader executes
- **THEN** it queries `services` with `published = true` ordered by `position` ascending
- **AND** converts database price objects to display strings using `formatPrice()`
- **AND** maps each row to the Showroom `Service` type

#### Scenario: Successful query for published packages and running costs
- **WHEN** the server reader executes
- **THEN** it queries `packages` ordered by `position` ascending
- **AND** formats package prices as Naira strings
- **AND** queries `running_costs` ordered by `position` ascending

#### Scenario: Successful query for published work items and active partners
- **WHEN** the server reader executes
- **THEN** it queries `work_items` with `published = true` ordered by `position` ascending
- **AND** queries `partners` with `published = true` and `status = 'active'` ordered by `position` ascending

#### Scenario: Successful query for site settings
- **WHEN** the server reader executes
- **THEN** it queries `settings` for `whatsapp_number`
- **AND** falls back to `NEXT_PUBLIC_WA_NUMBER` or `site.whatsappNumber` if unset

### Requirement: Graceful fallback to static files
The server reader SHALL return static default content from `src/data/` if Supabase environment variables are missing, connection times out, or any query throws an exception.

#### Scenario: Supabase connection fails
- **WHEN** Supabase is unreachable or queries fail
- **THEN** the server reader catches the error, logs a server warning, and returns static data from `src/data/`
- **AND** the public homepage renders normally without runtime crashes

### Requirement: Prop-less slot consumption via SiteContentProvider
Showroom slots SHALL consume dynamic content through `useSiteContent()` React context without violating the prop-less slot interface contract.

#### Scenario: Slot renders with database content
- **WHEN** `Showroom` renders with `SiteContentProvider` populated with database content
- **THEN** `Services`, `Schools`, `Work`, `Partners`, and `WhatsAppFab` slots render data from `useSiteContent()`
- **AND** slot component signatures remain prop-less (`() => JSX.Element`)
