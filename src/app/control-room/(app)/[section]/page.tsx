import { EmptyState } from "@/components/control-room/ui/kit";
import { NAV } from "@/lib/control-room/roles";

/**
 * Placeholder for screens that arrive in later patches (leads, deals, ...). A real folder such as
 * app/control-room/(app)/leads/page.tsx always wins over this dynamic route. Deleted in the last patch.
 */
export default async function ComingSoon({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = NAV.find((n) => n.href.endsWith(`/${section}`));
  return (
    <EmptyState icon={item?.icon ?? "clock"} title={`${item?.label ?? "This screen"} arrives in the next patch`}>
      The shell, the sign-in flow and the Overview are ready. The remaining screens are built in the following patches.
    </EmptyState>
  );
}
