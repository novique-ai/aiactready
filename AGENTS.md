---
owner: Clayton
last_reviewed: 2026-07-14
source_of_truth_for: AI Act Ready product scope, validation posture, legal copy, and repo workflow
---

# AI Act Ready — product operating contract

This repository inherits the IDE constitution through `$IDE_ROOT/AGENTS.md` and the Shell Corp launch playbook through `$IDE_ROOT/infra/runbooks/shell-corp-product-launch.md`. Those sources prevail on conflict.

## Product posture

- Standalone brand: **AI Act Ready**. Footer colophon: **A Novique.ai company**. Shell Corp remains customer-invisible.
- Current state: ad-ready validation funnel in TEST mode, not a delivered compliance product.
- Campaign-specific copy, pricing, evidence, CTA mode, booking URL, UTM contract, and verdict thresholds live only in `config/campaign.yaml`. Components consume that config; do not fork those values into JSX.
- The dossier and red-team verdict are the claim source of truth. Update `docs/claims.md` whenever landing copy changes.

## Legal boundary

The mandatory posture is technical documentation support, not legal advice. Do not provide regulatory opinions. Keep the full disclaimer in the footer and checkout-adjacent copy. High-risk systems may require specialist support beyond the assessment.

## Safety gates

- Stripe TEST mode only. `lib/stripe.ts` must continue rejecting non-`sk_test_` secrets and the webhook must reject `livemode=true` events.
- No live ads, domains, GitHub/Vercel/Supabase/Namecheap provisioning, or outbound email without an operator-directed later packet.
- No live checkout until every marketed deliverable exists, legal review clears, and the Shell Corp product-delivers gate passes.
- Missing Supabase must produce a clear service-unavailable response. Never fake persistence success.
- Missing Resend is allowed only after contact persistence; leave `email_status='pending'`.

## Data and analytics

- Per-product Supabase project; service-role writes only; all tables have RLS enabled.
- UTM attribution is first-touch per anonymous browser session.
- Paid intent signals are server-backed: checkout start in `/api/checkout`, completion in the verified Stripe webhook.
- Stripe event idempotency depends on `payment_events.stripe_event_id` uniqueness and the explicit `23505` success path. Preserve both.
- `docs/analytics.md` and `config/campaign.yaml` must remain numerically aligned.

## Workflow

Run before handoff:

```bash
npm test
npm run build
```

Update `docs/mvp-roadmap.md` when capability scope moves. Commit only this product's files. Do not push from this work packet.
