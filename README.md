# AI Act Ready

Ad-ready, test-mode validation funnel for the `eu-ai-act-compliance-assessment` candidate. The standalone customer brand is **AI Act Ready**, with a Novique.ai colophon.

## Scope

This repository validates purchase and lead intent. It does not yet deliver an assessment, legal interpretation, Annex IV package, checklist, or monitoring service. Stripe is test mode only. No live ad, domain, cloud project, or outbound email is created by this packet.

## Stack

- Next.js 16 App Router, React 19, Tailwind 4
- Supabase service-role writes for leads, contacts, payment events, and funnel analytics
- Stripe Checkout in `mode: payment`, enforced test key
- Optional Resend notification after contact persistence
- Campaign content and thresholds in `config/campaign.yaml`

## Local run

```bash
cp .env.example .env.local
npm install
npm run dev
```

The landing page builds and renders without any external credentials. Data handlers return explicit `503` responses when Supabase is absent. Contact email is optional: with Supabase configured but `RESEND_API_KEY` unset, the message persists with `email_status='pending'`.

## Test and build

```bash
npm test
npm run build
```

Local no-service smoke:

```bash
npm run dev
curl -i http://localhost:3000/
curl -i -X POST http://localhost:3000/api/track \
  -H 'content-type: application/json' \
  --data '{"session_id":"2ec15c91-21d2-47bb-99e1-a8c3bb5cd114","event":"page_view","path":"/"}'
```

The second request should return `503` with `analytics_not_configured`, not crash.

## Data setup checklist — operator/P6

1. Supabase dashboard: create the dedicated test project, then SQL Editor → run `sql/001_initial_schema.sql` through `sql/004_funnel_session_rollup.sql` in order.
2. Project Settings → API: copy the project URL and service-role key into `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the test environment only.
3. Stripe Dashboard: switch **Test mode on** → Product catalog → create one-time EUR prices matching the quick and full tiers in `config/campaign.yaml`; set their IDs as `STRIPE_PRICE_QUICK` and `STRIPE_PRICE_FULL`.
4. Stripe Developers → API keys: use only a `sk_test_` secret. The app rejects any other key shape.
5. Stripe Developers → Webhooks: add the test endpoint `/api/stripe/webhook` and subscribe only to `checkout.session.completed` and `payment_intent.payment_failed`; set its signing secret as `STRIPE_WEBHOOK_SECRET`.
6. Optional contact notification: Resend dashboard → API Keys and Domains; set `RESEND_API_KEY`, `CONTACT_EMAIL_TO`, and `CONTACT_EMAIL_FROM`. Leave the key unset for no-send testing.
7. Hosting dashboard: add the same variables to a non-production/test deployment and set `NEXT_PUBLIC_SITE_URL` to its public HTTPS origin. Production refuses localhost checkout origins.
8. Ad platform: operator creates the campaign manually with the UTM contract in `docs/analytics.md`; no ad-platform API is called by this app.

## Validation launch checklist

- Confirm `config/campaign.yaml` pricing, copy, evidence URLs, booking URL, spend cap, and thresholds.
- Run `npm test` and `npm run build`.
- Verify Stripe is visibly in Test mode and the secret starts with `sk_test_`.
- Apply all SQL migrations to the test Supabase project.
- Open the test deployment at 375px width; confirm no horizontal scroll and usable 44px+ controls.
- Complete one test checkout for each purchasable tier and replay the same signed webhook to verify idempotency.
- Submit the checklist form and contact form; confirm UTM columns and persist-first behavior.
- Run the exact verdict SQL from `docs/analytics.md` after the operator's $50 campaign.
- Do not enable live payments or outbound marketing from this repository.

## Evidence

- `docs/claims.md` maps each landing-page factual claim to the X-Prize dossier and source URL.
- `docs/analytics.md` defines attribution, benchmarks, numeric thresholds, and exact verdict SQL.
- `sql/002_funnel_events.sql` is the event contract.
