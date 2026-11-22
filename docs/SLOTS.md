# Slots: the map of swappable parts

The Showroom is a list of **slots**. `src/components/showroom/Showroom.tsx` renders them in a fixed order from a `Slots` map (`src/types/slots.ts`). Main uses `mainSlots`; each variant exports its own map, which starts as a copy of main's. To swap a part, you change which component sits in the map.

## The slots

| Slot | Main file (`src/components/showroom/`) | Kind | Reads | Must provide |
|---|---|---|---|---|
| `Nav` | `Nav.tsx` | client | `data/site.ts` | `data-inert-on-modal` on the `<nav>`; a mobile menu; Blueprint toggle (adds class `bp` to `<body>`); an `OpenButton` |
| `Stage` | `Stage.tsx` + `StageGL.tsx` + `scenes.ts` | client | `useScene()` | fixed background; GLB scenes over a flat poster rig (the Light and Still versions); reads `[data-scene]` sections and, while the Hero's slides are on screen, `[data-stage-slides]`; `aria-hidden`; no content |
| `Hero` | `Hero.tsx` | client | `data/copy.ts` | four scroll-driven slides on a tall track; sets `data-stage-slides`, `data-stage-scene` and `data-stage-slide` for the Stage; no 3D of its own; slide 2 shows its ruler and blueprint outlines; one Sunbeam `OpenButton` per slide |
| `About` | `About.tsx` | server | `data/copy.ts` | `id="about"`; `scene="cv"` |
| `Services` | `Services.tsx` | client | `data/services.ts` | `id="services"`; one card per service; each card switches the scene (hover and in view); price line may be absent |
| `Schools` | `Schools.tsx` + `RunningCosts.tsx` | server + client | `data/packages.ts` | `id="schools"`; `scene="sch"`; 3 packages; running costs table, collapsed on phones; AI tooltip |
| `Work` | `Work.tsx` | client | `data/work.ts` | `id="work"`; `scene="sch"` **with `dim`**; Design and Development tabs; must look good with 4 items |
| `Referral` | `Referral.tsx` | client | `data/referral.ts` | `id="referral"`; `scene="net"`; four steps; "Up to 10%" band; `OpenButton type="refer"` |
| `Partners` | `Partners.tsx` | server | `data/referral.ts` | `id="partners"`; `scene="net"`; 5 to 10 logo tiles; `OpenButton type="partner"` |
| `Join` | `Join.tsx` | server | `data/copy.ts`, `data/site.ts` | `id="join"`; `scene="bub"`; one Sunbeam `OpenButton` |
| `Footer` | `Footer.tsx` | server | `data/site.ts` | `data-inert-on-modal` |
| `WhatsAppFab` | `WhatsAppFab.tsx` | client | `useRegistration()` | `data-inert-on-modal`; opens the panel (never links straight to WhatsApp) |
| `RegistrationPanel` | `RegistrationPanel.tsx` | client | `useRegistrationFlow()` | skin only; see below |

## The five contracts (this is what makes parts interchangeable)

1. **Prop-less.** Every slot is `() => JSX`. All content comes from `src/data/`. If a new part needs a new field, add it as an **optional** field in `data/` and `types/content.ts`. Never rename or remove an existing field.
2. **Scenes.** The background is independent of the foreground. A foreground section declares the scene it wants with `<SceneSection scene="…">` or the `useSceneOnView` hook. Scene ids: `cv` canvas, `wire` wireframe, `dev` devices, `shp` shapes, `sch` school, `net` network, `bub` speech bubble (`src/types/scene.ts`). A new `Stage` must render all seven ids, or degrade gracefully. If a variant invents an eighth scene, extend `SceneId` in a separate, additive patch.
3. **Registration.** Open the panel only through `<OpenButton>` or `useRegistration().open({ type, ctx, pre })`. Never build your own modal or fetch call. A replacement panel keeps `useRegistrationFlow()` and changes only the markup and CSS. It must keep: a dialog role, labelled heading, Escape to close, focus on the heading when a step changes, all four visitor types, optional birthday, the honeypot field, the Open WhatsApp fallback button and the copy-number link.
4. **Anchors and inert.** Section ids above are linked from the Nav. Elements marked `data-inert-on-modal` are made `inert` while the panel is open.
5. **Styling.** Use design tokens (`var(--ink)`, `var(--g)`, Tailwind `text-ink`, `bg-brand`, …) from `globals.css`; never raw hex except for brand constants inside SVG art. Slot-specific CSS lives in a `*.module.css` next to the component so it cannot leak. Shared look (`.card`, `.chip`, `.note`, `.price`, `.ck`, `.wrap`, `.col`, `.section`, `buttonClass()`) may be reused, never redefined.

## Server or client?

Default to server components. Add `"use client"` only for state, effects, observers or event handlers. Sections that only need to tell the Stage their scene stay server components by wrapping their content in `<SceneSection>` (a client component that accepts server children).

## Performance budget

First load JS for `/` should stay small. No animation library in main. Any heavy asset (three.js, GLB, video) is loaded with `next/dynamic` (`ssr: false`) from inside the slot that needs it, after first paint, with a still poster as fallback.

## Motion modes (Full, Light, Still)

Every `Stage` reads `useMotionMode()` (`src/hooks/useMotionMode.ts`) and honours all three modes: **full** (everything), **light** (no pointer tilt or idle float; cheaper rendering and fewer objects for 3D) and **still** (stroke already painted, no idle motion; scene changes still crossfade). The mode changes while the page is open, so a Stage reacts to changes and never reads it once. A 3D Stage calls `reportFps(fps)` from `src/lib/motion.ts` about every two seconds while it renders, so a slow device steps down by itself.

Selection lives in `src/lib/motion.ts`: reduced motion, data saver, a slow connection or low memory set a ceiling, and a low frame rate lowers it further. In development only, `NEXT_PUBLIC_MOTION_MODE=full|light|still` pins the mode. Production builds ignore it.
