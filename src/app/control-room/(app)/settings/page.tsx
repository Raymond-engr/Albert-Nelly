import type { Metadata } from "next";
import { SettingsScreen } from "@/components/control-room/settings/SettingsScreen";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <SettingsScreen />;
}
