import { NextResponse } from "next/server";
import { insertFunnelEvent, normalizeFunnelEvent } from "@/lib/funnel-events";
import { supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "analytics_not_configured", detail: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required" },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const event = normalizeFunnelEvent({
    ...body,
    user_agent: request.headers.get("user-agent"),
  });
  if (!event) return NextResponse.json({ error: "invalid_event" }, { status: 400 });

  try {
    await insertFunnelEvent(event);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("track insert failed", error);
    return NextResponse.json({ error: "analytics_insert_failed" }, { status: 503 });
  }
}
