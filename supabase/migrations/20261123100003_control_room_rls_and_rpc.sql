-- ============================================================================
-- Phase 2: Row Level Security Policies and Atomic RPC Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enable Row Level Security on All Tables
-- ----------------------------------------------------------------------------
alter table public.leads enable row level security;
alter table public.lead_submissions enable row level security;
alter table public.referrers enable row level security;
alter table public.deals enable row level security;
alter table public.payments enable row level security;
alter table public.services enable row level security;
alter table public.packages enable row level security;
alter table public.running_costs enable row level security;
alter table public.work_items enable row level security;
alter table public.partners enable row level security;
alter table public.message_templates enable row level security;
alter table public.settings enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.birthday_sends enable row level security;
alter table public.activity_log enable row level security;

-- ----------------------------------------------------------------------------
-- 2. Row Level Security Policies
-- ----------------------------------------------------------------------------

-- Leads & Submissions
create policy "leads read" on public.leads for select to authenticated
  using (public.has_role(array['owner', 'sales', 'content']::public.staff_role[]));

create policy "leads update" on public.leads for update to authenticated
  using (public.has_role(array['owner', 'sales']::public.staff_role[]))
  with check (public.has_role(array['owner', 'sales']::public.staff_role[]));

create policy "lead submissions read" on public.lead_submissions for select to authenticated
  using (public.has_role(array['owner', 'sales', 'content']::public.staff_role[]));

-- Referrers
create policy "referrers read" on public.referrers for select to authenticated
  using (public.has_role(array['owner', 'finance', 'sales']::public.staff_role[]));

create policy "referrers write" on public.referrers for all to authenticated
  using (public.has_role(array['owner', 'finance']::public.staff_role[]))
  with check (public.has_role(array['owner', 'finance']::public.staff_role[]));

-- Deals
create policy "deals read" on public.deals for select to authenticated
  using (public.has_role(array['owner', 'finance', 'sales']::public.staff_role[]));

create policy "deals write" on public.deals for all to authenticated
  using (public.has_role(array['owner', 'finance', 'sales']::public.staff_role[]))
  with check (public.has_role(array['owner', 'finance', 'sales']::public.staff_role[]));

-- Payments
create policy "payments read" on public.payments for select to authenticated
  using (public.has_role(array['owner', 'finance']::public.staff_role[]));

create policy "payments insert" on public.payments for insert to authenticated
  with check (public.has_role(array['owner', 'finance']::public.staff_role[]));

-- Services
create policy "services staff read" on public.services for select to authenticated
  using (public.has_role(array['owner', 'finance', 'sales', 'content']::public.staff_role[]));

create policy "services public read" on public.services for select to anon
  using (published = true);

create policy "services write" on public.services for all to authenticated
  using (public.has_role(array['owner', 'finance']::public.staff_role[]))
  with check (public.has_role(array['owner', 'finance']::public.staff_role[]));

-- School Packages
create policy "packages staff read" on public.packages for select to authenticated
  using (public.has_role(array['owner', 'finance', 'sales', 'content']::public.staff_role[]));

create policy "packages public read" on public.packages for select to anon
  using (true);

create policy "packages write" on public.packages for all to authenticated
  using (public.has_role(array['owner', 'finance']::public.staff_role[]))
  with check (public.has_role(array['owner', 'finance']::public.staff_role[]));

-- School Running Costs
create policy "costs staff read" on public.running_costs for select to authenticated
  using (public.has_role(array['owner', 'finance', 'sales', 'content']::public.staff_role[]));

create policy "costs public read" on public.running_costs for select to anon
  using (true);

create policy "costs write" on public.running_costs for all to authenticated
  using (public.has_role(array['owner', 'finance']::public.staff_role[]))
  with check (public.has_role(array['owner', 'finance']::public.staff_role[]));

-- Work Items
create policy "work staff read" on public.work_items for select to authenticated
  using (public.has_role(array['owner', 'finance', 'sales', 'content']::public.staff_role[]));

create policy "work public read" on public.work_items for select to anon
  using (published = true);

create policy "work write" on public.work_items for all to authenticated
  using (public.has_role(array['owner', 'content']::public.staff_role[]))
  with check (public.has_role(array['owner', 'content']::public.staff_role[]));

-- Partners
create policy "partners staff read" on public.partners for select to authenticated
  using (public.has_role(array['owner', 'finance', 'sales', 'content']::public.staff_role[]));

create policy "partners public read" on public.partners for select to anon
  using (published = true and status = 'active');

create policy "partners write" on public.partners for all to authenticated
  using (public.has_role(array['owner', 'content']::public.staff_role[]))
  with check (public.has_role(array['owner', 'content']::public.staff_role[]));

-- Message Templates
create policy "templates read" on public.message_templates for select to authenticated
  using (public.has_role(array['owner', 'content']::public.staff_role[]));

