"use client";

import { useEffect, useRef, useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { referralSteps } from "@/data/referral";
import s from "./Referral.module.css";

/** A single vertical stroke with four nodes that light up in order as the visitor scrolls. */
export default function Referral() {
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const [lit, setLit] = useState<boolean[]>(() => referralSteps.map(() => false));

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const i = Number((e.target as HTMLElement).dataset.i);
          // On once the step passes the lower part of the screen, and it stays on while it is above.
          const on = e.isIntersecting || e.boundingClientRect.top < 0;
          setLit((a) => a.map((v, k) => (k === i ? on : v)));
        }),
      { rootMargin: "0px 0px -28% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <SceneSection scene="net" id="referral" className="section">
      <div className="wrap">
        <div className="col">
          <h2>{copy.referral.title}</h2>
          <ol className={s.path}>
            {referralSteps.map((st, i) => (
              <li key={st.title} data-i={i} ref={(el) => { refs.current[i] = el; }} className={`${s.step} ${lit[i] ? s.on : ""}`}>
                <h3>{st.title}</h3>
                <p>{st.text}</p>
              </li>
            ))}
          </ol>
          <p className={s.band}>{copy.referral.band}. {copy.referral.bandNote}</p>
          <OpenButton type="refer" variant="sun">{copy.referral.cta}</OpenButton>
        </div>
      </div>
    </SceneSection>
  );
}
