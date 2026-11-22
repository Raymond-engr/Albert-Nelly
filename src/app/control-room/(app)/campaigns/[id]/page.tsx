import type { Metadata } from "next";
import { CampaignEditor } from "@/components/control-room/campaigns/CampaignEditor";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignEditor id={id} />;
}
