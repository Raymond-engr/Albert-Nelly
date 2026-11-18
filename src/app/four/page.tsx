import type { Metadata } from "next";
import { Showroom } from "@/components/showroom/Showroom";
import { fourSlots } from "@/variants/four/slots";

export const metadata: Metadata = { title: "Variant four", robots: { index: false, follow: false } };

export default function Variant() {
  return <Showroom slots={fourSlots} />;
}
