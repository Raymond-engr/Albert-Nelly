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
  - Scroll is scrubbed continuously, so scenes blend instead of snapping. A scene change plays out across the section that introduces it, then holds. The hero blends canvas into wireframe from the first scroll, as in the HTML.
  - Three versions: Full 3D, Light 3D (about 340 triangles per scene) and Still. The mode comes from `useMotionMode()`: it adapts at runtime to the connection, memory, reduced motion and the frame rate this Stage reports, and `NEXT_PUBLIC_MOTION_MODE` pins it in development. Devices with 4 cores or fewer also top out at Light (unless a mode is pinned). Screen width does not matter.
  - Mode changes are live and gradual. Full and Light swap model sets scene by scene with no gap (the old scene stays until its replacement has loaded). Still crossfades from the 3D canvas to the flat posters over 0.6 s. Idle float and pointer tilt (Full only) ease out. The stroke paints once per visit, even after a mode change.
  - The render loop rests while `dim` is set (Selected Work).
  - Desktop pointer tilt and a slow float.
- Weaknesses / rough edges:
  - Models are simple procedural shapes, not an artist's models, and are not Draco or meshopt compressed. The GLBs carry no materials, so three's default metal material is what gives the dark, translucent look. Keep r128 until the GLBs are re-exported with real materials.
  - Still posters for `shp` and `sch` reuse the devices poster. Real posters are not made yet (`public/posters` is empty).
  - The bubble hit area is not tilted with the 3D bubble.
  - Going from Still back to 3D mounts a fresh WebGL canvas and reloads the models, so it takes a moment; the posters stay until the first scene is ready.
  - Not tested on a real phone yet. Checked in desktop Chromium with software rendering (about 12 fps), where the frame-rate rule correctly stepped down to Still.
- Needs: `three-r128`, an alias of `three@0.128.0` (`"three-r128": "npm:three@^0.128.0"`), the exact version the approved HTML prototype rendered with, so the scenes look identical. It is only loaded on `/three`, after first paint. The newer `three` is untouched. GLBs in `public/variants/three/models/` (7 scenes, Full and `-light`). Also uses `src/lib/motion.ts` and `src/hooks/useMotionMode.ts` (already on main).
- Depends on other parts of this variant? none. It reads `data-scene` (and the optional `data-scene-path`) from any section. Services is the only part that uses `data-scene-path`.
- Weight: about 150 KB gzip JS (three r128, loaded after first paint, only when WebGL exists), 2 KB CSS, assets about 238 KB (Full set) or 72 KB (Light set), one set per visitor

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

### Referral  (`src/variants/three/Referral.tsx`, `PhoneChat.tsx`, `PhoneGL.tsx`)
- Looks like: A four-step path whose steps light up as they scroll in, the big "Up to 10%" band with the green "Become a referrer" button under it, and on the right a WhatsApp group chat on a phone. Six messages arrive one by one with typing dots and "is typing…" under the group name, blue ticks after the first reply and a 🎉 reaction on the last message, then it loops.
- Strengths:
  - Three versions from `useMotionMode()`. Full: pop-in bubbles, smooth scroll, and a 3D phone body (three r128) that floats and tilts with the pointer. Light: the same loop with fade-only bubbles and one still 3D render. Still: the finished chat on a flat frame, scrollable by hand (visible scrollbar and a "Scroll up for the start" hint), opening on the last message.
  - Pause button for visitors (Full and Light). The loop also rests while the phone is off screen.
  - The chat text is real DOM. The screen is hidden from screen readers and the same text sits in a visually hidden list.
  - The 3D body reuses the `three-r128` already loaded for the Stage, so no extra download. Without WebGL the flat frame stays.
  - Turning the phone is one line: `POSE` at the top of `PhoneGL.tsx` (straight by default).
- Weaknesses / rough edges:
  - The phone body is built from code (an extruded rounded rectangle and three buttons), not a GLB. A designed model can replace `PhoneGL.tsx` later.
  - The chat screen is a flat DOM element laid over the 3D body with the same `perspective(900px)` and rotation. It stays glued up to about 0.35 rad (20°) of turn; beyond that the 3D edges and the screen drift apart.
  - A second WebGL context runs next to the Stage's (only in Full and Light, only after first paint).
  - In Still the chat scrolls by touch, mouse or trackpad only; keyboard and screen reader users get the hidden list instead.
  - The WhatsApp look is fixed and ignores the site's theme and Blueprint mode.
  - Not seen in a real browser yet: typecheck, lint and a production build pass, but the animation, tilt and scroll behaviour need a visual check at 375, 768 and 1280 px in each mode.
- Needs: `copy.referral.lead` (`data/copy.ts`) and `phoneChat` plus its types (`data/referral.ts`). `three-r128`, `useMotionMode` and `src/lib/motion.ts` (already on main).
- Depends on other parts of this variant? none (`PhoneChat.tsx`, `PhoneGL.tsx` and their CSS module belong to Referral)
- Weight: about 3 KB JS and 2 KB CSS (gzip) for the chat, plus about 2.5 KB JS for the 3D body, loaded after first paint

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
