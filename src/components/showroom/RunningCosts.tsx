"use client";

import { useEffect, useRef } from "react";
import s from "./Schools.module.css";

/** Open on desktop, collapsed on phones so the comparison above stays easy to reach. */
export default function RunningCosts({ title, rows }: { title: string; rows: { item: string; amount: string }[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.open = innerWidth > 820;
  }, []);
  return (
    <details ref={ref} className={`card ${s.costs}`}>
      <summary>{title}</summary>
      <table className={s.table}>
        <tbody>{rows.map((r) => <tr key={r.item}><td>{r.item}</td><td>{r.amount}</td></tr>)}</tbody>
      </table>
    </details>
  );
}
