"use client";

import { useEffect, useRef, useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { referralSteps } from "@/data/referral";
import s from "./Referral.module.css";

export default function Referral() {
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const [on, setOn] = useState<boolean[]>(() => referralSteps.map(() => false));

  // Each step lights while it is in the upper part of the screen, and dims again when scrolled back.
  useEffect(() => {
    const onScroll = () => {
      const next = refs.current.map((el) => !!el && el.getBoundingClientRect().top < innerHeight * 0.72);
      setOn((prev) => (prev.every((v, i) => v === next[i]) ? prev : next));
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <SceneSection scene="net" id="referral" className={s.sec}>
      <div className={s.col}><h2>{copy.referral.title}</h2></div>
      <ol className={s.path}>
        {referralSteps.map((st, i) => (
          <li key={st.title} ref={(el) => { refs.current[i] = el; }} className={`${s.stp} ${on[i] ? s.on : ""}`}>
            <b>{st.title}</b>
            <p>{st.text}</p>
          </li>
        ))}
      </ol>
      <div className={s.band}>{copy.referral.band}</div>
      <p>{copy.referral.bandNote}</p>
      <div><OpenButton type="refer" variant="brand">{copy.referral.cta}</OpenButton></div>
    </SceneSection>
  );
}
