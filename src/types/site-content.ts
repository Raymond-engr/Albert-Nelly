import { services as staticServices } from "@/data/services";
import { packages as staticPackages, runningCosts as staticRunningCosts } from "@/data/packages";
import { work as staticWork } from "@/data/work";
import { partnerTiles as staticPartnerTiles } from "@/data/referral";
import { site } from "@/data/site";
import type { Service, SchoolPackage, WorkItem } from "@/types/content";

export type SiteContent = {
  services: Service[];
  packages: SchoolPackage[];
  runningCosts: { item: string; amount: string }[];
  work: WorkItem[];
  partnerTiles: string[];
  whatsappNumber: string;
};

export const defaultSiteContent: SiteContent = {
  services: staticServices,
  packages: staticPackages,
  runningCosts: staticRunningCosts,
  work: staticWork,
  partnerTiles: staticPartnerTiles,
  whatsappNumber: site.whatsappNumber,
};
