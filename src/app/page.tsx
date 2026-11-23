import { Showroom } from "@/components/showroom/Showroom";
import { mainSlots } from "@/components/showroom/slots";
import { getSiteContent } from "@/lib/site-content";

export const revalidate = 300;

export default async function Home() {
  const content = await getSiteContent();
  return <Showroom slots={mainSlots} content={content} />;
}
