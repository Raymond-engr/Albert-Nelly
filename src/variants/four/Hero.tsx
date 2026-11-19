"use client";

import { useEffect, useRef, useState } from "react";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { useRegistration } from "@/providers/RegistrationProvider";
import s from "./Hero.module.css";

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
/** Which of the four captions belongs to scroll progress p (0 to 1). */
const captionAt = (p: number) => (p < 0.17 ? 0 : p < 0.5 ? 1 : p < 0.76 ? 2 : 3);
const [design, build] = copy.story.scenes;

/**
 * One sticky screen scrubbed by scroll: canvas, brushstroke, wireframe, devices, then the "Let's talk" bubble.
 * Everything is SVG and CSS (no libraries). Scroll is read in one rAF loop that sleeps when it has caught up.
 */
export default function Hero() {
  const { open } = useRegistration();
  const [idx, setIdx] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const cam = useRef<SVGGElement>(null);
  const cv = useRef<SVGGElement>(null);
  const brush = useRef<SVGPathElement>(null);
  const wire = useRef<SVGGElement>(null);
  const dev = useRef<SVGGElement>(null);
  const bub = useRef<SVGGElement>(null);

  useEffect(() => {
    const T = track.current, S = stage.current, V = svg.current, camEl = cam.current, cvEl = cv.current;
    const brushEl = brush.current, wireEl = wire.current, devEl = dev.current, bubEl = bub.current;
    if (!T || !S || !V || !camEl || !cvEl || !brushEl || !wireEl || !devEl || !bubEl) return;
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lines = V.querySelectorAll<SVGRectElement>(`.${s.w}`);
    const blocks = V.querySelectorAll<SVGRectElement>(`.${s.blk}`);
    let tp = 0, cp = 0, cur = 0, raf = 0, run = false;

    const calc = () => {
      tp = clamp(-T.getBoundingClientRect().top / Math.max(1, T.offsetHeight - S.offsetHeight));
    };
    const draw = (p: number) => {
      const w = seg(p, 0.18, 0.42), d = seg(p, 0.45, 0.62), b = seg(p, 0.78, 0.92), bl = seg(p, 0.55, 0.72);
      camEl.style.transform = `scale(${1 + 0.1 * seg(p, 0.08, 0.4) - 0.12 * seg(p, 0.45, 0.7)})`;
      brushEl.style.opacity = String(1 - seg(p, 0.16, 0.3));
      lines.forEach((e) => { e.style.strokeDashoffset = String(1 - w); });
      wireEl.style.opacity = String(1 - seg(p, 0.42, 0.55));
      cvEl.style.opacity = String(1 - 0.6 * d);
      devEl.style.opacity = String(d * (1 - seg(p, 0.76, 0.88)));
      devEl.style.transform = `translateY(${(1 - d) * 24}px)`;
      blocks.forEach((e) => { e.style.transform = `scaleX(${bl})`; });
      bubEl.style.opacity = String(b);
      bubEl.style.transform = `scale(${0.7 + 0.3 * b})`;
      bubEl.style.pointerEvents = b > 0.6 ? "auto" : "none";
      bubEl.tabIndex = b > 0.6 ? 0 : -1;
      const i = captionAt(p);
      if (i !== cur) {
        cur = i;
        setIdx(i);
      }
    };
    const loop = () => {
      cp += (tp - cp) * (rm ? 1 : 0.12);
      if (Math.abs(tp - cp) < 0.0004) cp = tp;
      draw(cp);
      if (cp === tp) run = false;
      else raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      calc();
      if (!run) {
        run = true;
        raf = requestAnimationFrame(loop);
      }
    };
    // Desktop only: the canvas follows the pointer slightly.
    const tilt = (e: PointerEvent) => {
      V.style.setProperty("--ry", `${((e.clientX / innerWidth - 0.5) * 10).toFixed(1)}deg`);
      V.style.setProperty("--rx", `${((0.5 - e.clientY / innerHeight) * 8).toFixed(1)}deg`);
    };
    const fine = matchMedia("(hover: hover)").matches && !rm;

    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    if (fine) addEventListener("pointermove", tilt);
    kick();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", kick);
      removeEventListener("resize", kick);
      removeEventListener("pointermove", tilt);
    };
  }, []);

  const seeWork = () =>
    scrollBy({ top: innerHeight * 1.1, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  const cap = (i: number) => `${s.c} ${idx === i ? s.on : ""}`;

  return (
    <SceneSection scene="cv" className={s.hero}>
      <div ref={track} className={s.track}>
        <div ref={stage} className={s.stage}>
          <div className={s.art}>
            <svg ref={svg} className={s.svg} viewBox="0 0 400 500" role="group" aria-label={copy.story.alt}>
              <defs>
                <filter id="four-rough" x="-10%" y="-20%" width="120%" height="140%">
                  <feTurbulence type="fractalNoise" baseFrequency=".03 .8" numOctaves="2" seed="4" />
                  <feDisplacementMap in="SourceGraphic" scale="10" />
                </filter>
              </defs>
              <g ref={cam} className={s.cam}>
                <g ref={cv}>
                  <rect className={s.canvas} x="40" y="40" width="320" height="420" rx="20" fill="#fff" />
                </g>
                <path ref={brush} className={s.brush} d="M72 330C130 230 170 400 230 300S320 220 330 262" pathLength="1" fill="none" stroke="#12B76A" strokeWidth="46" strokeLinecap="round" filter="url(#four-rough)" />
                <g ref={wire} fill="none" stroke="#06281E" strokeWidth="1.6">
                  <rect className={s.w} pathLength="1" x="70" y="70" width="260" height="28" rx="6" />
                  <rect className={s.w} pathLength="1" x="70" y="116" width="124" height="104" rx="10" />
                  <rect className={s.w} pathLength="1" x="206" y="116" width="124" height="104" rx="10" />
                  <rect className={s.w} pathLength="1" x="70" y="238" width="260" height="66" rx="10" />
                  <rect className={s.w} pathLength="1" x="70" y="326" width="112" height="38" rx="10" />
                  <rect className={s.w} pathLength="1" x="70" y="388" width="260" height="40" rx="10" />
                </g>
                <g ref={dev} opacity="0">
                  <rect x="60" y="86" width="280" height="170" rx="12" fill="#fff" stroke="#06281E" strokeWidth="2" />
                  <path d="M60 112H340" stroke="#06281E" strokeWidth="1.5" />
                  <circle cx="76" cy="99" r="3.5" fill="#FF6F59" />
                  <circle cx="90" cy="99" r="3.5" fill="#F7B733" />
                  <circle cx="104" cy="99" r="3.5" fill="#12B76A" />
                  <rect className={s.blk} x="76" y="128" width="120" height="14" rx="4" fill="#06281E" />
                  <rect className={s.blk} x="76" y="150" width="92" height="8" rx="4" fill="#c9dfd2" />
                  <rect className={s.blk} x="76" y="206" width="84" height="30" rx="8" fill="#12B76A" />
                  <rect className={s.blk} x="212" y="124" width="112" height="56" rx="8" fill="#E9F8F0" />
                  <rect x="232" y="196" width="100" height="224" rx="20" fill="#fff" stroke="#06281E" strokeWidth="2" />
                  <rect className={s.blk} x="268" y="206" width="28" height="5" rx="3" fill="#06281E" />
                  <rect className={s.blk} x="244" y="226" width="76" height="60" rx="8" fill="#E9F8F0" />
                  <rect className={s.blk} x="244" y="296" width="76" height="10" rx="4" fill="#06281E" />
                  <rect className={s.blk} x="244" y="314" width="52" height="8" rx="4" fill="#c9dfd2" />
                  <rect className={s.blk} x="244" y="376" width="76" height="28" rx="8" fill="#12B76A" />
                </g>
                <g
                  ref={bub}
                  className={s.bub}
                  role="button"
                  tabIndex={-1}
                  aria-label={`${copy.join.cta}. Open the chat`}
                  onClick={() => open()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      open();
                    }
                  }}
                >
                  <path d="M100 170H300a40 40 0 0 1 40 40V250a40 40 0 0 1-40 40H190L146 336V290H100a40 40 0 0 1-40-40V210a40 40 0 0 1 40-40Z" fill="#12B76A" />
                  <text className={s.bubText} x="200" y="241" textAnchor="middle" fontWeight={700} fontSize={34} fill="#06281E">{copy.join.cta}</text>
                </g>
              </g>
            </svg>
          </div>
          <div className={s.ticks} aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <i key={i} className={idx === i ? s.tk : undefined} />)}
          </div>
          <div className={s.cap}>
            <div className={cap(0)} inert={idx !== 0}>
              <h1>{copy.hero.title}</h1>
              <p>{copy.story.lead}</p>
              <div className={s.row}>
                <button type="button" className={s.btn} onClick={seeWork}>{copy.hero.primary}</button>
                <button type="button" className={`${s.btn} ${s.sun}`} onClick={() => open()}>{copy.hero.secondary}</button>
              </div>
            </div>
            <div className={cap(1)} inert={idx !== 1}>
              <small>{design.label}</small>
              <h2>{design.title}</h2>
              <p>{design.body}</p>
            </div>
            <div className={cap(2)} inert={idx !== 2}>
              <small>{build.label}</small>
              <h2>{build.title}</h2>
              <p>{build.body}</p>
            </div>
            <div className={cap(3)} inert={idx !== 3}>
              <h2>{copy.join.title}</h2>
              <p>{copy.story.talkLead}</p>
              <button type="button" className={`${s.btn} ${s.sun}`} onClick={() => open()}>{copy.hero.secondary}</button>
            </div>
          </div>
        </div>
      </div>
    </SceneSection>
  );
}
