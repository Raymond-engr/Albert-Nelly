"use client";

import { useEffect, useRef, type RefObject } from "react";
// three@0.128 on purpose: it is the exact version the approved HTML prototype rendered with, so the scenes look identical.
import * as THREE from "three-r128";
import { reportFps } from "@/lib/motion";
import type { SceneId } from "@/types/scene";
import { glbUrl, SCENE_ORDER, type Shared } from "./scenes";

type Loader = { load: (url: string, ok: (g: { scene: THREE.Group }) => void, progress?: undefined, fail?: (e: unknown) => void) => void };
type Item = { root: THREE.Object3D; mats: THREE.Material[]; strokes: THREE.Mesh[]; hv: number };

// The first scene's brushstroke writes AD. Same vertex-colour metal material and the same stroke and trace widths as the original squiggle.
const LH = 1.15, WS = [0.86, 0.7], GP = 0.4, X0 = -(WS[0] + GP + WS[1]) / 2, Y0 = LH / 2;
const XS = [X0, X0 + WS[0] + GP];
const P = (ci: number, u: number, v: number): [number, number] => [XS[ci] + u * WS[ci], Y0 - v * LH];
const ARC = Array.from({ length: 15 }, (_, k) => { const t = -Math.PI / 2 + (Math.PI * k) / 14; return [0.4 + 0.6 * Math.cos(t), 0.5 + 0.5 * Math.sin(t)]; });
const PATHS: [number, number][][] = [
  [[0, 1], [0.5, 0]].map(([u, v]) => P(0, u, v)),
  [[0.5, 0], [1, 1]].map(([u, v]) => P(0, u, v)),
  [[0.2, 0.7], [0.8, 0.7]].map(([u, v]) => P(0, u, v)),
  [[0, 1], [0, 0]].map(([u, v]) => P(1, u, v)),
  [[0, 0], ...ARC, [0, 1]].map(([u, v]) => P(1, u, v)),
];
const GHOST = 0.27; // the wireframe shows faintly on the first board, so it reads like a tablet

const metal = () => new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 1, vertexColors: true, flatShading: true, transparent: true, side: THREE.DoubleSide, depthFunc: THREE.LessDepth });

