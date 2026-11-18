# Albert Nelly: instructions for AI assistants

You are working on the Showroom (public site) for Albert Nelly, a tech agency. Read this file first, then the doc for your task.

## Which task are you doing?

| Task | Read |
|---|---|
| Turn an HTML prototype into reusable spare parts | `docs/CONVERT_PROTOTYPE.md` |
| Replace parts of the live site (`/`) with parts from a variant | `docs/SWAP_INTO_MAIN.md` |
| Understand what each part is and what it may touch | `docs/SLOTS.md` |

## Stack (do not change without saying so in your reply)

Next.js 16 (App Router, `src/`), React 19, TypeScript strict, Tailwind CSS v4, CSS Modules for slot-specific styles, Supabase (`@supabase/ssr`, `@supabase/supabase-js`). No animation library by default. Fonts through `next/font`.

## Where things live

- `/` is **main**. Its parts are in `src/components/showroom/` and are wired together in `src/components/showroom/slots.ts`.
- `/one`, `/two`, `/three`, `/four` are **variants** (spare parts). Their parts are in `src/variants/<name>/`.
- Copy, prices and lists live in `src/data/`. Never hard-code them in a component.
- Registration logic is in `src/hooks/useRegistrationFlow.ts`. Saving goes through `src/lib/leads.ts` to `/api/leads` to Supabase.

## Golden rules

1. A slot is prop-less and self-contained. Never change the signature of a slot or of a shared hook.
2. Touch only what your task names. One patch, one purpose.
3. Be light: no new dependency unless the task needs it. Say so in your reply and in the patch description.
4. Text and buttons are real DOM text. Nothing essential lives only in 3D or in an image.
5. Every slot must survive `prefers-reduced-motion` and a 360 px wide phone.
6. Never put secrets in `NEXT_PUBLIC_*` variables. `SUPABASE_SECRET_KEY` is server only.
7. Before you finish: `pnpm typecheck && pnpm lint && pnpm build` (or the npm equivalents) must pass.
8. Deliver changes as `.patch` files that apply with `git apply` on the `main` branch. Format and naming are in `docs/SWAP_INTO_MAIN.md`.

## Brand in one paragraph

White leads, green signs. Albert Green `#12B76A` is for fills and the brushstroke, never for white text on it. Deep green `#0A7D4A` for green text on white. Forest Night `#06281E` for body text and text on green or yellow buttons. One Sunbeam `#F7B733` button per screen at most. Sora for headings, Inter for body. Buttons say "Talk to us", never "Buy now". Prices are in naira and negotiable.
