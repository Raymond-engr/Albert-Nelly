import type { IconName } from "@/lib/control-room/types";

const PATHS: Record<IconName, string[]> = {
  home: ["M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"],
  users: ["M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21a8 8 0 0 1 16 0"],
  board: ["M4 4h5v16H4z", "M10 4h5v10h-5z", "M16 4h4v13h-4z"],
  tag: ["M3 12V4h8l10 10-8 8z", "M7.5 8.5h.01"],
  cap: ["M2 9l10-5 10 5-10 5z", "M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"],
  image: ["M3 5h18v14H3z", "M3 16l5-5 4 4 3-3 6 6"],
  link: ["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1", "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"],
  share: ["M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M8.6 13.5l6.8 4", "M15.4 6.5l-6.8 4"],
  mail: ["M3 5h18v14H3z", "M3 7l9 6 9-6"],
  cake: ["M4 11h16v10H4z", "M2 7h20v4H2z", "M12 7v14", "M12 7c-2-4-6-3-5 0", "M12 7c2-4 6-3 5 0"],
  shield: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"],
  sliders: ["M4 7h9", "M17 7h3", "M4 17h3", "M11 17h9", "M15 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", "M9 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3 2"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.3-4.3"],
  plus: ["M12 5v14", "M5 12h14"],
  x: ["M6 6l12 12", "M18 6L6 18"],
  check: ["M5 12l5 5L20 7"],
  chevronRight: ["M9 6l6 6-6 6"],
  chevronDown: ["M6 9l6 6 6-6"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
  logout: ["M9 21H5V3h4", "M16 17l5-5-5-5", "M21 12H9"],
  arrowUp: ["M12 19V5", "M6 11l6-6 6 6"],
  arrowDown: ["M12 5v14", "M6 13l6 6 6-6"],
  chat: ["M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"],
  edit: ["M4 20h4L19 9l-4-4L4 16z"],
  trash: ["M4 7h16", "M9 7V4h6v3", "M6 7l1 13h10l1-13"],
};

/** Line icons on a 24 px grid. Decorative by default; pass `label` when the icon is the only content. */
export function Icon({ name, size = 20, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      className="shrink-0"
    >
      {PATHS[name].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
