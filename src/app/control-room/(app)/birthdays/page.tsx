import type { Metadata } from "next";
import { BirthdaysScreen } from "@/components/control-room/birthdays/BirthdaysScreen";

export const metadata: Metadata = { title: "Birthdays" };

export default function Page() {
  return <BirthdaysScreen />;
}
