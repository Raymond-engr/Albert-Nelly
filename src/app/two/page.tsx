import type { Metadata } from "next";
import { Showroom } from "@/components/showroom/Showroom";
import { twoSlots } from "@/variants/two/slots";

export const metadata: Metadata = { title: "Variant two", robots: { index: false, follow: false } };

export default function Variant() {
  return <Showroom slots={twoSlots} />;
}
