# Proposal: Referral Lifecycle Automation & Commission Visibility

## Why
Currently, the referral lifecycle is fragmented: website submissions from prospective referrers (`type: "refer"`) remain inert leads with no path to become referrers without manual re-entry. Furthermore, incoming client leads have no mechanism to capture referral attribution codes (`?ref=...`), deal conversion fails to carry referrer relationships forward, and commission calculations appear permanently locked at ₦0 across all screens without clear explanation of lifecycle rules or pending/due statuses.

Automating this end-to-end creates a seamless growth flywheel: vetted referrers are promoted in one click, clients arriving via referral links are automatically linked, and finance/owners have crystal-clear visibility into pending versus payable commissions.

## What Changes
- **Lead-to-Referrer Promotion**: Add a one-click "Turn into Referrer" action on `type: "refer"` leads in `LeadDrawer.tsx`, prompting for initial commission rate and automatically creating the referrer record while advancing the lead. Enforce uniqueness on referrer emails to prevent duplicate profiles.
- **Referral Link Attribution**:
  - Provide a dedicated "Copy referral link" (`https://albertnelly.com/?ref=<referrer_id>`) in the Control Room Referrers screen.
  - Update `POST /api/leads` and public Showroom contact forms to capture the `ref` query param and persist referrer attribution on new client leads.
- **Auto-Attribution on Deal Conversion**:
  - Update `convert_lead_to_deal` RPC and `NewDealModal.tsx` to automatically attach the referrer and pre-fill their negotiated commission rate when a referred client converts to a deal.
- **Lifecycle & Commission Clarity**:
  - Enhance `DealDetail`, `ReferrersScreen`, and `Overview` to distinguish between **Accruing / Pending Commission** (for active/in-progress deals) and **Payable / Owed Commission** (for delivered/closed deals).
  - Clarify the business rules directly in the UI so staff understand why commission is pending versus due for payout.

## Capabilities

### New Capabilities
- `control-room/referral-automation`: Covers promoting referrer leads, generating referral links, client lead attribution, and deal-to-referrer commission propagation.

### Modified Capabilities
- `control-room/mutations-api`: Update lead-to-deal conversion and deal update mutations to support referrer linking and commission rate assignment.

## Impact
- **Database**: Add `referrer_id` column to `public.leads` referencing `public.referrers(id)` with index. Update `convert_lead_to_deal` to carry `referrer_id` to `public.deals`.
- **APIs**:
  - `POST /api/leads`: accept optional `referrerId` / `ref` attribution.
  - `POST /api/control-room/leads/[id]/convert-to-referrer`: new endpoint to promote a lead to a referrer.
  - `POST /api/control-room/leads/[id]/convert`: carry referrer and commission rate into deal.
- **UI**: `LeadDrawer.tsx`, `ReferrersScreen.tsx`, `DealDetail.tsx`, `NewDealModal.tsx`, and Showroom contact forms.
