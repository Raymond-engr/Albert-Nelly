import type { SceneId } from "@/types/scene";

/** Story order of the seven scenes. Index = how far into the story a scene sits. */
export const SCENE_ORDER: SceneId[] = ["cv", "wire", "dev", "shp", "sch", "net", "bub"];

const FILE: Record<SceneId, string> = {
  cv: "scene-01-canvas", wire: "scene-02-wireframe", dev: "scene-03-devices", shp: "scene-04-shapes",
  sch: "scene-05-cap", net: "scene-06-threads", bub: "scene-07-bubble",
};
/** Full and Light GLB sets live in public/variants/three/models. */
export const glbUrl = (id: SceneId, lite: boolean) => `/variants/three/models/${FILE[id]}${lite ? "-light" : ""}.glb`;

/** Which flat poster layer stands in for each scene in the Still version (and while the 3D loads). */
export const LAYER_OF: Record<SceneId, number> = { cv: 0, wire: 1, dev: 2, shp: 2, sch: 2, net: 3, bub: 4 };

/** Service cards fire this on window to light up their 3D object. Services.tsx repeats the string on purpose. */
export const HL_EVENT = "albert:hl";

/** One mutable bag the Stage writes every frame and the WebGL layer reads. */
/** fl = how much idle float/tilt is on (1 in Full, eases to 0 otherwise). painted = the stroke has been painted once, so a remount never repaints it. */
export type Shared = { w: Record<SceneId, number>; gs: number; px: number; py: number; hl: SceneId | null; dim: boolean; fl: number; painted: boolean };
export const newShared = (): Shared => ({
  w: { cv: 1, wire: 0, dev: 0, shp: 0, sch: 0, net: 0, bub: 0 }, gs: 0, px: 0, py: 0, hl: null, dim: false, fl: 1, painted: false,
});
