"use client";

import { useEffect, useRef, type RefObject } from "react";
// three@0.128 on purpose: it is the exact version the approved HTML prototype rendered with, so the scenes look identical.
import * as THREE from "three-r128";
import { reportFps } from "@/lib/motion";
import type { SceneId } from "@/types/scene";
import { glbUrl, SCENE_ORDER, type Shared } from "./scenes";

type Loader = { load: (url: string, ok: (g: { scene: THREE.Group }) => void, progress?: undefined, fail?: (e: unknown) => void) => void };
type Item = { root: THREE.Object3D; mats: THREE.Material[]; strokes: THREE.Mesh[]; hv: number };

/**
 * The real 3D: the seven GLB scenes, crossfaded by the weights the Stage computes from scroll.
 * `lite` can change while mounted: the other GLB set loads in the background and each scene is swapped in place.
 */
export default function StageGL({ shared, lite, onReady }: { shared: RefObject<Shared>; lite: boolean; onReady: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const liteRef = useRef(lite);
  const resync = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(600, 600, false);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    cam.position.z = 9;
    const group = new THREE.Group();
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(2, 3, 5);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfe8d3, 0.95), sun, group);

    const items = new Map<SceneId, Item>();
    const flavour = new Map<SceneId, boolean>(); // which GLB set each scene came from (true = Light)
    let dead = false, raf = 0, t0 = 0, ready = false, epoch = 0, loader: Loader | null = null;
    let fa = 0, fn = 0, warm = 2; // frame-rate window for the adaptive engine

    // r128's module loader imports a different "three". Its classic build attaches to a global THREE, so give it one.
    const init = (async () => {
      const g = globalThis as unknown as { THREE?: Record<string, unknown> };
      g.THREE = { ...THREE };
      await import("three-r128/examples/js/loaders/GLTFLoader.js");
      const Ctor = (g.THREE as unknown as { GLTFLoader: new () => Loader }).GLTFLoader;
      loader = new Ctor();
    })();

    const prepare = (root: THREE.Group): Item => {
      const it: Item = { root, mats: [], strokes: [], hv: 0 };
      root.visible = false;
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.transparent = true;
        mat.flatShading = true;
        mat.side = THREE.DoubleSide;
        mat.needsUpdate = true;
        it.mats.push(mat);
        if (/stroke/i.test(m.name)) it.strokes.push(m);
      });
      return it;
    };
    const drop = (it: Item) => {
      group.remove(it.root);
      it.root.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      it.mats.forEach((m) => m.dispose());
    };

    // Load scene by scene in the background so the first scene paints as early as possible. Run again when `lite` changes:
    // scenes already on screen keep showing until their replacement has arrived, so a mode change never leaves a gap.
    const sync = async () => {
      const mine = ++epoch;
      try { await init; } catch { return; }
      for (const id of SCENE_ORDER) {
        if (dead || mine !== epoch || !loader) return;
        const lt = liteRef.current;
        if (flavour.get(id) === lt) continue;
        try {
          const ld = loader;
          const gl = await new Promise<{ scene: THREE.Group }>((res, rej) => ld.load(glbUrl(id, lt), res, undefined, rej));
          const it = prepare(gl.scene);
          if (dead || mine !== epoch) { drop(it); return; } // superseded while loading
          const old = items.get(id);
          if (old) { it.hv = old.hv; drop(old); }
          group.add(gl.scene);
          items.set(id, it);
          flavour.set(id, lt);
          if (!ready) { ready = true; onReady(); }
        } catch {
          /* a missing file just leaves that scene to the flat poster (or to the set it already had) */
        }
        await new Promise((r) => setTimeout(r, 120));
      }
    };
    resync.current = () => { void sync(); };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const sh = shared.current;
      if (document.hidden || sh.dim) { fa = 0; fn = 0; return; } // Selected Work: the backdrop is still and the render loop rests
      const cv = items.get("cv");
      if (cv && !t0) t0 = t;
      if (cv && t0) {
        // The brushstroke paints once, about 3 seconds, never loops (not even after a remount).
        const e = sh.painted ? 1 : 1 - Math.pow(1 - Math.min(1, Math.max(0, (t - t0 - 500) / 3000)), 3);
        if (e >= 1) sh.painted = true;
        cv.strokes.forEach((m) => m.geometry.setDrawRange(0, Math.floor((e * (m.geometry.index?.count ?? 0)) / 3) * 3));
      }
      items.forEach((it, id) => {
        const a = sh.w[id];
        it.root.visible = a > 0.01;
        if (!it.root.visible) return;
        it.mats.forEach((m) => { m.opacity = a; });
        it.hv += ((sh.hl === id ? 1 : 0) - it.hv) * 0.12;
        it.root.scale.setScalar(1 + 0.07 * it.hv);
      });
      group.position.y = Math.sin(t / 1400) * 0.08 * sh.fl;
      group.rotation.set(-(12 - sh.py * 8) * (Math.PI / 180), (-16 + 8 * Math.sin(sh.gs * 0.8) + sh.px * 14) * (Math.PI / 180), 0);
      renderer.render(scene, cam);
      // Frame rate: a slow device steps down by itself (src/lib/motion.ts). The first two windows are warm-up (models still loading).
      if (!ready) return;
      fn++;
      if (!fa) fa = t;
      else if (t - fa >= 2000) {
        if (warm > 0) warm--;
        else reportFps((fn * 1000) / (t - fa));
        fa = t;
        fn = 0;
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      dead = true;
      resync.current = null;
      cancelAnimationFrame(raf);
      items.forEach(drop);
      renderer.dispose();
    };
  }, [shared, onReady]);

  // Start loading, and load the other set whenever Full and Light change.
  useEffect(() => {
    liteRef.current = lite;
    resync.current?.();
  }, [lite]);

  return <canvas ref={ref} style={{ position: "absolute", left: -150, top: -100, width: 600, height: 600 }} />;
}
