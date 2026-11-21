"use client";

import { useRef, useState } from "react";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { gallery } from "@/data/gallery";
import { work } from "@/data/work";
import { useMotionMode } from "@/hooks/useMotionMode";
import s from "./Work.module.css";
import { DesignCard, DevCard } from "./WorkFrames";
import { Gallery } from "./WorkGallery";

type Tab = "Design" | "Development" | "Painting" | "Photography";
const tabs: Tab[] = ["Design", "Development", "Painting", "Photography"];
// Each placeholder card gets its own colour.
const hueOf = (i: number) => (i * 70 + 150) % 360;

export default function Work() {
  const [tab, setTab] = useState<Tab>("Design");
  const row = useRef<HTMLDivElement>(null);
  const mode = useMotionMode();
  const ui = copy.work.ui;

  const pick = (t: Tab, el: HTMLElement) => {
    setTab(t);
    // Keep the chosen pill in view when the row scrolls on a phone.
    const r = row.current;
    if (r) r.scrollTo({ left: el.offsetLeft - (r.clientWidth - el.offsetWidth) / 2, behavior: mode === "still" ? "auto" : "smooth" });
  };

  return (
    <SceneSection scene="sch" dim id="work" className={`${s.sec} ${mode === "still" ? s.still : ""}`}>
      <h2>{copy.work.title}</h2>
      <div ref={row} className={s.tabs} role="group" aria-label="Project type">
        {tabs.map((t) => <button key={t} type="button" aria-pressed={tab === t} onClick={(e) => pick(t, e.currentTarget)}>{ui.tabs[t]}</button>)}
      </div>
      {tab === "Design" && (
        <div className={s.grid}>
          {work.filter((w) => w.category === "Design").map((w, i) => <DesignCard key={w.title} item={w} hue={hueOf(i)} mode={mode} />)}
        </div>
      )}
      {tab === "Development" && (
        <div className={s.grid}>
          {work.filter((w) => w.category === "Development").map((w, i) => <DevCard key={w.title} item={w} hue={hueOf(i + 2)} mode={mode} />)}
        </div>
      )}
      {(tab === "Painting" || tab === "Photography") && (
        <Gallery key={tab} category={tab} items={gallery.filter((g) => g.category === tab)} mode={mode} />
      )}
    </SceneSection>
  );
}
