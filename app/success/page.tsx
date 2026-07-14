import Link from "next/link";
import { getCampaign } from "@/lib/campaign";

export default function SuccessPage() {
  const campaign = getCampaign();
  return (
    <main className="success-page shell">
      <section className="success-card">
        <p className="eyebrow">Stripe test mode</p>
        <h1>Your test checkout is complete.</h1>
        <p>
          This validation payment used Stripe test mode. No live charge was made. If the offer advances, we will email the intake steps and delivery timeline before live checkout is enabled.
        </p>
        <p className="success-legal">{campaign.disclaimer.full}</p>
        <Link href="/" className="button button-secondary">Return to {campaign.brand.name}</Link>
      </section>
    </main>
  );
}
