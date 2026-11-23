/**
 * Permission matrix audit script.
 *
 * Prints PERMS from src/lib/control-room/roles.ts as a Markdown table and
 * exits non-zero if any PERM entry references an Area not in the Area union.
 *
 * Usage: npx tsx scripts/check-permissions.ts
 */

import { PERMS, ROLES } from "../src/lib/control-room/roles";
import type { Area } from "../src/lib/control-room/roles";

// The Area union values must match PERMS keys exactly.
const knownAreas: Area[] = [
  "overview", "leads", "deals", "services", "packages", "work",
  "partners", "referrers", "campaigns", "birthdays", "team", "settings", "activity",
];

// Validate: every key in PERMS must appear in the Area union.
const permAreas = Object.keys(PERMS) as string[];
const unknownAreas = permAreas.filter((a) => !knownAreas.includes(a as Area));

if (unknownAreas.length > 0) {
  console.error(`\n❌ PERM entries reference unknown Area values: ${unknownAreas.join(", ")}`);
  console.error("   Update the Area union in roles.ts or remove the stale PERM entry.\n");
  process.exit(1);
}

// Print Markdown table: roles as columns, areas as rows.
const roleIds = ROLES.map((r) => r.id);
const roleLabels = ROLES.map((r) => r.label);

const header = `| Area | ${roleLabels.join(" | ")} |`;
const divider = `|------|${roleIds.map(() => "------").join("|")}|`;

const rows = knownAreas.map((area) => {
  const perms = roleIds.map((role) => PERMS[area][role]);
  return `| ${area} | ${perms.join(" | ")} |`;
});

console.log("\n## Permission Matrix\n");
console.log(header);
console.log(divider);
rows.forEach((r) => console.log(r));
console.log(`\n✅ ${knownAreas.length} areas × ${roleIds.length} roles — all areas accounted for.\n`);
