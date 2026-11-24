# Design: Referral Lifecycle Automation & Commission Visibility

## Architectural Overview

This design connects prospective referrers, referral attribution links, lead conversion, and financial commission calculations into an end-to-end automated workflow.

```
[Public Website]
  │
  ├── 1. "Become a referrer" Form ──────────> public.leads (type: "refer")
  │                                                  │
  │                                                  │ [One-click: Turn into Referrer]
  │                                                  ▼
  │                                             public.referrers (active)
  │                                                  │
  │                                                  │ Unique Link: ?ref=<referrer_id>
  │                                                  ▼
  ├── 2. Client lands via ?ref=<id> & submits ─> public.leads (type: "hire", referrer_id: <id>)
                                                     │
                                                     │ [Convert to Deal]
                                                     ▼
                                                public.deals (referrer_id, commission_rate)
                                                     │
                                                     │ [Stage: in_progress -> delivered]
                                                     ▼
                                                dealBalance():
                                                  commissionDue > 0
                                                  commissionOwed > 0 (Payable)
```

## Data Schema Changes

1. **`public.leads`**:
   - Add `referrer_id uuid references public.referrers(id) on delete set null`.
   - Index on `leads(referrer_id)`.
2. **`public.referrers`**:
   - Add case-insensitive unique constraint or index on `lower(email)`: `create unique index referrers_lower_email_idx on public.referrers (lower(email));`.
3. **`convert_lead_to_deal` RPC**:
   - Accept optional `p_referrer_id uuid` and `p_commission_rate numeric(5,2)`.
   - Default `p_referrer_id` to `lead.referrer_id` if omitted.
   - If `p_referrer_id` is set, look up default `referrers.rate` if `p_commission_rate` is null.

## API Changes

1. **`POST /api/control-room/leads/[id]/convert-to-referrer`**:
   - Guard: `requireStaff("referrers", "edit")`.
   - Validate that lead exists and `lead.type === "refer"`.
   - Insert row in `public.referrers` with `lead.name`, `lead.email`, `lead.whatsapp`, and provided `rate` (defaulting to `settings.commissionMin` or fallback).
   - Mark lead as `status = "contacted"`.
   - Log activity: `"Promoted lead to referrer"`.
2. **`POST /api/leads`**:
   - Accept optional `ref` in payload.
   - Verify `ref` is a valid UUID matching an active referrer; if so, assign `referrer_id: ref`.
3. **`POST /api/control-room/leads/[id]/convert`**:
   - Accept `referrerId` and `commissionRate` in request body.
   - Pass them to updated `convert_lead_to_deal` RPC.

## UI / UX Enhancements

1. **Lead Drawer (`LeadDrawer.tsx`)**:
   - For `lead.type === "refer"`, add **"Promote to Referrer"** button with a modal to confirm initial commission rate.
2. **Referrers Screen (`ReferrersScreen.tsx`)**:
   - In `ReferrerDetail`, add a **Referral link generator & Copy button**: `https://albertnelly.com/?ref=${referrer.id}`.
   - Show introduced leads list and introduced deals list.
3. **New Deal Modal (`NewDealModal.tsx`)**:
   - If lead has `referrerId`, pre-select the referrer dropdown and commission rate field.
4. **Metrics & Commission Clarity (`dealBalance` & `DealDetail.tsx`)**:
   - Expand `dealBalance` output to include `commissionPending` (accrued for active deals before `delivered`/`closed`) vs `commissionOwed` (payable once delivered/closed).
   - Add inline badges explaining stage status: *"Pending delivery"* vs *"Payable now"*.

## Security & Role Constraints
- Only `owner` and `finance` can edit or view commission amounts and payouts.
- Public `/api/leads` validates `ref` cleanly without exposing internal DB error details.
