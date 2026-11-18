"use client";

import { useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { work } from "@/data/work";
import type { WorkCategory } from "@/types/content";
import s from "./Work.module.css";

const tabs: WorkCategory[] = ["Design", "Development"];

export default function Work() {
  const [tab, setTab] = useState<WorkCategory>("Design");
  return (
    <SceneSection scene="sch" dim id="work" className={s.sec}>
      <h2>{copy.work.title}</h2>
      <div className={s.tabs} role="group" aria-label="Project type">
        {tabs.map((t) => <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      <div className={s.grid}>
        {work.filter((w) => w.category === tab).map((w) => (
          <article key={w.title} className={s.card}>
            <div className={s.img} aria-hidden="true" />
            <span className={s.chip}>{w.category}</span>
            <h3>{w.title}</h3>
            <p className={s.note}>{w.challenge}</p>
            <p className={s.price}>{w.result}</p>
            <OpenButton type="hire" ctx={w.title}>Want something like this?</OpenButton>
          </article>
        ))}
      </div>
    </SceneSection>
  );
}
