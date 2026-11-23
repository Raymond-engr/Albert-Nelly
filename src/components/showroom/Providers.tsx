"use client";

import type { ReactNode } from "react";
import { RegistrationProvider } from "@/providers/RegistrationProvider";
import { SceneProvider } from "@/providers/SceneProvider";
import { SiteContentProvider } from "@/providers/SiteContentProvider";
import type { SiteContent } from "@/types/site-content";

export function ShowroomProviders({
  content,
  children,
}: {
  content?: SiteContent;
  children: ReactNode;
}) {
  return (
    <SiteContentProvider content={content}>
      <SceneProvider>
        <RegistrationProvider>{children}</RegistrationProvider>
      </SceneProvider>
    </SiteContentProvider>
  );
}
