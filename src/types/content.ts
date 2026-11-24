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
/** An image file in public/. w and h are its real pixel size, so the page can reserve the space before it loads. */
export type WorkPhoto = { src: string; alt: string; w: number; h: number };
export type WorkItem = {
  category: WorkCategory;
  title: string;
  challenge: string;
  result: string;
  // Optional fields used by variant two. Every other part ignores them.
  /** Design: the device the screens sit in. Defaults to phone. */
  frame?: "phone" | "laptop";
  /** Design: 3 to 5 screens, in order. Leave out to show placeholder screens. */
  screens?: WorkPhoto[];
  /** Design: link to a Figma prototype. */
  prototype?: string;
  /** Development: the live address. Shows the domain in the browser bar and a visit link. */
  url?: string;
  /** Development: a full-page desktop screenshot (the preview scrolls it) and a phone screenshot. */
  shot?: WorkPhoto;
  mobile?: WorkPhoto;
};

/** Paintings and photography live in src/data/gallery.ts, separate from WorkItem so the admin work type stays as it is. */
export type GalleryCategory = "Painting" | "Photography";
export type GalleryItem = {
  category: GalleryCategory;
  title: string;
  /** One line under the title: the medium and size, or the series. */
  line: string;
  credit?: string;
  /** One photo, or a set from one shoot (the first is the cover). For a comparison or stage item, put the finished image here. */
  photos: WorkPhoto[];
  /** Two images, before then after. Shows the divider. */
  compare?: [WorkPhoto, WorkPhoto];
  /** Names for the two sides of the divider. Defaults to Before and After. */
  labels?: [string, string];
  /** Three or more stages, first to last. Shows the stage slider. */
  stages?: { photo: WorkPhoto; name: string }[];
};
