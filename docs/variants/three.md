# Variant three catalog
Source prototype: Claude (Sonnet 5.5), single-file HTML "Albert Nelly prototype", From canvas to code: one painted stroke becomes a wireframe, devices, shapes, a school, a network and a speech bubble as the page scrolls, with the same story as seven GLB scenes.

## Parts
### Nav  (`src/variants/three/Nav.tsx`)
- Looks like: A transparent bar that turns frosted white after a short scroll. Logo left, links, a Blueprint toggle and a mint "Start a conversation" button on the right.
- Strengths:
  - Meets the Nav contract (`data-inert-on-modal`, Blueprint adds `bp` to `<body>`, OpenButton).
  - Light: no images.
- Weaknesses / rough edges:
  - The prototype had no mobile menu. The compact dropdown "Menu" button was added only to meet the contract.
- Needs: nothing new.
- Depends on other parts of this variant? none
- Weight: about 1 KB JS, 1 KB CSS

### Stage  (`src/variants/three/Stage.tsx`, `StageGL.tsx`, `scenes.ts`, `Stage.module.css`)
- Looks like: A tilted white canvas on the right (top centre on phones) with a green stroke that paints itself once. Scrolling crossfades it into a wireframe, a browser and phone, shapes, a cap and board, two linked threads and a "Let’s talk" bubble. Real GLB scenes when WebGL is available, flat poster layers otherwise.
- Strengths:
  - Scroll is scrubbed continuously, so scenes blend instead of snapping. It follows whatever order the sections have in the page.
  - Three versions: Full 3D, Light 3D (about 340 triangles per scene) and Still. Reduced motion picks Still; phones, data saver and 4 cores or fewer pick Light.
  - The render loop rests while `dim` is set (Selected Work).
  - Desktop pointer tilt and a slow float.
- Weaknesses / rough edges:
  - Models are simple procedural shapes, not an artist's models, and are not Draco or meshopt compressed.
  - Still posters for `shp` and `sch` reuse the devices poster. Real posters are not made yet (`public/posters` is empty).
  - The bubble hit area is not tilted with the 3D bubble.
  - Not tested in a real browser or on a phone yet.
- Needs: `three` (already a dependency). GLBs in `public/variants/three/models/` (7 scenes, Full and `-light`). It sets `THREE.ColorManagement.enabled = false` because the vertex colours are display-ready.
- Depends on other parts of this variant? none. It reads `data-scene` (and the optional `data-scene-path`) from any section. Services is the only part that uses `data-scene-path`.
- Weight: about 150 KB gzip JS (three.js, loaded after first paint, only when WebGL exists), 2 KB CSS, assets about 238 KB (Full set) or 72 KB (Light set), one set per visitor

### Hero  (`src/variants/three/Hero.tsx`)
- Looks like: Big Sora headline, one supporting line, a Sunbeam "Start a conversation" button and a mint "See what we do" button, left-aligned over the canvas.
- Strengths: server component, no JS of its own.
- Weaknesses / rough edges: none known.
- Needs: nothing new.
- Depends on other parts of this variant? none
- Weight: under 1 KB

### Services  (`src/variants/three/Services.tsx`)
- Looks like: A frosted panel with five framed cards, each with a line icon, a "For" line, a price line and a "Talk to us" button. Art and Painting carries the "with our partners" badge.
- Strengths:
  - Hover (desktop) or scrolling a card into view (phones) lights up its 3D object.
  - Price line may be absent.
- Weaknesses / rough edges:
  - Card order follows `data/services.ts` (Art first), not the prototype order.
  - The Stage only walks wireframe, devices, shapes if Services is its own Stage. With main's Stage the extra attributes are ignored.
- Needs: optional field `copy.services.lead` (added to `data/copy.ts`).
- Depends on other parts of this variant? none (it fires a `window` event the variant's Stage listens for; nothing breaks without it)
- Weight: about 2 KB JS, 1 KB CSS

### Schools  (`src/variants/three/Schools.tsx`)
- Looks like: Three framed package cards, the middle one outlined in green and lifted, each with "See all features". A collapsed "Yearly running costs" table sits below. The AI assistant line has a tooltip.
- Strengths: server component. The comparison stays readable at 360 px.
- Weaknesses / rough edges: the running costs table is collapsed on every screen size (the prototype did the same).
- Needs: nothing new.
- Depends on other parts of this variant? none
- Weight: under 1 KB JS, 1 KB CSS

### Referral  (`src/variants/three/Referral.tsx`)
- Looks like: A four-step path whose steps light up as they scroll in, the big "Up to 10%" band, and a small sample group chat. One green "Become a referrer" button.
- Strengths: uses `OpenButton type="refer"`.
- Weaknesses / rough edges: the chat bubbles are sample text (Ada, a school portal) and should be replaced with real wording.
- Needs: optional fields `copy.referral.lead` and `copy.referral.chat` (added to `data/copy.ts`).
- Depends on other parts of this variant? none
- Weight: about 1 KB JS, 1 KB CSS

### Join  (`src/variants/three/Join.tsx`)
- Looks like: A frosted card at the bottom of the screen with the invitation, one Sunbeam button and the contact lines.
- Strengths: the real button is DOM text, so nothing essential lives only in the 3D bubble.
- Weaknesses / rough edges: none known.
- Needs: nothing new.
- Depends on other parts of this variant? none
- Weight: under 1 KB

### Footer  (`src/variants/three/Footer.tsx`)
- Looks like: One quiet line with name, WhatsApp number, email, Privacy and Terms.
- Strengths: tiny. Weaknesses / rough edges: Privacy and Terms are placeholder links.
- Needs: nothing new.
- Depends on other parts of this variant? none
- Weight: under 1 KB

### WhatsAppFab  (`src/variants/three/WhatsAppFab.tsx`)
- Looks like: A green "Chat with us" pill fixed bottom right.
- Strengths: opens the registration panel, as the contract requires.
- Weaknesses / rough edges: none known.
- Needs: nothing new.
- Depends on other parts of this variant? none
- Weight: under 1 KB

### RegistrationPanel  (`src/variants/three/RegistrationPanel.tsx`)
- Looks like: A slide-over (full-width on phones) with four large choices, then a short form. After saving, a success screen with a countdown and a large Open WhatsApp button.
- Strengths:
  - Skin only: `useRegistrationFlow()` is untouched.
  - Keeps the dialog role, labelled heading, Escape, focus on step change, honeypot, optional birthday and the copy-number fallback.
- Weaknesses / rough edges:
  - Success and button wording follows the prototype, not main's panel.
  - There is no Back link (the prototype had none).
- Needs: nothing new.
- Depends on other parts of this variant? none
- Weight: about 3 KB JS, 2 KB CSS

## Not converted
- About, Work and Partners: the prototype has no such sections, so they fall back to main's.
- Copy differences kept as main's: section titles ("What we do.", "Introduce someone. Earn when the deal closes."), the Schools lead, referral step text and card order. The prototype used slightly different wording.
- Page order: the prototype placed Referral before Schools. `Showroom.tsx` fixes Schools before Referral, so the Stage follows that order. Swapping them is a separate one-line patch to `Showroom.tsx`.
- Hero and Join: the prototype's text wrapper shrank to its content, which centred the text. Here it is full width, so the text stays left-aligned.