create policy "templates write" on public.message_templates for all to authenticated
  using (public.has_role(array['owner']::public.staff_role[]))
  with check (public.has_role(array['owner']::public.staff_role[]));

-- Settings
create policy "settings read" on public.settings for select to authenticated
  using (public.has_role(array['owner']::public.staff_role[]));

create policy "settings write" on public.settings for all to authenticated
  using (public.has_role(array['owner']::public.staff_role[]))
  with check (public.has_role(array['owner']::public.staff_role[]));

-- Campaigns & Recipients
create policy "campaigns read" on public.campaigns for select to authenticated
  using (public.has_role(array['owner', 'sales', 'content']::public.staff_role[]));

create policy "campaigns write" on public.campaigns for all to authenticated
  using (public.has_role(array['owner', 'content']::public.staff_role[]))
  with check (public.has_role(array['owner', 'content']::public.staff_role[]));

create policy "recipients read" on public.campaign_recipients for select to authenticated
  using (public.has_role(array['owner', 'sales', 'content']::public.staff_role[]));

create policy "recipients write" on public.campaign_recipients for all to authenticated
  using (public.has_role(array['owner', 'content']::public.staff_role[]))
  with check (public.has_role(array['owner', 'content']::public.staff_role[]));

create policy "birthdays read" on public.birthday_sends for select to authenticated
  using (public.has_role(array['owner', 'sales', 'content']::public.staff_role[]));

create policy "birthdays write" on public.birthday_sends for all to authenticated
  using (public.has_role(array['owner', 'content']::public.staff_role[]))
  with check (public.has_role(array['owner', 'content']::public.staff_role[]));

-- Activity Log
create policy "activity read" on public.activity_log for select to authenticated
  using (public.has_role(array['owner', 'finance']::public.staff_role[]));

-- ----------------------------------------------------------------------------
-- 3. Atomic RPC Functions
-- ----------------------------------------------------------------------------

-- Log Activity Function
create or replace function public.log_activity(p_action text, p_target text default '') returns void
language plpgsql security definer set search_path = public as $$
declare
  v_staff record;
begin
  select id, name into v_staff from public.staff where id = (select auth.uid());
  if v_staff.id is not null then
    insert into public.activity_log (actor_id, actor_name, action, target)
    values (v_staff.id, v_staff.name, p_action, p_target);
  end if;
end;
$$;

revoke all on function public.log_activity(text, text) from public, anon;
grant execute on function public.log_activity(text, text) to authenticated;

-- Convert Lead to Deal Function
create or replace function public.convert_lead_to_deal(
  p_lead uuid,
  p_title text,
  p_client text,
  p_service text,
  p_agreed bigint
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_lead record;
  v_deal_id uuid;
  v_user_id uuid;
begin
  if not public.has_role(array['owner', 'sales']::public.staff_role[]) then
    raise exception 'Permission denied: role cannot convert leads to deals';
  end if;

  v_user_id := (select auth.uid());

  select * into v_lead from public.leads where id = p_lead for update;
  if not found then
    raise exception 'Lead not found';
  end if;
  if v_lead.deal_id is not null then
    raise exception 'Lead is already converted to a deal';
  end if;

  insert into public.deals (title, client, service, lead_id, agreed, owner_id)
  values (p_title, p_client, p_service, p_lead, p_agreed, v_user_id)
  returning id into v_deal_id;

  update public.leads
  set status = 'deal', deal_id = v_deal_id
  where id = p_lead;

  perform public.log_activity('Turned a lead into a deal', p_client);

  return v_deal_id;
end;
$$;

-- Record Payment Function
create or replace function public.record_payment(
  p_deal uuid,
  p_direction public.payment_direction,
  p_amount bigint,
  p_category public.payment_category,
  p_note text,
  p_paid_on date
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_user_id uuid;
  v_payment_id uuid;
  v_deal record;
begin
  if not public.has_role(array['owner', 'finance']::public.staff_role[]) then
    raise exception 'Permission denied: role cannot record payments';
  end if;

  v_user_id := (select auth.uid());

  select client into v_deal from public.deals where id = p_deal;
  if not found then
    raise exception 'Deal not found';
  end if;

  insert into public.payments (deal_id, direction, amount, category, note, paid_on, recorded_by)
  values (p_deal, p_direction, p_amount, p_category, p_note, p_paid_on, v_user_id)
  returning id into v_payment_id;

  perform public.log_activity('Recorded a payment', v_deal.client);

  return v_payment_id;
end;
$$;

-- Set Featured Package Function
create or replace function public.set_featured_package(p_id uuid) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if not public.has_role(array['owner', 'finance']::public.staff_role[]) then
    raise exception 'Permission denied: role cannot modify school packages';
  end if;

  update public.packages set featured = false where featured = true and id <> p_id;
  update public.packages set featured = true where id = p_id;
end;
$$;
