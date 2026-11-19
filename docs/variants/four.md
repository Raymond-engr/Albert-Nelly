# Variant four catalog
Source prototype: single-file HTML (Claude, vanilla JS and inline SVG, no libraries, `albert-nelly-hero.html`), "From stroke to chat": one sticky screen scrubbed by scroll. A white canvas is painted by one rough green stroke, which becomes a wireframe, then a phone and a browser, then a "Let's talk" bubble. Tapping the bubble opens a chat that asks the registration questions one at a time. Look: about 70% sharp tech (a faint grid, tight Sora, crisp wireframes), 30% art (the painted stroke).

## Parts
### Hero  (`src/variants/four/Hero.tsx`, `Hero.module.css`)
- Looks like: A 430 svh scroll track with one sticky screen on a faint grid and mint glow. The canvas is on the right (above the text on phones). A rough green stroke paints once, about 3 seconds after load (it never loops). Four captions swap as you scroll: the headline with "See what we do" and one Sunbeam "Start a conversation"; "It starts with one stroke."; "Then we make it real."; "Tell us what you're building." with the bubble. A small tick rail shows the scene.
- Strengths:
  - No dependency and no model files: SVG and CSS only (about 7 KB of JS and CSS). One rAF loop that sleeps when the scroll has caught up.
  - Declares `<SceneSection scene="cv">`. All text and buttons are real DOM text; the SVG has a text label and the bubble is a keyboard-reachable button that calls `useRegistration().open()`.
  - Reduced motion is a designed still: the stroke is already painted, there is no float or tilt, and the scenes cross-fade instantly.
  - Inactive captions are `inert`, so their buttons are not reachable by keyboard.
  - Opaque stage background, so main's fixed `Stage` art never shows through it.
- Weaknesses / rough edges:
  - The "3D" is 2D SVG with a pointer tilt (desktop only). It shows the story and timing, not real depth. Light and Still posters for each scene are not built.
  - Only 4 of the 7 scenes (canvas, wireframe, devices, bubble). Shapes, cap and board, and partner threads are not in the prototype.
  - Scrolling past the track continues with main's sections, so the next section's scene comes from main's `Stage`.
  - Not tested on a real mid-range Android over 4G.
- Needs: optional fields `story` in `src/data/copy.ts`. No deps, no assets, no new scene ids.
- Depends on other parts of this variant? none (reserves 64 px at the top for a fixed Nav)
- Weight: about 7 KB.

### Nav  (`Nav.tsx`, `Nav.module.css`)
- Looks like: The prototype's logo (a green stroke and "Albert Nelly") on the left and an outlined "Start a conversation" button on the right. Transparent over the hero, translucent with a blur after 40 px of scroll.
- Strengths: keeps `data-inert-on-modal`, a full-screen mobile menu with a large Sunbeam button, and the Blueprint toggle that main's Nav provides.
- Weaknesses / rough edges: the links, the Blueprint toggle and the burger menu are not in the prototype; they were added only to satisfy the Nav contract. Under 520 px the nav button is hidden (the menu and the hero both carry it). Position is `fixed`, so a Hero that does not reserve 64 px at the top will sit under it.
- Needs: nothing.
- Depends on other parts of this variant? none (pairs best with variant four's Hero)
- Weight: about 2 KB.

### RegistrationPanel  (`RegistrationPanel.tsx`, `RegistrationPanel.module.css`)
- Looks like: A full-screen sheet on phones and a 440 px slide-over on desktop. A header with "Let's talk" and Close, a chat log (mint bubbles for questions, green for answers) and an input area below. Step 1 is four large choices. Then one question at a time: name, WhatsApp, email, (service or business and category), birthday (optional, with a skip), consent. The success screen says "You're in" with the countdown, a Sunbeam Open WhatsApp button and the copy-number link.
- Strengths: keeps `useRegistrationFlow()` untouched (the chat only decides which field is on screen; saving, errors and the link come from the hook). Keeps the dialog role, labelled heading, Escape, focus on the heading when a step changes, all four visitor types, optional birthday, honeypot, Open WhatsApp button and copy-number link. Page behind is inert while open. Context chip when opened from a service or package.
- Weaknesses / rough edges: the prototype's one-tap "Yes, that's fine" became a consent checkbox plus a submit button, because the hook validates on submit. The prototype's static "+234" prefix is now a country-code select styled the same. A fixed list of questions means a long chat for partners (6 questions). No back button. After the first question, focus moves to each new input.
- Needs: optional field `chatPrompts` in `src/data/registration.ts`.
- Depends on other parts of this variant? none
- Weight: about 5 KB.

## Wording differences
Reused from main's data: headline, both hero buttons, the closing heading and the bubble text. New optional fields: hero supporting line ("Websites, apps, design and art for founders, schools and businesses." replaces main's longer `hero.lead` in this Hero only), the two scene captions, the closing line, the SVG label and every chat prompt. Main's wording is unchanged.

## Not converted
- Stage: the prototype's art lives inside the hero screen (it scrolls away with it), so there is no fixed background to replace. Main's `Stage` stays.
- WhatsAppFab: the prototype has none. Main's round button stays and may sit over the caption buttons on a 360 px phone.
- About, Services, Schools, Work, Referral, Partners, Join, Footer: not in the prototype.
