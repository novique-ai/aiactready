# Validation analytics and pre-registered verdict

## UTM contract

Every ad URL uses:

```text
utm_source={platform}
utm_medium=paid
utm_campaign=eu-ai-act-validation-202607
utm_content={ad-variant}
```

`lib/track.ts` stores the first-touch UTM set and anonymous `crypto.randomUUID()` session ID in local storage. The same attribution object flows to page/CTA tracking, signup, contact, and checkout. `/api/checkout` writes `checkout_started` before creating Stripe Checkout; the verified Stripe webhook writes `checkout_completed` server-side.

## Budget and assumptions

- Spend cap: **$50**.
- Assumed platform: **LinkedIn**, matching the dossier's reachable B2B channel.
- Assumed B2B SaaS CPC: **$11.02**, so expected clicks are `50 / 11.02 = 4.54` (roughly 4-5). Source: [Search Engine Land's B2B SaaS LinkedIn CPC benchmark](https://searchengineland.com/linkedin-ads-cpc-benchmarks-how-costs-compare-with-google-ads-481010).
- Commercial/professional-services landing pages have a **6.1% median conversion rate**. Source: [Unbounce Conversion Benchmark Report](https://unbounce.com/conversion-benchmark-report/professional-services-conversion-rate/).
- The dossier shows urgent compliance pain, existing professional-services budgets, and a low-friction fixed-fee wedge. Because the sample is tiny, PASS is deliberately demanding: at least one quick-tier checkout start and a combined intent rate of at least **20%**. KILL requires zero quick-tier checkout starts and intent below **6.1%**. Everything else is GREY for operator review.

The numeric values above are defined first in `config/campaign.yaml` under `thresholds`; this document explains them.

## Metric definition

Intent rate is:

```text
distinct sessions with checkout_started OR email_captured OR booking_click
--------------------------------------------------------------------------
distinct sessions with page_view
```

Multiple actions by one visitor count once. `booking_click` remains in the metric even though `booking_url` is currently null, so later campaign configs do not need a schema change.

## Exact verdict SQL

```sql
with settings as (
  select
    'eu-ai-act-validation-202607'::text as campaign,
    20.0::numeric as pass_intent_rate_pct,
    1::integer as pass_quick_checkout_min,
    6.1::numeric as kill_intent_rate_pct,
    0::integer as kill_quick_checkout_max
), sessions as (
  select
    session_id,
    bool_or(event = 'page_view') as landed,
    bool_or(event in ('checkout_started', 'email_captured', 'booking_click')) as showed_intent,
    bool_or(event = 'checkout_started' and tier = 'quick') as started_quick_checkout
  from public.funnel_events, settings
  where utm_campaign = settings.campaign
  group by session_id
), metrics as (
  select
    count(*) filter (where landed) as landing_sessions,
    count(*) filter (where landed and showed_intent) as intent_sessions,
    count(*) filter (where landed and started_quick_checkout) as quick_checkout_sessions
  from sessions
), scored as (
  select
    metrics.*,
    round(100.0 * intent_sessions / nullif(landing_sessions, 0), 2) as intent_rate_pct
  from metrics
)
select
  scored.*,
  case
    when landing_sessions = 0 then 'GREY'
    when intent_rate_pct >= settings.pass_intent_rate_pct
      and quick_checkout_sessions >= settings.pass_quick_checkout_min then 'PASS'
    when intent_rate_pct < settings.kill_intent_rate_pct
      and quick_checkout_sessions <= settings.kill_quick_checkout_max then 'KILL'
    else 'GREY'
  end as verdict
from scored cross join settings;
```
