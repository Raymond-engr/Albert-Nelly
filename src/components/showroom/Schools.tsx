"use client";

import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { AI_FEATURE } from "@/data/packages";
import { useSiteContent } from "@/providers/SiteContentProvider";
import RunningCosts from "./RunningCosts";
import s from "./Schools.module.css";

const Feature = ({ text }: { text: string }) =>
  text === AI_FEATURE ? (
    <li><span className={s.tip} tabIndex={0} data-tip={copy.schools.aiTooltip}>{AI_FEATURE}</span></li>
  ) : (
    <li>{text}</li>
  );

export default function Schools() {
  const { packages, runningCosts } = useSiteContent();
  return (
    <SceneSection scene="sch" id="schools" className="section">
      <div className="wrap">
        <h2>{copy.schools.title}</h2>
        <p>{copy.schools.lead}</p>
        <div className={s.grid}>
          {packages.map((p) => (
            <article key={p.name} className={`card ${s.pkg} ${p.featured ? s.featured : ""}`}>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <p className="note">Suits: {p.audience}</p>
              <p className="price">{p.price}</p>
              <ul className="ck">{p.features.map((f) => <Feature key={f} text={f} />)}</ul>
              {p.more.length > 0 && (
                <details className={s.more}>
                  <summary>{copy.schools.more}</summary>
                  <ul className="ck">{p.more.map((f) => <Feature key={f} text={f} />)}</ul>
                </details>
              )}
              <OpenButton type="hire" ctx={p.name} pre="School Websites" variant={p.featured ? "brand" : "outline"}>{copy.schools.cta}</OpenButton>
            </article>
          ))}
        </div>
        <RunningCosts title={copy.schools.costsTitle} rows={runningCosts} />
      </div>
    </SceneSection>
  );
}
