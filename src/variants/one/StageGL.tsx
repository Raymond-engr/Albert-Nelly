"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { SceneId } from "@/types/scene";
import { makePainting } from "./painting";
import { buildScenes } from "./scenes";
import s from "./Stage.module.css";

type Props = { scene: SceneId; dim: boolean; onReady: () => void };

/** The seven 3D scenes in one fixed canvas. Loaded on demand by Stage; never rendered on the server. */
export default function StageGL({ scene, dim, onReady }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ scene, dim });
  const ready = useRef(onReady);
  useEffect(() => {
    live.current = { scene, dim };
    ready.current = onReady;
  });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const mobile = innerWidth < 768;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // no WebGL: the Still version stays on screen
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
    renderer.setSize(innerWidth, innerHeight);
    el.appendChild(renderer.domElement);

    const W = mobile ? 608 : 1024;
    const H = mobile ? 608 : 704;
    const painting = makePainting(W, H);
    const { scenes, texture, assemble, dispose } = buildScenes(painting.canvas, W / H);
    const sce = new THREE.Scene();
    scenes.forEach((x) => sce.add(x.group));
    const cam = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 50);
    cam.position.z = 8;
    // Lights use physical units in current three.js, so the old 0.95 and 0.55 are multiplied by PI.
    const hemi = new THREE.HemisphereLight(0xffffff, 0xbfe8d2, 0.95 * Math.PI);
    const key = new THREE.DirectionalLight(0xffffff, 0.55 * Math.PI);
    key.position.set(2, 3, 4);
    sce.add(hemi, key);

    let mx = 0, my = 0, cx = 0, cy = 0, raf = 0, last = 0, dimSince = 0, fired = false, painted = false;
    const START = performance.now() + 900; // the stroke starts after the text has appeared
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
    };
    if (!mobile) addEventListener("pointermove", onMove);
    const onResize = () => {
      cam.aspect = innerWidth / innerHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    };
    addEventListener("resize", onResize);

    const loop = (ts: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || (mobile && ts - last < 33)) return; // 30 fps on phones
      last = ts;
      const { scene: active, dim: quiet } = live.current;
      if (quiet) { // Selected Work: let the fade finish, then pause the render loop
        if (!dimSince) dimSince = ts;
        if (ts - dimSince > 900) return;
      } else dimSince = 0;

      if (!painted && ts > START) {
        const q = Math.min(1, (ts - START) / 3200);
        painting.paint(q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2);
        texture.needsUpdate = true;
        painted = q >= 1;
      }

      const w = innerWidth, h = innerHeight, U = 5.045 / h, t = ts / 1000;
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      const px = mobile ? w / 2 : w * 0.72;
      const py = mobile ? h * 0.68 : h * 0.5;
      const size = mobile ? Math.min(w * 0.8, h * 0.36) : Math.min(w * 0.42, h * 0.62, 560);
      let warm = 0;
      for (const sc of scenes) {
        sc.e += ((sc.id === active ? 1 : 0) - sc.e) * 0.08;
        sc.group.visible = sc.e > 0.01;
        if (!sc.group.visible) continue;
        sc.group.scale.setScalar(((size * U) / Math.max(sc.dw, sc.dh)) * (0.6 + 0.4 * sc.e));
        sc.group.position.set((px - w / 2) * U, -(py - h / 2) * U, 0);
        sc.update?.(t, sc);
        sc.group.rotation.x += cy * 0.3;
        sc.group.rotation.y += cx * 0.35;
        assemble(sc);
        if (sc.id === "sch") warm = sc.e; // the light turns warmer in the school scene
      }
      key.color.setRGB(1, 1 - 0.08 * warm, 1 - 0.28 * warm);
      hemi.color.copy(key.color);
      renderer.render(sce, cam);
      if (!fired) {
        fired = true;
        ready.current();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      removeEventListener("resize", onResize);
      dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className={s.gl} />;
}
