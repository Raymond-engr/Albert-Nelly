/** Small input checks shared by the forms. TODO(integration): the server repeats every check (never trust the browser). */
export const emailOk = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());
export const waOk = (v: string) => /^\d{9,15}$/.test(v.replace(/\D/g, ""));
export function urlOk(v: string): boolean {
  if (!v.trim()) return true;
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
