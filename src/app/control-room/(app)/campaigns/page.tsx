import type { Metadata } from "next";
import { CampaignsScreen } from "@/components/control-room/campaigns/CampaignsScreen";

export const metadata: Metadata = { title: "Campaigns" };

export default function Page() {
  return <CampaignsScreen />;
}
