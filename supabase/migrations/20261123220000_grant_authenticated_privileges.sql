-- ============================================================================
-- Grant table privileges to `authenticated` and `anon` roles.
-- RLS policies require underlying table privileges before row-level rules apply.
-- ============================================================================

grant usage on schema public to authenticated, anon;

-- Authenticated staff permissions (RLS controls row access based on role & aal2)
grant all on table public.staff to authenticated;
grant all on table public.leads to authenticated;
grant all on table public.lead_submissions to authenticated;
grant all on table public.referrers to authenticated;
grant all on table public.deals to authenticated;
grant all on table public.payments to authenticated;
grant all on table public.services to authenticated;
grant all on table public.packages to authenticated;
grant all on table public.running_costs to authenticated;
grant all on table public.work_items to authenticated;
grant all on table public.partners to authenticated;
grant all on table public.message_templates to authenticated;
grant all on table public.settings to authenticated;
grant all on table public.campaigns to authenticated;
grant all on table public.campaign_recipients to authenticated;
grant all on table public.birthday_sends to authenticated;
grant all on table public.activity_log to authenticated;

-- Public Showroom read/lead generation access
grant select on table public.services to anon;
grant select on table public.packages to anon;
grant select on table public.partners to anon;
grant select on table public.work_items to anon;
grant insert on table public.leads to anon;
grant insert on table public.lead_submissions to anon;

-- Sequences
grant usage, select on all sequences in schema public to authenticated, anon;
