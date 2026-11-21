"use client";

import { useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { copy } from "@/data/copy";
import type { GalleryCategory, GalleryItem } from "@/types/content";
import type { MotionMode } from "@/types/motion";
import { Compare, Stages } from "./WorkCompare";
import { Pic, arStyle, ratio } from "./WorkPic";
import { Viewer, type Slide } from "./WorkViewer";
import s from "./Work.module.css";

const ui = copy.work.ui;

type Props = { category: GalleryCategory; items: GalleryItem[]; mode: MotionMode };

/**
 * Gallery wall for Paintings and Photography. Each piece keeps its own proportions.
 * One image shows plain (no divider). Two images with `compare` show the divider, `stages` shows the stage slider,
 * and several `photos` make a set with a count badge. Enlarging opens the viewer.
 */
export function Gallery({ category, items, mode }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  // Every photo of every set is its own step in the viewer. A comparison or stage piece is a single step.
  const slides: Slide[] = items.flatMap((it, item) => it.photos.map((_, photo) => ({ item, photo })));
  const openAt = (item: number) => setOpen(slides.findIndex((sl) => sl.item === item && sl.photo === 0));

  return (
    <>
      <div className={s.gal}>
        {items.map((it, i) => {
          const r = ratio(it.photos[0]);
          return (
            <figure key={it.title} className={s.gi}>
              {it.compare ? (
                <Compare pair={it.compare} labels={it.labels} ratio={r} mode={mode} />
              ) : it.stages ? (
                <Stages stages={it.stages} ratio={r} mode={mode} />
              ) : (
                <button type="button" className={s.mv} style={arStyle(r)} tabIndex={-1} aria-hidden="true" onClick={() => openAt(i)}>
                  <Pic photo={it.photos[0]} sizes="(max-width: 520px) 90vw, (max-width: 800px) 45vw, 400px" />
                  {it.photos.length > 1 && <span className={s.badge}>{it.photos.length} {ui.photos}</span>}
                </button>
              )}
              <figcaption className={s.cap}>
                <span className={s.chip}>{it.category}</span>
                <h3>{it.title}</h3>
                <p className={s.note}>{it.line}</p>
                {it.credit && <p className={s.note}>{ui.credit}: {it.credit}</p>}
                <button type="button" className={s.small} onClick={() => openAt(i)}>{ui.enlarge}</button>
              </figcaption>
            </figure>
          );
        })}
      </div>
      <div className={s.cta}>
        <OpenButton type="hire" ctx={ui.tabs[category]}>{category === "Painting" ? ui.commission : ui.shoot}</OpenButton>
      </div>
      {open !== null && <Viewer items={items} slides={slides} start={open} category={category} mode={mode} onClose={() => setOpen(null)} />}
    </>
  );
}
