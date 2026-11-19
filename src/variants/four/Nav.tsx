"use client";

import { useEffect, useState } from "react";
import { copy } from "@/data/copy";
import { site } from "@/data/site";
import { useRegistration } from "@/providers/RegistrationProvider";
import s from "./Nav.module.css";

/** Transparent over the hero, translucent with a blur after 40 px of scroll. Fixed, so the hero reserves 64 px at the top. */
export default function Nav() {
  const { open } = useRegistration();
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const [blueprint, setBlueprint] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(scrollY > 40);
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menu) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const toggleBlueprint = () => {
    const on = !blueprint;
    setBlueprint(on);
    document.body.classList.toggle("bp", on);
  };

  return (
    <>
      <nav data-inert-on-modal className={`${s.nav} ${solid ? s.solid : ""}`} aria-label="Main">
        <a className={s.logo} href="#top" aria-label={`${site.name}, home`}>
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <path d="M3 18C8 6 12 22 17 12S22 8 23 10" fill="none" stroke="#12B76A" strokeWidth="5" strokeLinecap="round" />
          </svg>
          {site.name}
        </a>
        <div className={s.links}>
          {site.nav.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          <button type="button" className={s.plain} aria-pressed={blueprint} onClick={toggleBlueprint}>Blueprint</button>
        </div>
        <button type="button" className={s.cta} onClick={() => open()}>{copy.hero.secondary}</button>
        <button type="button" className={s.burger} aria-label="Open menu" aria-expanded={menu} aria-controls="mobile-menu" onClick={() => setMenu(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M3 7h18M3 17h18" /></svg>
        </button>
      </nav>
      {menu && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" className={s.menu}>
          <button type="button" className={`${s.burger} ${s.shut}`} aria-label="Close menu" onClick={() => setMenu(false)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
          <nav aria-label="Sections">
            {site.nav.map((l) => <a key={l.href} href={l.href} onClick={() => setMenu(false)}>{l.label}</a>)}
          </nav>
          <button type="button" className={s.big} onClick={() => { setMenu(false); open(); }}>{copy.hero.secondary}</button>
          <button type="button" className={s.plain} aria-pressed={blueprint} onClick={toggleBlueprint}>Blueprint view</button>
        </div>
      )}
    </>
  );
}
