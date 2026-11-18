"use client";

import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { useScene } from "@/providers/SceneProvider";
import type { Mode } from "./world";
import s from "./Stage.module.css";

// three.js is only downloaded after first paint, on the client.
const StageGL = dynamic(() => import("./StageGL"), { ssr: false });

/** Reduced motion gets Still; data saver and low-memory phones get Light; everything else gets Full. */
function autoMode(): Mode {
  const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return "still";
  return (n.deviceMemory && n.deviceMemory < 4) || n.connection?.saveData ? "light" : "full";
}
const subscribe = () => () => {};

/** Fixed background: a painted canvas that becomes a wireframe, devices, shapes, a school, a network and a speech bubble. */
export default function Stage() {
  const { scene, dim } = useScene();
  const mode = useSyncExternalStore(subscribe, autoMode, () => "full" as Mode);
  const [failed, setFailed] = useState(false);
  return (
    <div className={`${s.stage} ${dim ? s.dim : ""} ${failed ? s.fb : ""}`} data-s={scene} aria-hidden="true">
      {!failed && <StageGL scene={scene} dim={dim} mode={mode} onFail={() => setFailed(true)} />}
    </div>
  );
}
