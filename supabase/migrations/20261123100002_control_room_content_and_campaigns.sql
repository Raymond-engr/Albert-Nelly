-- ============================================================================
-- Phase 2: Content, Campaigns, Settings, and System Activity Audit Tables
-- ============================================================================

-- Services Table
create table public.services (
  id uuid primary key default gen_random_uuid(),
  position int not null,
  scene text not null,
  title text not null,
  description text not null,
  audience text not null,
  badge text not null default '',
  price jsonb not null default '{"kind":"none"}'::jsonb
    check (price->>'kind' in ('exact', 'from', 'range', 'perStudent', 'custom', 'none')),
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();

-- School Packages Table
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  position int not null,
  name text not null,
  description text not null,
  audience text not null,
  price jsonb not null default '{"kind":"custom"}'::jsonb
    check (price->>'kind' in ('exact', 'from', 'range', 'perStudent', 'custom', 'none')),
  featured boolean not null default false,
  features text[] not null default '{}',
  more text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create unique index one_featured_package on public.packages ((true)) where featured;

create trigger packages_touch before update on public.packages
  for each row execute function public.touch_updated_at();

-- School Running Costs Table
create table public.running_costs (
  id uuid primary key default gen_random_uuid(),
  position int not null,
  item text not null,
  amount bigint not null check (amount >= 0)
);

-- Selected Work Items Table
create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  position int not null,
  category text not null check (category in ('Design', 'Development')),
  title text not null,
  challenge text not null,
  result text not null,
  image_path text,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger work_items_touch before update on public.work_items
  for each row execute function public.touch_updated_at();

-- Creative & Ecosystem Partners Table
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  position int not null,
  name text not null,
  category text not null,
  note text not null default '',
  link text not null default '',
  logo_path text,
  status text not null default 'pending' check (status in ('active', 'pending')),
  published boolean not null default false check (not published or status = 'active'),
  updated_at timestamptz not null default now()
);

create trigger partners_touch before update on public.partners
  for each row execute function public.touch_updated_at();

-- Message Templates Table
create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  type text not null unique check (type in ('hire', 'refer', 'partner', 'update', 'birthday')),
  label text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

create trigger message_templates_touch before update on public.message_templates
  for each row execute function public.touch_updated_at();

-- Settings Table (Single Row Guaranteed)
create table public.settings (
  id boolean primary key default true check (id),
  whatsapp_number text not null,
  birthday_discount int not null check (birthday_discount between 0 and 100),
  commission_min numeric(5,2) not null,
  commission_max numeric(5,2) not null check (commission_max >= commission_min),
  updated_at timestamptz not null default now()
);

create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- Campaigns Table
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null default '',
  body text not null default '',
  template public.campaign_template not null default 'promo',
  audience_types text[] not null default '{hire,refer,partner,update}',
  status public.campaign_status not null default 'draft',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_by uuid references public.staff(id),
  updated_at timestamptz not null default now()
);

create trigger campaigns_touch before update on public.campaigns
  for each row execute function public.touch_updated_at();

-- Campaign Recipients Table
create table public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  provider_id text,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  unique (campaign_id, lead_id)
);

-- Birthday Sends Table
create table public.birthday_sends (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  year int not null,
  sent_at timestamptz not null default now(),
  provider_id text,
  opened_at timestamptz,
  unique (lead_id, year)
);

-- Activity Log Table (Append-Only)
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor_id uuid not null,
  actor_name text not null,
  action text not null,
  target text not null default ''
);

drop trigger if exists activity_append_only on public.activity_log;
create trigger activity_append_only before update or delete on public.activity_log
  for each row execute function public.forbid_change();
