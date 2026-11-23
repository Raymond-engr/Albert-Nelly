import { NextResponse, after } from "next/server";
import { validatePayload } from "@/lib/validation";
import { getAdminClient } from "@/lib/supabase/admin";
import { getUnsubscribeUrl } from "@/lib/unsubscribe";
import { renderWelcomeEmail } from "@/emails";
import { sendEmail } from "@/lib/email";

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.", 400);
  }

  const parsed = validatePayload(body);
  if (!parsed.ok) return fail(parsed.error, 422);
  const p = parsed.data;

  // Honeypot: bots fill the hidden field. Pretend success, save nothing.
  if (p.company) return NextResponse.json({ ok: true, returning: false });

  // Dev-only: an email starting with "fail" simulates a network error.
  if (process.env.NODE_ENV !== "production" && /^fail/i.test(p.email)) return fail("Simulated failure.", 500);

  const admin = getAdminClient();
  if (!admin) {
    console.warn("[leads] Supabase is not configured. Demo mode: nothing was saved.");
    return NextResponse.json({ ok: true, returning: false, demo: true });
  }

  const row = {
    type: p.type, name: p.name, email: p.email, whatsapp: p.whatsapp, service: p.service,
    business_name: p.business, category: p.category, birth_day: p.birthDay, birth_month: p.birthMonth,
    consent: p.consent, context: p.context,
  };

  const { data: existing, error: lookupError } = await admin.from("leads").select("id").eq("email", p.email).maybeSingle();
  if (lookupError) return fail("Could not save.", 500);

  if (existing) {
    const { error } = await admin.from("leads").update(row).eq("id", existing.id);
    return error ? fail("Could not save.", 500) : NextResponse.json({ ok: true, returning: true });
  }

  const { data: inserted, error } = await admin.from("leads").insert(row).select("id").single();
  if (error) {
    // Unique violation: someone registered the same email a moment ago.
    if (error.code === "23505") return NextResponse.json({ ok: true, returning: true });
    return fail("Could not save.", 500);
  }

  if (p.consent && inserted?.id) {
    const leadId = inserted.id;
    const recipientName = p.name;
    const recipientEmail = p.email;

    after(async () => {
      try {
        const unsubscribeUrl = getUnsubscribeUrl(leadId);
        const { html, text } = await renderWelcomeEmail({ name: recipientName, unsubscribeUrl });
        await sendEmail({
          to: recipientEmail,
          subject: "Welcome to Albert Nelly",
          html,
          text,
          unsubscribeUrl,
        });
      } catch (err) {
        console.error("[leads] Failed to send welcome email:", err);
      }
    });
  }

  return NextResponse.json({ ok: true, returning: false });
}
