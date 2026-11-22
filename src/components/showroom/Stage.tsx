"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionMode } from "@/hooks/useMotionMode";
import { forcedMotionMode } from "@/lib/motion";
import { useRegistration } from "@/providers/RegistrationProvider";
import { useScene } from "@/providers/SceneProvider";
import type { SceneId } from "@/types/scene";
import { HL_EVENT, LAYER_OF, newShared, SCENE_ORDER } from "./scenes";
import s from "./Stage.module.css";

const StageGL = dynamic(() => import("./StageGL"), { ssr: false });
const clamp = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Where the page sits between scenes. Every [data-scene] section starts at its own scene
 * (or walks the ids in data-scene-path) and blends toward the next different scene as the
 * visitor scrolls through it. Returns the target weight of each scene id and the active scene.
 */
function target(): { w: Record<string, number>; active: string } {
  const secs = [...document.querySelectorAll<HTMLElement>("[data-scene]")];
  const scenes = secs.map((e) => e.dataset.scene ?? "cv");
  const paths = secs.map((e, i) => (e.dataset.scenePath ?? scenes[i]).split(" "));
  // A scene change plays out across the section that introduces it, then holds until a different scene begins.
  const ends = secs.map((_, i) => scenes.slice(i + 1).find((x) => x !== scenes[i]) ?? paths[i][paths[i].length - 1]);
  const mid = innerHeight * 0.5;
  let out: Record<string, number> = { cv: 1 };
  let active = "cv";
  secs.forEach((e, i) => {
    const r = e.getBoundingClientRect();
    if (r.top > mid) return;
    const start = i > 0 && scenes[i - 1] === scenes[i] ? ends[i - 1] : paths[i][0];
    const chain = [start, ...paths[i].slice(1), ends[i]];
    const u = clamp((mid - r.top) / Math.max(1, r.height)) * (chain.length - 1);
    const k = Math.min(chain.length - 2, Math.floor(u));
    out = {};
    out[chain[k]] = 1 - (u - k);
    out[chain[k + 1]] = (out[chain[k + 1]] ?? 0) + (u - k);
    active = scenes[i];
  });
  return { w: out, active };
}

/** While the hero's slides are mid-screen the Hero names the scene (data-stage-scene) and the slide number (data-stage-slide). */
function heroSlide(): { id: string; slide: string } | null {
  const el = document.querySelector<HTMLElement>("[data-stage-slides]");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const mid = innerHeight * 0.5;
  return r.top <= mid && r.bottom > mid ? { id: el.dataset.stageScene ?? "cv", slide: el.dataset.stageSlide ?? "0" } : null;
}

