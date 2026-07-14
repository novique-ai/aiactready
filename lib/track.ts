"use client";

import type { FunnelEventName } from "./funnel-events";
import type { TierId } from "./campaign";

const SESSION_KEY = "aiactready_session_id";
const ATTRIBUTION_KEY = "aiactready_attribution";

export type Attribution = {
  session_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  referrer: string | null;
  path: string;
};

function safeRead<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export function getAttribution(): Attribution {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  const saved = safeRead<Omit<Attribution, "session_id" | "path">>(ATTRIBUTION_KEY);
  if (saved) return { ...saved, session_id: sessionId, path: window.location.pathname };

  const params = new URLSearchParams(window.location.search);
  const attribution = {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    referrer: document.referrer || null,
  };
  localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  return { ...attribution, session_id: sessionId, path: window.location.pathname };
}

export async function track(event: FunnelEventName, tier?: TierId): Promise<boolean> {
  const attribution = getAttribution();
  try {
    const response = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ ...attribution, event, tier: tier ?? null }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
