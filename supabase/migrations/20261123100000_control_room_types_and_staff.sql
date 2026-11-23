-- ============================================================================
-- Phase 2: Control Room Types, Staff Table, and Permission Helpers
-- ============================================================================

-- Custom Enums
create type public.staff_role as enum ('owner', 'finance', 'sales', 'content');
create type public.lead_status as enum ('new', 'contacted', 'deal', 'archived');
create type public.deal_stage as enum ('new', 'conversation', 'quote', 'deposit', 'progress', 'delivered', 'closed', 'lost');
create type public.payment_direction as enum ('in', 'out');
create type public.payment_category as enum ('deposit', 'balance', 'commission', 'expense', 'other');
create type public.campaign_status as enum ('draft', 'scheduled', 'sending', 'sent', 'automated');
create type public.campaign_template as enum ('welcome', 'birthday', 'promo');

-- Staff Table
create table public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.staff_role not null,
  status text not null default 'invited' check (status in ('invited', 'active', 'disabled')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

-- Security Definer Helpers for Role & aal2 Session Assurance
create or replace function public.current_staff_role() returns public.staff_role
language sql stable security definer set search_path = public as $$
  select s.role from public.staff s
  where s.id = (select auth.uid()) and s.status = 'active'
    and coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
$$;

create or replace function public.has_role(roles public.staff_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_staff_role() = any(roles), false)
$$;

create policy "staff read self or owner" on public.staff for select to authenticated
  using (id = (select auth.uid()) or public.has_role(array['owner']::public.staff_role[]));
