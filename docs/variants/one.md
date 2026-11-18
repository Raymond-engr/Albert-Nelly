# Variant one catalog
Source prototype: single-file HTML (Claude, Three.js r128 from a CDN), "Canvas to Code": a white painted canvas where one green brush writes the letters AN, then becomes a wireframe, devices, orbiting shapes, a school, a network and a speech bubble.

## Parts
### Stage  (`src/variants/one/Stage.tsx`, `StageGL.tsx`, `StillArt.tsx`, `painting.ts`, `scenes.ts`, `Stage.module.css`)
- Looks like: A white canvas floats in the right half of the screen (lower middle on phones). A single green brush paints the letters AN in about three seconds, once. On each scene change the objects fly in and assemble: wireframe screen, browser and phone, orbiting shapes, cap and board with a warmer light, six logo tiles joined by threads to an abstract handshake, and a "Let's talk" bubble.
- Strengths:
  - Renders all seven scene ids, driven only by `useScene()`; honours `dim` by fading and then pausing the render loop.
  - Fully procedural: no model files, so no download beyond three.js itself.
  - Three tiers: full 3D, a designed Still poster (reduced motion, data saver, no WebGL, and while 3D loads), and 30 fps and lower pixel ratio on phones.
  - Desktop pointer tilt; render loop pauses when the tab is hidden.
- Weaknesses / rough edges:
  - The Still poster is one image (the blank canvas, or the finished AN mark). It does not change per scene.
  - Earlier scenes do not stay as a faint trace; they scatter and hide.
  - Only the letters A and N are defined in `painting.ts`. Another mark needs new stroke paths.
  - There is no Light tier between Full and Still beyond pixel ratio, frame cap and no antialiasing on phones.
  - Not yet tested on a real mid-range Android over 4G.
- Needs: new dependency `three` (runtime) and `@types/three` (dev). No new data fields, no new scene ids, no public assets.
- Depends on other parts of this variant? none
- Weight: about 5 KB of own code; three.js adds roughly 150 to 200 KB gzipped, in its own chunk, loaded only when the device can run 3D.

### Referral  (`src/variants/one/Referral.tsx`)
- Looks like: A single vertical green stroke runs down the left of the four steps. Each step has a node on the stroke that fills green as the step passes the lower part of the screen, and dims again when scrolled back.
- Strengths: calm, one column, works at 360 px; reads from `data/referral.ts` and `copy.referral`; respects reduced motion.
- Weaknesses / rough edges: the commission line sits under the steps (the prototype order) rather than in a band above them; the single column leaves empty space on wide screens.
- Needs: nothing.
- Depends on other parts of this variant? none
- Weight: under 1 KB of CSS and JS.

### WhatsAppFab  (`src/variants/one/WhatsAppFab.tsx`)
- Looks like: A dark pill with a green outline, a generic chat icon and the words "Chat with us". Opens the registration panel.
- Strengths: the label tells first-time visitors what the button does; contrast is high on any background.
- Weaknesses / rough edges: wider than main's round button, so it covers more of the page on a 360 px phone; the label is English only.
- Needs: nothing.
- Depends on other parts of this variant? none
- Weight: under 1 KB.

### RegistrationPanel  (`src/variants/one/RegistrationPanel.tsx`)
- Looks like: A slide-over on desktop and a full-screen sheet on phones. Back, the context chip and Close sit in one header row. Step 1 is four large rounded choices. Success headings get a painted green underline; the save button shows a stroke sweeping across while saving.
- Strengths: keeps `useRegistrationFlow()` untouched; keeps the dialog role, labelled heading, Escape, focus on the heading on every step, all four visitor types, optional birthday, honeypot, Open WhatsApp button and copy-number link; Sunbeam is used for the single primary action on each step.
- Weaknesses / rough edges: the prototype's one-line descriptions under each choice were not carried over, because they would be new copy; Back now lives in the header instead of under the form; no focus trap beyond the page being `inert`.
- Needs: nothing.
- Depends on other parts of this variant? none
- Weight: about 3 KB of JS and CSS.

## Not converted
- **Nav**: the prototype's top bar has no mobile menu and no Blueprint toggle, which the Nav contract requires. Main's Nav stays.
- **Hero, About, Services, Schools, Work, Partners, Join, Footer**: the prototype's versions carry the same content as main's with only small layout differences (a different hero line, an All filter on Work, a footer that is one placeholder line). Main's data and parts win, and forking them would only duplicate code. The prototype's scene anchoring (each section hosting its own 3D object) does not fit the fixed Stage contract, so it was replaced by `Stage` reading `useScene()`.
