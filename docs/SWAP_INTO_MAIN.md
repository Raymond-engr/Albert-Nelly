# Replacing parts of main with parts from other variants

Audience: an AI assistant asked to change the live site (`/`) by taking parts from `/one`…`/four`. Read `CLAUDE.md`, `docs/SLOTS.md` and the catalog `docs/variants/<name>.md` of every variant you use.

## Principle

Main is a `Slots` map in `src/components/showroom/slots.ts`. A swap changes which component sits in a slot. The variant's code stays in `src/variants/<name>/`, so patches stay tiny and reversible.

## Two ways to swap

**A. Re-point (default).** Change one import in `slots.ts`:

```ts
// before
import Hero from "./Hero";
// after
import Hero from "@/variants/two/Hero";
```

**B. Promote.** Only when the human says "make it permanent": copy the part and its CSS module into `src/components/showroom/`, fix imports, switch `slots.ts` to it, and delete the old main part. Keep the variant folder untouched.

## Steps

1. List the slots the human wants changed and where each should come from.
2. Open the variant's catalog entry for each. Check **Needs** (deps, data fields, scene ids, assets).
3. Check pairings. A `Stage` and the foreground sections must agree on scene ids (`SLOTS.md`, contract 2). A new `RegistrationPanel` must keep `useRegistrationFlow()`.
4. Make the change (A or B).
5. If a part needs new optional data fields, add them to `src/data/` and `src/types/content.ts` **additively**. If it needs a dependency, add it to `package.json` and say so.
6. Visual check at 375, 768 and 1280 px, with and without reduced motion. Open the registration panel and complete each of the four visitor types.
7. `pnpm typecheck && pnpm lint && pnpm build` must pass.
8. Write the patch(es).

## Patch rules

- **One patch per swap**, so the human can take or skip each one. If swap B depends on swap A, say so and number them in order.
- Names: `NNNN-swap-<slot>-from-<variant>.patch`, for example `0003-swap-hero-from-two.patch`. For mixed changes: `NNNN-<short-kebab-description>.patch`.
- Base: the `main` branch as pushed. Each patch must pass `git apply --check` on a clean `main` plus the earlier patches in your numbered list.
- Create them like this:

```bash
git checkout -b swap-hero-from-two main
# ...edit...
git add -A
git diff --cached --binary --no-color main > patches/0003-swap-hero-from-two.patch
git apply -R --check patches/0003-swap-hero-from-two.patch   # sanity: reversible
git reset --hard main
```

- Do not include lockfile churn, formatting-only changes or unrelated edits.
- Append one line per patch to `docs/CHANGELOG-SWAPS.md`: `date | patch name | slots | source | deps added`. This file change goes inside the same patch.

## Your reply must contain

For each patch: its filename, one sentence on what changes visually, new dependencies (or "none"), and anything the human must do after applying (`pnpm install`, copying assets, env vars). Then the apply command:

```bash
git apply patches/0003-swap-hero-from-two.patch
```

## Never

Change a slot's signature, edit another variant, hard-code copy, add secrets, remove the honeypot or the WhatsApp fallback, bypass `useRegistration`, or put a third-party script on the page without telling the human.
