"use client";

import { useEffect, useRef, useState } from "react";
import { oneCopy } from "@/data/one";
import { OpenBtn } from "./OpenBtn";
import s from "./proto.module.css";

/** Logo, five section links, one button. A green stroke along the top edge shows how far down the page you are. */
export default function Nav() {
  const [solid, setSolid] = useState(false);
  const prog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => {
      setSolid(scrollY > 40);
      const max = document.documentElement.scrollHeight - innerHeight;
      if (prog.current) prog.current.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    };
    const first = requestAnimationFrame(on);
    addEventListener("scroll", on, { passive: true });
    return () => {
      cancelAnimationFrame(first);
      removeEventListener("scroll", on);
    };
  }, []);

  return (
    <div className={s.t}>
      <div ref={prog} className={s.prog} aria-hidden="true" />
      <header data-inert-on-modal className={`${s.bar} ${solid ? s.solid : ""}`}>
        <a className={s.logo} href="#top">{oneCopy.brand}</a>
        <nav aria-label="Main">
          {oneCopy.nav.map((l) => <a key={l.href} className={s.u} href={l.href}>{l.label}</a>)}
        </nav>
        <OpenBtn className={`${s.btn} ${s.ghost} ${s.sm}`}>
          <span className={s.d}>{oneCopy.navCta.long}</span>
          <span className={s.m}>{oneCopy.navCta.short}</span>
        </OpenBtn>
      </header>
    </div>
  );
}
