import { fill, sampleValues } from "@/lib/control-room/templates";
import type { Campaign } from "@/lib/control-room/types";

/** The four partner ideas in the birthday email. Placeholder wording until real partners are chosen (design to-do). */
const IDEAS = [
  { title: "Photographers", line: "Capture the day properly.", cta: "See photographers" },
  { title: "Birthday flyer designers", line: "A flyer worth sharing.", cta: "See flyers" },
  { title: "Portrait artists", line: "A painted keepsake.", cta: "See portraits" },
  { title: "Surprise event planners", line: "A surprise they will remember.", cta: "Plan a surprise" },
];

/**
 * What the email will look like: 600 px wide, one column on a phone, Arial fallback fonts, an unsubscribe link in the footer.
 * It always renders on white, like an email app in light mode. Dark mode is a design to-do (see the handover).
 * TODO(integration): the real email is rendered on the server from the same template (React Email or MJML), not from this component.
 */
export function EmailPreview({ template, subject, body, discount, width, name }: {
  template: Campaign["template"]; subject: string; body: string; discount: number; width: number; name?: string;
}) {
  const vals = { ...sampleValues("birthday", discount), ...(name ? { name } : {}) };
  const who = vals.name;
  const paras = fill(body, vals).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const headline = template === "welcome" ? `Welcome, ${who}.` : template === "birthday" ? `Happy birthday, ${who}!` : fill(subject, vals) || "Your headline goes here";
  return (
    <div className="rounded-2xl border border-line bg-cloud p-4">
      <div className="mb-3 text-sm"><span className="text-ink/70">Subject: </span><span className="font-semibold">{subject ? fill(subject, vals) : "No subject yet"}</span></div>
      <div className="mx-auto overflow-hidden rounded-xl border border-line bg-white text-[#06281E]" style={{ maxWidth: width, fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div className="flex items-center gap-2 px-6 py-4">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M3 18C8 6 12 22 17 12S22 8 23 10" fill="none" stroke="#12B76A" strokeWidth="5" strokeLinecap="round" /></svg>
          <span className="text-lg font-bold">Albert Nelly</span>
        </div>
        <div className="bg-[#E9F8F0] px-6 py-8">
          <svg viewBox="0 0 120 30" className="mb-4 h-8 w-32" aria-hidden="true"><path d="M4 22C20 4 34 28 52 14S92 6 116 12" fill="none" stroke="#12B76A" strokeWidth="9" strokeLinecap="round" /></svg>
          <div className="text-2xl leading-tight font-bold">{headline}</div>
        </div>
        <div className="px-6 py-6 text-[15px] leading-relaxed">
          {paras.length === 0 && <p className="mb-3 max-w-none text-[#42594e]">Your message appears here.</p>}
          {paras.map((p, i) => <p key={i} className="mb-3 max-w-none">{p}</p>)}
          {template === "birthday" && (
            <>
              <div className="my-4 rounded-xl border-2 border-[#12B76A] bg-[#E9F8F0] p-4">
                <div className="text-lg font-bold">{discount}% off your next project</div>
                <div className="text-sm">Reply on WhatsApp to claim it.</div>
              </div>
              <div className={`mb-4 grid gap-3 ${width < 500 ? "grid-cols-1" : "grid-cols-2"}`}>
                {IDEAS.map((c) => (
                  <div key={c.title} className="rounded-xl border border-[#cfe0d6] p-3">
                    <div className="font-bold">{c.title}</div>
                    <div className="mb-2 text-sm text-[#42594e]">{c.line}</div>
                    <span className="inline-block rounded-full border border-[#06281E] px-4 py-1.5 text-sm font-bold">{c.cta}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <span className="mt-2 inline-block rounded-full bg-[#F7B733] px-6 py-3 text-[15px] font-bold text-[#06281E]">Talk to us on WhatsApp</span>
        </div>
        <div className="border-t border-[#E9F8F0] px-6 py-5 text-xs text-[#42594e]">
          Albert Nelly. You are getting this email because you registered on our website.{" "}
          <span className="underline">Unsubscribe</span>
        </div>
      </div>
    </div>
  );
}
