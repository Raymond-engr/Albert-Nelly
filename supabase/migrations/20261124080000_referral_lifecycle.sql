-- ============================================================================
-- Referral Lifecycle: Lead Attribution, Unique Referrer Emails, and RPC update
-- ============================================================================

-- 1. Add referrer_id to leads table
alter table public.leads
  add column if not exists referrer_id uuid references public.referrers(id) on delete set null;

create index if not exists leads_referrer_idx on public.leads (referrer_id);

-- 2. Add case-insensitive unique index on referrers email
create unique index if not exists referrers_lower_email_idx on public.referrers (lower(email));

-- 3. Update convert_lead_to_deal RPC to support optional referrer_id and commission_rate
create or replace function public.convert_lead_to_deal(
  p_lead uuid,
  p_title text,
  p_client text,
  p_service text,
  p_agreed bigint,
  p_referrer_id uuid default null,
  p_commission_rate numeric(5,2) default null
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_lead record;
  v_deal_id uuid;
  v_user_id uuid;
  v_ref_id uuid;
  v_comm_rate numeric(5,2);
  v_default_rate numeric(5,2);
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

  -- Determine effective referrer_id: explicit param or lead's existing referrer
  v_ref_id := coalesce(p_referrer_id, v_lead.referrer_id);

  -- Determine effective commission rate if referrer is present
  if v_ref_id is not null then
    if p_commission_rate is not null then
      v_comm_rate := p_commission_rate;
    else
      select rate into v_default_rate from public.referrers where id = v_ref_id;
      v_comm_rate := coalesce(v_default_rate, 10.00);
    end if;
  else
    v_comm_rate := null;
  end if;

  insert into public.deals (title, client, service, lead_id, agreed, owner_id, referrer_id, commission_rate)
  values (p_title, p_client, p_service, p_lead, p_agreed, v_user_id, v_ref_id, v_comm_rate)
  returning id into v_deal_id;

  update public.leads
  set status = 'deal', deal_id = v_deal_id
  where id = p_lead;

  perform public.log_activity('Turned a lead into a deal', p_client);

  return v_deal_id;
end;
$$;
