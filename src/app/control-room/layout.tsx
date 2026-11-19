import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ToastHost } from "@/components/control-room/ui/Toast";

export const metadata: Metadata = {
  title: { default: "Control Room", template: "%s · Control Room" },
  robots: { index: false, follow: false },
};

/** The staff area. It has no Showroom providers, no WhatsApp button and is never indexed. */
export default function ControlRoomLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastHost />
    </>
  );
}
