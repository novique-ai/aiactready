"use client";

import { useEffect, useState } from "react";
import type { CheckoutTierId } from "@/lib/campaign";
import { getAttribution, track } from "@/lib/track";

type Phase = "idle" | "loading" | "capture" | "saving" | "done" | "error";

export default function CheckoutButton({
  tier,
  label,
  tierName,
  primary = false,
}: {
  tier: CheckoutTierId;
  label: string;
  tierName?: string;
  primary?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const modalOpen = phase === "capture" || phase === "saving" || phase === "error";

  useEffect(() => {
    if (!modalOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPhase("idle");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  function startCheckout() {
    if (phase === "loading") return;
    setMessage("");
    // A click is only a click: record cta_click and open the capture. The
    // checkout_started intent signal (what PASS/KILL counts) fires in reserve()
    // after a work email is actually submitted — a click-level event here would
    // overstate intent against the form-fill benchmarks the gate is calibrated to.
    void track("cta_click", tier);
    setPhase("capture");
  }

  async function reserve(event: React.FormEvent) {
    event.preventDefault();
    setPhase("saving");
    setMessage("");
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...getAttribution(), email, tier }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setPhase("error");
        setMessage(
          body.error === "invalid_email"
            ? "Enter a valid work email."
            : body.error === "storage_not_configured"
              ? "The list is not connected yet. Please use the contact form."
              : "We couldn't reserve your spot. Please try again.",
        );
        return;
      }
      // Email is in: this is the real purchase-intent moment. Record
      // checkout_started server-side (fire-and-forget; the reservation above is
      // already saved, so a failure here loses a metric, never a lead). We still
      // do not navigate to the returned test-mode Stripe URL; it simply expires.
      void fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...getAttribution(), tier }),
      }).catch(() => {});
      setPhase("done");
    } catch {
      setPhase("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="checkout-cta">
      <button
        type="button"
        onClick={startCheckout}
        disabled={phase === "loading"}
        className={primary ? "button button-primary" : "button button-secondary"}
      >
        {phase === "loading" ? "One moment…" : label}
      </button>

      {phase === "done" ? (
        <p className="form-success reserve-success">
          You&apos;re on the list. We&apos;ll email your secure checkout link and intake steps when your cohort opens.
        </p>
      ) : null}

      {modalOpen ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`reserve-title-${tier}`}
          onClick={() => setPhase("idle")}
        >
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" aria-label="Close" onClick={() => setPhase("idle")}>
              ×
            </button>
            <p className="eyebrow">First cohort{tierName ? ` — ${tierName}` : ""}</p>
            <h3 id={`reserve-title-${tier}`}>Reserve your spot</h3>
            <p className="modal-body">
              We&apos;re onboarding the first group of SaaS teams now. Leave your work email and we&apos;ll send your
              secure checkout link and intake steps as soon as your slot opens.
            </p>
            <form onSubmit={reserve} className="reserve-form">
              <label htmlFor={`reserve-email-${tier}`} className="sr-only">Work email</label>
              <input
                id={`reserve-email-${tier}`}
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
              />
              <button type="submit" disabled={phase === "saving"} className="button button-primary">
                {phase === "saving" ? "Reserving…" : "Reserve my spot"}
              </button>
              {phase === "error" ? <p className="form-error" role="alert">{message}</p> : null}
              <p className="modal-note">No charge today. Technical documentation support, not legal advice.</p>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
