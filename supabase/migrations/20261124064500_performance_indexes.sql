-- ============================================================================
-- Performance: Add indexes for audit log, CRM relationships, and lookup queries
-- ============================================================================

-- Activity Log timestamps (used for dashboard feeds and recent audits)
create index if not exists activity_log_at_idx on public.activity_log (at desc);
create index if not exists activity_log_actor_idx on public.activity_log (actor_id, at desc);

-- Deals foreign keys
create index if not exists deals_owner_idx on public.deals (owner_id);
create index if not exists deals_lead_idx on public.deals (lead_id);
create index if not exists deals_referrer_idx on public.deals (referrer_id);

-- Payments relationships and ledger ordering
create index if not exists payments_deal_idx on public.payments (deal_id);
create index if not exists payments_paid_on_idx on public.payments (paid_on desc);
create index if not exists payments_recorded_by_idx on public.payments (recorded_by);

-- Submissions and Campaign relationships
create index if not exists lead_submissions_lead_idx on public.lead_submissions (lead_id, created_at desc);
create index if not exists campaign_recipients_lead_idx on public.campaign_recipients (lead_id);
create index if not exists birthday_sends_year_idx on public.birthday_sends (year);

-- Ensure created_at exists on campaigns
alter table public.campaigns add column if not exists created_at timestamptz not null default now();

-- Allow staff to update their own presence timestamp
drop policy if exists "staff update self presence" on public.staff;
create policy "staff update self presence" on public.staff
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Grant select on running_costs to anon for the public Showroom site
grant select on table public.running_costs to anon;


