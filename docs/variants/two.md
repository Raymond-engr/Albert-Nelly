# Variant two catalog
Source prototype: single-file HTML (Claude, Three.js r128 from a CDN, `albert-nelly-prototype.html`), a scroll-scrubbed 3D story: a white canvas is painted by one bristle brushstroke, then becomes a wireframe, a browser and phone, orbiting shapes, a cap and board, partner tiles joined by threads, and a speech bubble.

## Parts
### Stage  (`src/variants/two/Stage.tsx`, `StageGL.tsx`, `world.ts`, `Stage.module.css`)
- Looks like: A white canvas floats in soft mint light on the right half of the screen (upper part on phones). A 28-bristle green brushstroke paints across it once, about 3 seconds after load. The camera then travels along a path as the visitor scrolls: the stroke becomes a wireframe screen, a browser and phone, slow orbiting shapes, a cap and classroom board with a lower camera, six partner tiles with threads and an abstract handshake, and a "Let's talk" speech bubble.
- Strengths:
  - Fully procedural: no model files, so nothing downloads except three.js. The stroke is drawn live into a canvas texture.
  - Scrubbed to scroll with light smoothing. The timeline is read from the section ids in `SLOTS.md`; a missing id is skipped.
  - Honours `dim`: fades to 12% and pauses the render loop (Selected Work). Reads `scene` to pulse the object of the service card being hovered or mid-screen.
  - Three modes: Full, Light (pixel ratio 1, half the orbit shapes) and Still (no idle motion or smoothing, stroke already painted). The mode comes from `useMotionMode()`: it adapts at runtime to the connection, memory, reduced motion and the frame rate this Stage reports, and `NEXT_PUBLIC_MOTION_MODE` pins it in development. Changes are smooth: idle motion fades, scroll smoothing relaxes and the extra orbit shapes shrink away.
  - Tapping the speech bubble opens the registration panel through `useRegistration().open()`.
  - Desktop pointer tilt only when the pointer is fine; render loop pauses when the tab is hidden; falls back to a mint gradient when WebGL is unavailable.
- Weaknesses / rough edges:
  - The Still mode freezes the live scene. It is not yet a set of poster frames that crossfade per scene.
  - The scene follows scroll position through section ids, not only `useScene()`. A section without its contract id will not move the story. The scene id is used only for the service-card pulse.
  - The four referral nodes read `#referral li` from the DOM. A Referral part without an `ol` of `li` steps leaves them unlit.
  - Not tested on a real mid-range Android over 4G.
- Needs: no new dependency (`three` and `@types/three` are already in `package.json`). No new scene ids, no public assets. Needs `src/lib/motion.ts` and `src/hooks/useMotionMode.ts` (patch 0002).
- Depends on other parts of this variant? none
- Weight: about 9 KB of own code; three.js is a separate chunk, loaded after first paint.

### Nav  (`Nav.tsx`, `Nav.module.css`)
- Looks like: An "AD" monogram placeholder (two letters overlapping, the D in green), five underlined-on-hover links and a green "Start a conversation" button. Transparent over the 3D, turning translucent with a blur after 40 px of scroll.
- Strengths: brush-underline hover; keeps `data-inert-on-modal`, a full-screen mobile menu and the Blueprint toggle that main's Nav provides.
- Weaknesses / rough edges: the mobile menu and Blueprint toggle are not in the prototype; they were added only to satisfy the Nav contract. The monogram is text, to be replaced by the real logo SVG.
- Needs: nothing.
- Depends on other parts of this variant? none
- Weight: about 1 KB.

### Hero  (`Hero.tsx`, `Hero.module.css`)
- Looks like: A large headline, one supporting line and two buttons (Sunbeam "Start a conversation", outline "See what we do") on the left, leaving the canvas free on the right. Bottom-anchored on phones.
- Strengths: server component; one Sunbeam button; no reveal animation, so the stroke is the one moment.
- Weaknesses / rough edges: none known.
- Needs: nothing.
- Depends on other parts of this variant? none
- Weight: under 1 KB.

### About  (`About.tsx`, `About.module.css`)
- Looks like: One framed translucent card with a heading, a paragraph and the facts as a small list. It fades up once when it enters the screen.
- Strengths: respects reduced motion (no movement).
- Weaknesses / rough edges: client component, only for the one-time reveal. The card is invisible until it hydrates.
- Needs: nothing.
- Depends on other parts of this variant? none
- Weight: under 1 KB.

