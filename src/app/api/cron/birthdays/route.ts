import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getUnsubscribeUrl } from "@/lib/unsubscribe";
import { renderBirthdayEmail } from "@/emails";
import { sendEmail } from "@/lib/email";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev mode
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

function getLagosDateParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  return { year, month, day };
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export async function GET(req: Request) {
  return handleBirthdayCron(req);
}

export async function POST(req: Request) {
  return handleBirthdayCron(req);
}

async function handleBirthdayCron(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, demo: true, sent: 0 });
  }

  const { year, month, day } = getLagosDateParts();

  // Query birthday discount from settings
  const { data: settingsRow } = await admin
    .from("settings")
    .select("birthday_discount")
    .single();
  const discount = settingsRow?.birthday_discount ?? 10;

  // Determine matching days (on non-leap years, Feb 29 birthdays receive on Feb 28)
  const isFeb28NonLeap = !isLeapYear(year) && month === 2 && day === 28;

  // Query active leads with birthdays today
  let leadsQuery = admin
    .from("leads")
    .select("id, name, email, birth_day, birth_month")
    .neq("status", "archived")
    .eq("consent", true)
    .is("unsubscribed_at", null)
    .eq("birth_month", month);

  if (isFeb28NonLeap) {
    leadsQuery = leadsQuery.in("birth_day", [28, 29]);
  } else {
    leadsQuery = leadsQuery.eq("birth_day", day);
  }

  const { data: candidates, error: leadsErr } = await leadsQuery;

  if (leadsErr) {
    return NextResponse.json({ error: leadsErr.message }, { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Idempotency: find already sent for this year
  const leadIds = candidates.map((c) => c.id);
  const { data: alreadySent } = await admin
    .from("birthday_sends")
    .select("lead_id")
    .eq("year", year)
    .in("lead_id", leadIds);

  const sentSet = new Set((alreadySent || []).map((s) => s.lead_id));
  const toSend = candidates.filter((c) => !sentSet.has(c.id));

  let sentCount = 0;

  for (const lead of toSend) {
    const unsubscribeUrl = getUnsubscribeUrl(lead.id);
    const { html, text } = await renderBirthdayEmail({
      name: lead.name || "Friend",
      discount,
      unsubscribeUrl,
    });

    const sendRes = await sendEmail({
      to: lead.email,
      subject: "Happy birthday from Albert Nelly",
      html,
      text,
      unsubscribeUrl,
    });

    // Record in birthday_sends
    await admin.from("birthday_sends").insert({
      lead_id: lead.id,
      year,
      provider_id: sendRes.id || null,
      sent_at: new Date().toISOString(),
    });

    sentCount++;
  }

  return NextResponse.json({ ok: true, sent: sentCount });
}
