import { getSupabase, supabaseConfigured } from "./supabase";
import type { TierId } from "./campaign";

export const FUNNEL_EVENTS = [
  "page_view",
  "cta_click",
  "checkout_started",
  "checkout_completed",
  "email_captured",
  "booking_click",
  "contact_submitted",
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[number];

export type FunnelEventInput = {
  session_id: string;
  event: FunnelEventName;
  tier?: TierId | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  referrer?: string | null;
  path?: string | null;
  user_agent?: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cap(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export function normalizeFunnelEvent(value: Record<string, unknown>): FunnelEventInput | null {
  const sessionId = cap(value.session_id, 64);
  const event = cap(value.event, 40);
  const tier = cap(value.tier, 24);
  if (!sessionId || !UUID_RE.test(sessionId)) return null;
  if (!event || !FUNNEL_EVENTS.includes(event as FunnelEventName)) return null;
  if (tier && !["quick", "full", "monitoring"].includes(tier)) return null;
  return {
    session_id: sessionId,
    event: event as FunnelEventName,
    tier: (tier as TierId | null) ?? null,
    utm_source: cap(value.utm_source, 100),
    utm_medium: cap(value.utm_medium, 100),
    utm_campaign: cap(value.utm_campaign, 150),
    utm_content: cap(value.utm_content, 150),
    referrer: cap(value.referrer, 500),
    path: cap(value.path, 500),
    user_agent: cap(value.user_agent, 500),
  };
}

export async function insertFunnelEvent(input: FunnelEventInput): Promise<void> {
  if (!supabaseConfigured()) throw new Error("analytics_not_configured");
  const normalized = normalizeFunnelEvent(input as unknown as Record<string, unknown>);
  if (!normalized) throw new Error("invalid_funnel_event");
  const { error } = await getSupabase().from("funnel_events").insert(normalized);
  if (error?.code === "23505") return;
  if (error) throw new Error(`funnel_event_insert_failed: ${error.message}`);
}
