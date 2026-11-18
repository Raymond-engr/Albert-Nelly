"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useRegistration } from "@/providers/RegistrationProvider";
import type { SceneId } from "@/types/scene";
import { buildWorld, G, MINT, type Mode } from "./world";

type Props = { scene: SceneId; dim: boolean; mode: Mode; onFail: () => void };

const ss = (x: number) => {
  const v = Math.min(1, Math.max(0, x));
  return v * v * (3 - 2 * v);
};
/** Where each group (cv, wire, dev, shp, sch, net, bub) is visible on the 0..1 story timeline. */
const IV: [number, number][] = [[-1, 0.16], [0.1, 0.36], [0.33, 0.56], [0.44, 0.56], [0.54, 0.7], [0.76, 0.93], [0.9, 9]];
/** Section id -> timeline position when that section reaches 45% of the viewport. The hero is the start (0). */
const STOPS: [string, number][] = [["about", 0.12], ["services", 0.2], ["schools", 0.6], ["work", 0.72], ["referral", 0.78], ["partners", 0.9], ["join", 0.96]];
/** Camera path: [timeline, x, y, z]. */
const CAM = [[0, 0, 0, 7.2], [0.2, 0, 0, 5.6], [0.4, 0.3, 0.2, 6.6], [0.58, 0, 0.2, 7], [0.66, 0, -0.8, 6.3], [0.8, 0, 0, 7.5], [1, 0, 0, 6.2]];
/** Which group pulses when a service card switches the scene (Art and Painting pulses the stroke trace on the wireframe). */
const PULSE: Record<SceneId, number> = { cv: 1, wire: 1, dev: 2, shp: 3, sch: 4, net: 5, bub: 6 };

function timeline(): number {
  const pts: [number, number][] = [[0, 0]];
  for (const [id, t] of STOPS) {
    const el = document.getElementById(id);
    if (el) pts.push([el.getBoundingClientRect().top + scrollY, t]);
  }
  const y = scrollY + innerHeight * 0.45;
  let i = 0;
  while (i < pts.length - 1 && pts[i + 1][0] <= y) i++;
  const last = i === pts.length - 1;
  const nextTop = last ? document.documentElement.scrollHeight : pts[i + 1][0];
  const nextT = last ? 1 : pts[i + 1][1];
  return pts[i][1] + (nextT - pts[i][1]) * Math.min(1, Math.max(0, (y - pts[i][0]) / Math.max(1, nextTop - pts[i][0])));
}

function camAt(t: number): number[] {
  let i = 0;
  while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[i + 1], u = ss((t - a[0]) / (b[0] - a[0]));
  return [1, 2, 3].map((k) => a[k] + (b[k] - a[k]) * u);
}

