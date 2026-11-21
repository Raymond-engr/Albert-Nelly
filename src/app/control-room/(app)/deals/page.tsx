import type { Metadata } from "next";
import { DealsBoard } from "@/components/control-room/deals/DealsBoard";

export const metadata: Metadata = { title: "Deals" };

export default function DealsPage() {
  return <DealsBoard />;
}
