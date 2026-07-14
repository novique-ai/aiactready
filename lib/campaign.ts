import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export type TierId = "quick" | "full" | "monitoring";
export type CheckoutTierId = "quick" | "full";
export type CtaMode = "test_checkout" | "waitlist_only";

export type CampaignTier = {
  id: TierId;
  name: string;
  price_minor: number;
  currency: string;
  cadence: "one_time" | "monthly";
  stripe_mode: "payment" | "none";
  stripe_price_env: string | null;
  purchasable: boolean;
  primary: boolean;
  qualifier?: string;
  description: string;
  features: string[];
};

export type Campaign = {
  candidate_slug: string;
  brand: {
    name: string;
    eyebrow: string;
    colophon: string;
    description: string;
  };
  value_proposition: {
    headline: string;
    body: string;
    proof_line: string;
  };
  offer_tiers: CampaignTier[];
  urgency: { label: string; headline: string; body: string };
  evidence_bullets: Array<{ text: string; source_url: string }>;
  cta_mode: CtaMode;
  booking_url: string | null;
  lead_magnet: { headline: string; button: string; delivery_note: string };
  utm_scheme: {
    source: string;
    medium: string;
    campaign: string;
    content: string;
  };
  thresholds: {
    spend_usd: number;
    platform: string;
    assumed_cpc_usd: number;
    expected_clicks: number;
    pass: { intent_rate_pct_min: number; quick_checkout_started_min: number };
    kill: { intent_rate_pct_below: number; quick_checkout_started_max: number };
    grey: string;
    benchmark_sources: Array<{ label: string; url: string }>;
  };
  disclaimer: { short: string; full: string };
};

let cached: Campaign | null = null;

function assertCampaign(value: unknown): asserts value is Campaign {
  if (!value || typeof value !== "object") throw new Error("campaign_config_invalid");
  const campaign = value as Partial<Campaign>;
  if (!campaign.candidate_slug || !campaign.brand?.name) {
    throw new Error("campaign_config_missing_identity");
  }
  if (!Array.isArray(campaign.offer_tiers) || campaign.offer_tiers.length < 2) {
    throw new Error("campaign_config_missing_tiers");
  }
  if (!campaign.offer_tiers.some((tier) => tier.id === "quick" && tier.primary)) {
    throw new Error("campaign_config_missing_primary_tier");
  }
  if (!campaign.disclaimer?.short || !campaign.disclaimer?.full) {
    throw new Error("campaign_config_missing_disclaimer");
  }
}

export function getCampaign(): Campaign {
  if (cached) return cached;
  const path = join(process.cwd(), "config", "campaign.yaml");
  const value = parse(readFileSync(path, "utf8"));
  assertCampaign(value);
  cached = value;
  return cached;
}

export function getTier(id: string): CampaignTier | null {
  return getCampaign().offer_tiers.find((tier) => tier.id === id) ?? null;
}

export function isCheckoutTier(id: string): id is CheckoutTierId {
  return id === "quick" || id === "full";
}

export function formatTierPrice(tier: CampaignTier): string {
  const amount = tier.price_minor / 100;
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: tier.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
