import Link from "next/link";
import type { Metadata } from "next";
import { getCampaign } from "@/lib/campaign";
import ContactForm from "./contact-form";

export const metadata: Metadata = { title: "Contact — AI Act Ready" };

export default function ContactPage() {
  const campaign = getCampaign();
  return (
    <main className="contact-page shell contact-shell">
      <Link href="/" className="back-link">← {campaign.brand.name}</Link>
      <p className="eyebrow">Contact</p>
      <h1>Send us a message.</h1>
      <p className="contact-intro">
        Ask about the validation offer, technical assessment scope, or the checklist. Messages persist before any email notification is attempted.
      </p>
      <ContactForm />
      <p className="pricing-legal">{campaign.disclaimer.full}</p>
    </main>
  );
}
