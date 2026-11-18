import type { SceneId } from "./scene";

export type Service = {
  scene: SceneId;
  title: string;
  description: string;
  audience: string;
  /** Price line as shown on the card. Leave undefined for "no price". */
  price?: string;
  badge?: string;
};

export type SchoolPackage = {
  name: string;
  description: string;
  audience: string;
  price: string;
  features: string[];
  more: string[];
  featured?: boolean;
};

export type WorkCategory = "Design" | "Development";
export type WorkItem = { category: WorkCategory; title: string; challenge: string; result: string };
