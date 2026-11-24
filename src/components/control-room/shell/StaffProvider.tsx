"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Staff } from "@/lib/control-room/types";

const StaffContext = createContext<Staff | null>(null);

export function StaffProvider({ staff, children }: { staff: Staff; children: ReactNode }) {
  return <StaffContext.Provider value={staff}>{children}</StaffContext.Provider>;
}

export function useStaff(): Staff | null {
  return useContext(StaffContext);
}
