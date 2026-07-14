import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import {
  persistPaymentEventWithClient,
  type PaymentEventClient,
} from "../lib/payment-events";

function checkoutEvent(): Stripe.Event {
  return {
    id: "evt_test_duplicate_checkout",
    object: "event",
    api_version: "2026-03-25.dahlia",
    created: 0,
    data: {
      object: {
        id: "cs_test_123",
        object: "checkout.session",
        amount_total: 50000,
        currency: "eur",
        customer: null,
        payment_intent: "pi_test_123",
        payment_status: "paid",
        metadata: { tier: "quick", session_id: "2ec15c91-21d2-47bb-99e1-a8c3bb5cd114" },
      } as Stripe.Checkout.Session,
    },
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type: "checkout.session.completed",
  };
}

describe("payment event idempotency", () => {
  it("treats Stripe's 23505 duplicate as success and leaves one row", async () => {
    const rows = new Map<string, Record<string, unknown>>();
    const client: PaymentEventClient = {
      from: () => ({
        insert: async (row) => {
          const key = String(row.stripe_event_id);
          if (rows.has(key)) return { error: { code: "23505", message: "duplicate key" } };
          rows.set(key, row);
          return { error: null };
        },
      }),
    };

    expect(await persistPaymentEventWithClient(checkoutEvent(), client)).toBe("inserted");
    expect(await persistPaymentEventWithClient(checkoutEvent(), client)).toBe("duplicate");
    expect(rows.size).toBe(1);
  });
});
