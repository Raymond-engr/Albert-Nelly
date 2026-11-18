"use client";

import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { useScene } from "@/providers/SceneProvider";
import StillArt from "./StillArt";
import s from "./Stage.module.css";

// three.js is only downloaded when the device can run it, after first paint.
const StageGL = dynamic(() => import("./StageGL"), { ssr: false });

let cached: boolean | undefined;
function canRun3D(): boolean {
  if (cached !== undefined) return cached;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  let ok = !matchMedia("(prefers-reduced-motion: reduce)").matches && !nav.connection?.saveData;
  if (ok) {
    try {
      const c = document.createElement("canvas");
      ok = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      ok = false;
    }
  }
  return (cached = ok);
}
const subscribe = () => () => {};

/** Fixed background: a painted canvas that becomes a wireframe, devices, shapes, a school, a network and a bubble. */
export default function Stage() {
  const { scene, dim } = useScene();
  const gl = useSyncExternalStore(subscribe, canRun3D, () => false);
  const [ready, setReady] = useState(false);
  return (
    <div className={`${s.stage} ${dim ? s.dim : ""}`} data-s={scene} aria-hidden="true">
      <StillArt painted={!gl} hidden={gl && ready} />
      {gl && <StageGL scene={scene} dim={dim} onReady={() => setReady(true)} />}
    </div>
  );
}
