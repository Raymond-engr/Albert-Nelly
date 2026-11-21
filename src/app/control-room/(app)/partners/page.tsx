import type { Metadata } from "next";
import { PartnersScreen } from "@/components/control-room/content/PartnersScreen";

export const metadata: Metadata = { title: "Partners" };

export default function Page() {
  return <PartnersScreen />;
}
