"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { phoneChat, type PhoneItem, type PhoneMessage } from "@/data/referral";
import { useMotionMode } from "@/hooks/useMotionMode";
import s from "./PhoneChat.module.css";

const PhoneGL = dynamic(() => import("./PhoneGL"), { ssr: false });

const items: readonly PhoneItem[] = phoneChat.items;
const isMsg = (it: PhoneItem): it is PhoneMessage => "from" in it;
const tone = { me: "", client: s.client, team: s.team };

/**
 * One step of the loop: what is on screen and for how long.
 * tick: 0 none yet, 1 sent, 2 delivered (grey), 3 read (blue).
 */
type Frame = { shown: number; typing: number; tick: 0 | 1 | 2 | 3; react: boolean; out: boolean; ms: number };

// The whole loop is worked out once, from the data, so the component only has to step through it.
const FRAMES: Frame[] = (() => {
  const out: Frame[] = [];
  let shown = 0, tick: Frame["tick"] = 0, react = false;
  const push = (o: Partial<Frame> & { ms: number }) => out.push({ shown, typing: -1, tick, react, out: false, ...o });
  push({ ms: 1000 });
  items.forEach((it, i) => {
    if (!isMsg(it)) {
      shown = i + 1; // a day chip arrives together with the next message
      return;
    }
    if (it.typingMs) {
      if (tick === 2) tick = 3; // the first reply starts: the contact has read your message
      push({ typing: i, ms: it.typingMs });
    }
    shown = i + 1;
    if (it.from === "me") {
      tick = 1;
      push({ ms: 800 });
      tick = 2;
      push({ ms: 1100 });
    } else if (it.react) {
      push({ ms: 700 });
      react = true;
      push({ ms: 1100 });
    } else push({ ms: 1100 });
  });
  push({ ms: 3500 });
  push({ ms: 600, out: true });
  return out;
})();

// Still shows the finished conversation, with nothing moving.
const STILL: Frame = { shown: items.length, typing: -1, tick: 3, react: true, out: false, ms: 0 };

/**
 * A WhatsApp group chat on a phone: messages arrive one by one, typing dots between them, then it loops.
 * Full and Light play the loop (Full adds pop-in, a smooth scroll and, with WebGL, a 3D body that floats and tilts).
 * Still shows the whole chat with nothing moving, and the chat scrolls so the start can be read.
 * Everything on the screen is hidden from screen readers; the same text sits in a visually hidden list.
 */
export default function PhoneChat() {
  const mode = useMotionMode();
  const still = mode === "still";
  const [f, setF] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [glOn, setGlOn] = useState(false);
  const [scale, setScale] = useState(1);
  const [hintGone, setHintGone] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const scr = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const fr = still ? STILL : FRAMES[f];
  const typer = fr.typing >= 0 ? items[fr.typing] : null;

  // Step through the loop. Off screen, paused or Still: stop the clock.
  useEffect(() => {
    if (still || paused || !inView) return;
    const t = setTimeout(() => setF((i) => (i + 1) % FRAMES.length), FRAMES[f].ms);
    return () => clearTimeout(t);
  }, [f, still, paused, inView]);

  // Keep the newest message in view. Smooth in Full, instant otherwise (and in Still, where it opens on the last message).
  useEffect(() => {
    body.current?.scrollTo({ top: body.current.scrollHeight, behavior: mode === "full" ? "smooth" : "auto" });
  }, [fr.shown, fr.typing, fr.react, mode]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / 340)));
    io.observe(el);
    ro.observe(el);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={host} className={s.host} data-mode={mode}>
      <div className={s.rigw} style={{ "--s": scale } as CSSProperties}>
        <div className={`${s.rig} ${glOn ? s.g3 : ""}`}>
          <div className={s.fb} />
          {!still && (
            <PhoneGL
              className={s.cv}
              mode={mode}
              active={inView && !paused}
              hostRef={host}
              screenRef={scr}
              onState={setGlOn}
            />
          )}
          <div ref={scr} className={s.scr} aria-hidden="true">
            <div className={s.sb}>
              <span>{phoneChat.clock}</span>
              <span className={s.si}>
                {phoneChat.network}
                <svg width="12" height="10" viewBox="0 0 12 10" fill="#fff"><rect y="7" width="2" height="3" /><rect x="3" y="5" width="2" height="5" /><rect x="6" y="3" width="2" height="7" /><rect x="9" width="2" height="10" /></svg>
                <svg width="18" height="10" viewBox="0 0 18 10"><rect x=".5" y=".5" width="14" height="9" rx="2" fill="none" stroke="#fff" /><rect x="2" y="2" width="9" height="6" rx="1" fill="#fff" /><rect x="15.5" y="3" width="2" height="4" rx="1" fill="#fff" /></svg>
              </span>
            </div>
            <div className={s.hd}>
              <span className={s.bk}>‹</span>
              <i className={s.av}>{phoneChat.initials}</i>
              <div className={s.ti}>
                <b>{phoneChat.group}</b>
                <small>{typer && isMsg(typer) ? `${typer.name} ${phoneChat.typing}` : phoneChat.members}</small>
              </div>
              <span className={s.mn}>⋮</span>
            </div>
            <div
              ref={body}
              className={`${s.bd} ${fr.out ? s.out : ""}`}
              onScroll={(e) => {
                const el = e.currentTarget;
                if (still && !hintGone && el.scrollHeight - el.clientHeight - el.scrollTop > 24) setHintGone(true);
              }}
            >
              {items.slice(0, fr.shown).map((it, i) =>
                isMsg(it) ? (
                  <div key={i} className={`${s.m} ${it.from === "me" ? s.me : ""} ${it.react && fr.react ? s.hr : ""}`}>
                    {it.from !== "me" && <b className={tone[it.from]}>{it.name}</b>}
                    {it.text}
                    <i>
                      {it.time}
                      {it.from === "me" && <span className={`${s.tk} ${fr.tick === 3 ? s.rd : ""}`}>{fr.tick === 1 ? "✓" : "✓✓"}</span>}
                    </i>
                    {it.react && fr.react && <span className={s.re}>{it.react}</span>}
                  </div>
                ) : (
                  <div key={i} className={s.dt}>{it.day}</div>
                ),
              )}
              {typer && isMsg(typer) && (
                <div className={`${s.m} ${s.ty}`}>
                  <b className={tone[typer.from]}>{typer.name}</b>
                  <span className={s.d} /><span className={s.d} /><span className={s.d} />
                </div>
              )}
            </div>
            {still && !hintGone && <div className={s.hint}>{phoneChat.scrollHint}</div>}
            <div className={s.in}>
              <div className={s.pill}>{phoneChat.placeholder}</div>
              <div className={s.mic}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      {!still && (
        <button type="button" className={s.pp} aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? phoneChat.play : phoneChat.pause}
        </button>
      )}
      <ul className={s.sr} aria-label={phoneChat.label}>
        {items.filter(isMsg).map((m, i) => (
          <li key={i}>{m.name}: {m.text}</li>
        ))}
      </ul>
    </div>
  );
}
