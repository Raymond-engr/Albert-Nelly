"use client";

import { useEffect, useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [menu]);

  const toggleBlueprint = () => {
    const on = !blueprint;
    setBlueprint(on);
    document.body.classList.toggle("bp", on);
  };

  return (
    <nav data-inert-on-modal className={`${s.nav} ${solid || menu ? s.sol : ""}`} aria-label="Main">
      <a className={s.lg} href="#top">{site.name}</a>
      <div className={s.links}>
        {site.nav.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        <button type="button" className={s.b} aria-pressed={blueprint} onClick={toggleBlueprint}>Blueprint</button>
      </div>
      <OpenButton className={s.b}>Start a conversation</OpenButton>
      <button type="button" className={`${s.b} ${s.burger}`} aria-expanded={menu} aria-controls="three-menu" onClick={() => setMenu((v) => !v)}>
        {menu ? "Close" : "Menu"}
      </button>
      {menu && (
        <div id="three-menu" className={s.menu}>
          {site.nav.map((l) => <a key={l.href} href={l.href} onClick={() => setMenu(false)}>{l.label}</a>)}
          <button type="button" className={s.b} aria-pressed={blueprint} onClick={toggleBlueprint}>Blueprint view</button>
        </div>
      )}
    </nav>
  );
}
