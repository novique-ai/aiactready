"use client";

import { useState } from "react";
import type { CheckoutTierId } from "@/lib/campaign";
import { getAttribution, track } from "@/lib/track";

export default function CheckoutButton({
  tier,
  label,
  primary = false,
}: {
  tier: CheckoutTierId;
  label: string;
  primary?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function startCheckout() {
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");
    void track("cta_click", tier);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...getAttribution(), tier }),
      });
      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url) {
        setStatus("error");
        setMessage(
          body.error === "analytics_not_configured"
            ? "Test checkout is not connected yet. Join the checklist list below."
            : "Test checkout is temporarily unavailable.",
        );
        return;
      }
      window.location.assign(body.url);
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={status === "loading"}
        className={primary ? "button button-primary" : "button button-secondary"}
      >
        {status === "loading" ? "Opening test checkout…" : label}
      </button>
      {status === "error" ? <p className="form-error" role="alert">{message}</p> : null}
    </div>
  );
}
