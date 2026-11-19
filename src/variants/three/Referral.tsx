"use client";

import { useEffect, useRef, useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { referralSteps } from "@/data/referral";
import s from "./Referral.module.css";

export default function Referral() {
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const [lit, setLit] = useState<boolean[]>(() => referralSteps.map(() => false));

  // The four nodes light up in order as the visitor scrolls.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = Number((e.target as HTMLElement).dataset.i);
        setLit((a) => a.map((v, k) => (k === i ? true : v)));
        io.unobserve(e.target);
      }),
      { threshold: 0.9 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <SceneSection scene="net" id="referral" className={s.sec}>
      <div className={`${s.w} ${s.pan}`}>
        <h2>{copy.referral.title}</h2>
        <p className={s.lead}>{copy.referral.lead}</p>
        <ol className={s.st}>
          {referralSteps.map((st, i) => (
            <li key={st.title} data-i={i} ref={(el) => { refs.current[i] = el; }} className={lit[i] ? s.on : ""}>
              <h3>{st.title}</h3>
              <p>{st.text}</p>
            </li>
          ))}
        </ol>
        <div className={s.mid}>
          <div>
            <p className={s.cm}>{copy.referral.band}</p>
            <p>{copy.referral.bandNote}</p>
          </div>
          <div className={s.chat} aria-hidden="true">
            {copy.referral.chat.map((m) => (
              <div key={m.who} className={`${s.m} ${m.me ? s.me : ""}`}><small>{m.who}</small>{m.text}</div>
            ))}
          </div>
        </div>
        <OpenButton type="refer" className={`${s.b} ${s.g}`}>{copy.referral.cta}</OpenButton>
      </div>
    </SceneSection>
  );
}
