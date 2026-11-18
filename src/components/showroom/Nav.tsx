"use client";

import { useEffect, useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { Button } from "@/components/ui/Button";
import { site } from "@/data/site";
import s from "./Nav.module.css";

export default function Nav() {
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
        <a className={s.logo} href="#top"><i />{site.name}</a>
        <div className={s.links}>
          {site.nav.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          <Button aria-pressed={blueprint} onClick={toggleBlueprint}>Blueprint</Button>
          <OpenButton variant="dark">Start a conversation</OpenButton>
        </div>
        <button type="button" className={s.burger} aria-label="Open menu" aria-expanded={menu} aria-controls="mobile-menu" onClick={() => setMenu(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7h18M3 17h18" /></svg>
        </button>
      </nav>
      {menu && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" className={s.menu}>
          <div className={s.menuTop}>
            <span className={s.logo}><i />{site.name}</span>
            <button type="button" className={s.burger} style={{ display: "inline-flex" }} aria-label="Close menu" onClick={() => setMenu(false)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
          </div>
          <nav aria-label="Sections">
            {site.nav.map((l) => <a key={l.href} href={l.href} onClick={() => setMenu(false)}>{l.label}</a>)}
          </nav>
          <div className={s.menuActions}>
            <OpenButton variant="sun" big onClick={() => setMenu(false)}>Start a conversation</OpenButton>
            <Button aria-pressed={blueprint} onClick={toggleBlueprint}>Blueprint view</Button>
          </div>
        </div>
      )}
    </>
  );
}
