-- Leads captured by the registration panel. Written only by the server (service/secret key).
create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  type          text not null check (type in ('hire','refer','partner','update')),
  name          text not null,
  email         text not null unique,          -- stored lowercased by the API
  whatsapp      text,                          -- digits with country code, null for "update"
  service       text,
  business_name text,
  category      text,
  birth_day     smallint check (birth_day between 1 and 31),
  birth_month   smallint check (birth_month between 1 and 12),
  consent       boolean not null default false,
  context       text                           -- e.g. the package or service the visitor clicked
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
for each row execute function public.touch_updated_at();

-- RLS on with no public policies: the browser cannot read or write leads.
-- The Next.js route handler uses the secret key, which bypasses RLS.
alter table public.leads enable row level security;
-- Control Room (later): add policies for authenticated staff roles here.
