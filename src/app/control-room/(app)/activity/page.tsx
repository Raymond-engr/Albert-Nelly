import type { Metadata } from "next";
import { ActivityScreen } from "@/components/control-room/activity/ActivityScreen";

export const metadata: Metadata = { title: "Activity log" };

export default function Page() {
  return <ActivityScreen />;
}
