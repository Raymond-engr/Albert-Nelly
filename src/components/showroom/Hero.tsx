"use client";

import { useEffect, useRef, useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { buttonClass } from "@/components/ui/Button";
import { copy } from "@/data/copy";
import s from "./Hero.module.css";

/** Which Stage scene each slide shows. The Stage reads it from data-stage-scene on the track. */
const SCENES = ["cv", "wire", "dev", "bub"] as const;
/** Where the scroll lands for each dot, as a share of the track. */
const STOPS = [0.05, 0.33, 0.63, 0.92];
const RULER = Array.from({ length: 12 }, (_, i) => i * 80);

const slideAt = (p: number) => (p < 0.17 ? 0 : p < 0.5 ? 1 : p < 0.76 ? 2 : 3);

/**
 * Four slides that play while the page scrolls through a tall track: the idea, UI/UX design, build, then "let's talk".
 * The 3D is the Stage behind it. This only says which scene is current, so the art never lives in two places.
 */
export default function Hero() {
  const track = useRef<HTMLElement>(null);
  const [idx, setIdx] = useState(0);
  const scenes = copy.story.scenes;

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = track.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const range = Math.max(1, r.height - innerHeight);
      setIdx(slideAt(Math.min(1, Math.max(0, -r.top / range))));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, []);

  const go = (k: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY + STOPS[k] * (el.offsetHeight - innerHeight);
    scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const caps = [
    { key: "idea", label: "", title: copy.hero.title, body: copy.story.lead },
    { key: "ux", label: scenes[0].label, title: scenes[0].title, body: scenes[0].body },
    { key: "dev", label: scenes[1].label, title: scenes[1].title, body: scenes[1].body },
    { key: "talk", label: "", title: copy.join.title, body: copy.story.talkLead },
  ];

  return (
    <section
      ref={track}
      className={`${s.track} ${idx === 1 ? s.bp2 : ""}`}
      data-stage-slides=""
      data-stage-scene={SCENES[idx]}
      data-stage-slide={idx}
      aria-label={copy.story.alt}
    >
      <div className={s.screen}>
        {/* Slide 2 only: a ruler down the left edge. Decoration. */}
        <div className={`${s.bpl} ${idx === 1 ? s.on : ""}`} aria-hidden="true">
          <div className={s.ruler}><span className={s.t1} /><span className={s.t2} /></div>
          {RULER.map((y) => <em key={y} style={{ top: y + 4 }}>{y}</em>)}
        </div>
        <div className="wrap">
          <div className="col">
            <div className={s.cap}>
              {caps.map((c, k) => (
                <div key={c.key} className={`${s.c} ${idx === k ? s.on : ""}`} inert={idx !== k}>
                  {c.label && <small>{c.label}</small>}
                  {k === 0 ? <h1>{c.title}</h1> : <h2>{c.title}</h2>}
                  <p className={k === 0 ? s.lead : ""}>{c.body}</p>
                  {k === 0 && (
                    <div className={s.acts}>
                      <a className={buttonClass("dark")} href="#services">{copy.hero.primary}</a>
                      <OpenButton variant="sun">{copy.hero.secondary}</OpenButton>
                    </div>
                  )}
                  {k === 3 && <OpenButton variant="sun">{copy.hero.secondary}</OpenButton>}
                </div>
              ))}
            </div>
            <div className={s.dots}>
              <span className={s.cnt} aria-hidden="true">{`0${idx + 1} / 04`}</span>
              {SCENES.map((_, k) => (
                <button key={k} type="button" aria-label={`Go to slide ${k + 1} of 4`} aria-current={idx === k} onClick={() => go(k)}><i /></button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
