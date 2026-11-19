import * as THREE from "three";
import type { SceneId } from "@/types/scene";

/** Where a piece rests (h) and where it flies in from (o). q, fl, th, cf are per-scene extras. */
type Piece = { h: [number, number, number]; o: [number, number, number]; q?: [number, number, number]; fl?: number; th?: boolean; cf?: boolean };
/** m is 1, or 0 when the visitor prefers reduced motion. cx and cy are the smoothed pointer position (-0.5 to 0.5). */
export type Ctx = { m: number; cx: number; cy: number };
export type SceneObj = {
  id: SceneId;
  group: THREE.Group;
  /** Design size in scene units, used to fit the object into its anchor element. */
  dw: number;
  dh: number;
  /** 0 = scattered, 1 = assembled. Eased by the render loop. */
  e: number;
  /** 0 to 1, eased: how "lit" the object is while its card is hovered. */
  h: number;
  /** The element in the page this object sits on: [data-stage="<id>"]. */
  a: Element | null;
  update?: (t: number, s: SceneObj, c: Ctx) => void;
};

// Brand constants for the 3D materials (raw hex is allowed for brand constants in art).
const GR = 0x12b76a, DP = 0x0a7d4a, NI = 0x06281e, SU = 0xf7b733, CO = 0xff6f59, BR = 0xdcefe5, WH = 0xffffff;
type Vec3 = [number, number, number];
const data = (o: THREE.Object3D) => o.userData as Piece;

