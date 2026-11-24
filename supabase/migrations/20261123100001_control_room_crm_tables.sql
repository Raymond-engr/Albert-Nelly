-- ============================================================================
-- Phase 2: CRM Tables, Extensions, and Append-Only Financial Ledgers
-- ============================================================================

-- Referrers Table
create table public.referrers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  whatsapp text not null,
  rate numeric(5,2) not null check (rate between 0 and 100),
  status text not null default 'active' check (status in ('active', 'paused')),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger referrers_touch before update on public.referrers
  for each row execute function public.touch_updated_at();

-- Deals Table
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client text not null,
  service text not null,
  lead_id uuid references public.leads(id) on delete set null,
  stage public.deal_stage not null default 'new',
  agreed bigint not null default 0 check (agreed >= 0),
  referrer_id uuid references public.referrers(id) on delete set null,
  commission_rate numeric(5,2) check (commission_rate between 0 and 100),
  owner_id uuid not null references public.staff(id),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deals_stage_idx on public.deals (stage, updated_at desc);

create trigger deals_touch before update on public.deals
  for each row execute function public.touch_updated_at();

-- Extend Existing Leads Table
alter table public.leads
  add column if not exists status public.lead_status not null default 'new',
  add column if not exists source text not null default 'Unknown',
  add column if not exists notes text not null default '',
  add column if not exists tags text[] not null default '{}',
  add column if not exists owner_id uuid references public.staff(id) on delete set null,
  add column if not exists deal_id uuid references public.deals(id) on delete set null,
  add column if not exists referrer_id uuid references public.referrers(id) on delete set null,
  add column if not exists consent_at timestamptz,
  add column if not exists unsubscribed_at timestamptz;

create index if not exists leads_status_idx on public.leads (status, created_at desc);

-- Lead Submissions History Table
create table public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null,
  service text,
  context text,
  source text,
  created_at timestamptz not null default now()
);

-- Payments Table (Append-Only)
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete restrict,
  direction public.payment_direction not null,
  amount bigint not null check (amount > 0),
  category public.payment_category not null,
  note text not null default '',
  paid_on date not null,
  recorded_by uuid not null references public.staff(id),
  created_at timestamptz not null default now()
);

-- Immutability Trigger for Append-Only Ledgers
create or replace function public.forbid_change() returns trigger language plpgsql as $$
begin
  raise exception 'This table is append-only. Record a correcting entry instead.';
end $$;

drop trigger if exists payments_append_only on public.payments;
create trigger payments_append_only before update or delete on public.payments
  for each row execute function public.forbid_change();
