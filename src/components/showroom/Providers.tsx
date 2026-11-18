"use client";

import type { ReactNode } from "react";
import { RegistrationProvider } from "@/providers/RegistrationProvider";
import { SceneProvider } from "@/providers/SceneProvider";

export function ShowroomProviders({ children }: { children: ReactNode }) {
  return (
    <SceneProvider>
      <RegistrationProvider>{children}</RegistrationProvider>
    </SceneProvider>
  );
}
