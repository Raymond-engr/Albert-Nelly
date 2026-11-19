import { SceneSection } from "@/components/shared/SceneSection";
import { oneCopy } from "@/data/one";
import { OpenBtn } from "./OpenBtn";
import s from "./proto.module.css";

export default function Services() {
  const c = oneCopy.services;
  return (
    <div className={s.t}>
      <SceneSection scene="wire" id="services" className={s.sec}>
        <h2>{c.title}</h2>
        <div className={s.grid}>
          {c.items.map((it) => (
            <article key={it.title} className={s.card}>
              {"stage" in it && <div className={`${s.stage} ${s.sm}`} data-stage={it.stage} aria-hidden="true" />}
              {"badge" in it && <span className={s.badge}>{it.badge}</span>}
              <h3>{it.title}</h3>
              <p>{it.text}</p>
              <span className={s.for}>{it.suits}</span>
              <OpenBtn type="hire" ctx={it.title} className={`${s.btn} ${s.ghost}`}>{c.cta}</OpenBtn>
            </article>
          ))}
        </div>
      </SceneSection>
    </div>
  );
}
