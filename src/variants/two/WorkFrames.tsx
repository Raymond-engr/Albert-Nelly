"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { copy } from "@/data/copy";
import type { WorkItem } from "@/types/content";
import type { MotionMode } from "@/types/motion";
import { Natural, Pic } from "./WorkPic";
import s from "./Work.module.css";

const ui = copy.work.ui;
const hueStyle = (h: number) => ({ "--h": h }) as CSSProperties;
const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** Placeholder phone screen drawn in CSS. Shown until a project has real screens. */
function Mock({ hue, i }: { hue: number; i: number }) {
  return (
    <div className={s.mock} style={hueStyle(hue)} aria-hidden="true">
      <b />
      {[0, 1, 2].map((k) => <i key={k} style={{ height: 16 + ((i + k) % 3) * 14, width: `${(i + k) % 2 ? 70 : 100}%` }} />)}
      <em />
    </div>
  );
}

/** Placeholder full web page drawn in CSS. It is taller than the frame, so the scroll preview has something to scroll. */
function MockPage({ hue }: { hue: number }) {
  const row = <div className={s.pgRow}><i /><i /><i /></div>;
  return (
    <div className={s.page} style={hueStyle(hue)} aria-hidden="true">
      <div className={s.pgHero} />
      {row}
      {[0, 1, 2, 3].map((k) => <p key={k} />)}
      <div className={s.pgBan} />
      {row}
      <div className={s.pgFoot} />
    </div>
  );
}

/** Design: the project's screens inside a phone or laptop frame. Swipe, or use the arrows. */
export function DesignCard({ item, hue, mode }: { item: WorkItem; hue: number; mode: MotionMode }) {
  const [at, setAt] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const screens = item.screens?.length ? item.screens : null;
  const count = screens ? screens.length : 3;
  const step = (d: number) => track.current?.scrollBy({ left: d * track.current.clientWidth, behavior: mode === "still" ? "auto" : "smooth" });

  return (
    <article className={s.card}>
      <div className={s.tile}>
        <div className={item.frame === "laptop" ? s.laptop : s.phone}>
          <div ref={track} className={s.track} onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
            {Array.from({ length: count }, (_, k) => (
              <div key={k} className={s.slide}>
                {screens ? <Pic photo={screens[k]} top sizes="(max-width: 520px) 70vw, 300px" /> : <Mock hue={hue} i={k} />}
              </div>
            ))}
          </div>
        </div>
        <button type="button" className={`${s.arrow} ${s.prev}`} aria-label={ui.screenPrev} onClick={() => step(-1)}>‹</button>
        <button type="button" className={`${s.arrow} ${s.next}`} aria-label={ui.screenNext} onClick={() => step(1)}>›</button>
        <div className={s.dots} aria-hidden="true">
          {Array.from({ length: count }, (_, k) => <i key={k} className={`${s.dot} ${k === at ? s.dotOn : ""}`} />)}
        </div>
      </div>
      <span className={s.chip}>{item.category}</span>
      <h3>{item.title}</h3>
      <p className={s.note}>{item.challenge}</p>
      <p className={s.price}>{item.result}</p>
      <div className={s.row}>
        {item.prototype && <a className={s.link} href={item.prototype} target="_blank" rel="noopener noreferrer">{ui.prototype} ↗</a>}
        <OpenButton type="hire" ctx={item.title}>{ui.want}</OpenButton>
      </div>
    </article>
  );
}

/**
 * Development: a browser frame whose page scrolls, with a phone shot in the corner.
 * Full mode scrolls on mouse hover. The Preview button works in Full and Light. Still mode has no auto-scroll,
 * but the page can still be scrolled by hand.
 */
export function DevCard({ item, hue, mode }: { item: WorkItem; hue: number; mode: MotionMode }) {
  const view = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const [playing, setPlaying] = useState(false);

  const stop = () => cancelAnimationFrame(raf.current);
  const run = (down: boolean) => {
    const v = view.current;
    if (!v) return;
    stop();
    const max = v.scrollHeight - v.clientHeight;
    const from = v.scrollTop;
    const to = down ? max : 0;
    const dur = down ? Math.max(3500, max * 9) : 600;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      v.scrollTop = from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const hover = (e: React.PointerEvent, down: boolean) => {
    if (mode !== "full" || e.pointerType !== "mouse") return;
    if (!down) setPlaying(false);
    run(down);
  };

  return (
    <article className={s.card}>
      <div className={s.tile}>
        <div className={s.browser} onPointerEnter={(e) => hover(e, true)} onPointerLeave={(e) => hover(e, false)}>
          <div className={s.bbar}><i /><i /><i /><span>{item.url ? host(item.url) : ""}</span></div>
          <div ref={view} className={s.view} onWheel={stop} onTouchStart={stop}>
            {item.shot ? <Natural photo={item.shot} sizes="(max-width: 520px) 90vw, 420px" /> : <MockPage hue={hue} />}
          </div>
        </div>
        <div className={s.mobile}>
          {item.mobile ? <Pic photo={item.mobile} top sizes="120px" /> : <Mock hue={hue} i={1} />}
        </div>
        {mode !== "still" && (
          <button
            type="button"
            className={s.pv}
            aria-pressed={playing}
            onClick={() => {
              setPlaying(!playing);
              run(!playing);
            }}
          >
            {playing ? `■ ${ui.stop}` : `▶ ${ui.preview}`}
          </button>
        )}
      </div>
      <span className={s.chip}>{item.category}</span>
      <h3>{item.title}</h3>
      <p className={s.note}>{item.challenge}</p>
      <p className={s.price}>{item.result}</p>
      <div className={s.row}>
        {item.url && <a className={s.link} href={item.url} target="_blank" rel="noopener noreferrer">{ui.visit} {host(item.url)} ↗</a>}
        <OpenButton type="hire" ctx={item.title}>{ui.want}</OpenButton>
      </div>
    </article>
  );
}
