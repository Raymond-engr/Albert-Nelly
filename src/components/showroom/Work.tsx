"use client";

import { useState } from "react";
import { SceneSection } from "@/components/shared/SceneSection";
import { Button } from "@/components/ui/Button";
import { copy } from "@/data/copy";
import { useSiteContent } from "@/providers/SiteContentProvider";
import type { WorkCategory } from "@/types/content";
import s from "./Work.module.css";

const tabs: WorkCategory[] = ["Design", "Development"];

export default function Work() {
  const [tab, setTab] = useState<WorkCategory>("Design");
  const { work } = useSiteContent();
  return (
    <SceneSection scene="sch" dim id="work" className="section">
      <div className="wrap">
        <h2>{copy.work.title}</h2>
        <p>{copy.work.lead}</p>
        <div className={s.tabs} role="group" aria-label="Project type">
          {tabs.map((t) => (
            <Button key={t} variant={tab === t ? "dark" : "outline"} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</Button>
          ))}
        </div>
        <div className={s.grid}>
          {work.filter((w) => w.category === tab).map((w) => (
            <article key={w.title} className="card">
              <div className={s.ph} aria-hidden="true">
                <svg viewBox="0 0 160 100"><path d="M20 70C50 30 80 90 110 50S140 30 145 25" fill="none" stroke="#12B76A" strokeWidth="12" strokeLinecap="round" /></svg>
              </div>
              <span className="chip">{w.category}</span>
              <h3>{w.title}</h3>
              <p className="note">{w.challenge}</p>
              <p className="price">{w.result}</p>
            </article>
          ))}
        </div>
      </div>
    </SceneSection>
  );
}
