# Converting an HTML prototype into spare parts

Audience: an AI assistant given (a) this repo and (b) a single-file HTML prototype of the Albert Nelly Showroom. Goal: make the prototype's pieces available as **variant parts** so a human can mix them into main. You do **not** edit main.

Read `CLAUDE.md` and `docs/SLOTS.md` first.

## 0. Pick your variant

The human will tell you: `one`, `two`, `three` or `four`. Everything you create goes under `src/variants/<name>/` (plus one catalog file `docs/variants/<name>.md`). The route `/<name>` already exists and renders `<name>Slots` from `src/variants/<name>/slots.ts`.

## 1. Read the prototype and cut it into slots

Open the HTML and list its regions. Map each to a slot from `docs/SLOTS.md`:

| In the prototype | Slot |
|---|---|
| top bar and menu | `Nav` |
| fixed or sticky 3D / canvas / SVG / animated background | `Stage` |
| first screen | `Hero` |
| about block | `About` |
| the five service cards | `Services` |
| school packages and running costs | `Schools` |
| selected work | `Work` |
| referral path and commission band | `Referral` |
| partner logos and "how to partner" | `Partners` |
| closing invitation and contact | `Join` |
| footer | `Footer` |
| floating WhatsApp button | `WhatsAppFab` |
| slide-over or sheet with the form | `RegistrationPanel` |

If the prototype lacks a slot, do not invent one: leave it out of `slots.ts` (it falls back to main's). If it has extras, ignore them, or mention them in the catalog.

## 2. Build each part

For each slot you convert, create `src/variants/<name>/<Slot>.tsx` as a **default export**, prop-less, following the contracts in `docs/SLOTS.md`.

- **Copy, prices, lists** go to `src/data/` only if they are new or changed. Prefer reusing existing data. If the prototype's wording differs, keep main's data and note the difference in the catalog. Do not fork data per variant.
- **Styles.** Use a CSS Module next to the part (`<Slot>.module.css`). Convert the prototype's CSS; translate colours to tokens (`var(--g)` etc.). Keep layout, spacing, motion timings and easing faithful. Use Tailwind utilities where they are simpler.
- **Scenes.** If the prototype's background changes as the user scrolls, expose it as a `Stage` that reads `useScene()`. In the foreground sections use `<SceneSection scene="…">`. Map the prototype's stages to the seven ids; if it has more, see contract 2 in `SLOTS.md`.
- **Registration.** Convert only the look. Keep `useRegistrationFlow()` for the logic. Replace any prototype `fetch`, `localStorage` or fake delay.
- **Images and models.** Put files in `public/variants/<name>/…`. Images: WebP or AVIF, hero under about 1.5 MB total, whole page under about 4 MB. 3D: GLB with Draco or meshopt, loaded via `next/dynamic` with `ssr: false`, and a `still` poster fallback. If you add `three` or `@react-three/fiber`, say so in the catalog and the patch description.
- **No globals.** Do not edit `globals.css`, `layout.tsx`, `data/` structure, hooks or providers, other than additive optional fields. If you need a new CSS keyframe, put it in the part's module.
- **Self-contained.** A part must work when placed in main with main's other parts, and in its own variant with the other parts from main.

## 3. Register the parts

Edit only `src/variants/<name>/slots.ts`:

```ts
import Hero from "./Hero";
import Stage from "./Stage";
export const oneSlots: Slots = { ...mainSlots, Hero, Stage };
```

## 4. Write the catalog: `docs/variants/<name>.md`

A human and a later AI will use this to choose parts. Use exactly this shape:

```md
# Variant <name> catalog
Source prototype: <what model / file>, <one line on its overall idea>.

## Parts
### <Slot>  (`src/variants/<name>/<Slot>.tsx`)
- Looks like: <2 sentences a designer would use>
- Strengths: <bullets>
- Weaknesses / rough edges: <bullets>
- Needs: <new deps, new data fields, new scene ids, assets in public/variants/<name>/>
- Depends on other parts of this variant? <none | list>   (must be "none" unless unavoidable)
- Weight: <approx KB of JS/CSS/assets added>

## Not converted
<regions of the prototype you left out and why>
```

## 5. Verify

```bash
pnpm install
pnpm typecheck && pnpm lint && pnpm build
pnpm dev   # open /<name>, check mobile width 375 and reduced motion
```

## 6. Deliver a patch

```bash
git checkout -b convert-<name> main
# ...your work...
git add -A
mkdir -p patches
git diff --cached --binary --no-color main > patches/0001-add-variant-<name>.patch
git apply --check patches/0001-add-variant-<name>.patch   # run on a clean checkout of main
git reset
```

Send the `.patch` file and a short summary (parts converted, new deps, known issues). The human applies it with `git apply patches/0001-add-variant-<name>.patch`.
