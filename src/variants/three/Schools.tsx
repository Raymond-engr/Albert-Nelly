import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { AI_FEATURE, packages, runningCosts } from "@/data/packages";
import s from "./Schools.module.css";

const Feature = ({ text }: { text: string }) =>
  text === AI_FEATURE ? (
    <li><span className={s.tip} tabIndex={0} data-tip={copy.schools.aiTooltip}>{AI_FEATURE}</span></li>
  ) : (
    <li>{text}</li>
  );

export default function Schools() {
  return (
    <SceneSection scene="sch" id="schools" className={s.sec}>
      <div className={`${s.w} ${s.pan}`}>
        <h2>{copy.schools.title}</h2>
        <p className={s.lead}>{copy.schools.lead}</p>
        <div className={s.gr}>
          {packages.map((p) => (
            <article key={p.name} className={`${s.tr} ${p.featured ? s.mid : ""}`}>
              <h3>{p.name}</h3>
              <p className={s.fr}>{p.description}</p>
              <p className={s.fr}>Suits: {p.audience}</p>
              <p className={s.pr}>{p.price}</p>
              <ul>{p.features.map((f) => <Feature key={f} text={f} />)}</ul>
              {p.more.length > 0 && (
                <details>
                  <summary>{copy.schools.more}</summary>
                  <ul>{p.more.map((f) => <Feature key={f} text={f} />)}</ul>
                </details>
              )}
              <OpenButton type="hire" ctx={p.name} pre="School Websites" className={`${s.b} ${p.featured ? s.g : ""}`}>{copy.schools.cta}</OpenButton>
            </article>
          ))}
        </div>
        <details className={s.costs}>
          <summary>{copy.schools.costsTitle}</summary>
          <table><tbody>{runningCosts.map((r) => <tr key={r.item}><td>{r.item}</td><td>{r.amount}</td></tr>)}</tbody></table>
        </details>
      </div>
    </SceneSection>
  );
}
