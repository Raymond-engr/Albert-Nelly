"use client";

import { useEffect, useRef } from "react";
import s from "./proto.module.css";

/** Cheap checks first, so devices that cannot run 3D never download three.js. */
function canRun3D(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The 3D layer: fixed, full screen, above the page and click-through. It does not read useScene().
 * Each scene sits on a page element marked data-stage="cv" | "wire" | "dev" | "shp" | "sch" | "net" | "bub"
 * (the sections of this variant render them). Without 3D, the Still version paints the same stroke on a flat canvas.
 */
export default function Stage() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let stop: (() => void) | null = null;
    let dead = false;

    const still = async () => {
      document.documentElement.dataset.oneGl = "off"; // the sections read this to hide the other stages
      const { makePainting, stepper } = await import("./painting");
      const anchor = document.querySelector('[data-stage="cv"]');
      if (dead || !anchor) return;
      const mobile = innerWidth < 768;
      const p = makePainting(mobile ? 608 : 1024, mobile ? 608 : 704);
      p.canvas.className = s.fb;
      p.canvas.setAttribute("aria-hidden", "true");
      anchor.appendChild(p.canvas);
      const play = stepper(p, matchMedia("(prefers-reduced-motion: reduce)").matches);
      let raf = 0;
      const f = (ts: number) => {
        play.tick(ts);
        if (!play.finished()) raf = requestAnimationFrame(f);
      };
      raf = requestAnimationFrame(f);
      stop = () => {
        cancelAnimationFrame(raf);
        p.canvas.remove();
        delete document.documentElement.dataset.oneGl;
      };
    };

    if (!canRun3D()) void still();
    else
      import("./stage-gl").then((m) => {
        if (dead) return;
        stop = m.startStage(el);
        if (!stop) void still();
      });

    return () => {
      dead = true;
      stop?.();
    };
  }, []);

  return (
    <div className={s.t}>
      <div ref={host} className={s.gl} aria-hidden="true" />
    </div>
  );
}
