import type { Metadata } from "next";
import { WorkScreen } from "@/components/control-room/content/WorkScreen";

export const metadata: Metadata = { title: "Selected work" };

export default function Page() {
  return <WorkScreen />;
}
