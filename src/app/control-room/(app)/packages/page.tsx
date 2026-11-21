import type { Metadata } from "next";
import { PackagesScreen } from "@/components/control-room/content/PackagesScreen";

export const metadata: Metadata = { title: "School packages" };

export default function Page() {
  return <PackagesScreen />;
}