/** Builds the seven scenes. Every object is procedural: no model files to download. */
export function buildScenes(art: HTMLCanvasElement, ratio: number) {
  const mats = new Map<number, THREE.MeshStandardMaterial>();
  const geos: THREE.BufferGeometry[] = [];
  const extra: { dispose: () => void }[] = [];
  const mat = (c: number) => {
    let m = mats.get(c);
    if (!m) mats.set(c, (m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })));
    return m;
  };
  const geo = <T extends THREE.BufferGeometry>(g: T): T => (geos.push(g), g);
  const box = (w: number, h: number, d: number) => geo(new THREE.BoxGeometry(w, h, d));
  const rnd = (): Vec3 => [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5, Math.random() * 3 + 0.5];
  const lineMat = new THREE.LineBasicMaterial({ color: GR });
  extra.push(lineMat);

  const scenes: SceneObj[] = [];
  const add = (id: SceneId, dw: number, dh: number, update?: SceneObj["update"]) => {
    const s: SceneObj = { id, group: new THREE.Group(), dw, dh, e: 0, h: 0, a: null, update };
    scenes.push(s);
    return s;
  };
  const piece = (s: SceneObj, g: THREE.BufferGeometry, c: number, x: number, y: number, z: number, rot?: Vec3) => {
    const m = new THREE.Mesh(g, mat(c));
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    m.userData = { h: [x, y, z], o: rnd() } satisfies Piece;
    s.group.add(m);
    return m;
  };
  const wire = (s: SceneObj, w: number, h: number, x: number, y: number) => {
    const l = new THREE.LineSegments(geo(new THREE.EdgesGeometry(box(w, h, 0.02))), lineMat);
    l.position.set(x, y, 0);
    l.userData = { h: [x, y, 0], o: rnd() } satisfies Piece;
    s.group.add(l);
  };

  /* 1 cv: the painted canvas */
  const texture = new THREE.CanvasTexture(art);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  extra.push(texture);
  const cv = add("cv", 2.4 * ratio, 2.4, (t, s, c) => {
    s.group.rotation.set(-0.12 + c.cy * 0.3, -0.3 + c.cx * 0.35, 0.05 + Math.sin(t * 0.6) * 0.015 * c.m);
    s.group.position.y += Math.sin(t * 0.8) * 0.07 * c.m * s.group.scale.x;
  });
  const edge = new THREE.MeshStandardMaterial({ color: 0xeef3f0, roughness: 0.9 });
  const face = new THREE.MeshBasicMaterial({ map: texture });
  extra.push(edge, face);
  cv.group.add(new THREE.Mesh(box(2.4 * ratio, 2.4, 0.1), [edge, edge, edge, edge, face, edge]));

  /* 2 wire: stroke to wireframe */
  const wr = add("wire", 2.5, 1.45, (t, s, c) => { s.group.rotation.y = Math.sin(t * 0.5) * 0.25 * c.m; });
  wire(wr, 2.4, 0.28, 0, 0.5);
  [-0.85, 0, 0.85].forEach((x) => wire(wr, 0.7, 0.6, x, -0.05));
  wire(wr, 1, 0.26, 0, -0.62);

  /* 3 dev: screen to devices */
  const dv = add("dev", 2.5, 1.3, (t, s, c) => { s.group.rotation.y = Math.sin(t * 0.5) * 0.3 * c.m; });
  piece(dv, box(1.7, 1.15, 0.06), BR, -0.35, 0, 0);
  piece(dv, box(1.7, 0.18, 0.07), GR, -0.35, 0.5, 0.01);
  piece(dv, box(0.6, 0.4, 0.07), WH, -0.7, 0.1, 0.02);
  piece(dv, box(0.6, 0.4, 0.07), WH, -0.05, 0.1, 0.02);
  piece(dv, box(1.3, 0.2, 0.07), WH, -0.35, -0.35, 0.02);
  piece(dv, box(0.6, 1.1, 0.08), NI, 0.95, -0.05, 0.15);
  piece(dv, box(0.5, 0.95, 0.09), WH, 0.95, -0.05, 0.16);
  piece(dv, box(0.4, 0.25, 0.1), GR, 0.95, 0.2, 0.17);
  piece(dv, box(0.4, 0.12, 0.1), BR, 0.95, -0.1, 0.17);
  piece(dv, box(0.4, 0.12, 0.1), BR, 0.95, -0.3, 0.17);

  /* 4 shp: shapes in orbit */
  const sh = add("shp", 2.6, 1.6, (t, s) => {
    for (const c of s.group.children) {
      const p = data(c);
      if (!p.q) continue;
      const a = p.q[0] + t * p.q[1];
      p.h = [Math.cos(a) * 1.15, Math.sin(a) * 0.55 + p.q[2], Math.sin(a) * 0.6];
      c.rotation.x = t * 0.6;
      c.rotation.y = t * 0.4;
    }
  });
  const orbiters: [THREE.BufferGeometry, number][] = [
    [geo(new THREE.SphereGeometry(0.2, 16, 12)), GR], [box(0.32, 0.32, 0.32), SU], [geo(new THREE.TorusGeometry(0.2, 0.06, 8, 20)), CO],
    [geo(new THREE.TorusKnotGeometry(0.13, 0.045, 40, 6)), DP], [geo(new THREE.SphereGeometry(0.14, 14, 10)), SU], [box(0.26, 0.26, 0.26), GR],
    [geo(new THREE.TorusGeometry(0.15, 0.05, 8, 18)), DP], [geo(new THREE.SphereGeometry(0.17, 14, 10)), CO],
  ];
  orbiters.forEach(([g, c], i) => {
    const m = piece(sh, g, c, 0, 0, 0);
    data(m).q = [(i * Math.PI) / 4, 0.25 + 0.05 * (i % 3), i % 2 ? 0.2 : -0.2];
  });
  piece(sh, box(0.5, 0.9, 0.07), NI, 0, 0, 0);

  /* 5 sch: cap and board */
  const sc = add("sch", 3, 1.5, (t, s, c) => { s.group.rotation.y = Math.sin(t * 0.4) * 0.2 * c.m; });
  piece(sc, box(1.5, 1, 0.06), DP, 0.55, 0.1, 0);
  piece(sc, box(1.58, 0.04, 0.1), NI, 0.55, -0.42, 0.03);
  [0, 1, 2].forEach((i) => {
    piece(sc, box(0.12, 0.12, 0.08), WH, 0.05, 0.35 - i * 0.3, 0.05);
    piece(sc, box(0.8, 0.06, 0.08), WH, 0.62, 0.35 - i * 0.3, 0.05);
  });
  piece(sc, geo(new THREE.CylinderGeometry(0.3, 0.34, 0.3, 16)), NI, -0.85, -0.25, 0);
  piece(sc, box(1.05, 0.07, 1.05), NI, -0.85, 0, 0, [0.35, Math.PI / 4, 0]);
  piece(sc, geo(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6)), SU, -0.3, -0.12, 0.2);
  piece(sc, geo(new THREE.SphereGeometry(0.08, 10, 8)), SU, -0.3, -0.4, 0.2);

  /* 6 net: threads and handshake */
  const nt = add("net", 3, 2.2, (t, s, c) => {
    for (const ch of s.group.children) {
      const p = data(ch);
      if (p.th) ch.scale.setScalar(Math.max(0.001, s.e));
      else if (p.fl !== undefined) p.h[1] = p.fl + Math.sin(t + p.fl * 5) * 0.06 * c.m;
    }
  });
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.3;
    const x = Math.cos(a) * 1.35;
    const y = Math.sin(a) * 0.9;
    data(piece(nt, box(0.7, 0.44, 0.05), BR, x, y, 0)).fl = y;
    const line = new THREE.Line(geo(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(x, y, 0)])), lineMat);
    line.userData = { th: true } as Piece;
    nt.group.add(line);
  }
  const bar = geo(new THREE.CylinderGeometry(0.14, 0.14, 0.7, 12));
  piece(nt, bar, GR, -0.33, 0, 0.05, [0, 0, Math.PI / 2]);
  piece(nt, bar, DP, 0.33, 0, 0.05, [0, 0, Math.PI / 2]);
  piece(nt, geo(new THREE.SphereGeometry(0.2, 14, 10)), SU, 0, 0, 0.1);

  /* 7 bub: let's talk */
  const label = document.createElement("canvas");
  label.width = 512;
  label.height = 200;
  const lg = label.getContext("2d");
  if (lg) {
    lg.fillStyle = "#06281E";
    lg.font = "700 96px Sora, Inter, Arial, sans-serif";
    lg.textAlign = "center";
    lg.textBaseline = "middle";
    lg.fillText("Let’s talk", 256, 100);
  }
  const labelTex = new THREE.CanvasTexture(label);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
  extra.push(labelTex, labelMat);
  const text = new THREE.Mesh(geo(new THREE.PlaneGeometry(1.9, 0.74)), labelMat);
  text.position.set(0, 0.1, 0.48);
  const bb = add("bub", 2.8, 1.8, (t, s, c) => {
    const k = 0.6 + 0.4 * s.e;
    s.group.children[0].scale.set(1.3 * k, 0.9 * k, 0.45);
    s.group.rotation.y = Math.sin(t * 0.5) * 0.2 * c.m;
    for (const ch of s.group.children) if (data(ch).cf) ch.scale.setScalar(Math.max(0.001, 1 - s.e));
    text.visible = s.e > 0.7;
  });
  piece(bb, geo(new THREE.SphereGeometry(1, 24, 16)), GR, 0, 0.1, 0);
  bb.group.add(text);
  piece(bb, geo(new THREE.ConeGeometry(0.3, 0.6, 4)), GR, -0.7, -0.85, 0, [0, 0, 0.5]);
  [GR, SU, CO, DP, SU, GR, CO, DP].forEach((c, i) => {
    const a = (i * Math.PI) / 4;
    data(piece(bb, box(0.2, 0.2, 0.2), c, Math.cos(a) * 1.5, Math.sin(a) * 0.95, 0.1)).cf = true;
  });

  /** Moves every piece between scattered (e = 0) and assembled (e = 1). */
  const assemble = (s: SceneObj) => {
    const k = 1 - s.e;
    for (const c of s.group.children) {
      const p = data(c);
      if (p.h) c.position.set(p.h[0] + p.o[0] * k, p.h[1] + p.o[1] * k, p.h[2] + p.o[2] * k);
    }
  };
  const dispose = () => {
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    extra.forEach((x) => x.dispose());
  };
  return { scenes, texture, assemble, dispose };
}