/** The seven 3D scenes in one fixed canvas, scrubbed by scroll. Loaded on demand by Stage; never rendered on the server. */
export default function StageGL({ scene, dim, mode, onFail }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const { isOpen, open } = useRegistration();
  const live = useRef({ scene, dim, mode, isOpen, open, onFail });
  useEffect(() => {
    live.current = { scene, dim, mode, isOpen, open, onFail };
  });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let rd: THREE.WebGLRenderer;
    try {
      rd = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      live.current.onFail();
      return;
    }
    el.appendChild(rd.domElement);
    const w = buildWorld();
    const sc = new THREE.Scene();
    sc.add(w.root);
    // Lights use physical units in current three.js, so the prototype's 0.95 and 0.7 are multiplied by PI.
    sc.add(new THREE.HemisphereLight(0xffffff, 0xbfe9d3, 0.95 * Math.PI));
    const key = new THREE.DirectionalLight(0xffffff, 0.7 * Math.PI);
    key.position.set(3, 5, 4);
    sc.add(key);
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50);

    let applied: Mode | null = null, ts = 0, px = 0, py = 0, done = false, raf = 0;
    const pl = [0, 0, 0, 0, 0, 0, 0];
    const start = performance.now() + 900; // the stroke starts after the text has appeared

    const resize = () => {
      rd.setSize(innerWidth, innerHeight, false);
      cam.aspect = innerWidth / innerHeight;
      cam.updateProjectionMatrix();
      const wide = innerWidth > 800;
      w.root.position.set(wide ? 1.5 : 0, wide ? 0 : 1.1, 0);
      w.root.scale.setScalar(wide ? 1 : 0.72);
    };
    const apply = (m: Mode) => {
      applied = m;
      rd.setPixelRatio(m === "full" ? Math.min(devicePixelRatio, 2) : 1);
      w.orb.forEach((o, i) => (o.visible = m === "full" || i < 4));
      resize();
      if (m === "still") w.paint(1);
    };
    const onMove = (e: PointerEvent) => {
      if (live.current.mode === "full" && matchMedia("(pointer: fine)").matches) {
        px = (e.clientX / innerWidth) * 2 - 1;
        py = (e.clientY / innerHeight) * 2 - 1;
      }
    };
    // Tapping the speech bubble opens the registration panel.
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || live.current.isOpen || w.gs[6].userData.w < 0.5 || t.closest('a,button,input,select,label,details,aside,nav,[class*="card"]')) return;
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), cam);
      if (ray.intersectObject(w.bubble, true).length) live.current.open();
    };
    addEventListener("resize", resize);
    addEventListener("pointermove", onMove);
    addEventListener("click", onClick);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const L = live.current;
      if (document.hidden || L.dim) return; // Selected Work: the render loop pauses
      if (L.mode !== applied) apply(L.mode);
      const still = L.mode === "still", fl = still ? 0 : 1, time = now / 1000;
      ts += (timeline() - ts) * (still ? 1 : 0.08);
      if (!done) {
        const u = still ? 1 : Math.min(1, Math.max(0, (now - start) / 3000));
        w.paint(1 - Math.pow(1 - u, 3));
        if (u >= 1) done = true;
      }
      const inServices = ts >= 0.2 && ts < 0.6;
      IV.forEach((v, i) => {
        const wt = ss((ts - v[0]) / 0.06) * (1 - ss((ts - v[1]) / 0.06));
        pl[i] += ((inServices && PULSE[L.scene] === i ? 1 : 0) - pl[i]) * 0.15;
        const g = w.gs[i];
        g.visible = wt > 0.01;
        g.scale.setScalar(Math.max(0.001, wt * (1 + 0.1 * pl[i])));
        g.userData.w = wt;
      });
      w.gs[1].children.forEach((c, i) => c.scale.setScalar(Math.max(0.001, ss(w.gs[1].userData.w * 1.6 - i * 0.15))));
      w.gs[0].position.y = Math.sin(time * 0.8) * 0.08 * fl;
      w.orb.forEach((o) => {
        const d = o.userData, a = time * d.s * fl + d.p;
        o.position.set(Math.cos(a) * d.r, d.y + Math.sin(a * 1.3) * 0.2 * fl, Math.sin(a) * d.r * 0.5);
        o.rotation.set(a, a * 0.7, 0);
      });
      w.cap.rotation.y = time * 0.4 * fl;
      w.h1.rotation.y = Math.sin(time) * 0.2 * fl;
      w.h2.rotation.y = -Math.sin(time) * 0.2 * fl;
      // The four referral nodes light up with the steps of whatever Referral section is on the page.
      let lit = 0;
      document.querySelectorAll("#referral li").forEach((li, i) => {
        if (li.getBoundingClientRect().top < innerHeight * 0.72) lit = i + 1;
      });
      w.nodes.forEach((n, i) => {
        (n.material as THREE.MeshLambertMaterial).color.setHex(i < lit ? G : MINT);
        n.scale.setScalar(i < lit ? 1.5 : 1);
      });
      w.root.rotation.y += (px * 0.2 - w.root.rotation.y) * 0.05;
      w.root.rotation.x += (py * 0.1 - w.root.rotation.x) * 0.05;
      const c = camAt(ts);
      cam.position.set(c[0] + px * 0.3, c[1] - py * 0.2, c[2]);
      cam.lookAt(0, 0, 0);
      rd.render(sc, cam);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
      removeEventListener("click", onClick);
      w.dispose();
      rd.dispose();
      rd.domElement.remove();
    };
  }, []);

  return <div ref={host} style={{ display: "contents" }} />;
}
