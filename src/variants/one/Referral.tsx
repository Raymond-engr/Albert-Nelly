"use client";

import { useEffect, useRef, useState } from "react";
import { SceneSection } from "@/components/shared/SceneSection";
import { oneCopy } from "@/data/one";
import { OpenBtn } from "./OpenBtn";
import s from "./proto.module.css";

/** Four steps on one stroke. Each node lights up, in order, as its step passes the lower part of the screen. */
export default function Referral() {
  const c = oneCopy.referral;
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const [lit, setLit] = useState<boolean[]>(() => c.steps.map(() => false));

  useEffect(() => {
    const on = () => {
      const next = refs.current.map((el) => !!el && el.getBoundingClientRect().top < innerHeight * 0.72);
      setLit((prev) => (prev.every((v, i) => v === next[i]) ? prev : next));
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
      <SceneSection scene="net" id="referral" className={s.sec}>
        <h2>{c.title}</h2>
        <ul className={s.steps}>
          {c.steps.map(([b, rest], i) => (
            <li key={b} ref={(el) => { refs.current[i] = el; }} className={lit[i] ? s.on : undefined}>
              <b>{b}</b>{rest}
            </li>
          ))}
        </ul>
        <p className={s.band}>{c.band}</p>
        <OpenBtn type="refer" className={`${s.btn} ${s.sun}`}>{c.cta}</OpenBtn>
      </SceneSection>
    </div>
  );
}
