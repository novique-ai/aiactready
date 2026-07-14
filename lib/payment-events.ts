import type Stripe from "stripe";
import { getSupabase } from "./supabase";
import type { CheckoutTierId } from "./campaign";

type InsertError = { code?: string; message: string } | null;
export type PaymentEventClient = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => Promise<{ error: InsertError }>;
  };
};

export type PersistResult = "inserted" | "duplicate";

function tierFromMetadata(metadata: Stripe.Metadata | null | undefined): CheckoutTierId | null {
  const tier = metadata?.tier;
  return tier === "quick" || tier === "full" ? tier : null;
}

export function shapePaymentEvent(event: Stripe.Event): Record<string, unknown> {
  const base: Record<string, unknown> = {
    stripe_event_id: event.id,
    event_type: event.type,
    tier: null,
    stripe_customer_id: null,
    stripe_payment_intent_id: null,
    amount_total: null,
    currency: null,
    status: null,
    raw: event,
  };

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    base.tier = tierFromMetadata(session.metadata);
    base.stripe_customer_id =
      typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
    base.stripe_payment_intent_id =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
    base.amount_total = session.amount_total;
    base.currency = session.currency;
    base.status = session.payment_status;
  } else if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    base.tier = tierFromMetadata(intent.metadata);
    base.stripe_customer_id =
      typeof intent.customer === "string" ? intent.customer : intent.customer?.id ?? null;
    base.stripe_payment_intent_id = intent.id;
    base.amount_total = intent.amount;
    base.currency = intent.currency;
    base.status = "failed";
  }

  return base;
}

export async function persistPaymentEventWithClient(
  event: Stripe.Event,
  client: PaymentEventClient,
): Promise<PersistResult> {
  const { error } = await client.from("payment_events").insert(shapePaymentEvent(event));
  if (!error) return "inserted";
  if (error.code === "23505") {
    console.log(`[payment-event] dedup: ${event.id}`);
    return "duplicate";
  }
  throw new Error(`payment_event_insert_failed: ${error.message}`);
}

export async function persistPaymentEvent(event: Stripe.Event): Promise<PersistResult> {
  return persistPaymentEventWithClient(
    event,
    getSupabase() as unknown as PaymentEventClient,
  );
}
