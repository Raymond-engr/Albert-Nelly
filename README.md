# Albert Nelly: Showroom

Scroll-driven public site for Albert Nelly, plus the plumbing for the Control Room later.
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase.

## Run it

```bash
pnpm install        # or npm install
cp .env.example .env.local
pnpm dev            # http://localhost:3000
```

Without Supabase keys the site runs in **demo mode**: the registration form works end to end and opens WhatsApp, but nothing is saved. In development, an email starting with `fail` simulates a network error.

## Motion modes

Animation runs in three modes: **full**, **light** and **still**. By default the site adapts at runtime to the connection (data saver, 2G/3G, slow round trips), low memory, reduced motion and the frame rate it actually achieves. Changes are gradual: down one mode per second, up only after a better connection has held for 6 seconds. Browsers without the Network Information API (Safari, Firefox) adapt by frame rate and reduced motion only.

To test one mode in development, add this to `.env.development.local` and restart `pnpm dev`:

```
NEXT_PUBLIC_MOTION_MODE=still   # full | light | still. Empty or missing = adapt.
```

Production builds ignore it. The current mode is on `<html data-motion>` and logged in the console in development. Logic: `src/lib/motion.ts`, hook: `src/hooks/useMotionMode.ts`.

## Connect Supabase

1. Create a project. Run `supabase/migrations/20261118000000_create_leads.sql` in the SQL editor (or `supabase db push`).
2. Put the project URL, the publishable key and the secret key in `.env.local` (names in `.env.example`).
3. Submit the form. The row appears in `public.leads`. A repeat email updates the row and shows "Welcome back".

`src/lib/supabase/` has three clients: `admin.ts` (server only, used by `/api/leads`), `server.ts` (cookie-aware, for Control Room auth) and `client.ts` (browser). The Control Room will add a `proxy.ts` to refresh sessions.

## Routes

| Route | What it is |
|---|---|
| `/` | **Main**: the site that ships |
| `/one` `/two` `/three` `/four` | **Spare parts** from other design iterations (empty shells, noindex) |

## Structure

```
src/
  app/                 routes, globals.css (tokens), api/leads
  components/
    showroom/          main's slots (Nav, Stage, Hero … RegistrationPanel) + slots.ts
    shared/            OpenButton, SceneSection (used by every slot)
    ui/                Button
  variants/<name>/     spare parts per iteration + slots.ts
  data/                all copy, prices, lists
  hooks/ providers/    scene + registration logic
  lib/                 validation, WhatsApp link, lead submit, Supabase clients
docs/                  SLOTS.md, CONVERT_PROTOTYPE.md, SWAP_INTO_MAIN.md
supabase/migrations/   SQL
patches/               .patch files from AI assistants
```

## Mixing iterations

Give an AI assistant this repo's GitHub link and `CLAUDE.md`. It will convert a prototype into `src/variants/<name>/` or swap parts into main, and hand back `.patch` files:

```bash
git apply --check patches/0003-swap-hero-from-two.patch && git apply patches/0003-swap-hero-from-two.patch
```

## Notes

- **TypeScript 6, not 7.** TypeScript 7 (native) is released but has no programmatic API until 7.1, which Next.js and ESLint tooling still use. Move to 7.x once `next build` and `typescript-eslint` support it.
- **Fonts** (Sora, Inter) are fetched by `next/font` at build time and self-hosted. No runtime request to Google.
- **Assets.** Put posters in `public/posters/` (WebP, about 150 KB each) and models in `public/models/` (GLB, Draco or meshopt). Nothing ships there yet.
- **Not verified here.** This was written without network access, so `pnpm install && pnpm build` has not been run. If the first build reports a type or lint error, send it back with the output.
