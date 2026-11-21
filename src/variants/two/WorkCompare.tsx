"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { copy } from "@/data/copy";
import type { GalleryItem, WorkPhoto } from "@/types/content";
import type { MotionMode } from "@/types/motion";
import { Pic, arStyle } from "./WorkPic";
import s from "./Work.module.css";

const ui = copy.work.ui;
const clamp = (n: number) => Math.min(100, Math.max(0, n));
const SIZES = "(max-width: 520px) 90vw, (max-width: 800px) 45vw, 400px";
const BIG = "(max-width: 900px) 94vw, 880px";

type CompareProps = {
  pair: [WorkPhoto, WorkPhoto];
  labels?: [string, string];
  ratio: number;
  mode: MotionMode;
  large?: boolean;
};

/**
 * Before and after divider. Drag sideways to move it (vertical swipes still scroll the page),
 * tap to jump it, or use the arrow keys on the handle. In Full mode it nudges once when it scrolls into view.
 */
export function Compare({ pair, labels = [ui.before, ui.after], ratio, mode, large }: CompareProps) {
  const [p, setP] = useState(50);
  const [used, setUsed] = useState(false);
  const [ease, setEase] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const touched = useRef(false);

  const moveTo = (x: number) => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    touched.current = true;
    setUsed(true);
    setP(clamp(((x - r.left) / r.width) * 100));
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.abs(e.clientX - d.x) > 6) d.moved = true;
    if (d.moved) moveTo(e.clientX);
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) moveTo(e.clientX); // a tap jumps the divider
  };
  const key = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.key === "ArrowLeft" ? -5 : e.key === "ArrowRight" ? 5 : 0;
    if (step) setP((v) => clamp(v + step));
    else if (e.key === "Home") setP(0);
    else if (e.key === "End") setP(100);
    else return;
    touched.current = true;
    setUsed(true);
    e.preventDefault();
  };

  // One gentle nudge the first time it is mostly on screen, so people see it moves. Full mode only.
  useEffect(() => {
    if (mode !== "full") return;
    const el = box.current;
    if (!el) return;
    const timers: number[] = [];
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setEase(true);
        [38, 56, 50].forEach((v, i) => timers.push(window.setTimeout(() => { if (!touched.current) setP(v); }, i * 550)));
        timers.push(window.setTimeout(() => setEase(false), 1700));
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(window.clearTimeout);
    };
  }, [mode]);

  const sizes = large ? BIG : SIZES;
  return (
    <div className={`${s.mv} ${large ? s.big : ""}`} style={arStyle(ratio)}>
      <div
        ref={box}
        className={`${s.cmp} ${ease ? s.ease : ""}`}
        style={{ "--p": `${p}%` } as CSSProperties}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => (drag.current = null)}
      >
        <div><Pic photo={pair[0]} sizes={sizes} /></div>
        <div className={s.af}><Pic photo={pair[1]} sizes={sizes} /></div>
        <span className={`${s.label} ${s.labelL}`}>{labels[0]}</span>
        <span className={`${s.label} ${s.labelR}`}>{labels[1]}</span>
        <i className={s.ln} />
        <button type="button" role="slider" className={s.hd} aria-label={ui.compareLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)} onKeyDown={key}>‹ ›</button>
      </div>
      <span className={`${s.hint} ${used ? s.hintOff : ""}`}>{ui.dragHint}</span>
    </div>
  );
}

type StagesProps = { stages: NonNullable<GalleryItem["stages"]>; ratio: number; mode: MotionMode; large?: boolean };

/** A slider that fades through the stages of a piece, from the first sketch to the finished work. */
export function Stages({ stages, ratio, mode, large }: StagesProps) {
  const [v, setV] = useState(0);
  const [used, setUsed] = useState(false);
  const sizes = large ? BIG : SIZES;
  const name = stages[Math.round(v)]?.name ?? "";
  return (
    <div>
      <div className={`${s.mv} ${large ? s.big : ""}`} style={arStyle(ratio)}>
        {stages.map((st, i) => (
          <div key={st.name} style={{ position: "absolute", inset: 0, opacity: Math.max(0, 1 - Math.abs(v - i)) }}>
            <Pic photo={st.photo} sizes={sizes} />
          </div>
        ))}
        <span className={`${s.hint} ${used ? s.hintOff : ""}`}>{ui.stageHint}</span>
      </div>
      <div className={s.sc}>
        <input
          type="range"
          min={0}
          max={stages.length - 1}
          step={mode === "still" ? 1 : 0.01}
          value={v}
          aria-label={ui.stageLabel}
          aria-valuetext={name}
          onChange={(e) => { setV(Number(e.target.value)); setUsed(true); }}
        />
        <output className={s.note}>{name}</output>
      </div>
    </div>
  );
}
