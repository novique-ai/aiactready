import { NextResponse } from "next/server";
import { insertFunnelEvent, normalizeFunnelEvent } from "@/lib/funnel-events";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const event = normalizeFunnelEvent({ ...body, event: "email_captured", user_agent: request.headers.get("user-agent") });
  if (!event) return NextResponse.json({ error: "invalid_attribution" }, { status: 400 });

  const { error } = await getSupabase().from("signups").insert({
    email,
    tier_interest: event.tier ?? "quick",
    session_id: event.session_id,
    referrer: event.referrer,
    utm_source: event.utm_source,
    utm_medium: event.utm_medium,
    utm_campaign: event.utm_campaign,
    utm_content: event.utm_content,
    user_agent: event.user_agent,
  });
  if (error && error.code !== "23505") {
    console.error("signup insert failed", error);
    return NextResponse.json({ error: "storage_failed" }, { status: 503 });
  }
  try {
    await insertFunnelEvent(event);
  } catch (eventError) {
    console.error("email capture event failed", eventError);
    return NextResponse.json({ error: "analytics_insert_failed" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, status: error?.code === "23505" ? "already_subscribed" : "subscribed" });
}
