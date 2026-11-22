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

  // The four nodes light up in order as the visitor scrolls.
  useEffect(() => {
    const timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = Number((e.target as HTMLElement).dataset.i);
          timers.push(window.setTimeout(() => setLit((a) => a.map((v, k) => (k === i ? true : v))), i * 260));
          io.unobserve(e.target);
        }),
      { threshold: 0.6 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <SceneSection scene="net" id="referral" className="section">
      <div className="wrap">
        <div className={s.pan}>
          <div className="col">
            <h2>{copy.referral.title}</h2>
          </div>
          <ol className={s.path} style={{ listStyle: "none", padding: 0 }}>
            {referralSteps.map((st, i) => (
              <li key={st.title} data-i={i} ref={(el) => { refs.current[i] = el; }} className={`${s.step} ${lit[i] ? s.on : ""}`}>
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
