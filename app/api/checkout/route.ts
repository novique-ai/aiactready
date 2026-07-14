import { NextResponse } from "next/server";
import { getCampaign, getTier, isCheckoutTier } from "@/lib/campaign";
import { insertFunnelEvent, normalizeFunnelEvent } from "@/lib/funnel-events";
import { getStripe, priceIdForTier } from "@/lib/stripe";
import { supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export function resolveOrigin(request: Request): string {
  const headerOrigin = request.headers.get("origin");
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const candidate = process.env.NODE_ENV === "production"
    ? envSiteUrl ?? headerOrigin
    : headerOrigin ?? envSiteUrl;

  if (process.env.NODE_ENV === "production") {
    if (!candidate) throw new Error("origin_unresolvable_in_production");
    if (
      candidate.startsWith("http://localhost") ||
      candidate.startsWith("http://127.") ||
      candidate.startsWith("http://0.0.0.0")
    ) {
      throw new Error("origin_localhost_in_production");
    }
  }
  const origin = candidate ?? "http://localhost:3000";
  const parsed = new URL(origin);
  return parsed.origin;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const tierId = typeof body.tier === "string" ? body.tier : "";
  const campaign = getCampaign();
  const tier = getTier(tierId);
  if (
    campaign.cta_mode !== "test_checkout" ||
    !isCheckoutTier(tierId) ||
    !tier?.purchasable ||
    tier.stripe_mode !== "payment"
  ) {
    return NextResponse.json({ error: "invalid_or_disabled_tier" }, { status: 400 });
  }

  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "analytics_not_configured", detail: "Checkout intent must be persisted before Stripe Checkout starts" },
      { status: 503 },
    );
  }

  const event = normalizeFunnelEvent({
    ...body,
    event: "checkout_started",
    tier: tierId,
    user_agent: request.headers.get("user-agent"),
  });
  if (!event) return NextResponse.json({ error: "invalid_attribution" }, { status: 400 });

  let origin: string;
  try {
    origin = resolveOrigin(request);
    await insertFunnelEvent(event);
  } catch (error) {
    const message = error instanceof Error ? error.message : "checkout_precondition_failed";
    console.error("checkout precondition failed", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const metadata = {
    tier: tierId,
    session_id: event.session_id,
    utm_source: event.utm_source ?? "",
    utm_medium: event.utm_medium ?? "",
    utm_campaign: event.utm_campaign ?? "",
    utm_content: event.utm_content ?? "",
    referrer: event.referrer ?? "",
  };

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceIdForTier(tierId), quantity: 1 }],
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      metadata,
      payment_intent_data: { metadata },
    });
    if (!session.url) return NextResponse.json({ error: "no_checkout_url" }, { status: 500 });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "checkout_failed";
    console.error("checkout create failed", message);
    return NextResponse.json(
      { error: message.includes("is not set") || message.includes("test key") ? "stripe_not_configured" : "checkout_failed" },
      { status: 503 },
    );
  }
}
