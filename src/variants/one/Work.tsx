"use client";

import { useState } from "react";
import { SceneSection } from "@/components/shared/SceneSection";
import { oneCopy } from "@/data/one";
import s from "./proto.module.css";

export default function Work() {
  const c = oneCopy.work;
  const [tab, setTab] = useState<string>("All");
  return (
    <div className={s.t}>
      <SceneSection scene="sch" dim id="work" className={s.sec}>
        <h2>{c.title}</h2>
        <div className={s.tabs} role="group" aria-label={c.filterLabel}>
          {c.tabs.map((t) => (
            <button key={t} type="button" className={s.tab} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div className={s.grid}>
          {c.projects.map((p) => (
            <article key={p.title} className={`${s.card} ${s.proj}`} hidden={tab !== "All" && tab !== p.category}>
              <div className={s.img} />
              <span className={s.badge}>{p.category}</span>
              <h3>{p.title}</h3>
              <p>{c.challenge}</p>
              <p><b>{c.resultBold}</b>{c.resultRest}</p>
            </article>
          ))}
        </div>
      </SceneSection>
    </div>
  );
}
