# Control Room handover

Audience: a developer or an AI assistant who has this repo and must turn the Control Room prototype into a working system.
Read `CLAUDE.md` first, then this file top to bottom. Each phase can be done on its own and ends with checks.

## 0. In one page

**What exists.** A complete clickable Control Room frontend at `/control-room`, built with fake data kept in the browser (localStorage). It has 13 screens, 4 roles, a fake login with a fake 2-step code, and every write goes through a small set of functions (the "seam"). Nothing talks to a server except the public registration form, which already posts to `/api/leads`.

**What remains.** Everything behind the screens:

1. Make the registration form save leads for real (mostly configuration, see Phase 0).
2. Real staff accounts: invite-only sign-in, 2-step verification, roles (Phase 1).
3. The database tables and security rules (Phase 2).
4. Feed the existing screens from the database (Phase 3) and make their buttons write to it (Phase 4).
5. Activity log and live updates (Phase 5).
6. The public site reads prices, packages, work and partners from the database (Phase 6).
7. Email: sending, scheduling, birthdays, unsubscribe, results (Phase 7).
8. Image uploads (Phase 8).
9. Hardening and launch (Phase 9), plus the design and content to-dos in sections 14 and 15.

**Order.** 0, 1, 2, 3, 4, 5 give a working Control Room. 6 to 9 can follow in any order after that, except that 7 needs 4.

**The one rule that matters most.** Hiding a button in the UI is not security. Every rule in `src/lib/control-room/roles.ts` must also be enforced on the server and in the database (sections 5 and 6).

## 1. Ground rules for whoever executes this

- Follow `CLAUDE.md`: deliver `.patch` files that apply with `git apply` on `main`, one purpose per patch, no new dependency unless needed (say so in the patch description), and run `pnpm typecheck && pnpm lint && pnpm build` before finishing. Number new patches after the last existing one (`0007-...`).
- Never put secrets in `NEXT_PUBLIC_*` variables. `SUPABASE_SECRET_KEY` and every key in section 13 marked "server only" stay on the server.
- Do not change the signature of a Showroom slot or of `useRegistrationFlow()` / `useRegistration()`. Additive optional fields are fine.
- Keep the function signatures in the seam files (section 2.2). The screens call them. Change what is inside, not what they accept or return, so the 13 screens keep working.
- Money is a whole number of naira everywhere (`bigint` in the database, `number` in TypeScript). If kobo is ever needed, that is a separate migration.
- Dates are stored as UTC (`timestamptz`) and shown in the browser's local time. Nigeria is UTC+1 all year.
- Third-party APIs change. Where this document names a Supabase, Next.js or email-provider call, check the current documentation before relying on the exact name.
- Add this row to the table in `CLAUDE.md` ("Which task are you doing?") if you want future assistants to find this file: `| Work on the Control Room (admin) | docs/CONTROL_ROOM_HANDOVER.md |`.

## 2. What the prototype contains

### 2.1 Where things are

```
src/app/control-room/
  layout.tsx                 noindex metadata + toast host
  login/page.tsx             -> components/control-room/shell/LoginForm.tsx (fake login + fake code)
  (app)/layout.tsx           -> shell/Shell.tsx (sidebar, role switch, access check, demo banner)
  (app)/page.tsx             Overview
  (app)/leads/               Leads (?lead=<id> opens the drawer)
  (app)/deals/ , deals/[id]  Board, deal page (details, payments, commission)
  (app)/services/            Services and pricing (price editor + live preview)
  (app)/packages/            School packages + running costs
  (app)/work/  partners/  referrers/
  (app)/campaigns/ , campaigns/[id]   list, composer, results
  (app)/birthdays/  settings/  team/  activity/
src/components/control-room/   ui/ (kit, Field, Overlay, Toast, Switch, ...), shell/, charts/, and one folder per area
src/lib/control-room/
  types.ts        domain types (mirror the future tables)
  roles.ts        PERMS (who sees what), NAV, can(), areaForPath()   <- source of truth for permissions
  store.ts        the fake database (localStorage) + useDb(), useSession(), useHydrated()
  demo.ts         invented seed data
  api.ts          auth + logActivity + uid + demo.reset
  leads-api.ts  deals-api.ts  content-api.ts  campaigns-api.ts  admin-api.ts     <- THE SEAM
  metrics.ts      dealBalance(), upcomingBirthdays(), monthTotals(), ... (pure, reusable on the server)
  price.ts        PRICE_KINDS, formatPrice()  (builds the price line the site shows)
  templates.ts    message variables, fill(), campaign defaults, audience helpers
  labels.ts format.ts validate.ts dates.ts birthday.ts toast.ts
```

### 2.2 The seam: every function that must become a server call

| Function (file) | Becomes | Allowed roles | Notes |
|---|---|---|---|
| `auth.signIn`, `auth.signOut`, `auth.switchRole` (`api.ts`) | Supabase Auth in the browser (Phase 1). `switchRole` is deleted. | all staff | |
| `logActivity` (`api.ts`) | A database function the server calls (Phase 5). The browser never logs. | n/a | |
| `leadsApi.update` | `PATCH /api/control-room/leads/:id` | owner, sales | status (not `deal`), notes, tags, owner |
| `leadsApi.convertToDeal` | `POST /api/control-room/leads/:id/deal` | owner, sales | one transaction (RPC) |
| `dealsApi.create` | `POST /api/control-room/deals` | owner, finance, sales | |
| `dealsApi.update` | `PATCH /api/control-room/deals/:id` | owner, finance, sales | `commissionRate` only owner and finance |
| `dealsApi.move` | `POST /api/control-room/deals/:id/stage` | owner, finance, sales | |
| `paymentsApi.record` | `POST /api/control-room/deals/:id/payments` | owner, finance | append-only |
| `servicesApi.update` | `PATCH /api/control-room/services/:id` | owner, finance | then refresh the public site |
| `packagesApi.update` | `PATCH /api/control-room/packages/:id` | owner, finance | only one `featured` |
| `costsApi.save` | `PUT /api/control-room/running-costs` | owner, finance | replace the list |
| `workApi.create/update/remove` | `POST/PATCH/DELETE /api/control-room/work(/:id)` | owner, content | |
| `partnersApi.create/update/remove` | `POST/PATCH/DELETE /api/control-room/partners(/:id)` | owner, content | only active partners can be published |
| `referrersApi.create/update` | `POST/PATCH /api/control-room/referrers(/:id)` | owner, finance | |
| `campaignsApi.create/save/schedule/unschedule/sendNow/remove` | `POST/PATCH/DELETE /api/control-room/campaigns(/:id[/schedule|/send])` | owner, content | sending is Phase 7 |
| `teamApi.invite/setRole/remove` | `POST/PATCH/DELETE /api/control-room/team(/:id)` | owner | uses the admin client; "remove" disables the account, it does not delete the row (5.3) |
| `settingsApi.save`, `templatesApi.update` | `PUT /api/control-room/settings`, `PATCH /api/control-room/templates/:id` | owner | |

