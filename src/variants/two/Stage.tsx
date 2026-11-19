"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useMotionMode } from "@/hooks/useMotionMode";
import { useScene } from "@/providers/SceneProvider";
import s from "./Stage.module.css";

// three.js is only downloaded after first paint, on the client.
const StageGL = dynamic(() => import("./StageGL"), { ssr: false });

/** Fixed background: a painted canvas that becomes a wireframe, devices, shapes, a school, a network and a speech bubble. */
export default function Stage() {
  const { scene, dim } = useScene();
  // Adapts at runtime, or is pinned in development by NEXT_PUBLIC_MOTION_MODE. See src/lib/motion.ts.
  const mode = useMotionMode();
  const [failed, setFailed] = useState(false);
  return (
    <div className={`${s.stage} ${dim ? s.dim : ""} ${failed ? s.fb : ""}`} data-s={scene} data-mode={mode} aria-hidden="true">
      {!failed && <StageGL scene={scene} dim={dim} mode={mode} onFail={() => setFailed(true)} />}
    </div>
  );
}
