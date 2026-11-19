"use client";

import { useEffect, useRef } from "react";
import { useMotionMode } from "@/hooks/useMotionMode";
import { useScene } from "@/providers/SceneProvider";
import { StageArt } from "./StageArt";
import s from "./Stage.module.css";

/** Fixed background behind the page. Reads the scene from context and never owns content. */
export default function Stage() {
  const { scene, dim } = useScene();
  const mode = useMotionMode();
  const ref = useRef<HTMLDivElement>(null);

  // Full mode, desktop only: the canvas follows the pointer slightly. Light and Still keep it level.
  useEffect(() => {
    const el = ref.current;
    if (!el || mode !== "full") return;
    const fine = matchMedia("(hover: hover) and (min-width: 821px)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine) return;
    const move = (e: PointerEvent) => {
      el.style.setProperty("--ry", `${-10 + (e.clientX / innerWidth - 0.5) * 10}deg`);
      el.style.setProperty("--rx", `${3 - (e.clientY / innerHeight - 0.5) * 8}deg`);
    };
    addEventListener("pointermove", move);
    return () => {
      removeEventListener("pointermove", move);
      el.style.removeProperty("--ry"); // eases back to level through the transform transition
      el.style.removeProperty("--rx");
    };
  }, [mode]);

  return (
    <div ref={ref} className={`${s.stage} ${dim ? s.dim : ""}`} data-s={scene} data-mode={mode} aria-hidden="true">
      <StageArt />
    </div>
  );
}
