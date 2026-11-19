import * as THREE from "three";
import type { MotionMode } from "@/types/motion";

export type Mode = MotionMode;

// Brand constants for the 3D art (same hex values as the tokens in globals.css).
export const G = 0x12b76a, FN = 0x06281e, MINT = 0xe9f8f0, SUN = 0xf7b733, CO = 0xff6f59;

const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c });
const lineMat = (c: number) => new THREE.LineBasicMaterial({ color: c });
const box = (g: THREE.Object3D, w: number, h: number, d: number, c: number, x: number, y: number, z: number) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
  m.position.set(x, y, z);
  g.add(m);
  return m;
};
const edges = (g: THREE.Object3D, w: number, h: number, d: number, c: number, x: number, y: number, z: number) => {
  const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), lineMat(c));
  l.position.set(x, y, z);
  g.add(l);
  return l;
};

/** The brushstroke: 28 bristle lines painted into a canvas texture. paint(0..1) draws the stroke up to that point. */
function makeStroke() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 640;
  const x = c.getContext("2d") as CanvasRenderingContext2D;
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const X = (s: number) => 50 + 412 * s;
  const Y = (s: number) => 400 - 170 * s + 45 * Math.sin(s * 6);
  const paint = (u: number) => {
    x.fillStyle = "#fff";
    x.fillRect(0, 0, 512, 640);
    for (let b = 0; b < 28; b++) {
      const o = (b - 14) * 2.8, a = 0.4 + (0.5 * ((b * 37) % 10)) / 10, su = u * (0.93 + (0.07 * ((b * 7) % 10)) / 10);
      x.strokeStyle = b % 5 ? `rgba(18,183,106,${a})` : `rgba(10,125,74,${a})`;
      x.lineWidth = 2.6;
      x.beginPath();
      for (let i = 0; i <= 70; i++) {
        const s = (i / 70) * su, k = o * (0.55 + 0.45 * Math.sin(Math.min(s * 1.3, 1) * Math.PI));
        if (i) x.lineTo(X(s) + k * 0.25, Y(s) + k);
        else x.moveTo(X(s) + k * 0.25, Y(s) + k);
      }
      x.stroke();
    }
    texture.needsUpdate = true;
  };
  return { texture, paint };
}

