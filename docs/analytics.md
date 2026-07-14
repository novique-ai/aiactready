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
- Primary platform: **Reddit Ads**, using community targeting adjacent to r/SaaS, r/startups, r/Entrepreneur, and r/smallbusiness, where the dossier's direct demand evidence lives.
- Current B2B SaaS Reddit Ads CPC benchmark: **$0.75-$3.00**. The plan uses the range midpoint, **$1.875**, so expected clicks are `50 / 1.875 = 26.67`. Source: [Skip the Noise Media's May 2026 B2B SaaS Reddit Ads benchmark](https://skipthenoisemedia.com/reddit-ads-b2b-saas) (accessed 2026-07-14).
- Evaluation requires **20 landing sessions**, equal to 75% of the 26.67-click forecast and leaving a 25% allowance for click-to-load loss, duplicate clicks, or unavailable first-party sessions. Fewer than 20 sessions is GREY rather than a forced verdict.
- SaaS landing pages have a **3.8% median conversion rate**, while SaaS paid-social traffic converts at a **2.9% median**. Source: [Unbounce's SaaS Conversion Benchmark Report](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/) (accessed 2026-07-14).
- PASS requires intent rate at or above **3.8%** and at least **1 quick-tier `checkout_started`** session. At the 20-session floor, one quick checkout is a 5% intent rate, so PASS is achievable but still demands the strongest measured buying-intent event.
- KILL requires intent rate below **2.9%** and **0 quick-tier `checkout_started`** sessions. At the forecast denominator, this means no measured intent; a weaker email/booking signal without a quick checkout remains GREY instead of being discarded.
- GREY covers fewer than 20 landing sessions and every evaluable result that satisfies neither complete PASS nor complete KILL.

LinkedIn remains an alternative scenario only. Its B2B SaaS CPC is **$11.02**, so `$50 / $11.02 = 4.54` expected clicks. That is below the 20-session evaluation floor and therefore under-powered at this budget. Source: [Search Engine Land's June 2026 LinkedIn benchmark](https://searchengineland.com/linkedin-ads-cpc-benchmarks-how-costs-compare-with-google-ads-481010) (accessed 2026-07-14).

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
    20::integer as minimum_landing_sessions,
    3.8::numeric as pass_intent_rate_pct,
    1::integer as pass_quick_checkout_min,
    2.9::numeric as kill_intent_rate_pct,
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
    when landing_sessions < settings.minimum_landing_sessions then 'GREY'
    when intent_rate_pct >= settings.pass_intent_rate_pct
      and quick_checkout_sessions >= settings.pass_quick_checkout_min then 'PASS'
    when intent_rate_pct < settings.kill_intent_rate_pct
      and quick_checkout_sessions <= settings.kill_quick_checkout_max then 'KILL'
    else 'GREY'
  end as verdict
from scored cross join settings;
```
