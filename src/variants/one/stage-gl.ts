import * as THREE from "three";
import { makePainting, stepper } from "./painting";
import { buildScenes } from "./scenes";

/**
 * Starts the 3D layer inside `host` (a fixed, full-screen, click-through element).
 * Each scene sits on the page element [data-stage="<scene id>"] and follows it while the visitor scrolls.
 * Scenes whose element is off screen are hidden, and when none is on screen the render loop idles
 * (this is the quiet moment in Selected Work). Returns a stop function, or null when WebGL is unavailable.
 */
export function startStage(host: HTMLElement): (() => void) | null {
  const mobile = innerWidth < 768;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  host.appendChild(renderer.domElement);

  const W = mobile ? 608 : 1024;
  const H = mobile ? 608 : 704;
  const painting = makePainting(W, H);
  const play = stepper(painting, reduced);
  const { scenes, texture, assemble, dispose } = buildScenes(painting.canvas, W / H);
  const sce = new THREE.Scene();
  scenes.forEach((x) => sce.add(x.group));
  const cam = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 50);
  cam.position.z = 8;
  // Lights use physical units in current three.js, so the original 0.95 and 0.55 are multiplied by PI.
  const hemi = new THREE.HemisphereLight(0xffffff, 0xbfe8d2, 0.95 * Math.PI);
  const key = new THREE.DirectionalLight(0xffffff, 0.55 * Math.PI);
  key.position.set(2, 3, 4);
  sce.add(hemi, key);

  let mx = 0, my = 0, cx = 0, cy = 0, raf = 0, last = 0;
  const onMove = (e: PointerEvent) => {
    mx = e.clientX / innerWidth - 0.5;
    my = e.clientY / innerHeight - 0.5;
  };
  if (!mobile && !reduced) addEventListener("pointermove", onMove);
  const onResize = () => {
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };
  addEventListener("resize", onResize);

  const m = reduced ? 0 : 1;
  const loop = (ts: number) => {
    raf = requestAnimationFrame(loop);
    if (document.hidden || (mobile && ts - last < 33)) return; // 30 fps on phones
    last = ts;
    if (play.tick(ts)) texture.needsUpdate = true;
    const U = 5.045 / innerHeight;
    const t = ts / 1000;
    cx += (mx - cx) * 0.06;
    cy += (my - cy) * 0.06;
    let any = false;
    let warm = 0;
    for (const s of scenes) {
      if (!s.a || !s.a.isConnected) s.a = document.querySelector(`[data-stage="${s.id}"]`);
      const b = s.a?.getBoundingClientRect();
      const vis = !!b && b.bottom > -60 && b.top < innerHeight + 60;
      s.group.visible = vis;
      if (!b || !vis) continue;
      any = true;
      const p = (b.top + b.height / 2 - innerHeight / 2) / (innerHeight / 2); // -1 below the middle... 1 at the bottom edge
      const target = p <= 0 ? 1 : Math.min(1, Math.max(0, 1.3 * (1 - p)));
      s.e += (target - s.e) * (reduced ? 1 : 0.08);
      s.h += ((s.a?.closest("article")?.matches(":hover") ? 1 : 0) - s.h) * 0.12; // a hovered card lights its object
      s.group.scale.setScalar(Math.min((b.width * U) / s.dw, (b.height * U) / s.dh) * 0.92 * (1 + 0.1 * s.h));
      s.group.position.set((b.left + b.width / 2 - innerWidth / 2) * U, -(b.top + b.height / 2 - innerHeight / 2) * U, 0);
      s.update?.(t, s, { m, cx, cy });
      assemble(s);
      if (s.id === "sch") warm = Math.max(0, 1 - Math.abs(p)); // the light turns warmer in the school scene
    }
    renderer.domElement.style.visibility = any ? "visible" : "hidden";
    if (!any) return;
    key.color.setRGB(1, 1 - 0.08 * warm, 1 - 0.28 * warm);
    hemi.color.copy(key.color);
    renderer.render(sce, cam);
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
}
