"use client";

import { useEffect, useRef, useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { referralSteps } from "@/data/referral";
import PhoneChat from "./PhoneChat";
import s from "./Referral.module.css";

export default function Referral() {
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const [lit, setLit] = useState<boolean[]>(() => referralSteps.map(() => false));

  // A step lights while it sits in the upper part of the screen and dims again when the visitor scrolls back above it.
  useEffect(() => {
    const on = () => {
      const next = refs.current.map((el) => !!el && el.getBoundingClientRect().top < innerHeight * 0.72);
      setLit((prev) => (prev.every((v, i) => v === next[i]) ? prev : next));
    };
    const first = requestAnimationFrame(on);
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(first);
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
    };
  }, []);

  return (
    <SceneSection scene="net" id="referral" className="section">
      <div className="wrap">
        <div className={s.pan}>
          <div className="col">
            <h2>{copy.referral.title}</h2>
          </div>
          <ol className={s.path}>
            {referralSteps.map((st, i) => (
              <li key={st.title} ref={(el) => { refs.current[i] = el; }} className={`${s.step} ${lit[i] ? s.on : ""}`}>
                <h3><b>{i + 1}</b>{st.title}</h3>
                <p>{st.text}</p>
              </li>
            ))}
          </ol>
          <div className={s.mid}>
            <div className={s.side}>
              <p className={s.cm}>{copy.referral.band}</p>
              <p>{copy.referral.bandNote}</p>
              <div className={s.cta}>
                <OpenButton type="refer" variant="brand">{copy.referral.cta}</OpenButton>
              </div>
            </div>
            <PhoneChat />
          </div>
        </div>
      </div>
    </SceneSection>
  );
}
