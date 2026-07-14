import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCampaign } from "@/lib/campaign";
import { insertFunnelEvent, normalizeFunnelEvent } from "@/lib/funnel-events";
import { sendEmail, URGENT_HEADERS } from "@/lib/resend";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORIES = ["general", "sales", "support", "feedback", "research", "partnership", "other"] as const;
type Category = (typeof CATEGORIES)[number];

function ipHash(request: Request): string | null {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip ? createHash("sha256").update(ip).digest("hex").slice(0, 32) : null;
}

export async function POST(request: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true, status: "received" });
  }

  const name = String(body.name ?? "").trim().slice(0, 200);
  const email = String(body.email ?? "").trim().toLowerCase();
  const company = String(body.company ?? "").trim().slice(0, 200) || null;
  const message = String(body.message ?? "").trim().slice(0, 5000);
  const requestedCategory = String(body.category ?? "general").toLowerCase();
  const category = CATEGORIES.includes(requestedCategory as Category)
    ? (requestedCategory as Category)
    : null;
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!category) return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  if (message.length < 10) return NextResponse.json({ error: "message_too_short" }, { status: 400 });

  const event = normalizeFunnelEvent({
    ...body,
    event: "contact_submitted",
    user_agent: request.headers.get("user-agent"),
  });
  if (!event) return NextResponse.json({ error: "invalid_attribution" }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("contact_messages")
    .insert({
      name,
      email,
      company,
      category,
      message,
      session_id: event.session_id,
      user_agent: event.user_agent,
      referrer: event.referrer,
      ip_hash: ipHash(request),
      email_status: "pending",
    })
    .select("id")
    .single();
  if (error) {
    console.error("contact persistence failed", error);
    return NextResponse.json({ error: "storage_failed" }, { status: 503 });
  }

  try {
    await insertFunnelEvent(event);
  } catch (analyticsError) {
    console.error("contact event persistence failed", analyticsError);
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, status: "stored_pending", id: data.id });
  }

  const campaign = getCampaign();
  const result = await sendEmail({
    from: process.env.CONTACT_EMAIL_FROM ?? `${campaign.brand.name} <onboarding@resend.dev>`,
    to: process.env.CONTACT_EMAIL_TO ?? "support@novique.ai",
    reply_to: email,
    subject: `${campaign.brand.name} Customer Message — ${category}`,
    text: [
      `New ${campaign.brand.name} contact submission`,
      `Category: ${category}`,
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : null,
      "",
      message,
      "",
      `Stored as contact_messages.id = ${data.id}`,
    ].filter(Boolean).join("\n"),
    headers: URGENT_HEADERS,
  });

  const update = result.ok
    ? { email_status: "sent", email_error: null }
    : { email_status: "failed", email_error: result.error.slice(0, 500) };
  const { error: updateError } = await supabase.from("contact_messages").update(update).eq("id", data.id);
  if (updateError) console.error("contact email status update failed", updateError);
  return NextResponse.json({ ok: true, status: result.ok ? "received" : "stored_email_failed", id: data.id });
}
