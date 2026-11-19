import { SceneSection } from "@/components/shared/SceneSection";
import { oneCopy } from "@/data/one";
import { OpenBtn } from "./OpenBtn";
import s from "./proto.module.css";

export default function Partners() {
  const c = oneCopy.partners;
  return (
    <div className={s.t}>
      <SceneSection scene="net" id="partners" className={s.sec}>
        <h2>{c.title}</h2>
        <div className={s.stage} data-stage="net" aria-hidden="true" />
        <ul className={s.logos}>{Array.from({ length: c.logos }, (_, i) => <li key={i}>{c.logoLabel}</li>)}</ul>
        <article className={s.card}>
          <h3>{c.howTitle}</h3>
          <p>{c.howText}</p>
          <ol>{c.steps.map((x) => <li key={x}>{x}</li>)}</ol>
          <OpenBtn type="partner" className={`${s.btn} ${s.ghost}`}>{c.cta}</OpenBtn>
        </article>
      </SceneSection>
    </div>
  );
}
