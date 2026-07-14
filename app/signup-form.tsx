"use client";

import { useState } from "react";
import { getAttribution } from "@/lib/track";

export default function SignupForm({
  buttonLabel,
  deliveryNote,
}: {
  buttonLabel: string;
  deliveryNote: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...getAttribution(), email, tier: "quick" }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(
          body.error === "storage_not_configured"
            ? "The list is not connected yet. Please use the contact form."
            : body.error === "invalid_email"
              ? "Enter a valid email address."
              : "We could not save that email. Try again.",
        );
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return <p className="form-success">You&apos;re on the launch list. We&apos;ll send the checklist when it is ready.</p>;
  }

  return (
    <form onSubmit={submit} className="signup-form">
      <label htmlFor="checklist-email" className="sr-only">Work email</label>
      <input
        id="checklist-email"
        type="email"
        required
        maxLength={254}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@company.com"
        autoComplete="email"
      />
      <button type="submit" disabled={status === "loading"} className="button button-dark">
        {status === "loading" ? "Saving…" : buttonLabel}
      </button>
      <p className="form-note">{deliveryNote}</p>
      {status === "error" ? <p className="form-error" role="alert">{message}</p> : null}
    </form>
  );
}
