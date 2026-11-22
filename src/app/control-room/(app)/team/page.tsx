import type { Metadata } from "next";
import { TeamScreen } from "@/components/control-room/team/TeamScreen";

export const metadata: Metadata = { title: "Team and permissions" };

export default function Page() {
  return <TeamScreen />;
}
