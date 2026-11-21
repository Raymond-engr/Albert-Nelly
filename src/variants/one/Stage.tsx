"use client";

import { useEffect, useRef } from "react";
import { useMotionMode } from "@/hooks/useMotionMode";
import { getMotionMode } from "@/lib/motion";
import type { Live } from "./stage-gl";
import s from "./proto.module.css";

const FADE_MS = 700; // a little over the 0.6 s CSS crossfade

/** Cheap check first, so a device without WebGL never downloads three.js. */
function hasWebGL(): boolean {
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
 * (the sections of this variant render them).
 *
 * The mode comes from useMotionMode() and changes while the page is open (see src/lib/motion.ts):
 * Full and Light run the 3D layer (Light is cheaper, see stage-gl.ts). Still, or a device without WebGL,
 * paints the same stroke on a flat canvas instead. Switching between 3D and Still crossfades over 0.6 s.
 */
export default function Stage() {
  const host = useRef<HTMLDivElement>(null);
  const mode = useMotionMode();
  const live = useRef<Live>({ mode, painted: false });
  const apply = useRef<(() => void) | null>(null);

  // A mode change reaches the running layers without a restart.
  useEffect(() => {
    live.current.mode = mode;
    apply.current?.();
  }, [mode]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const L = live.current;
    L.mode = getMotionMode();
    const root = document.documentElement;
    let dead = false, glOk = hasWebGL(), started = false;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };
    const cancel = (id: number) => {
      clearTimeout(id);
      timers.delete(id);
    };
    const wantGL = () => glOk && L.mode !== "still";
    const twice = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn)); // lets a CSS fade start from 0

    // ---- the 3D layer
    let gl: (() => void) | null = null;
    let glBusy = false;
    let glOut: number | null = null; // pending removal while the layer fades out
    const startGL = async () => {
      if (glOut !== null) { // came back before the fade finished: fade in again, no restart
        cancel(glOut);
        glOut = null;
        el.classList.remove(s.off);
        return;
      }
      if (gl || glBusy) return;
      glBusy = true;
      const m = await import("./stage-gl");
      glBusy = false;
      if (dead || !wantGL()) return;
      if (started) el.classList.add(s.off);
      gl = m.startStage(el, L);
      if (!gl) {
        glOk = false; // WebGL failed: stay on the flat stroke
        sync();
        return;
      }
      if (started) twice(() => el.classList.remove(s.off));
      started = true;
    };
    const stopGL = () => {
      if (!gl || glOut !== null) return;
      el.classList.add(s.off);
      glOut = later(() => {
        gl?.();
        gl = null;
        glOut = null;
        el.classList.remove(s.off);
        if (flat) root.dataset.oneGl = "off"; // now the empty 3D slots can collapse
      }, FADE_MS);
    };

    // ---- the flat Still layer
    let flat: { canvas: HTMLCanvasElement; stop: () => void } | null = null;
    let flatBusy = false;
    let flatOut: number | null = null;
    const startFlat = async () => {
      if (flatOut !== null) {
        cancel(flatOut);
        flatOut = null;
        flat?.canvas.classList.add(s.on);
        if (!gl) root.dataset.oneGl = "off";
        return;
      }
      if (flat || flatBusy) return;
      flatBusy = true;
      const { makePainting, stepper } = await import("./painting");
      flatBusy = false;
      const anchor = document.querySelector('[data-stage="cv"]');
      if (dead || wantGL() || !anchor) return;
      const mobile = innerWidth < 768;
      const p = makePainting(mobile ? 608 : 1024, mobile ? 608 : 704);
      p.canvas.className = s.fb;
      p.canvas.setAttribute("aria-hidden", "true");
      anchor.appendChild(p.canvas);
      twice(() => p.canvas.classList.add(s.on));
      const play = stepper(p, L.painted || L.mode === "still"); // Still shows the finished mark; a no-3D device plays it once
      let raf = 0;
      const f = (ts: number) => {
        play.tick(ts);
        if (play.finished()) {
          L.painted = true;
          return;
        }
        raf = requestAnimationFrame(f);
      };
      raf = requestAnimationFrame(f);
      flat = { canvas: p.canvas, stop: () => { cancelAnimationFrame(raf); p.canvas.remove(); } };
      if (!gl) root.dataset.oneGl = "off"; // with 3D still fading out this waits for stopGL
    };
    const stopFlat = () => {
      if (!flat || flatOut !== null) return;
      delete root.dataset.oneGl; // the 3D slots come back right away
      flat.canvas.classList.remove(s.on);
      flatOut = later(() => {
        flat?.stop();
        flat = null;
        flatOut = null;
      }, FADE_MS);
    };

    function sync() {
      if (dead) return;
      if (wantGL()) {
        void startGL();
        stopFlat();
      } else {
        void startFlat();
        stopGL();
      }
    }
    apply.current = sync;
    sync();

    return () => {
      dead = true;
      apply.current = null;
      timers.forEach(clearTimeout);
      gl?.();
      flat?.stop();
      el.classList.remove(s.off);
      delete root.dataset.oneGl;
    };
  }, []);

  return (
    <div className={s.t}>
      <div ref={host} className={s.gl} aria-hidden="true" />
    </div>
  );
}
