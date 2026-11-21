import type { WorkItem } from "@/types/content";

// Placeholders. Keep each card to: category, title, one-line challenge, one result.
// Optional fields for variant two: frame, screens, prototype (Design); url, shot, mobile (Development).
export const work: WorkItem[] = [
  { category: "Design", title: "Project one", frame: "phone", challenge: "Challenge: one line on the problem.", result: "Result: one number goes here." },
  { category: "Design", title: "Project two", frame: "laptop", challenge: "Challenge: one line on the problem.", result: "Result: one number goes here." },
  { category: "Development", title: "Project three", url: "https://example.com", challenge: "Challenge: one line on the problem.", result: "Result: one number goes here." },
  { category: "Development", title: "Project four", url: "https://example.com", challenge: "Challenge: one line on the problem.", result: "Result: one number goes here." },
];
