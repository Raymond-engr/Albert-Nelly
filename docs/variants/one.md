# Variant one catalog
Source prototype: single-file HTML ("Canvas to Code"). White painted canvas, one green brush that writes AN, scenes that assemble on top of the page content. This variant reproduces it exactly: same layout, same wording, same behaviour, light only. It fills all 13 slots and uses nothing from main's look, copy or data (main's Nav, Blueprint toggle and burger menu do not appear).

## How it fits together
- `proto.module.css` is the prototype stylesheet. Every rule is scoped under `.t`, which also re-declares the light tokens, so main's global styles and dark mode cannot change the look. Each part renders inside `<div className={s.t}>`.
- Copy lives in `src/data/one.ts` (the prototype's own placeholder text). Main's data files are untouched.
- Every part is prop-less and reads only `data/one.ts` and the shared providers. Sections still wrap `SceneSection` with a scene id, so main's Stage (or another variant's) works with them too.
- 3D anchors: a section places a `<div data-stage="cv|wire|dev|shp|sch|net|bub">` where an object should appear. The Stage finds these elements by that attribute and ignores `useScene()`. A section without an anchor simply has no object.
- Buttons open the panel through `OpenBtn` (same provider as main's `OpenButton`, with this variant's classes).

## Parts
### Nav (`Nav.tsx`)
- Looks like: transparent logo bar that turns white with blur after 40 px; five section links; one outline button ("Start a conversation", "Talk to us" on phones); a green stroke along the top edge that grows as you scroll.
- Strengths: exactly the prototype header; no Blueprint toggle.
- Weaknesses: no mobile full-screen menu (the prototype has none); the links disappear below 768 px.
- Needs: nothing. Depends on other parts? none.

### Stage (`Stage.tsx`, `stage-gl.ts`, `scenes.ts`, `painting.ts`)
- Looks like: a fixed, click-through 3D layer above the page. The canvas on the hero paints AN once; wireframe, devices and shapes sit on three service cards; cap and board on Schools; threads and handshake on Partners; a "Let's talk" bubble on the Join button. Objects assemble as they scroll in and light up while their card is hovered. The light turns warmer on Schools.
- Strengths: fully procedural (no model files); 30 fps and lower pixel ratio on phones; hidden scenes cost nothing and the loop idles when no object is on screen (Selected Work); reduced motion keeps the scenes but removes sway and paints the finished mark at once; Data Saver or no WebGL gives the Still version (the same stroke on a flat canvas, the other objects hidden, the bubble shown as a green pill).
- Weaknesses: needs the `data-stage` anchors from this variant's sections; only A and N exist in `painting.ts`; three.js r187 lighting is tuned by eye against the prototype's r128 and may need a small adjustment; not tested on a real mid-range Android over 4G.
- Needs: dependency `three` and `@types/three` (already in package.json). Depends on other parts? yes, Hero, Services, Schools, Partners and Join provide the anchors.

### Hero, About, Services, Schools, Work, Referral, Partners, Join, Footer (`*.tsx`)
- Look like: the prototype sections, unchanged. Services has five cards (three carry a 3D object, Art and Painting has the "with our partners" badge). Schools has three package cards with the middle one emphasised, an AI tooltip and a collapsible yearly costs table. Work has All, Design and Development filters over four placeholder projects. Referral is four steps on one stroke whose nodes light up in order. Partners has a logo strip and a "How to partner" card. Join is the bubble button. Footer is the prototype's single placeholder line.
- Strengths: wording and spacing match the prototype; all open the panel with the right visitor type and a context chip.
- Weaknesses: costs, project cards and logos are placeholders; Work sits on a Stage scene with `dim` but the quiet moment really comes from having no anchor.
- Needs: nothing. Depends on other parts? only the Stage anchors above.

### WhatsAppFab (`WhatsAppFab.tsx`)
- Looks like: a dark pill with a green outline, a generic chat icon and "Chat with us". Opens the panel.
- Weaknesses: wider than a round icon button on a 360 px phone.

### RegistrationPanel (`RegistrationPanel.tsx`)
- Looks like: slide-over on desktop, full-screen sheet on phones. Header row with Back, context chip and Close. Four large choices with a line under each, then the form, then "You're in." with a painted underline and a countdown, plus every state in the brief.
- Strengths: uses `useRegistrationFlow()` untouched, so saving, the WhatsApp link and the countdown are main's; keeps the honeypot, `inert` page, Escape, Tab trap and focus on the heading.
- Weaknesses: validation messages and labels are the prototype's, shown for the fields the hook flags (the hook decides what is invalid, so the WhatsApp number is not required for "Just keep me updated"); the copy-number line shows main's configured number.
- Needs: nothing. Depends on other parts? none.
