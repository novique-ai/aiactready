import Stripe from "stripe";
import { getTier, isCheckoutTier } from "./campaign";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!key.startsWith("sk_test_")) {
    throw new Error("STRIPE_SECRET_KEY must be a Stripe test key");
  }
  stripe ??= new Stripe(key);
  return stripe;
}

export function priceIdForTier(tierId: string): string {
  if (!isCheckoutTier(tierId)) throw new Error("invalid checkout tier");
  const tier = getTier(tierId);
  if (!tier?.purchasable || tier.stripe_mode !== "payment" || !tier.stripe_price_env) {
    throw new Error("tier checkout is disabled");
  }
  const value = process.env[tier.stripe_price_env];
  if (!value) throw new Error(`${tier.stripe_price_env} is not set`);
  return value;
}
