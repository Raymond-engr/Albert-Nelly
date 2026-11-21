import type { Metadata } from "next";
import { ReferrersScreen } from "@/components/control-room/referrers/ReferrersScreen";

export const metadata: Metadata = { title: "Referrers" };

export default function Page() {
  return <ReferrersScreen />;
}
