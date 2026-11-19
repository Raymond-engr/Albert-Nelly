import { SceneSection } from "@/components/shared/SceneSection";
import { oneCopy } from "@/data/one";
import { OpenBtn } from "./OpenBtn";
import s from "./proto.module.css";

export default function Schools() {
  const c = oneCopy.schools;
  return (
    <div className={s.t}>
      <SceneSection scene="sch" id="schools" className={s.sec}>
        <h2>{c.title}</h2>
        <p className={s.sub}>{c.lead}</p>
        <div className={s.stage} data-stage="sch" aria-hidden="true" />
        <div className={s.grid}>
          {c.packages.map((p) => (
            <article key={p.title} className={`${s.card} ${"highlight" in p ? s.hi : ""}`}>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
              <ul className={s.ck}>
                {p.features.map((f) => (
                  <li key={f}>
                    {f}
                    {"tipOn" in p && p.tipOn === f && <span className={s.tip} tabIndex={0} data-tip={c.tip} aria-label={c.tip}>?</span>}
                  </li>
                ))}
              </ul>
              <OpenBtn type="hire" ctx={p.ctx} className={`${s.btn} ${s.ghost}`}>{c.cta}</OpenBtn>
            </article>
          ))}
        </div>
        <details className={s.cost} open>
          <summary>{c.costsTitle}</summary>
          <table>
            <tbody>{c.costs.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
          </table>
        </details>
      </SceneSection>
    </div>
  );
}