Every `TODO(integration)` comment in the code points at this table. Search for it: `grep -rn "TODO(integration)" src`.

### 2.3 Role rules (copy of `roles.ts`)

| Area | Owner | Finance | Sales | Content and Marketing |
|---|---|---|---|---|
| Overview | view | view | view | view |
| Leads | edit | none | edit | view |
| Deals | edit | edit | edit | none |
| Payments (received, remaining, commission) | edit | edit | none | none |
| Services, Packages | edit | edit | view | view |
| Selected work, Partners | edit | none | view | edit |
| Referrers | edit | edit | view | none |
| Campaigns, Birthdays | edit | none | view | edit |
| Team, Settings | edit | none | none | none |
| Activity log | view | view | none | none |

Sales sees a deal's agreed price but not what was received, what remains, the commission rate or payments. The UI hides them; the server must not send them (section 8).

## 3. Target architecture

```
Browser (Control Room screens, unchanged)
   |  fetch JSON                         |  supabase browser client (sign-in, MFA, realtime only)
   v                                     v
Next.js Route Handlers  /api/control-room/*      Supabase Auth
   |  requireStaff(area, need)  -> user session (cookies) + role + MFA level
   |  zod validation, then queries with the USER's Supabase client  -> Row Level Security enforces roles again
   v
Supabase Postgres (tables, RLS, RPC functions, triggers)        Supabase Storage (images)
   ^
   |  admin client (secret key, server only): invites, seeding, cron jobs, webhooks, the public /api/leads
Cron routes  /api/cron/*      Email provider webhooks  /api/webhooks/*
```

Decisions already made, with reasons:

- **One Next.js app.** The server code lives in Route Handlers under `src/app/api/`. No separate backend.
- **Two layers of permission checks.** The handler checks the role (friendly errors). Row Level Security checks it again (so a bug in a handler cannot leak data). Control Room handlers use the signed-in user's client, not the admin client.
- **Admin client only where there is no user:** the public `/api/leads`, cron jobs, webhooks, inviting staff, seeding.
- **Small data, so one "snapshot" read first.** The agency will have hundreds, not millions, of rows. Phase 3 serves the screens from one endpoint that returns the same `Db` shape the prototype uses. Paginate later (section 8.4).

## 4. Phase 0: the registration form saves leads for real

### 4.1 What already works

`RegistrationPanel` skins -> `useRegistrationFlow()` -> `submitLead()` (`src/lib/leads.ts`) -> `POST /api/leads` (`src/app/api/leads/route.ts`) -> `getAdminClient()` -> table `public.leads`.
With no Supabase environment variables the route runs in **demo mode**: it answers `{ ok: true }` and saves nothing. The route already validates on the server (`validatePayload`), drops honeypot submissions, and updates the row of a returning email address (`returning: true`).

### 4.2 Steps to go live

