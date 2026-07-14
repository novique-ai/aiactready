-- Reusable session-level input view for campaign verdict queries.
create or replace view public.funnel_session_rollup
with (security_invoker = true) as
select
  session_id,
  utm_campaign,
  min(created_at) as first_seen_at,
  bool_or(event = 'page_view') as landed,
  bool_or(event in ('checkout_started', 'email_captured', 'booking_click')) as showed_intent,
  bool_or(event = 'checkout_started' and tier = 'quick') as started_quick_checkout,
  bool_or(event = 'checkout_completed') as completed_checkout
from public.funnel_events
group by session_id, utm_campaign;
