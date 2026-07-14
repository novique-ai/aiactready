"use client";

import { track } from "@/lib/track";

export default function BookingLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="button button-secondary"
      onClick={() => void track("booking_click")}
    >
      Book a slot
    </a>
  );
}
