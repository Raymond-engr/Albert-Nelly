import type { Service } from "@/types/content";

// Order follows the 3D story: canvas, wireframe, devices, shapes, school.
// The price line demonstrates each display type the admin can choose later.
export const services: Service[] = [
  { scene: "cv", title: "Art and Painting", description: "Custom pieces and portraits, painted by our partner artists.", audience: "Anyone with a wall or a gift to give", badge: "with our partners" },
  { scene: "wire", title: "UI/UX Design", description: "Apps and websites people understand on the first tap.", audience: "Founders and product teams", price: "from ₦X" },
  { scene: "dev", title: "Web and Mobile Development", description: "Fast sites and apps, built to grow with you.", audience: "Founders and growing businesses", price: "Custom quote after consultation" },
  { scene: "shp", title: "Graphics Design", description: "Logos, flyers and brand kits that look like you meant it.", audience: "Individuals and small businesses", price: "₦X to ₦Y" },
  { scene: "sch", title: "School Websites", description: "A clear, modern site for your school, with report cards and tests when you’re ready.", audience: "School owners and administrators", price: "₦X per student per term" },
];
