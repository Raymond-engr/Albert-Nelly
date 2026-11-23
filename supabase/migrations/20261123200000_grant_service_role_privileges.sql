-- ============================================================================
-- Hotfix: Grant explicit privileges to service_role on all app tables.
-- PostgREST with the service_role key needs explicit GRANT even though it
-- bypasses RLS — it still needs object-level privileges.
-- ============================================================================

grant usage on schema public to service_role;

grant all on table public.staff              to service_role;
grant all on table public.leads              to service_role;
grant all on table public.lead_submissions   to service_role;
grant all on table public.referrers          to service_role;
grant all on table public.deals              to service_role;
grant all on table public.payments           to service_role;
grant all on table public.services           to service_role;
grant all on table public.packages           to service_role;
grant all on table public.running_costs      to service_role;
grant all on table public.work_items         to service_role;
grant all on table public.partners           to service_role;
grant all on table public.message_templates  to service_role;
grant all on table public.settings           to service_role;
grant all on table public.campaigns          to service_role;
grant all on table public.campaign_recipients to service_role;
grant all on table public.birthday_sends     to service_role;
grant all on table public.activity_log       to service_role;

-- Also grant on sequences if any
grant usage, select on all sequences in schema public to service_role;
