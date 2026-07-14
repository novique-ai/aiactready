create table if not exists public.funnel_events (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null,
  event        text not null check (event in (
                 'page_view',
                 'cta_click',
                 'checkout_started',
                 'checkout_completed',
                 'email_captured',
                 'booking_click',
                 'contact_submitted'
               )),
  tier         text check (tier in ('quick', 'full', 'monitoring')),
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_content  text,
  referrer     text,
  path         text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index if not exists funnel_events_created_idx
  on public.funnel_events (created_at desc);
create index if not exists funnel_events_session_idx
  on public.funnel_events (session_id, created_at);
create index if not exists funnel_events_campaign_event_idx
  on public.funnel_events (utm_campaign, event, created_at);
create index if not exists funnel_events_tier_event_idx
  on public.funnel_events (tier, event, created_at);

-- Stripe may retry a webhook. This complements payment_events.stripe_event_id
-- uniqueness by making the paid funnel signal one-per-session/tier.
create unique index if not exists funnel_events_checkout_completed_once
  on public.funnel_events (session_id, event, tier)
  where event = 'checkout_completed';

alter table public.funnel_events enable row level security;