1. Create a Supabase project (one for development, one for production later).
2. Run `supabase/migrations/20261118000000_create_leads.sql` (SQL editor or `supabase db push`).
3. Put these in `.env.local` (names are in `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
4. `pnpm dev`, submit the form on `/`, and check that a row appears in `public.leads`. Submit the same email again: the row updates and the panel says "Welcome back".

Acceptance: a new row for a new email; the same row updated for a repeated email; a row with the honeypot field filled is not saved; with the keys removed the form still works (demo mode).

### 4.3 Changes the Control Room needs in this flow (separate patch)

The Control Room shows more than the first migration stores. Do these in one migration and one patch:

1. **New columns on `leads`:** `status`, `source`, `notes`, `tags`, `owner_id`, `deal_id`, `consent_at`, `unsubscribed_at`. SQL is in section 6.3.
2. **Do not overwrite staff work when a visitor returns.** Today the "returning" branch of `route.ts` updates the whole row. After the change it may update only: `name`, `whatsapp`, `service`, `business_name`, `category`, `birth_day`, `birth_month`, `context`, `source`, `type`, and it must set `status = 'new'` only if the old status was `archived`. It must never touch `notes`, `tags`, `owner_id`, `deal_id`.
3. **Keep a history.** Insert one row in `lead_submissions` (section 6.3) on every submission, so a visitor who first asked for UI/UX and later for a school site keeps both.
4. **Fill `source`.** The Control Room shows where a lead came from ("Service card", "School package", "Hero button", ...). Smallest change: derive it on the server from `context` and `type`:
   - `context` equals a service title -> "Service card"; equals a package name -> "School package"; equals a project title -> "Selected work";
   - `type = 'refer'` -> "Referral section"; `type = 'partner'` -> "Partners section"; `type = 'update'` -> "Join section";
   - otherwise "Floating button or hero".
   Later improvement (optional): add an optional `source` field to `OpenOptions` in `RegistrationProvider`, to `OpenButton`, and to `LeadPayload`, and pass it from each button. It is additive, so it does not break the contract.
5. **Record consent.** Set `consent_at = now()` when `consent` is true. The unsubscribe link in emails (Phase 7) sets `unsubscribed_at`.
6. **Send the welcome email** for `type = 'update'` after the response, with `after()` from `next/server`, so the visitor never waits on email (Phase 7).
7. **Protect the endpoint.** The honeypot stops simple bots only. Add a rate limit (for example 5 submissions per IP per 10 minutes) with your host's firewall or a small Redis rate limiter, and keep the server-side validation exactly as is.
8. **Optional: referral links.** `?ref=<referrer id>` on any page URL is stored in `sessionStorage` by a tiny client script and sent as `ref` in the payload; the route sets `leads.referrer_id`. Show the link on the referrer's drawer. Not in the prototype; design the link format first.

### 4.4 Also decide: the floating WhatsApp button

The brief left this open. Recommendation: new visitors see the registration panel first (every chat becomes a lead); a returning visitor (the form has been saved once on this browser, remembered with a first-party flag in `localStorage`) goes straight to WhatsApp with their details prefilled. This needs one small change in `src/components/showroom/WhatsAppFab.tsx` (and the variants' copies), nothing in the Control Room.

## 5. Phase 1: staff, sign-in and 2-step verification

### 5.1 Model

- Staff are **invited by an Owner**. Nobody signs up. In the Supabase dashboard's Authentication settings, turn **off** "allow new users to sign up" (and keep email confirmations on).
- A person is staff only if they have a row in `public.staff` with `status = 'active'`. Having a Supabase account is not enough.
- Every staff member enrolls an authenticator app (TOTP). Data access requires the session to be at assurance level `aal2` (section 6.2 enforces it in the database).

### 5.2 First Owner (done once)

Pick one:

- **By hand.** Dashboard: Authentication > Users > "Add user" with email and password (auto-confirm). Copy the user id. Then in the SQL editor:
  `insert into public.staff (id, name, email, role, status) values ('<user id>', 'Your Name', 'you@example.com', 'owner', 'active');`
- **By script.** `scripts/seed-owner.ts` reads `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD`, `SEED_OWNER_NAME` from the environment, calls `getAdminClient()`, then `auth.admin.createUser({ email, password, email_confirm: true })` and inserts the `staff` row. Run it once, then delete the three variables. (Running a TypeScript script may need `tsx`; say so in the patch description if you add it.)

At first sign-in the Owner is asked to enroll the authenticator app (5.4).

### 5.3 Inviting staff

`POST /api/control-room/team` (Owner only), body `{ name, email, role }`:

1. Validate with zod. Refuse an email that already exists in `staff`.
2. With the admin client: `auth.admin.inviteUserByEmail(email, { redirectTo: `${SITE_URL}/control-room/accept-invite` })`.
3. Insert `staff (id = new user id, name, email, role, status = 'invited')`.
4. Log "Invited a team member".

The invited person clicks the email link, lands on `/control-room/accept-invite`, chooses a password (`supabase.auth.updateUser({ password })`), then goes to MFA enrollment (5.4). When enrollment succeeds the **server** sets `staff.status = 'active'` (a small `POST /api/control-room/me/activate` that checks the session is `aal2`). Role changes and removal: `PATCH` and `DELETE /api/control-room/team/:id`; both refuse to leave the team with no active Owner (the prototype's `admin-api.ts` already shows the rule). **Removing staff disables the account, it does not delete it:** set `staff.status = 'disabled'` and ban the auth user (the admin `updateUserById` call has a ban option). The row stays because payments, deals and the activity log keep pointing at the person; the Team screen simply stops listing disabled people.

### 5.4 New pages to build (they do not exist in the prototype)

| Route | Purpose |
|---|---|
| `/control-room/login` | Replace the fake form's `onSubmit` with `supabase.auth.signInWithPassword`. On success, if the user has a verified TOTP factor go to step 2, otherwise go to `/control-room/mfa`. Keep the existing two-step layout. |
| `/control-room/mfa` | Enroll (`auth.mfa.enroll({ factorType: 'totp' })` returns a QR code and a secret) then verify a first code (`mfa.challenge` + `mfa.verify`). Show the secret as text for people who cannot scan. |
| step 2 on the login page | `mfa.listFactors`, then `mfa.challenge` and `mfa.verify` with the 6 digits. Success gives an `aal2` session. |
| `/control-room/accept-invite` | Set a password after the invite link, then continue to `/control-room/mfa`. |
| `/control-room/forgot-password` and `/control-room/reset-password` | `resetPasswordForEmail`, then `updateUser({ password })`. |

If someone loses their phone, an Owner removes their factor with the admin API (`auth.admin.mfa.deleteFactor`) from a button on the Team screen ("Reset 2-step verification"). Design this button and a confirmation (section 14).

### 5.5 Keeping the session fresh: `src/proxy.ts`

`README.md` already plans this file (Next.js 16 calls it `proxy`, formerly `middleware`). Use the `@supabase/ssr` pattern: build a server client from the request cookies, call `supabase.auth.getUser()` (this validates the token with Supabase; do not trust `getSession()` on the server), and write refreshed cookies onto the response. Matcher: `/control-room/:path*` and `/api/control-room/:path*`. In the proxy only redirect when there is no user (to `/control-room/login`); role checks happen in layouts and handlers.

### 5.6 Server helpers (create these files)

`src/lib/control-room/server/guard.ts` (add `import "server-only"`):

```ts
import { createClient } from "@/lib/supabase/server";
import { can, type Area } from "@/lib/control-room/roles";

export class HttpError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) { super(message); }
}

/** Throws unless a signed-in, active, 2-step-verified staff member may do `need` in `area`. */
export async function requireStaff(area: Area, need: "view" | "edit" = "view") {
  const supabase = await createClient();                       // user session from cookies, RLS applies
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new HttpError(401, "Sign in to continue.");
  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal.data?.currentLevel !== "aal2") throw new HttpError(401, "Two-step verification is required.");
  const { data: staff } = await supabase.from("staff").select("id,name,email,role,status").eq("id", user.id).single();
  if (!staff || staff.status !== "active") throw new HttpError(403, "This account is not active.");
  if (!can(staff.role, area, need)) throw new HttpError(403, "Your role can’t do this.");
  return { supabase, staff };
}

