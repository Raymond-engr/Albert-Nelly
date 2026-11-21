import type { Metadata } from "next";
import { DealDetail } from "@/components/control-room/deals/DealDetail";

export const metadata: Metadata = { title: "Deal" };

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealDetail id={id} />;
}
