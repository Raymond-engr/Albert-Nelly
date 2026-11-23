# Proposal

## Why

The Control Room currently prototypes campaign composition, birthday views, and templates in memory and in database records, but cannot deliver emails, track engagement, automate scheduled broadcasts, send birthday greetings, or process unsubscribes. Implementing Phase 7 completes the transactional and marketing email loop described in `docs/CONTROL_ROOM_HANDOVER.md` (Section 11), connecting campaign management to a real email delivery service (Resend) with compliance safeguards (consent verification, rate-limiting, and one-click unsubscribe).

## What Changes

- **Email Provider Abstraction (`src/lib/email.ts`)**: Modular client supporting batch delivery, provider tags, header customization (`List-Unsubscribe`), and fallback mock/dry-run mode when credentials (`RESEND_API_KEY`) are missing.
- **Typed Responsive Email Templates (`src/emails/`)**: Implement `@react-email/components` templates for `Welcome` (new lead registration), `Birthday` (discount voucher + partner card showcase), and `Campaign` (marketing broadcast matching `EmailPreview.tsx`).
- **Campaign Execution Engine**: Upgrade `POST /api/control-room/campaigns/[id]/send` to resolve eligible leads (consented, non-unsubscribed, matching audience types), record recipient rows in `campaign_recipients`, and deliver in batches with message tags.
- **Automated Cron Jobs (`src/app/api/cron/`)**:
  - `/api/cron/send-scheduled`: Periodically queries and dispatches campaigns whose `scheduled_for <= now()`.
  - `/api/cron/birthdays`: Daily execution at 07:00 Lagos time (06:00 UTC) dispatching birthday greetings idempotently via `birthday_sends`.
  - Protected via `Authorization: Bearer ${CRON_SECRET}`.
- **Delivery Webhook & Tracking (`POST /api/webhooks/email`)**: Validates provider signature and updates delivery status (`delivered_at`, `opened_at`, `clicked_at`, `bounced_at`) or marks leads as unsubscribed on spam complaint/hard bounce.
- **One-Click Unsubscribe Flow (`/unsubscribe`)**: HMAC-signed token generator and handler (`UNSUBSCRIBE_SECRET`) enabling single-click instant unsubscription with a user-friendly status page.
- **Welcome Trigger**: Dispatches the Welcome template upon new lead registration (`POST /api/leads`).

## Capabilities

### New Capabilities

- `email/delivery-provider`: Provider abstraction (`src/lib/email.ts`) wrapping Resend/mock transport, batch dispatch, metadata tagging, and delivery error handling.
- `email/templates`: React Email component templates (`Welcome`, `Birthday`, `Campaign`) adhering to 600px mobile-responsive table layout and brand guidelines.
- `email/campaign-execution`: Campaign recipient resolution, batch sending, and recipient status tracking.
- `email/cron-automation`: Secure cron endpoints for scheduled campaign dispatching and daily birthday greetings.
- `email/webhooks-and-unsubscribe`: Webhook event listener for delivery analytics and HMAC-secured one-click unsubscribe endpoint.

### Modified Capabilities

<!-- None: Existing specs in openspec/specs/ cover showroom and control-room core CRUD/auth/realtime/logging, but have no existing email delivery requirements. -->

## Impact

- **Dependencies**: Add `resend` and `@react-email/components` (and `@react-email/render`).
- **Control Room**:
  - `POST /api/control-room/campaigns/[id]/send` executes real email dispatches and populates `campaign_recipients`.
  - Campaign metrics ("delivered", "opened", "clicked") reflect webhook updates.
- **Showroom / Public**:
  - `POST /api/leads` triggers a Welcome email for opt-in registrations.
  - New public route `/unsubscribe` provides one-click unsubscription.
- **Database**:
  - Queries and updates rows in existing tables: `campaign_recipients`, `birthday_sends`, `campaigns`, and `leads`.
- **Environment**:
  - Introduces `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_WEBHOOK_SECRET`, `UNSUBSCRIBE_SECRET`, and `CRON_SECRET`.
