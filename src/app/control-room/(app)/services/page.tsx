import type { Metadata } from "next";
import { ServicesScreen } from "@/components/control-room/pricing/ServicesScreen";

export const metadata: Metadata = { title: "Services and pricing" };

export default function Page() {
  return <ServicesScreen />;
}