/** Fixed background: the 3D story (GLB scenes) over a flat poster rig that doubles as the Light and Still versions. */
export default function Stage() {
  const { scene, dim } = useScene();
  const { open } = useRegistration();
  const shared = useRef(newShared());
  const live = useRef({ scene, dim });
  const rig = useRef<HTMLDivElement>(null);
  const hit = useRef<HTMLButtonElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [weak, setWeak] = useState(false);
  const [gx, setGx] = useState(false);
  const [gl, setGl] = useState(false);
  const [go, setGo] = useState(false);
  const ready = useCallback(() => setGl(true), []);

  // Full, Light or Still comes from the shared engine (src/lib/motion.ts) and changes while the page is open.
  // On top of it, 4 cores or fewer top out at Light, unless NEXT_PUBLIC_MOTION_MODE pins a mode in development.
  const engine = useMotionMode();
  const mode = !forcedMotionMode() && weak && engine === "full" ? "light" : engine;
  const still = mode === "still", full = mode === "full";
  const lite = !full; // Still uses the Light set. The first scene is rendered once, the other scenes are the flat posters

  useEffect(() => { live.current = { scene, dim }; });

  // Capabilities are read once, after first paint, so text and buttons never wait for 3D.
  useEffect(() => {
    const id = setTimeout(() => {
      let ok = false;
      try { ok = !!document.createElement("canvas").getContext("webgl"); } catch { /* no WebGL */ }
      setGx(ok);
      setWeak((navigator.hardwareConcurrency || 8) <= 4);
      setGo(true);
    }, 200);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const sh = shared.current;
    let raf = 0, tx = 0, ty = 0;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches && full;
    const move = (e: PointerEvent) => { if (e.pointerType === "mouse") { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; } };
    const hl = (e: Event) => { sh.hl = (e as CustomEvent<SceneId | null>).detail; };
    if (fine) addEventListener("pointermove", move);
    addEventListener(HL_EVENT, hl);

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const hs = heroSlide();
      const tgt = hs
        ? { w: { [hs.id]: 1 } as Record<string, number>, active: hs.id }
        : still ? { w: { [live.current.scene]: 1 } as Record<string, number>, active: live.current.scene as string } : target();
      const zone = hs ? `h${hs.slide}` : "page";
      if (wrap.current && wrap.current.dataset.zone !== zone) wrap.current.dataset.zone = zone;
      const tg = tgt.w;
      let gs = 0;
      SCENE_ORDER.forEach((id, i) => {
        const goal = tg[id] ?? 0;
        sh.w[id] = still ? goal : sh.w[id] + (goal - sh.w[id]) * 0.1;
        gs += sh.w[id] * i;
      });
      sh.gs = gs;
      sh.px += (tx - sh.px) * 0.08;
      sh.py += (ty - sh.py) * 0.08;
      sh.fl += ((full ? 1 : 0) - sh.fl) * 0.05; // idle float eases in and out with the mode
      sh.dim = live.current.dim;

      const o = [0, 0, 0, 0, 0];
      SCENE_ORDER.forEach((id) => { o[LAYER_OF[id]] += sh.w[id]; });
      const r = rig.current;
      if (r) {
        // The rig's five children are the flat poster layers, in LAYER_OF order.
        [...r.children].forEach((el, i) => { (el as HTMLElement).style.opacity = String(Math.min(1, o[i])); });
        r.children[1]?.classList.toggle(s.hl, sh.hl === "wire" && o[1] > 0.2);
        r.children[2]?.classList.toggle(s.hl, sh.hl === "dev" && o[2] > 0.2);
        r.querySelectorAll<SVGElement>("[data-wl]").forEach((e) => { e.style.strokeDashoffset = String(sh.w.cv); });
        r.querySelectorAll<SVGElement>("[data-th]").forEach((e) => { e.style.strokeDashoffset = String(1 - clamp(sh.w.net + sh.w.bub)); });
        r.parentElement?.style.setProperty("--cvw", String(sh.w.cv)); // Still: the Light 3D board fades with the first scene's weight
        const fl = Math.sin(t / 1400) * 8 * sh.fl;
        r.style.transform = `translate3d(0,${fl}px,0) rotateX(${12 - sh.py * 8}deg) rotateY(${-16 + 8 * Math.sin(gs * 0.8) + sh.px * 14}deg)`;
      }
      if (hit.current) hit.current.style.visibility = tgt.active === "bub" && sh.w.bub > 0.6 ? "visible" : "hidden";
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", move);
      removeEventListener(HL_EVENT, hl);
    };
  }, [still, full]);

  const cls = [s.root, dim && s.dim, still && s.still, go && s.go, gx && !still && s.gx, gl && !still && s.gl, gl && still && s.glst].filter(Boolean).join(" ");

  return (
    <div className={s.wrap} ref={wrap} data-zone="page">
      <div className={cls} data-s={scene} data-mode={mode} aria-hidden="true">
        <div className={s.sc}>
          {gx && <StageGL shared={shared} lite={lite} still={still} onReady={ready} />}
          <div className={s.rig} ref={rig}>
            <div className={s.ly} style={{ opacity: 1 }}>
              <div className={s.cvs}>
                <svg viewBox="0 0 300 400" width="300" height="400">
                  <g fill="none" strokeLinecap="round">
                    <path className={s.sk} pathLength={1} stroke="#12B76A" strokeWidth={30} d="M34 265L89 135L144 265M52 229H126M188 265V135H210C255 135 276 160 276 200C276 240 255 265 210 265H188" />
                    <path className={s.sk} pathLength={1} stroke="#0A7D4A" strokeOpacity={0.35} strokeWidth={4} transform="translate(7 -9)" d="M34 265L89 135L144 265M52 229H126M188 265V135H210C255 135 276 160 276 200C276 240 255 265 210 265H188" />
                  </g>
                </svg>
              </div>
            </div>
            <div className={s.ly}>
              <svg viewBox="0 0 300 400" width="300" height="400">
                <rect className={s.wl} data-wl pathLength={1} x="20" y="24" width="260" height="34" rx="8" />
                <rect className={s.wl} data-wl pathLength={1} x="20" y="78" width="124" height="120" rx="12" />
                <rect className={s.wl} data-wl pathLength={1} x="156" y="78" width="124" height="120" rx="12" />
                <rect className={s.wl} data-wl pathLength={1} x="20" y="218" width="260" height="70" rx="12" />
                <rect className={s.wl} data-wl pathLength={1} x="90" y="318" width="120" height="40" rx="12" />
                <circle className={s.wl} data-wl pathLength={1} cx="46" cy="41" r="7" />
              </svg>
            </div>
            <div className={s.ly}>
              <div className={s.br}><i /><i /><i /><b /><b /></div>
              <div className={s.ph}><b /><b /></div>
            </div>
            <div className={s.ly}>
              <svg viewBox="0 0 300 400" width="300" height="400">
                <g fill="none" strokeWidth="6" strokeLinecap="round">
                  <path className={s.th} data-th pathLength={1} stroke="#12B76A" d="M30 200C30 100 170 100 170 200C170 300 30 300 30 200Z" />
                  <path className={s.th} data-th pathLength={1} stroke="#0A7D4A" d="M130 200C130 100 270 100 270 200C270 300 130 300 130 200Z" />
                </g>
                <g fill="var(--mint)" stroke="var(--line)">
                  <rect x="10" y="26" width="48" height="30" rx="8" /><rect x="242" y="26" width="48" height="30" rx="8" />
                  <rect x="10" y="344" width="48" height="30" rx="8" /><rect x="242" y="344" width="48" height="30" rx="8" />
                  <rect x="126" y="352" width="48" height="30" rx="8" />
                </g>
              </svg>
            </div>
            <div className={`${s.ly} ${s.bubL}`}>
              <svg viewBox="0 0 300 400" width="300" height="400">
                <g transform="translate(150 200) scale(2.1) translate(-72 -58)">
                    <polygon points="72,58 22,56 38,30" fill="#19C474" /><polygon points="72,58 38,30 72,20" fill="#12B76A" />
                    <polygon points="72,58 72,20 106,30" fill="#19C474" /><polygon points="72,58 106,30 122,56" fill="#12B76A" />
                    <polygon points="72,58 122,56 106,86" fill="#0F9F5C" /><polygon points="72,58 106,86 72,96" fill="#0F9F5C" />
                    <polygon points="72,58 72,96 38,86" fill="#10AE64" /><polygon points="72,58 38,86 22,56" fill="#0F9F5C" />
                    <polygon points="48,88 44,118 70,94" fill="#0A7D4A" />
                  </g>
                <text x="150" y="212" textAnchor="middle" fontFamily="var(--font-sora), Arial, sans-serif" fontWeight="700" fontSize="34" fill="#06281E">Let’s talk</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
      {/* Tapping the bubble opens the registration panel. Real, focusable, outside the aria-hidden art. */}
      <div className={s.hit} data-inert-on-modal>
        <button ref={hit} type="button" aria-label="Let’s talk. Open the registration form" onClick={() => open()} />
      </div>
    </div>
  );
}
