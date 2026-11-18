import type { Metadata } from "next";
import { Showroom } from "@/components/showroom/Showroom";
import { oneSlots } from "@/variants/one/slots";

export const metadata: Metadata = { title: "Variant one", robots: { index: false, follow: false } };

export default function Variant() {
  return <Showroom slots={oneSlots} />;
}
