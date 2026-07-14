import Link from "next/link";
import Analytics from "./analytics";
import BookingLink from "./booking-link";
import CheckoutButton from "./checkout-button";
import SignupForm from "./signup-form";
import {
  formatTierPrice,
  getCampaign,
  isCheckoutTier,
} from "@/lib/campaign";

export default function Home() {
  const campaign = getCampaign();
  const primaryTier = campaign.offer_tiers.find((tier) => tier.primary);
  if (!primaryTier || !isCheckoutTier(primaryTier.id)) throw new Error("primary checkout tier missing");

  return (
    <main>
      <Analytics />
      <header className="site-header shell">
        <Link href="/" className="brand-mark">{campaign.brand.name}</Link>
        <span className="test-badge">Test-mode validation</span>
      </header>

      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">{campaign.brand.eyebrow}</p>
          <h1>{campaign.value_proposition.headline}</h1>
          <p className="hero-body">{campaign.value_proposition.body}</p>
          <p className="proof-line">{campaign.value_proposition.proof_line}</p>
          <div className="hero-action">
            {campaign.cta_mode === "test_checkout" ? (
              <CheckoutButton
                tier={primaryTier.id}
                label={`Start ${formatTierPrice(primaryTier)} test checkout`}
                primary
              />
            ) : (
              <a href="#checklist" className="button button-primary">Join the checklist list</a>
            )}
            <p className="checkout-disclaimer">{campaign.disclaimer.short}</p>
          </div>
        </div>
        <aside className="deadline-card">
          <p className="eyebrow">{campaign.urgency.label}</p>
          <h2>{campaign.urgency.headline}</h2>
          <p>{campaign.urgency.body}</p>
        </aside>
      </section>

      <section className="evidence-band">
        <div className="shell">
          <p className="eyebrow">Why test this offer now</p>
          <ul className="evidence-grid">
            {campaign.evidence_bullets.map((bullet) => (
              <li key={bullet.source_url}>
                <span>{bullet.text}</span>
                <a href={bullet.source_url} target="_blank" rel="noreferrer">Source ↗</a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pricing shell" id="pricing">
        <div className="section-heading">
          <p className="eyebrow">Transparent fixed fees</p>
          <h2>Choose the depth you need.</h2>
          <p>No sales call is required for this test-mode funnel.</p>
        </div>
        <div className="tier-grid">
          {campaign.offer_tiers.map((tier) => (
            <article key={tier.id} className={`tier-card ${tier.primary ? "tier-primary" : ""}`}>
              <div>
                {tier.qualifier ? <p className="tier-qualifier">{tier.qualifier}</p> : null}
                <h3>{tier.name}</h3>
                <p className="tier-price">
                  {formatTierPrice(tier)}
                  {tier.cadence === "monthly" ? <span>/mo</span> : null}
                </p>
                <p>{tier.description}</p>
                <ul>
                  {tier.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </div>
              {tier.id === "full" && campaign.cta_mode === "test_checkout" ? (
                <CheckoutButton tier="full" label={`Test ${tier.name.toLowerCase()} checkout`} />
              ) : tier.primary ? (
                <p className="primary-offer-label">Primary validation offer</p>
              ) : (
                <p className="not-for-sale">No checkout in validation v1</p>
              )}
            </article>
          ))}
        </div>
        <p className="pricing-legal">{campaign.disclaimer.full}</p>
        {campaign.booking_url ? <BookingLink url={campaign.booking_url} /> : null}
      </section>

      <section className="checklist" id="checklist">
        <div className="shell checklist-inner">
          <div>
            <p className="eyebrow">Lower-commitment signal</p>
            <h2>{campaign.lead_magnet.headline}</h2>
          </div>
          <SignupForm
            buttonLabel={campaign.lead_magnet.button}
            deliveryNote={campaign.lead_magnet.delivery_note}
          />
        </div>
      </section>

      <footer className="site-footer shell">
        <div>
          <p className="brand-mark">{campaign.brand.name}</p>
          <p>{campaign.brand.colophon}</p>
        </div>
        <p className="footer-disclaimer">{campaign.disclaimer.full}</p>
        <Link href="/contact">Contact</Link>
      </footer>
    </main>
  );
}
