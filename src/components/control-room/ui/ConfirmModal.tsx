"use client";

import { useState, type ReactNode } from "react";
import { Overlay } from "./Overlay";
import { btn } from "./kit";

/** "Are you sure?" for deletions. The confirm button says what it does ("Delete project"), not "OK". */
export function ConfirmModal({ open, title, children, confirmLabel = "Delete", onConfirm, onClose }: {
  open: boolean; title: string; children: ReactNode; confirmLabel?: string; onConfirm: () => void | Promise<void>; onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const close = () => {
    if (!confirming) onClose();
  };
  const confirm = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Overlay
      open={open}
      onClose={close}
      variant="modal"
      title={title}
      footer={<><button type="button" className={btn("ghost")} onClick={close} disabled={confirming}>Cancel</button><button type="button" className={btn("danger")} onClick={confirm} disabled={confirming} aria-busy={confirming}>{confirming ? "Working…" : confirmLabel}</button></>}
    >
      <div className="text-[15px]">{children}</div>
    </Overlay>
  );
}
