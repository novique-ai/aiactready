"use client";

import { useState } from "react";
import { getAttribution } from "@/lib/track";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, ...getAttribution() }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(result.error === "storage_not_configured" ? "Contact storage is not connected yet." : "We could not save the message.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "success") return <p className="form-success">Message stored. We&apos;ll follow up by email.</p>;

  return (
    <form onSubmit={submit} className="contact-form">
      <div className="honeypot" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="contact-row">
        <label>Name<input name="name" required maxLength={200} /></label>
        <label>Email<input name="email" type="email" required maxLength={254} /></label>
      </div>
      <label>Company <span>(optional)</span><input name="company" maxLength={200} /></label>
      <label>
        Category
        <select name="category" defaultValue="general">
          <option value="general">General inquiry</option>
          <option value="sales">Assessment scope</option>
          <option value="feedback">Product feedback</option>
          <option value="research">Research</option>
          <option value="partnership">Partnership</option>
          <option value="support">Support</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label>Message<textarea name="message" required minLength={10} maxLength={5000} /></label>
      <button type="submit" className="button button-primary" disabled={status === "loading"}>
        {status === "loading" ? "Saving…" : "Send message"}
      </button>
      {status === "error" ? <p className="form-error" role="alert">{message}</p> : null}
    </form>
  );
}
