"use client";

import { SceneSection } from "@/components/shared/SceneSection";
import { oneCopy } from "@/data/one";
import { useRegistration } from "@/providers/RegistrationProvider";
import s from "./proto.module.css";

/** The speech bubble is drawn by the Stage on top of the button, so tapping it opens the registration panel. */
export default function Join() {
  const c = oneCopy.join;
  const { open } = useRegistration();
  return (
    <div className={s.t}>
      <SceneSection scene="bub" id="join" className={s.sec}>
        <h2>{c.title}</h2>
        <p className={s.sub}>{c.lead}</p>
        <button type="button" className={`${s.stage} ${s.cta}`} data-stage="bub" aria-label={c.bubbleLabel} onClick={() => open()}>
          <span>{c.bubble}</span>
        </button>
        <p className={s.sub}>{c.note}</p>
      </SceneSection>
    </div>
  );
}
