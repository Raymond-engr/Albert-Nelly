"use client";

import type { ReactNode } from "react";
import { Overlay } from "./Overlay";
import { btn } from "./kit";

/** "Are you sure?" for deletions. The confirm button says what it does ("Delete project"), not "OK". */
export function ConfirmModal({ open, title, children, confirmLabel = "Delete", onConfirm, onClose }: {
  open: boolean; title: string; children: ReactNode; confirmLabel?: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Overlay
      open={open}
      onClose={onClose}
      variant="modal"
      title={title}
      footer={<><button type="button" className={btn("ghost")} onClick={onClose}>Cancel</button><button type="button" className={btn("danger")} onClick={onConfirm}>{confirmLabel}</button></>}
    >
      <div className="text-[15px]">{children}</div>
    </Overlay>
  );
}
