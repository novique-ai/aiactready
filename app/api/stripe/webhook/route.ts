import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { insertFunnelEvent, normalizeFunnelEvent } from "@/lib/funnel-events";
import { persistPaymentEvent } from "@/lib/payment-events";
import { getStripe } from "@/lib/stripe";
import { supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const RELEVANT_EVENTS = new Set([
  "checkout.session.completed",
  "payment_intent.payment_failed",
]);

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  if (!supabaseConfigured()) return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (error) {
    console.error("webhook signature verification failed", error);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.livemode) {
    return NextResponse.json({ error: "live_event_rejected" }, { status: 400 });
  }
  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  try {
    const persisted = await persistPaymentEvent(event);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const analytics = normalizeFunnelEvent({
        session_id: session.metadata?.session_id,
        event: "checkout_completed",
        tier: session.metadata?.tier,
        utm_source: session.metadata?.utm_source,
        utm_medium: session.metadata?.utm_medium,
        utm_campaign: session.metadata?.utm_campaign,
        utm_content: session.metadata?.utm_content,
        referrer: session.metadata?.referrer,
        path: "/success",
      });
      if (!analytics) throw new Error("checkout_completed_attribution_invalid");
      await insertFunnelEvent(analytics);
    }
    return NextResponse.json({ received: true, event_id: event.id, persisted });
  } catch (error) {
    console.error(`webhook persistence failed for ${event.id}`, error);
    return NextResponse.json({ error: "persist_failed", event_id: event.id }, { status: 503 });
  }
}
