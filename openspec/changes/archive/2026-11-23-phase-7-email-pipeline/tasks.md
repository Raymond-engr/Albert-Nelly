# Tasks

## 1. Transport Layer & Unsubscribe Token Signing

- [x] 1.1 Install `resend`, `@react-email/components`, and `@react-email/render` dependencies; verify installation in `package.json`
- [x] 1.2 Implement `src/lib/unsubscribe.ts` with HMAC SHA-256 token generation and verification; verify unit tests in `tests/email/unsubscribe.test.ts`
- [x] 1.3 Implement `src/lib/email.ts` provider abstraction with Resend integration, mock fallback, batching, and `List-Unsubscribe` headers; verify unit tests in `tests/email/transport.test.ts`

## 2. React Email Templates & Welcome Trigger

- [x] 2.1 Create responsive email templates in `src/emails/`: `Welcome.tsx`, `Birthday.tsx`, and `Campaign.tsx` adhering to 600px mobile-first layout; verify template rendering tests in `tests/email/templates.test.ts`
- [x] 2.2 Wire Welcome email trigger into `src/app/api/leads/route.ts` via `after()` for opt-in registrations; verify lead registration test

## 3. Campaign Execution & Webhooks

- [x] 3.1 Upgrade `POST /api/control-room/campaigns/[id]/send` to resolve consented/active leads, populate `campaign_recipients`, dispatch in batches with message tags, and update campaign status to `sent`; verify campaign send test
- [x] 3.2 Implement `POST /api/webhooks/email` to verify provider signatures, update `campaign_recipients` / `birthday_sends` timestamps (`delivered_at`, `opened_at`, `clicked_at`, `bounced_at`), and unsubscribe bounced leads; verify webhook test
- [x] 3.3 Implement `/unsubscribe` public route and confirmation page to validate token and update `leads.unsubscribed_at`; verify unsubscribe flow test

## 4. Background Cron Automation

- [x] 4.1 Implement `/api/cron/send-scheduled` route guarded by `Authorization: Bearer ${CRON_SECRET}` to drain scheduled campaigns; verify scheduled cron test
- [x] 4.2 Implement `/api/cron/birthdays` route guarded by `Authorization: Bearer ${CRON_SECRET}` to idempotently greet leads celebrating birthdays today in `Africa/Lagos` timezone; verify birthday cron test

## 5. Verification & Validation

- [x] 5.1 Run `npm run typecheck` to verify no TypeScript regressions across Showroom and Control Room
- [x] 5.2 Run `npm run lint` to verify zero ESLint errors
- [x] 5.3 Run `npm test -- --run` to verify all test suites pass cleanly
- [x] 5.4 Run `npm run build` to confirm static and dynamic pages build cleanly with Next.js 16