/** Wrap every handler: turns HttpError into { ok:false, error } and hides unexpected errors. */
export function handle<T>(fn: () => Promise<T>) {
  return fn().then(
    (data) => Response.json({ ok: true, data }),
    (e: unknown) => {
      if (e instanceof HttpError) return Response.json({ ok: false, error: e.message, fields: e.fields }, { status: e.status });
      console.error("[control-room]", e);
      return Response.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
    },
  );
}
```

`can()` and `PERMS` come from `roles.ts`, so the handler and the screens share one definition. The SQL policies in section 6.4 must be kept in line with it (see the test in 9.2).

Mutation requests (POST, PATCH, PUT, DELETE) must also check that the `Origin` header matches your site, and require `Content-Type: application/json`. This blocks cross-site form posts on top of the session cookie's `SameSite` setting.

### 5.7 Protect the pages

Make `src/app/control-room/(app)/layout.tsx` an async server component: call `createClient()`, `getUser()`, load the `staff` row; if there is no active `aal2` staff member, `redirect('/control-room/login')`. Pass the staff member to the client `Shell` through a small `StaffProvider` context, and change `useSession()` (in `store.ts`) to read that context instead of the fake session. Then delete: `auth.switchRole`, the "View as" select, the demo banner and "Reset demo data" button in `Shell.tsx`, and the "Preview as" role select in `LoginForm.tsx`.

Acceptance for Phase 1: an uninvited email cannot sign in; an invited person can set a password and enroll an authenticator; a session without 2-step verification gets 401 from every `/api/control-room/*` route; an Owner can invite, change a role and remove staff; the last Owner cannot be demoted or removed.

## 6. Phase 2: database schema and Row Level Security

Write these as migrations in `supabase/migrations/` (use the current date in the file names, in this order). The SQL below is a reference draft: run it on a development project first, and adapt names if you already changed the `leads` table.

### 6.1 Types

```sql
create type public.staff_role as enum ('owner','finance','sales','content');
create type public.lead_status as enum ('new','contacted','deal','archived');
create type public.deal_stage as enum ('new','conversation','quote','deposit','progress','delivered','closed','lost');
create type public.payment_direction as enum ('in','out');
create type public.payment_category as enum ('deposit','balance','commission','expense','other');
create type public.campaign_status as enum ('draft','scheduled','sending','sent','automated');
create type public.campaign_template as enum ('welcome','birthday','promo');
```

### 6.2 Staff and the permission helpers

```sql
create table public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.staff_role not null,
  status text not null default 'invited' check (status in ('invited','active','disabled')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.staff enable row level security;

-- The signed-in user's role, or null. Requires an active staff row AND a 2-step-verified session.
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
-- Writes to `staff` go through the admin client in the team handlers (no insert/update/delete policy on purpose).
```

Reusable trigger for `updated_at` (the first migration already defines `public.touch_updated_at()`): attach it to every table that has an `updated_at` column.

### 6.3 CRM tables (leads, deals, payments, referrers)

```sql
-- Extend the existing leads table
alter table public.leads
  add column status public.lead_status not null default 'new',
  add column source text not null default 'Unknown',
  add column notes text not null default '',
  add column tags text[] not null default '{}',
  add column owner_id uuid references public.staff(id) on delete set null,
  add column deal_id uuid,                         -- foreign key added after `deals` exists
  add column referrer_id uuid,                     -- foreign key added after `referrers` exists
  add column consent_at timestamptz,
  add column unsubscribed_at timestamptz;
create index leads_status_idx on public.leads (status, created_at desc);

create table public.lead_submissions (             -- one row per form submission (history)
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null, service text, context text, source text,
  created_at timestamptz not null default now()
);

create table public.referrers (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, whatsapp text not null,
  rate numeric(5,2) not null check (rate between 0 and 100),
  status text not null default 'active' check (status in ('active','paused')),
  joined_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null, client text not null, service text not null,
  lead_id uuid references public.leads(id) on delete set null,
  stage public.deal_stage not null default 'new',
  agreed bigint not null default 0 check (agreed >= 0),             -- whole naira
  referrer_id uuid references public.referrers(id) on delete set null,
  commission_rate numeric(5,2) check (commission_rate between 0 and 100),
  owner_id uuid not null references public.staff(id),
  notes text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.leads add foreign key (deal_id) references public.deals(id) on delete set null;
alter table public.leads add foreign key (referrer_id) references public.referrers(id) on delete set null;
create index deals_stage_idx on public.deals (stage, updated_at desc);

create table public.payments (                      -- append-only
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
create function public.forbid_change() returns trigger language plpgsql as $$
begin raise exception 'This table is append-only. Record a correcting entry instead.'; end $$;
create trigger payments_append_only before update or delete on public.payments
  for each row execute function public.forbid_change();
```

The prototype's `Payment.date` is a full timestamp; the table uses `paid_on date`. Map it to `paid_on::timestamptz` when building the snapshot (section 8.2).

### 6.4 Content, campaigns, settings, audit

```sql
create table public.services (
  id uuid primary key default gen_random_uuid(),
  position int not null, scene text not null,
  title text not null, description text not null, audience text not null, badge text not null default '',
  price jsonb not null default '{"kind":"none"}'::jsonb
    check (price->>'kind' in ('exact','from','range','perStudent','custom','none')),
  published boolean not null default true, updated_at timestamptz not null default now()
);
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  position int not null, name text not null, description text not null, audience text not null,
  price jsonb not null default '{"kind":"custom"}'::jsonb
    check (price->>'kind' in ('exact','from','range','perStudent','custom','none')),
  featured boolean not null default false,
  features text[] not null default '{}', more text[] not null default '{}',
  updated_at timestamptz not null default now()
);
create unique index one_featured_package on public.packages ((true)) where featured;
create table public.running_costs (
  id uuid primary key default gen_random_uuid(), position int not null,
  item text not null, amount bigint not null check (amount >= 0)
);
create table public.work_items (
  id uuid primary key default gen_random_uuid(), position int not null,
  category text not null check (category in ('Design','Development')),
  title text not null, challenge text not null, result text not null,
  image_path text, published boolean not null default true, updated_at timestamptz not null default now()
);
create table public.partners (
  id uuid primary key default gen_random_uuid(), position int not null,
  name text not null, category text not null, note text not null default '', link text not null default '',
  logo_path text, status text not null default 'pending' check (status in ('active','pending')),
  published boolean not null default false check (not published or status = 'active'),
  updated_at timestamptz not null default now()
);
create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  type text not null unique check (type in ('hire','refer','partner','update','birthday')),
  label text not null, body text not null, updated_at timestamptz not null default now()
);
create table public.settings (                       -- exactly one row
  id boolean primary key default true check (id),
  whatsapp_number text not null, birthday_discount int not null check (birthday_discount between 0 and 100),
  commission_min numeric(5,2) not null, commission_max numeric(5,2) not null check (commission_max >= commission_min),
  updated_at timestamptz not null default now()
);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null, subject text not null default '', body text not null default '',
  template public.campaign_template not null default 'promo',
  audience_types text[] not null default '{hire,refer,partner,update}',
  status public.campaign_status not null default 'draft',
  scheduled_for timestamptz, sent_at timestamptz,
  created_by uuid references public.staff(id), updated_at timestamptz not null default now()
);
create table public.campaign_recipients (            -- results come from here (Phase 7)
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  provider_id text, delivered_at timestamptz, opened_at timestamptz, clicked_at timestamptz, bounced_at timestamptz,
  unique (campaign_id, lead_id)
);
create table public.birthday_sends (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  year int not null, sent_at timestamptz not null default now(), provider_id text,
  opened_at timestamptz, unique (lead_id, year)
);
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor_id uuid not null,                        -- no foreign key on purpose: the log must survive offboarding
  actor_name text not null,                      -- copied at write time, so history keeps names
  action text not null, target text not null default ''
);
create or replace function public.log_activity(p_action text, p_target text default '') returns void
language sql security definer set search_path = public as $$
  insert into public.activity_log (actor_id, actor_name, action, target)
  select s.id, s.name, p_action, p_target from public.staff s where s.id = (select auth.uid());
$$;
revoke all on function public.log_activity(text, text) from public, anon;
grant execute on function public.log_activity(text, text) to authenticated;
create trigger activity_append_only before update or delete on public.activity_log
  for each row execute function public.forbid_change();
```

Seed the content tables from `src/data/` (services, packages, running costs, work, partner tiles) and the templates from `lib/whatsapp.ts` with a one-off script or SQL, so the Control Room starts with the same words as the live site. Set `settings.whatsapp_number` from `NEXT_PUBLIC_WA_NUMBER`.

### 6.5 Row Level Security policies

Turn RLS on for **every** table, then add policies. Pattern (repeat for each row of the table below):

```sql
alter table public.deals enable row level security;
create policy "deals read"  on public.deals for select to authenticated
  using (public.has_role(array['owner','finance','sales']::public.staff_role[]));
create policy "deals write" on public.deals for all to authenticated
  using      (public.has_role(array['owner','finance','sales']::public.staff_role[]))
  with check (public.has_role(array['owner','finance','sales']::public.staff_role[]));
```

| Table | Read (select) | Write (insert, update, delete) |
|---|---|---|
| `staff` | self, or owner | none (admin client only) |
| `leads`, `lead_submissions` | owner, sales, content | update: owner, sales. Insert: none (the public route uses the admin client). Delete: none (archive instead) |
| `deals` | owner, finance, sales | owner, finance, sales (no delete) |
| `payments` | owner, finance | insert: owner, finance. Update and delete: nobody (trigger) |
| `referrers` | owner, finance, sales | owner, finance |
| `services`, `packages`, `running_costs` | all staff; also `anon` for `services` where `published` and for `packages`, `running_costs` | owner, finance |
| `work_items`, `partners` | all staff; also `anon` where `published` | owner, content |
| `campaigns`, `campaign_recipients`, `birthday_sends` | owner, sales, content | owner, content |
| `message_templates` | owner, content (read); public site reads through the server | owner |
| `settings` | owner; the public site reads `whatsapp_number` through the server | owner |
| `activity_log` | owner, finance | none (only `log_activity()`) |

Limit of Row Level Security: it hides rows, not columns. Sales can read a `deals` row, including `commission_rate`. That is why the handler (section 8.2) must remove fields the role may not see, and why the browser must never query these tables directly. Keep it that way: **Control Room data is read only through the Route Handlers.**

### 6.6 Multi-step changes are RPC functions, not several calls

Supabase's JavaScript client cannot wrap several statements in one transaction, so write these as SQL functions (`security invoker`, so RLS applies) and call them with `supabase.rpc(...)`:

- `convert_lead_to_deal(p_lead uuid, p_title text, p_client text, p_service text, p_agreed bigint) returns uuid`: checks the lead has no deal, inserts the deal (owner = `auth.uid()`), sets `leads.status = 'deal'` and `leads.deal_id`, calls `log_activity('Turned a lead into a deal', p_client)`.
- `record_payment(p_deal uuid, p_direction, p_amount, p_category, p_note, p_paid_on) returns uuid`: checks role, inserts the payment, calls `log_activity`.
- `set_featured_package(p_id uuid)`: clears `featured` on the others, then sets it (the partial unique index above also guards this).

Verify roles inside each function with `if not public.has_role(array[...]) then raise exception 'not allowed'; end if;`.

## 7. Phase 3: the existing screens read real data

Goal: every screen shows database rows, with the fewest code changes.

### 7.1 One snapshot endpoint

`GET /api/control-room/snapshot`:

1. `const { supabase, staff } = await requireStaff("overview")`.
2. Run the queries below in parallel and build the same object as the prototype's `Db` type (`src/lib/control-room/types.ts`). Return empty arrays for collections the role cannot read:
   - leads, deals, referrers, services, packages, running_costs, work_items, partners, campaigns, staff, activity_log (newest 200), message_templates, settings.
   - payments: only for owner and finance.
3. Remove fields a role may not see (table in 8.2).
4. Return `{ ok: true, data: Db }`.

### 7.2 Mappers

Put `rowToLead`, `rowToDeal`, ... in `src/lib/control-room/server/mappers.ts`. Mapping (database -> TypeScript):

| Table.column | `Db` field | Table.column | `Db` field |
|---|---|---|---|
| `leads.created_at` | `Lead.createdAt` | `deals.commission_rate` | `Deal.commissionRate` |
| `leads.business_name` | `Lead.business` | `deals.referrer_id` | `Deal.referrerId` |
| `leads.birth_day / birth_month` | `birthDay / birthMonth` | `deals.owner_id` | `Deal.ownerId` |
| `leads.owner_id`, `deal_id` | `ownerId`, `dealId` | `payments.paid_on` | `Payment.date` (ISO) |
| `leads.whatsapp` | `Lead.whatsapp` | `payments.recorded_by` | `Payment.recordedBy` |
| `referrers.joined_at` | `Referrer.joinedAt` | `campaigns.audience_types` | `Campaign.audience` (join with `,`) |
| `staff.last_seen_at` | `Staff.lastSeen` | campaign results | `Campaign.stats` (count `campaign_recipients`) |
| `settings.whatsapp_number` etc. | `Settings.*` camelCase | `activity_log.actor_id`, `actor_name` | `Activity.actorId` (add an optional `actorName` to the type and show it when the person is no longer in the team list) |

`Campaign.audienceSize` is the number of recipients (sent) or a count query (draft). `Service.scene` comes from the `scene` column. Add `updatedAt` to `Lead` and `Deal` types (additive) so edits can detect conflicts (8.3).

### 7.3 Swap the store, keep the hooks

`src/lib/control-room/store.ts` is the only file the screens import data from. Change it, not the screens:

1. Make `dbStore`'s initial value an **empty** `Db` (all arrays empty, default settings) instead of `seedDb`; remove localStorage persistence from the db store.
2. Add `refresh()`: `fetch('/api/control-room/snapshot')`, then `dbStore.set(() => data)`. Call it once when the shell mounts, after every successful mutation (8.1), and on window focus.
3. Add a `status` (`loading | ready | error`) and show a skeleton in `Shell.tsx` while loading and a retry card on error (design to-do, section 14).
4. `useSession()` now reads the `StaffProvider` from 5.7.
5. Delete `demo.ts`, the `demo` object in `api.ts`, and the "demo data" banner and toast copy.

Acceptance: every screen renders with real rows; a Sales user's network responses contain no payments and no commission rates; refreshing the page keeps the data (it comes from the server, not the browser).

## 8. Phase 4: make the buttons write

### 8.1 Client side: replace the bodies, keep the signatures

Create `src/lib/control-room/http.ts`:

```ts
export class ApiError extends Error { constructor(message: string, public status: number, public fields?: Record<string, string>) { super(message); } }
export async function call<T>(method: "POST" | "PATCH" | "PUT" | "DELETE", url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) throw new ApiError(json?.error ?? "Something went wrong. Please try again.", res.status, json?.fields);
  return json.data as T;
}
```

In each seam function, call the endpoint, then `await refresh()`, and return what the signature promises. Example (`dealsApi.move`): `await call("POST", \`/api/control-room/deals/${id}/stage\`, { stage }); await refresh();`.

**Failures.** The prototype's calls cannot fail, so the screens do not handle errors. Handle them in one place without editing every screen: let each seam function **throw** the `ApiError`, and in `Shell.tsx` add a `window` `unhandledrejection` listener that, for an `ApiError`, calls `toast(error.message, "error")` and `preventDefault()`; for status 409 also call `refresh()`. Because the function throws, the screen's success toast after `await` never runs. One thing to fix by hand: the forms that set a `saving` flag around an `await` (`deals/NewDealModal.tsx`, `deals/RecordPaymentModal.tsx`) must reset it in a `try / finally`, otherwise the button stays on "Saving…" after a failure. `ApiError.fields` can later be shown next to inputs form by form.

### 8.2 Server side: one handler per row of the table in 2.2

Every handler has the same shape:

```ts
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("deals", "edit");     // 401/403 here
    const input = DealPatch.parse(await req.json());              // zod: 422 with fields on failure
    // 1. ownership/role details (for example: only owner and finance may send commissionRate)
    // 2. the write, with the user's client (RLS enforces again)
    // 3. log_activity via rpc, or inside the RPC function
    // 4. revalidatePath for public content (Phase 6)
    return rowToDeal(updated);
  });
}
```

Validation rules to repeat on the server (the screens already enforce them in the browser; the server must too):

- Text: names and titles at least 2 to 3 characters (see each form), maximum lengths (for example 120 for names, 160 for titles, 2,000 for notes and message bodies).
- Money: whole naira, integer, `0 <= agreed`, payment `amount > 0`, payment `date` not in the future.
- Percentages: 0 to 100. Warn, not block, outside the usual commission range.
- Email: simple pattern; WhatsApp: digits only, 9 to 15; URL: `http` or `https` or empty.
- Lead status: only `new`, `contacted`, `archived` through `PATCH`; `deal` is set only by `convert_lead_to_deal`.
- `featured` package: use `set_featured_package`.
- Partner `published` is refused unless `status = 'active'`.
- Team: refuse to demote or remove the last active Owner; refuse changing your own role.
- Campaign `schedule`: `scheduled_for` must be in the future; `send` only from `draft` or `scheduled`.

Fields hidden by role in the snapshot and in every response:

| Field | Visible to |
|---|---|
| `payments` rows, `received`, `remaining`, commission paid and owed | owner, finance |
| `Deal.commissionRate` | owner, finance (send `null` to others) |
| `Settings`, `staff` list details beyond name and role | owner (others get names only where a screen needs "who") |

### 8.3 Conflicts

Two people can edit the same lead or deal. Send the `updatedAt` you loaded with every `PATCH`, and have the server update `where id = $1 and updated_at = $2`; if no row changes answer `409 { error: "Someone else changed this. Reload to see their changes." }`. The screens then show a toast and call `refresh()`.

### 8.4 When the snapshot stops being enough

Leads grow every day. When there are about 2,000 leads, stop sending all of them in the snapshot: add `GET /api/control-room/leads?type=&status=&q=&page=` and make `LeadsScreen` call it (its filters already map to these parameters). The same goes for `activity_log` (cursor by `at`). Nothing else needs this for a long time.

Acceptance for Phase 4: for every row in 2.2, the role that may do it succeeds and every other role gets 403 (and the database refuses too, see 9.2); a failed request shows an error toast and leaves the screen unchanged; each successful write appears in the Activity log.

## 9. Activity, realtime and tests (Phase 5 and Phase 9)

### 9.1 Activity log and realtime (Phase 5)

- **Activity:** the prototype's `logActivity` is gone. Each handler (or RPC) calls `log_activity(action, target)`. Keep the same wording as the prototype's calls so the screen reads the same. The browser never writes the log.
- **Realtime for new leads:** `alter publication supabase_realtime add table public.leads;`. In `Shell.tsx`, for roles that may read leads, create the browser client (`src/lib/supabase/client.ts`), subscribe to `INSERT` on `public.leads`, show a toast "New lead: <name>" and call `refresh()`. Realtime obeys Row Level Security. Do not stream payments.
- **`last_seen_at`:** update `staff.last_seen_at` at most every 5 minutes from `requireStaff`.

### 9.2 Tests you must run before launch (Phase 9)

1. **Permission matrix.** For each role, in a development project, sign in as a user of that role and check every endpoint in 2.2 returns the status in 2.3. Also check directly in SQL with a test script (impersonate each role by setting the JWT claims, including `aal = aal2`) that denied tables return no rows and denied writes fail. Add a script that prints `PERMS` from `roles.ts` as a table, to compare with the policies whenever either side changes.
2. **No MFA, no data.** A session at `aal1` gets 401 from handlers and empty results from SQL.
3. **Append-only.** `update` or `delete` on `payments` and `activity_log` fails, even with the admin client.
4. **Leak check for Sales.** Open the browser network tab as Sales: no payments, no commission rate, no staff emails.
5. **Registration regression.** A returning visitor does not overwrite notes, tags, owner or deal.
6. **Accessibility.** Keyboard-only pass on the Control Room and the registration panel; run an automated check (axe) on every route.

## 10. Phase 6: the public site reads the database

The live site still reads `src/data/*.ts`. After this phase, prices and packages edited in the Control Room appear on the site.

1. **Server reader** `src/lib/site-content.ts` (`server-only`): returns `{ services, packages, runningCosts, work, partners, whatsappNumber, templates }` for published rows only. Use the admin client, or the anon client with the `anon` policies from 6.5. Build each price line with `formatPrice()` from `src/lib/control-room/price.ts` (it is pure and works on the server).
2. **Fallback.** If Supabase is not configured or a query fails, return the static values from `src/data/` so the site never breaks (the demo mode promise).
3. **Provider.** Add `src/providers/SiteContentProvider.tsx` and a `useSiteContent()` hook. In `src/app/page.tsx` (a server component) await the reader and pass the result to `Showroom` as a new **optional** prop `content`, which `ShowroomProviders` puts in the provider. Slots stay prop-less: `Services`, `Schools`, `Work`, `Partners` read `useSiteContent()` instead of importing `data/services.ts` and friends. `data/` remains the default and the fallback; do not delete it. The variants (`/one` to `/four`) can keep using `data/` until someone swaps them.
4. **Freshness.** After any write to services, packages, running costs, work or partners, call `revalidatePath("/")` in the handler (use the newer tag-based caching of the installed Next.js 16 if you prefer; the requirement is only "the public page is rebuilt after an admin saves"). For the first version also set `export const revalidate = 300` on the page as a safety net.
5. **WhatsApp number and first-message templates.** `src/data/site.ts` reads `NEXT_PUBLIC_WA_NUMBER`, and `src/lib/whatsapp.ts` builds the message. Give both an override from `useSiteContent()` (number and template bodies with `fill()` from `templates.ts`), keeping the env var as the fallback.
6. **Contract note.** The `Service.price` and `SchoolPackage.price` fields in `types/content.ts` stay strings (never rename or remove a field, `docs/SLOTS.md` contract 1). Only their values come from the database.

Acceptance: change a price type in the Control Room; the site shows the new line after the revalidation; turn a service off and it disappears; stop Supabase and the site still renders from `data/`.

## 11. Phase 7: email

### 11.1 Provider and setup

Use a transactional email provider that supports batch sending, webhooks and open and click tracking (Resend is a good fit; any provider works if you keep the interface in one file, `src/lib/email.ts`). Steps: create an account, verify a sending domain (add the SPF, DKIM and DMARC records your provider shows), create an API key, set `RESEND_API_KEY` and `EMAIL_FROM` (for example `Albert Nelly <hello@yourdomain.com>`), and set up a webhook (11.5). New dependencies to declare: the provider SDK and, if you want typed templates, `@react-email/components`.

### 11.2 Templates (code)

Create `src/emails/Welcome.tsx`, `Birthday.tsx`, `Campaign.tsx` that render the same layout as `EmailPreview.tsx` (600 px, one column on phones, table-based, Arial and Helvetica fallback fonts, alt text on every image, images under about 100 KB, a visible unsubscribe link). The preview in the Control Room is a faithful sketch; the real templates must be tested in real mail apps (section 14).

### 11.3 Sending a campaign

`POST /api/control-room/campaigns/:id/send` (owner, content):

1. Check the status is `draft` or `scheduled`, and validate subject, body and audience as the composer does.
2. Resolve recipients: leads whose `type` is in `audience_types`, `status <> 'archived'`, `consent = true`, `unsubscribed_at is null`, distinct by email.
3. Insert one `campaign_recipients` row per lead, set the campaign `status = 'sending'`.
4. Send in batches (providers cap a batch, for example 100). Put `campaign_id` and `recipient_id` in the provider's tags so webhooks can find the row. Store the provider's message id in `provider_id`. Add `List-Unsubscribe` and `List-Unsubscribe-Post` headers.
5. When all batches are done set `status = 'sent'` and `sent_at`. If the request could time out, make this route enqueue and return quickly, and let a cron route (11.4) drain the queue.

`schedule` stores `scheduled_for` and `status = 'scheduled'`; `unschedule` returns it to `draft`.

### 11.4 Cron routes

Protect every `/api/cron/*` route with `Authorization: Bearer ${CRON_SECRET}` and use the admin client.

- `/api/cron/send-scheduled` every 5 to 15 minutes: pick campaigns with `status = 'scheduled' and scheduled_for <= now()` and run the send routine. (A hosting plan with only daily cron cannot do this; use Supabase `pg_cron` with `pg_net` to call the route instead.)
- `/api/cron/birthdays` once a day at 07:00 Lagos time (06:00 UTC): find leads where `birth_day` and `birth_month` equal today's date in `Africa/Lagos`, `consent`, not unsubscribed, and no `birthday_sends` row for this year; send the birthday email; insert the `birthday_sends` row (the unique `(lead_id, year)` makes a rerun harmless). In non-leap years, send 29 February birthdays on 28 February.

### 11.5 Webhooks, results and unsubscribe

- `POST /api/webhooks/email`: verify the provider's signature header with the webhook secret, then update `campaign_recipients` (`delivered_at`, `opened_at`, `clicked_at`, `bounced_at`) or `birthday_sends.opened_at`. Bounces and spam complaints also set `leads.unsubscribed_at`. The Control Room's "delivered, opened, clicked" tiles are counts over these columns. (Apple Mail privacy protection inflates "opened"; say so in the UI help text.)
- **Unsubscribe:** the link in every email is `/unsubscribe?t=<signed token>`. Sign `{ leadId }` with an HMAC using `UNSUBSCRIBE_SECRET`; the page verifies it and sets `unsubscribed_at`. It needs no sign-in, and must be one click. Design this page and the thank-you state (section 14).
- **Welcome email:** sent from `/api/leads` with `after()` for `type = 'update'`.

Acceptance: a test campaign to your own address arrives, looks right on a phone, the unsubscribe link works, the Control Room shows delivered then opened; the birthday route sends to a test lead once, and a second run sends nothing.

## 12. Phase 8: images

The brief wants project screenshots (16:10) and partner logos. The prototype has no upload.

1. Create a Supabase Storage bucket `site-media` (public read). Folder layout: `work/<id>.webp`, `partners/<id>.svg|webp`.
2. Handler `POST /api/control-room/uploads` (owner, content): validate type (WebP, PNG, JPEG, SVG for logos), size (screenshots about 150 KB, hard limit 500 KB; logos 100 KB), then return a signed upload URL (`createSignedUploadUrl`). The browser uploads straight to Storage; the handler records `image_path` / `logo_path` on the row.
3. Screens: add an image field to the Work form and the Partner form (preview, replace, remove). Show a warning for files over the budget. Sanitize SVG logos (strip scripts) or accept raster only.
4. Public site: `next/image` with the Storage domain added to `next.config.ts` `images.remotePatterns`.

## 13. Environment variables

| Variable | Used by | Server only? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser and server clients | no |
| `SUPABASE_SECRET_KEY` | `getAdminClient()` (leads route, invites, cron, webhooks, seeding) | **yes** |
| `NEXT_PUBLIC_WA_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_SOCIAL_HANDLE` | public site fallbacks | no |
| `SITE_URL` | invite and password-reset links, unsubscribe links | **yes** |
| `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD`, `SEED_OWNER_NAME` | first-Owner script, then delete | **yes** |
| `RESEND_API_KEY` (or your provider's), `EMAIL_FROM` | email sending | **yes** |
| `EMAIL_WEBHOOK_SECRET` | webhook signature check | **yes** |
| `UNSUBSCRIBE_SECRET` | signing unsubscribe tokens | **yes** |
| `CRON_SECRET` | `/api/cron/*` | **yes** |

Add the non-secret ones to `.env.example` with empty values and a comment. Use separate Supabase projects and keys for development, staging and production.

## 14. Design to-dos

These are decisions and drawings a designer (or the owner with Claude Design) must make. The prototype is code-first, so each item says what to deliver.

### 14.1 Control Room

- **Loading, error and offline states** for every screen (skeleton rows for lists and cards; a retry card; a "your changes were not saved" pattern). Needed in Phase 3.
- **Sign-in family:** the real login, the 6-digit step, MFA enrollment (QR code, the secret as text, a short "what is an authenticator app" help), accept-invite, forgot and reset password, "access removed" and "no access" screens, Owner's "Reset 2-step verification" button with a confirmation.
- **Conflict message** for 409 (8.3) and a permission-denied toast.
- **Dark mode pass.** The tokens switch automatically, but every screen needs an eye check (badges, the striped money bars, the pricing preview frame, the email preview, which is always light on purpose).
- **Tablet (768) and phone (375, 360) pass** for every screen. The prototype is desktop-first and checked mostly at phone and desktop; the board and tables are the risky parts.
- **Density and tables:** decide sort and column controls for Leads and the Activity log once there is real data (the prototype has only filters).
- **Confirmation patterns for money:** the wording of the "record payment" screen and what a "correcting payment" looks like in the list (a visible link between a payment and its correction is optional, the ledger itself was postponed).
- **Optional "Add lead by hand"** (a customer who messages on WhatsApp without using the form) and "Create referrer or partner from a lead" actions.
- **Help text and empty states in plain language** (currently written by the developer, review them).

### 14.2 Emails (three templates)

Welcome (for "keep me updated"), Birthday (greeting, a "10% off, reply on WhatsApp to claim it" block with no code, a grid of four partner cards: photographers, birthday flyer designers, portrait artists, surprise event planners, each with name, line and button) and the Campaign base (header, hero image, body, button, footer). Deliver: final layouts at 600 px and a phone layout, web-safe fonts, alt text on every image, each image under about 100 KB, stills from the 3D scenes for brand continuity, a **dark mode check** (Apple Mail, Gmail app), and test results from real inboxes (Gmail, Outlook desktop, Apple Mail, a phone). Plus the **unsubscribe page** and its confirmation.

### 14.3 Showroom (still open from the designer brief)

- The Light and Still versions of every 3D scene and the poster frames (1920x1080 and 1080x1920, WebP, about 150 KB each) in `public/posters/`; GLB scenes in `public/models/` (Full and Light).
- A reduced-motion design for each scene (a designed still, not just paused motion).
- **Case pages** for Selected Work (`/work/[slug]`: problem, approach, 3 to 5 screenshots, outcome, "Want something like this?" button) and a design for the thin client-logo strip.
- **Support pages:** Privacy Policy, Terms, the newsletter thank-you page, a 404 page.
- **Brand files:** the logo (confirm whether one exists), the brushstroke system (hero stroke, divider, hover underline, loading), a one-page style sheet.
- **Partner logo system:** fixed height, consistent padding, single-colour variant, grey by default and colour on hover.
- **Team photos:** decide yes or no and design both versions of About.
- **Performance check** on a mid-range Android phone over 4G: hero under about 1.5 MB, whole page under about 4 MB, text and the WhatsApp button usable before the 3D loads.
- **Accessibility audit** of the Showroom (focus states, contrast with the green rules, form usable by keyboard).

## 15. Content and decisions only a person can give

- Real prices or ranges for each service and package; the running-costs numbers.
- 4 to 6 finished projects with one result each (ideally a number) and screenshots.
- The partners (so far: 3 known, 2 categories), their logos and one line each.
- The official WhatsApp number, email address and social handles.
- Whether the commission is shown as "Up to 10%" (current choice) or a range.
- Privacy Policy and Terms text, reviewed by someone qualified. The site collects names, emails, phone numbers and birthdays; the Nigeria Data Protection Act 2023 applies. Keep proof of consent (`consent_at`), honour unsubscribe, and decide how a person can ask to see or delete their data (a Control Room action to export or delete a lead is a sensible later feature).
- Who the first Owner is, and who else gets which role.
- Whether to add a second sender address or a reply-to for campaigns.

## 16. Phase 9: hardening and launch checklist

- [ ] All tables have RLS on; the tests in 9.2 pass.
- [ ] Sign-ups are disabled in Supabase; MFA is required (`aal2`) in the policies.
- [ ] Secrets: none in `NEXT_PUBLIC_*`; production keys differ from development keys; the seed variables are deleted.
- [ ] `/api/leads` has a rate limit; the honeypot and validation are intact.
- [ ] Security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`) set in `next.config.ts`; Control Room pages are `noindex` (already) and not in any sitemap.
- [ ] Backups: enable point-in-time recovery on the production Supabase project; do one test restore.
- [ ] Email domain verified (SPF, DKIM, DMARC); unsubscribe works; a test campaign and a test birthday sent.
- [ ] Cron jobs are scheduled and authenticated; a failed run is visible (log or alert).
- [ ] Errors: `console.error` in handlers is sent to a log you read (Vercel logs or a service such as Sentry).
- [ ] `pnpm typecheck && pnpm lint && pnpm build` pass; the permission matrix and accessibility checks are done.
- [ ] Offboarding procedure written: removing a staff member sets `status = 'disabled'` and bans the auth user the same day (the row stays so history keeps names).

## 17. Suggested patch order

| Patch | Contents |
|---|---|
| `0007-supabase-live-leads` | Phase 0 (migration for new `leads` columns, route changes, rate limit). Needs a Supabase project. |
| `0008-staff-auth-mfa` | Phase 1 (proxy, guard, login, MFA, invite, protected layout, seed script). |
| `0009-control-room-schema-rls` | Phase 2 (migrations and seeds) plus the RLS tests. |
| `0010-control-room-data` | Phase 3 (snapshot endpoint, mappers, store swap, loading and error states). |
| `0011-control-room-writes` | Phase 4 (all handlers, client `call()` wrapper, error toasts, conflicts), then Phase 5 (activity, realtime). Split by area if large: leads and deals first. |
| `0012-public-site-content` | Phase 6. |
| `0013-email-and-cron` | Phase 7. |
| `0014-uploads` | Phase 8. |
| `0015-hardening` | Phase 9 items that are code (headers, rate limits, logging). |

Each patch description lists: new dependencies, new environment variables, anything to run after applying (migrations, seed scripts), and the acceptance checks from this file.
