import type { ReactNode } from "react";
import { Shell } from "@/components/control-room/shell/Shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