### Services  (`Services.tsx`, `Services.module.css`)
- Looks like: One scroll chapter per service, about half a screen tall, each with a translucent framed card on the left. The card in the middle of the screen (or hovered) gets a green border, lifts slightly and pulses its 3D object.
- Strengths: card order follows the 3D story; price line is optional; the badge shows as a chip.
- Weaknesses / rough edges: five tall chapters make the section long. Order comes from `data/services.ts` (Art and Painting first), while the prototype put UI/UX first.
- Needs: nothing.
- Depends on other parts of this variant? none (pairs best with variant two's Stage, but works with any Stage)
- Weight: about 1 KB.

### Schools  (`Schools.tsx`, `Schools.module.css`)
- Looks like: Three framed package cards side by side, the featured one with a thick green border and a Sunbeam button. Checklist with ticks, a "See all features" expander, an AI tooltip, and a collapsed "Yearly running costs" table below.
- Strengths: server component; no client JavaScript; the table is collapsed by default, which suits phones.
- Weaknesses / rough edges: the running-costs table is closed on desktop too (main's opens it).
- Needs: nothing.
- Depends on other parts of this variant? none
- Weight: under 1 KB.

### Work  (`Work.tsx`, `Work.module.css`, `WorkFrames.tsx`, `WorkGallery.tsx`, `WorkViewer.tsx`, `WorkCompare.tsx`, `WorkPic.tsx`)
- Looks like: four pill tabs (Design, Development, Paintings, Photography) that scroll sideways on a phone. Design and Development are framed cards with a mint 16:10 tile: Design shows screens in a phone or laptop frame (swipe or arrows, dots); Development shows a browser frame whose page scrolls (mouse hover in Full mode, or the Preview button) with a phone shot in the corner. Paintings and Photography are a gallery wall that keeps each piece at its own proportions, with a viewer (Enlarge). A piece with two images and `compare` gets a before/after divider (left before, right after), a piece with `stages` gets a stage slider, several `photos` make a set with a count badge, and one image shows plain with no divider. One call-to-action button sits under each gallery and in the viewer. The Stage dims while this section is on screen.
- Strengths: the divider takes horizontal drags and leaves vertical swipes to the page; tap jumps it; arrow keys work on the handle; one gentle nudge in Full mode only; Still mode has no auto-scroll, nudge, crossfade or transitions; the viewer is a native dialog (Esc, focus kept inside, background inert); no new dependencies.
- Weaknesses / rough edges: placeholder art (drawn SVG in `public/work/placeholder/`) and CSS-drawn placeholder screens until real images are added; the Preview button overlaps the corner of the browser frame; the viewer needs the buttons or arrow keys to change slide on divider and stage pieces.
- Needs: new `src/data/gallery.ts`; optional fields on `WorkItem` (`frame`, `screens`, `prototype`, `url`, `shot`, `mobile`) and a `WorkPhoto` and `GalleryItem` type in `src/types/content.ts`; `copy.work.ui` in `src/data/copy.ts`; images in `public/work/`. Shared `WorkCategory` and the admin work type are unchanged, so gallery items are not in the control room yet.
- Depends on other parts of this variant? none
- Weight: about 18 KB of source, no new packages.

### Referral  (`Referral.tsx`, `Referral.module.css`)
- Looks like: A heading, four dashed step cards that turn solid mint with a green border as they pass the upper part of the screen (and dim when scrolled back), then a large "Up to 10%" band and a green "Become a referrer" button.
- Strengths: reversible on scroll; the 3D nodes in the Stage light with the same steps.
- Weaknesses / rough edges: scroll listener without throttling (state only changes when a step crosses the line).
- Needs: nothing.
- Depends on other parts of this variant? none
- Weight: under 1 KB.

### Partners  (`Partners.tsx`, `Partners.module.css`)
- Looks like: A row of grey logo tiles that turn to full colour on hover or focus. Clicking one opens a small card with its name, a note and a link. A "How to partner" card follows, with the three steps and a green "Partner with us" button.
- Strengths: tile container is a fixed height with consistent padding.
- Weaknesses / rough edges: text placeholders instead of logos; no single-colour logo variant yet.
- Needs: two new optional fields in `data/copy.ts`: `partners.tileNote` and `partners.tileLink`.
- Depends on other parts of this variant? none
- Weight: under 1 KB.

### Join  (`Join.tsx`, `Join.module.css`)
- Looks like: A heading, one line, a Sunbeam "Let's talk" button and the contact details, with the speech bubble in the Stage beside it.
- Strengths: server component; one Sunbeam button.
- Weaknesses / rough edges: none known.
- Needs: nothing.
- Depends on other parts of this variant? none
- Weight: under 1 KB.

### WhatsAppFab  (`WhatsAppFab.tsx`)
- Looks like: A round 58 px green button with a generic chat bubble, bottom right, clear of the safe area.
- Strengths: opens the panel (never links straight to WhatsApp); keeps `data-inert-on-modal`.
- Weaknesses / rough edges: close to main's version; the only differences are size and shadow.
- Needs: nothing.
- Depends on other parts of this variant? none
- Weight: under 1 KB.

### RegistrationPanel  (`RegistrationPanel.tsx`, `RegistrationPanel.module.css`)
- Looks like: A slide-over on desktop and a full-screen sheet on phones. Step 1 is four large rounded choices. The form has inline errors and a stroke-sweep loader while saving. The success screen shows the exact WhatsApp message in a chat bubble, a countdown, a Sunbeam "Open WhatsApp" button and a "Copy our number" button.
- Strengths: keeps `useRegistrationFlow()` untouched; keeps the dialog role, labelled heading, Escape, focus on the heading on every step, all four visitor types, optional birthday, honeypot, Open WhatsApp button and copy-number button. Page behind is inert while open.
- Weaknesses / rough edges: there is no Back button (the prototype had none). The prototype's test triggers ("fail" and "back" in the email field) are gone; the real hook handles network errors and returning visitors.
- Needs: nothing.
- Depends on other parts of this variant? none
- Weight: about 2 KB.

## Wording differences (data is main's, per CONVERT_PROTOTYPE.md)
The prototype's own wording was replaced by `src/data/` in these places: hero lead; About title, body and facts; the service order and prices; the School packages lead (not shown) and "See all features"; the running-costs amounts; Referral title and step text; Partners lead (not shown) and how-to text; Join heading and button; form headings; the partner category field (a select here, free text in the prototype).

## Not converted
- Footer: the prototype has none, so main's Footer stays.
- Prototype footnote ("Prices shown are placeholders..."): scaffolding text, not site copy.
- Case pages, the thin client-logo strip, and the Light/Still poster images: not in the prototype.
