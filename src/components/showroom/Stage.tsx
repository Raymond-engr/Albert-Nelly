"use client";

import { useEffect, useRef } from "react";
import { useScene } from "@/providers/SceneProvider";
import { StageArt } from "./StageArt";
import s from "./Stage.module.css";

/** Fixed background behind the page. Reads the scene from context and never owns content. */
export default function Stage() {
  const { scene, dim } = useScene();
  const ref = useRef<HTMLDivElement>(null);

  // Desktop only: the canvas follows the pointer slightly.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = matchMedia("(hover: hover) and (min-width: 821px)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine) return;
    const move = (e: PointerEvent) => {
      el.style.setProperty("--ry", `${-10 + (e.clientX / innerWidth - 0.5) * 10}deg`);
      el.style.setProperty("--rx", `${3 - (e.clientY / innerHeight - 0.5) * 8}deg`);
    };
    addEventListener("pointermove", move);
    return () => removeEventListener("pointermove", move);
  }, []);

  return (
    <div ref={ref} className={`${s.stage} ${dim ? s.dim : ""}`} data-s={scene} aria-hidden="true">
      <StageArt />
    </div>
  );
}