/** A flat ribbon along each pen stroke, drawn in order so setDrawRange paints it like a brush. hw = half width. */
function ribbon(hw: number, z: number, col: [number, number, number]): THREE.Mesh {
  const pos: number[] = [], cl: number[] = [], ix: number[] = [];
  for (const pl of PATHS) {
    const pts: [number, number][] = [];
    for (let i = 1; i < pl.length; i++) {
      const a = pl[i - 1], b = pl[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.07));
      for (let k = i === 1 ? 0 : 1; k <= n; k++) pts.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
    const m = pts.length, U: [number, number][] = [];
    for (let i = 0; i < m; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(m - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      U.push([dx / l, dy / l]);
    }
    pts[0] = [pts[0][0] - U[0][0] * hw * 0.5, pts[0][1] - U[0][1] * hw * 0.5];
    pts[m - 1] = [pts[m - 1][0] + U[m - 1][0] * hw * 0.5, pts[m - 1][1] + U[m - 1][1] * hw * 0.5];
    const k0 = pos.length / 3;
    pts.forEach((q, i) => {
      const nx = -U[i][1] * hw, ny = U[i][0] * hw;
      pos.push(q[0] + nx, q[1] + ny, z, q[0] - nx, q[1] - ny, z);
      cl.push(...col, ...col);
    });
    for (let i = 0; i < m - 1; i++) { const k = k0 + i * 2; ix.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3));
  g.setIndex(ix);
  g.computeVertexNormals();
  return new THREE.Mesh(g, metal());
}

/**
 * The real 3D: the seven GLB scenes, crossfaded by the weights the Stage computes from scroll.
 * `lite` can change while mounted: the other GLB set loads in the background and each scene is swapped in place.
 */
export default function StageGL({ shared, lite, still, onReady }: { shared: RefObject<Shared>; lite: boolean; still: boolean; onReady: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const liteRef = useRef(lite);
  const stillRef = useRef(still);
  const sigRef = useRef(""); // Still renders one frame, then again only when the visible scene changes
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

    const dark = matchMedia("(prefers-color-scheme: dark)");
    const prepare = (root: THREE.Group, id: SceneId): Item => {
      const it: Item = { root, mats: [], strokes: [], hv: 0 };
      root.visible = false;
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        if (id === "cv" && /stroke/i.test(m.name)) { m.visible = false; return; } // the old squiggle gives way to AD
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.transparent = true;
        mat.flatShading = true;
        mat.side = THREE.DoubleSide;
        mat.needsUpdate = true;
        if (id === "wire") mat.emissive.set(0xe9f8f0); // lines turn pale on a dark theme (intensity is set per frame)
        it.mats.push(mat);
      });
      if (id === "cv") {
        const a = ribbon(0.152, 0.07, [18 / 255, 183 / 255, 106 / 255]);
        const b = ribbon(0.0225, 0.085, [10 / 255, 125 / 255, 74 / 255]);
        a.geometry.setDrawRange(0, 0);
        b.geometry.setDrawRange(0, 0);
        root.add(a, b);
        it.mats.push(a.material as THREE.Material, b.material as THREE.Material);
        it.strokes.push(a, b);
      }
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
        const lt = liteRef.current || id === "bub"; // the bubble always uses the faceted Light model
        if (flavour.get(id) === lt) continue;
        try {
          const ld = loader;
          const gl = await new Promise<{ scene: THREE.Group }>((res, rej) => ld.load(glbUrl(id, lt), res, undefined, rej));
          const it = prepare(gl.scene, id);
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
      const still = stillRef.current;
      if (document.hidden || sh.dim) { fa = 0; fn = 0; return; } // Selected Work: the backdrop is still and the render loop rests
      const cv = items.get("cv");
      if (cv && !t0) t0 = t;
      if (cv && t0) {
        // The brushstroke paints once, about 3 seconds, never loops (not even after a remount).
        const e = sh.painted || still ? 1 : 1 - Math.pow(1 - Math.min(1, Math.max(0, (t - t0 - 500) / 3000)), 3);
        if (e >= 1) sh.painted = true;
        cv.strokes.forEach((m) => m.geometry.setDrawRange(0, Math.floor((e * (m.geometry.index?.count ?? 0)) / 3) * 3));
      }
      items.forEach((it, id) => {
        let a = sh.w[id];
        if (id === "wire") a = Math.max(a, GHOST * sh.w.cv);
        it.root.visible = a > 0.01;
        if (!it.root.visible) return;
        it.mats.forEach((m) => {
          m.opacity = a;
          if (id === "wire") (m as THREE.MeshStandardMaterial).emissiveIntensity = dark.matches ? 0.7 * (1 - sh.w.cv) : 0;
        });
        it.hv += ((sh.hl === id ? 1 : 0) - it.hv) * 0.12;
        it.root.scale.setScalar(1 + 0.07 * it.hv);
      });
      group.position.y = still ? 0 : Math.sin(t / 1400) * 0.08 * sh.fl;
      group.rotation.set(-(12 - sh.py * 8) * (Math.PI / 180), (-16 + 8 * Math.sin(sh.gs * 0.8) + sh.px * 14) * (Math.PI / 180), 0);
      if (still) {
        // Still: one frame, repeated only when the visible scene changes. No idle float, no frame-rate reporting.
        const key = SCENE_ORDER.map((id) => sh.w[id].toFixed(2)).join() + items.size;
        if (key !== sigRef.current) { sigRef.current = key; renderer.render(scene, cam); }
        fa = 0; fn = 0;
        return;
      }
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

  useEffect(() => {
    stillRef.current = still;
    sigRef.current = "";
  }, [still]);

  // Start loading, and load the other set whenever Full and Light change.
  useEffect(() => {
    liteRef.current = lite;
    resync.current?.();
  }, [lite]);

  return <canvas ref={ref} style={{ position: "absolute", left: -150, top: -100, width: 600, height: 600 }} />;
}
