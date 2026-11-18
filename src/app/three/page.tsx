import type { Metadata } from "next";
import { Showroom } from "@/components/showroom/Showroom";
import { threeSlots } from "@/variants/three/slots";

export const metadata: Metadata = { title: "Variant three", robots: { index: false, follow: false } };

export default function Variant() {
  return <Showroom slots={threeSlots} />;
}