/** Builds the seven scene groups, in the order of the SceneIds: cv, wire, dev, shp, sch, net, bub. */
export function buildWorld() {
  const root = new THREE.Group();
  const gs = Array.from({ length: 7 }, () => {
    const g = new THREE.Group();
    root.add(g);
    return g;
  });
  const orb: THREE.Mesh[] = [];
  const nodes: THREE.Mesh[] = [];
  const { texture, paint } = makeStroke();
  const tilt = (g: THREE.Group) => g.rotation.set(0.05, -0.25, -0.08);

  // 1. Canvas, with the painted stroke
  const g0 = gs[0];
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.7, 48), new THREE.MeshBasicMaterial({ color: MINT }));
  disc.position.z = -0.5;
  g0.add(disc);
  box(g0, 2.4, 3, 0.08, 0xffffff, 0, 0, 0);
  edges(g0, 2.4, 3, 0.08, FN, 0, 0, 0);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.9), new THREE.MeshBasicMaterial({ map: texture }));
  face.position.z = 0.045;
  g0.add(face);
  tilt(g0);

  // 2. Wireframe screen, plus a faint trace of the stroke
  const g1 = gs[1];
  edges(g1, 2.4, 3, 0.06, G, 0, 0, 0);
  edges(g1, 2.1, 0.3, 0.04, G, 0, 1.15, 0.05);
  [-0.75, 0, 0.75].forEach((v) => edges(g1, 0.62, 0.9, 0.04, G, v, 0.1, 0.05));
  edges(g1, 1.1, 0.28, 0.04, G, 0, -1.1, 0.05);
  const curve = new THREE.CatmullRomCurve3([[-1, -0.5, 0.08], [-0.3, -0.2, 0.08], [0.4, -0.6, 0.08], [1, -0.3, 0.08]].map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const trace = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.03, 5), new THREE.MeshLambertMaterial({ color: G, transparent: true, opacity: 0.4 }));
  g1.add(trace);
  tilt(g1);

  // 3. Browser window and phone
  const g2 = gs[2], br = new THREE.Group(), ph = new THREE.Group();
  g2.add(br, ph);
  box(br, 2.6, 1.7, 0.08, MINT, 0, 0, 0);
  edges(br, 2.6, 1.7, 0.08, FN, 0, 0, 0);
  box(br, 2.6, 0.2, 0.1, FN, 0, 0.75, 0.01);
  box(br, 0.7, 0.9, 0.05, G, -0.8, -0.1, 0.06);
  box(br, 1.1, 0.3, 0.05, SUN, 0.45, 0.2, 0.06);
  box(br, 1.1, 0.3, 0.05, 0xffffff, 0.45, -0.25, 0.06);
  br.position.set(-0.5, 0.3, 0);
  br.rotation.y = 0.35;
  box(ph, 0.95, 1.8, 0.1, FN, 0, 0, 0);
  box(ph, 0.8, 1.6, 0.03, MINT, 0, 0, 0.06);
  box(ph, 0.6, 0.3, 0.03, G, 0, 0.45, 0.09);
  box(ph, 0.6, 0.2, 0.03, SUN, 0, -0.1, 0.09);
  ph.position.set(1.6, -0.3, 0.4);
  ph.rotation.y = -0.35;

  // 4. Shapes in orbit
  const cs = [G, SUN, CO, FN, MINT, G, SUN, CO, FN];
  for (let i = 0; i < 9; i++) {
    const k = i % 3;
    const geo = k === 0 ? new THREE.TorusGeometry(0.2, 0.05, 8, 20) : k === 1 ? new THREE.BoxGeometry(0.28, 0.28, 0.28) : new THREE.TorusKnotGeometry(0.14, 0.04, 40, 6);
    const m = new THREE.Mesh(geo, mat(cs[i]));
    m.userData = { r: 2 + k * 0.5, s: 0.25 + i * 0.03, p: i * 0.7, y: ((i % 4) - 1.5) * 0.5 };
    gs[3].add(m);
    orb.push(m);
  }

  // 5. Cap and board
  const g4 = gs[4], cap = new THREE.Group();
  g4.add(cap);
  box(cap, 1.3, 0.06, 1.3, FN, 0, 0.3, 0).rotation.y = 0.785;
  box(cap, 0.55, 0.3, 0.55, FN, 0, 0.12, 0).rotation.y = 0.785;
  box(cap, 0.04, 0.5, 0.04, SUN, 0.5, 0.05, 0.5);
  cap.position.set(-1.2, 1, 0);
  cap.rotation.x = 0.25;
  box(g4, 2.2, 1.4, 0.08, 0x0d4a35, 0.4, -0.4, 0);
  edges(g4, 2.3, 1.5, 0.1, MINT, 0.4, -0.4, 0);
  for (let i = 0; i < 3; i++) {
    const y = 0.05 - i * 0.45;
    box(g4, 0.07, 0.2, 0.02, MINT, -0.55, y, 0.06).rotation.z = 0.7;
    box(g4, 0.07, 0.34, 0.02, MINT, -0.4, y + 0.04, 0.06).rotation.z = -0.7;
    box(g4, 1, 0.06, 0.02, MINT, 0.5, y, 0.06);
  }

  // 6. Partner tiles, threads, abstract handshake, four referral nodes
  const g5 = gs[5];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, px = Math.cos(a) * 2.4, py = Math.sin(a) * 1.9;
    box(g5, 0.8, 0.5, 0.05, 0xffffff, px, py, 0);
    edges(g5, 0.8, 0.5, 0.05, FN, px, py, 0);
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(px, py, 0), new THREE.Vector3(px * 0.4, py * 0.4 + 0.5, 0.4), new THREE.Vector3(0, 0, 0));
    g5.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(20)), lineMat(G)));
  }
  const h1 = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 8, 24, Math.PI * 1.3), mat(G));
  const h2 = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 8, 24, Math.PI * 1.3), mat(FN));
  h1.position.x = -0.25;
  h2.position.x = 0.25;
  h2.rotation.z = Math.PI;
  g5.add(h1, h2);
  for (let i = 0; i < 4; i++) {
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), mat(MINT));
    n.position.set(-0.9 + i * 0.6, -1, 0.2);
    g5.add(n);
    nodes.push(n);
  }

  // 7. Speech bubble
  const g6 = gs[6];
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), mat(G));
  bubble.scale.set(1.7, 1.1, 0.6);
  g6.add(bubble);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 4), mat(G));
  tail.position.set(-0.7, -1.05, 0);
  tail.rotation.z = Math.PI - 0.4;
  g6.add(tail);
  for (let i = -1; i < 2; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0xffffff));
    d.position.set(i * 0.45, 0, 0.36);
    g6.add(d);
  }

  const dispose = () => {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose());
      else m.material?.dispose();
    });
    texture.dispose();
  };

  return { root, gs, orb, nodes, cap, h1, h2, bubble, paint, dispose };
}
