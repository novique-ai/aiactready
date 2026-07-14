-- AI Act Ready validation data plane. Apply to a dedicated Supabase project in P6.
create extension if not exists "pgcrypto";

create table if not exists public.signups (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  tier_interest text not null default 'quick'
                  check (tier_interest in ('quick', 'full', 'monitoring')),
  session_id    uuid not null,
  referrer      text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  user_agent    text,
  created_at    timestamptz not null default now()
);
create unique index if not exists signups_email_key on public.signups (lower(email));
create index if not exists signups_campaign_idx on public.signups (utm_campaign, created_at desc);

create table if not exists public.payment_events (
  id                       uuid primary key default gen_random_uuid(),
  stripe_event_id          text not null unique,
  event_type               text not null
                             check (event_type in ('checkout.session.completed', 'payment_intent.payment_failed')),
  tier                     text check (tier in ('quick', 'full')),
  stripe_customer_id       text,
  stripe_payment_intent_id text,
  amount_total             integer,
  currency                 text,
  status                   text,
  raw                      jsonb not null,
  created_at               timestamptz not null default now()
);
create index if not exists payment_events_type_idx on public.payment_events (event_type, created_at desc);
create index if not exists payment_events_intent_idx on public.payment_events (stripe_payment_intent_id);

alter table public.signups enable row level security;
alter table public.payment_events enable row level security;
