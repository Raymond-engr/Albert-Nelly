"use client";

import { useEffect, useRef, type RefObject } from "react";
// three@0.128 on purpose: it is the version the Stage already loads, so no second copy of three ships.
import * as THREE from "three-r128";

/**
 * ANGLE. Change POSE to turn the phone.
 * y turns it: negative = turned left, positive = turned right, 0 = straight.
 * x tips it: negative = leans back, positive = leans forward.
 * Radians. Keep both under about 0.35 or the chat on its screen starts to look flat.
 */
const POSE = { x: 0, y: 0 };

// The canvas is 340 x 680 CSS px and the camera sits 900 px away, so a plane at z = 0 is exactly one CSS px per unit.
// The chat screen (a normal DOM element) gets the same perspective(900px) and the same rotation, which is why it stays glued to the 3D body.
const W = 340;
const H = 680;
const DIST = 900;

function roundedRect(w: number, h: number, r: number) {
  const x = -w / 2, y = -h / 2, PI = Math.PI;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, PI / 2, PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, PI, PI * 1.5, false);
  return s;
}

type Props = {
  className: string;
  mode: "full" | "light";
  /** False while the phone is off screen or the visitor paused the animation. */
  active: boolean;
  hostRef: RefObject<HTMLElement | null>;
  screenRef: RefObject<HTMLElement | null>;
  /** Called with true after the first frame is drawn, and with false when the canvas goes away. */
  onState: (on: boolean) => void;
};

/**
 * The phone body. Full: live render with a slow float and a pointer tilt. Light: one render at POSE, no loop.
 * Still never mounts this, and neither does a browser without WebGL: the parent keeps its flat CSS frame.
 */
export default function PhoneGL({ className, mode, active, hostRef, screenRef, onState }: Props) {
  const cv = useRef<HTMLCanvasElement>(null);
  const live = useRef({ active });
  const apply = useRef<((m: "full" | "light") => void) | null>(null);
  const told = useRef(false);

  useEffect(() => {
    live.current.active = active;
  }, [active]);

  useEffect(() => {
    const canvas = cv.current, host = hostRef.current, scr = screenRef.current;
    if (!canvas || !host || !scr) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return; // no WebGL: the flat frame stays
    }
    renderer.setSize(W, H, false);
    const cam = new THREE.PerspectiveCamera((2 * Math.atan(H / 2 / DIST) * 180) / Math.PI, W / H, 10, 3000);
    cam.position.z = DIST;
    const scene = new THREE.Scene();
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(-250, 350, 600);
    scene.add(new THREE.AmbientLight(0xffffff, 0.75), sun);

    const mat = new THREE.MeshStandardMaterial({ color: 0x14352b, metalness: 0.6, roughness: 0.38 });
    const geos: THREE.BufferGeometry[] = [];
    const group = new THREE.Group();
    const body = new THREE.ExtrudeGeometry(roundedRect(284, 594, 37), {
      depth: 8, bevelEnabled: true, bevelThickness: 3, bevelSize: 3, bevelSegments: 3, curveSegments: 16,
    });
    body.translate(0, 0, -4);
    geos.push(body);
    group.add(new THREE.Mesh(body, mat));
    // Side buttons: x, y, height.
    for (const [x, y, h] of [[147, 120, 56], [147, 40, 56], [-147, 150, 80]]) {
      const g = new THREE.BoxGeometry(6, h, 8);
      geos.push(g);
      const b = new THREE.Mesh(g, mat);
      b.position.set(x, y, 0);
      group.add(b);
    }
    scene.add(group);

    const cur = { x: POSE.x, y: POSE.y, f: 0 };
    const tg = { x: POSE.x, y: POSE.y };
    const draw = () => {
      group.rotation.set(-cur.x, cur.y, 0); // CSS y points down and three's points up, so x flips
      group.position.y = -cur.f;
      renderer.render(scene, cam);
      scr.style.transform = `perspective(${DIST}px) translateY(${cur.f}px) rotateX(${cur.x}rad) rotateY(${cur.y}rad) translateZ(8px)`;
    };

    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!live.current.active) return;
      cur.f = Math.sin(t / 900) * 8;
      cur.x += (tg.x - cur.x) * 0.08;
      cur.y += (tg.y - cur.y) * 0.08;
      draw();
    };
    apply.current = (m) => {
      cancelAnimationFrame(raf);
      raf = 0;
      renderer.setPixelRatio(m === "full" ? Math.min(devicePixelRatio, 2) : 1);
      renderer.setSize(W, H, false);
      if (m === "full") raf = requestAnimationFrame(loop);
      else {
        cur.x = tg.x = POSE.x;
        cur.y = tg.y = POSE.y;
        cur.f = 0;
        draw();
      }
    };

    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      tg.y = POSE.y + ((e.clientX - r.left) / r.width - 0.5) * 0.5;
      tg.x = POSE.x + (0.5 - (e.clientY - r.top) / r.height) * 0.35;
    };
    const leave = () => {
      tg.x = POSE.x;
      tg.y = POSE.y;
    };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      apply.current = null;
      scr.style.transform = "";
      geos.forEach((g) => g.dispose());
      mat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (told.current) onState(false);
      told.current = false;
    };
  }, [hostRef, screenRef, onState]);

  // Runs after the setup above on mount, then again whenever the motion mode changes.
  useEffect(() => {
    if (!apply.current) return;
    apply.current(mode);
    if (!told.current) {
      told.current = true;
      onState(true);
    }
  }, [mode, onState]);

  return <canvas ref={cv} className={className} width={W} height={H} aria-hidden="true" />;
}
