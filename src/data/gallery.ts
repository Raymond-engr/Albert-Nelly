import type { GalleryItem, WorkPhoto } from "@/types/content";

const DIR = "/work/placeholder";
const photo = (file: string, w: number, h: number, alt: string): WorkPhoto => ({ src: `${DIR}/${file}.svg`, w, h, alt });

// Paintings and photography for variant two's Work tabs. Newest first.
// These use drawn placeholders. Replace each src with a real file in public/work/ (WebP, about 1200 px wide)
// and set w and h to that file's pixel size. Both images of a pair should share the same size.
const harvest = (file: string, alt: string) => photo(file, 500, 400, alt);
const portrait = (file: string, alt: string) => photo(file, 300, 400, alt);

export const gallery: GalleryItem[] = [
  {
    category: "Painting",
    title: "Harvest morning",
    line: "Oil on canvas, 60 × 48 cm",
    credit: "Artist name",
    photos: [harvest("harvest-finished", "Harvest morning, finished painting")],
    compare: [harvest("harvest-sketch", "Harvest morning, first sketch"), harvest("harvest-finished", "Harvest morning, finished painting")],
  },
  {
    category: "Painting",
    title: "Portrait of Mama",
    line: "Pencil on paper, reference photo and drawing",
    photos: [portrait("portrait-pencil", "Pencil portrait")],
    compare: [portrait("portrait-reference", "Reference photo"), portrait("portrait-pencil", "Pencil portrait")],
    labels: ["Reference", "Drawing"],
  },
  {
    category: "Painting",
    title: "Market day",
    line: "Acrylic, four stages",
    credit: "Artist name",
    photos: [harvest("harvest-finished", "Market day, finished painting")],
    stages: [
      { name: "Sketch", photo: harvest("harvest-sketch", "Market day, sketch") },
      { name: "Flat colour", photo: harvest("harvest-flat", "Market day, flat colour") },
      { name: "Layers", photo: harvest("harvest-layers", "Market day, layers") },
      { name: "Finished", photo: harvest("harvest-finished", "Market day, finished painting") },
    ],
  },
  {
    category: "Photography",
    title: "Lagos evening",
    line: "Street series",
    credit: "Photographer name",
    photos: [1, 2, 3, 4, 5].map((n) => photo(`lagos-${n}`, 600, 400, `Lagos evening, photo ${n}`)),
  },
  {
    category: "Photography",
    title: "Studio portraits",
    line: "Portrait session",
    credit: "Photographer name",
    photos: [1, 2, 3].map((n) => photo(`studio-${n}`, 300, 400, `Studio portraits, photo ${n}`)),
  },
  {
    category: "Photography",
    title: "Wedding detail",
    line: "Single frame",
    photos: [photo("wedding-1", 500, 500, "Wedding detail")],
  },
];
