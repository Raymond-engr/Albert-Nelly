import type { Metadata } from "next";
import { LeadsScreen } from "@/components/control-room/leads/LeadsScreen";

export const metadata: Metadata = { title: "Leads" };

/** /control-room/leads?lead=<id> opens that lead's drawer straight away (used by links from deals). */
export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const { lead } = await searchParams;
  return <LeadsScreen initialLeadId={lead} />;
}
