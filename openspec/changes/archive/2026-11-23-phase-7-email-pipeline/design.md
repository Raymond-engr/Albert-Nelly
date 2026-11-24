# Design

## Context

The system has database tables ready (`campaigns`, `campaign_recipients`, `birthday_sends`, `leads`), alongside Control Room UI prototypes for drafting, previewing, and scheduling campaigns. However, no outbound delivery pipeline exists, no email provider is connected, and background cron routes are unbuilt.

Phase 7 connects these pieces cleanly using Resend as the delivery provider, React Email for modular template rendering, HMAC-signed links for RFC-compliant one-click unsubscribes, and protected cron endpoints for background automation.

## Goals / Non-Goals

**Goals:**
- Provide a single, swappable email transport module (`src/lib/email.ts`) that safely operates in development/test mode without API keys and routes through Resend in production.
- Deliver typed, responsive email templates (`Welcome`, `Birthday`, `Campaign`) adhering to the 600px email layout and brand color tokens.
- Execute campaign broadcasting with audience resolution (consent, active, non-unsubscribed, distinct by email) and recipient-level status tracking in `campaign_recipients`.
- Provide cron endpoints `/api/cron/send-scheduled` and `/api/cron/birthdays` guarded by `CRON_SECRET`.
- Handle webhook events for delivery/engagement stats and automated bounce/complaint suppression.
- Support one-click HMAC-signed unsubscription (`/unsubscribe?t=<token>`).

**Non-Goals:**
- In-app WYSIWYG drag-and-drop template builder (templates remain typed code components).
- Marketing automation journey builder (Phase 7 focuses strictly on campaigns, birthdays, and welcome triggers).
- Complex contact list segmentation beyond the existing lead `type` tags.

## Decisions

### 1. Delivery Provider Architecture (`src/lib/email.ts`)
- **Decision**: Isolate all provider-specific code inside `src/lib/email.ts`. If `RESEND_API_KEY` is not provided or in testing environment, default to a mock transport that logs dispatches and returns simulated provider IDs (`mock_<timestamp>_<rand>`).
- **Rationale**: Ensures the local test suite, preview environments, and demo setups continue to pass without hard dependency on external API credentials.
- **Alternatives Considered**: Direct calls to Resend SDK throughout route handlers. Rejected because it couples API routes tightly to a single vendor and breaks offline testing.

### 2. Template Rendering with `@react-email/components` & `@react-email/render`
- **Decision**: Author templates as React components in `src/emails/` and compile them to HTML strings using `render()`.
- **Rationale**: Provides type safety, reusable styling, and cross-client email layout compatibility (table layouts, inline styles, fallback fonts). Matches the aesthetic of `EmailPreview.tsx`.
- **Alternatives Considered**: Raw string template literals or MJML. React Email integrates natively with the Next.js and TypeScript stack.

### 3. HMAC-Signed One-Click Unsubscribe Tokens (`src/lib/unsubscribe.ts`)
- **Decision**: Generate tokens by signing `leadId` with HMAC SHA-256 using `UNSUBSCRIBE_SECRET` (`${leadId}.${signature}`).
- **Rationale**: Requires no separate database token table, cannot be tampered with or brute-forced, and works seamlessly with email headers (`List-Unsubscribe: <https://.../unsubscribe?t=...>, <mailto:...>`).
- **Alternatives Considered**: Storing random UUID tokens in the database. Adds unnecessary schema complexity and storage overhead.

### 4. Background Execution & Idempotency
- **Decision**:
  - Scheduled campaigns: Route `/api/cron/send-scheduled` queries campaigns with `status = 'scheduled' AND scheduled_for <= NOW()`, transitions status to `'sending'`, and executes batch dispatches.
  - Birthdays: Route `/api/cron/birthdays` computes date in `Africa/Lagos` timezone. Checks `birthday_sends` for `(lead_id, year)` to ensure runs are strictly idempotent.
  - Security: Protected by `Authorization: Bearer ${CRON_SECRET}` and executed with Supabase admin client (`getAdminClient()`).
- **Rationale**: Guarantees zero double-sends even if the cron scheduler retries or triggers multiple times per day.

### 5. Webhook Processing (`POST /api/webhooks/email`)
- **Decision**: Use provider signature verification to authenticate webhook calls, extracting `campaign_id` and `recipient_id` from tags to record timestamps (`delivered_at`, `opened_at`, `clicked_at`, `bounced_at`).
- **Rationale**: Keeps campaign metrics accurate and immediately unsubscribes bounced or complaining leads.

## Risks / Trade-offs

- **[Risk] Long-running campaign execution timing out on serverless HTTP requests**
  → *Mitigation*: For large audiences, the send route sets status to `sending` and seeds `campaign_recipients`, processing in batches of 100. If batch sizes exceed serverless timeout limits, remaining batches are picked up and drained by the scheduled cron processor.
- **[Risk] Email client rendering quirks (e.g., Outlook, Gmail dark mode)**
  → *Mitigation*: Use web-safe font stacks (`Arial, Helvetica, sans-serif`), explicit inline CSS styles, table structure, and high-contrast color pairings.
- **[Risk] Webhook signature replay attacks**
  → *Mitigation*: Verify webhook timestamp tolerance within 5 minutes and validate provider secret.
