"use client";

import { useEffect, useId, useRef, useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { copy } from "@/data/copy";
import type { GalleryCategory, GalleryItem } from "@/types/content";
import type { MotionMode } from "@/types/motion";
import { Compare, Stages } from "./WorkCompare";
import { Pic, arStyle, ratio } from "./WorkPic";
import s from "./Work.module.css";

const ui = copy.work.ui;

/** One step in the viewer: a photo of a set, or a whole painting. */
export type Slide = { item: number; photo: number };

type Props = { items: GalleryItem[]; slides: Slide[]; start: number; category: GalleryCategory; mode: MotionMode; onClose: () => void };

/**
 * Full-size viewer on a native <dialog>, so focus stays inside, Esc closes it and the page behind is inert.
 * Arrow keys, the buttons and a sideways swipe move between slides. A divider or stage slider keeps
 * its own sideways drag, so swipe-to-change is off on those slides and the buttons or keys are used.
 */
export function Viewer({ items, slides, start, category, mode, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [i, setI] = useState(start);
  const x0 = useRef(0);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const close = () => ref.current?.close();
  const go = (d: number) => setI((n) => (n + d + slides.length) % slides.length);
  const slide = slides[i];
  const it = items[slide.item];
  const r = ratio(it.photos[0]);
  const interactive = Boolean(it.compare || it.stages);

  return (
    <dialog
      ref={ref}
      className={s.viewer}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && close()}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).closest('[role="slider"], input')) return;
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      <div className={s.vi}>
        <div className={s.vh}>
          <h3 id={titleId}>{it.title}</h3>
          <button type="button" className={s.round} aria-label={ui.close} onClick={close}>✕</button>
        </div>
        <div
          key={i}
          onTouchStart={(e) => { x0.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (interactive) return;
            const d = e.changedTouches[0].clientX - x0.current;
            if (Math.abs(d) > 50) go(d < 0 ? 1 : -1);
          }}
        >
          {it.compare ? (
            <Compare pair={it.compare} labels={it.labels} ratio={r} mode={mode} large />
          ) : it.stages ? (
            <Stages stages={it.stages} ratio={r} mode={mode} large />
          ) : (
            <div className={`${s.mv} ${s.big}`} style={arStyle(r)}>
              <Pic photo={it.photos[slide.photo]} sizes="(max-width: 900px) 94vw, 880px" priority />
            </div>
          )}
        </div>
        <p className={s.note} style={{ marginTop: 10 }}>{it.line}{it.credit ? `, ${ui.credit.toLowerCase()}: ${it.credit}` : ""}</p>
        <div className={s.vc}>
          <OpenButton type="hire" ctx={it.title} variant="brand" onClick={close}>{category === "Painting" ? ui.commission : ui.shoot}</OpenButton>
          {slides.length > 1 && (
            <div className={s.vn}>
              <button type="button" className={s.round} aria-label={ui.prev} onClick={() => go(-1)}>‹</button>
              <span>{i + 1} / {slides.length}</span>
              <button type="button" className={s.round} aria-label={ui.next} onClick={() => go(1)}>›</button>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
