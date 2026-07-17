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

const RISK_CLASSES = ["Minimal", "Limited", "High-risk?", "Prohibited"] as const;
const HIGHLIGHT_CLASS = "High-risk?";

function AccentedHeadline({ text, accent }: { text: string; accent: string }) {
  const idx = text.indexOf(accent);
  if (idx === -1) return <h1>{text}</h1>;
  return (
    <h1>
      {text.slice(0, idx)}
      <em className="accent">{accent}</em>
      {text.slice(idx + accent.length)}
    </h1>
  );
}

export default function Home() {
  const campaign = getCampaign();
  const primaryTier = campaign.offer_tiers.find((tier) => tier.primary);
  if (!primaryTier || !isCheckoutTier(primaryTier.id)) throw new Error("primary checkout tier missing");

  return (
    <main>
      <Analytics />
      <header className="site-header shell">
        <Link href="/" className="brand-mark"><span className="brand-dot" aria-hidden />{campaign.brand.name}</Link>
        <div className="header-badges">
          <span className="test-badge"><span className="cohort-dot" aria-hidden />Now onboarding · First cohort</span>
          <span className="enforce-badge"><span className="pulse-dot" aria-hidden />Enforcement Aug 2026</span>
        </div>
      </header>

      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">{campaign.value_proposition.proof_line.replace(/\.$/, "")}</p>
          <AccentedHeadline text={campaign.value_proposition.headline} accent="before" />
          <p className="hero-body">{campaign.value_proposition.body}</p>
          <div className="risk-chips" role="list" aria-label="EU AI Act risk classes">
            {RISK_CLASSES.map((label) => (
              <span key={label} role="listitem" className={`chip ${label === HIGHLIGHT_CLASS ? "chip-hot" : ""}`}>
                {label}
              </span>
            ))}
          </div>
          <div className="hero-action">
            {campaign.cta_mode === "test_checkout" ? (
              <CheckoutButton tier={primaryTier.id} tierName={primaryTier.name} label="Get classified →" primary />
            ) : (
              <a href="#checklist" className="button button-primary">Join the checklist list</a>
            )}
            <p className="checkout-disclaimer">{campaign.disclaimer.short}</p>
          </div>
        </div>
        <aside className="deadline-card">
          <p className="eyebrow">From {formatTierPrice(primaryTier)} fixed</p>
          <ul className="offer-list">
            <li className="included">Risk classification</li>
            <li className="included">Next-step map</li>
            <li>Annex IV support</li>
            <li>Audit prep</li>
          </ul>
          <p className="offer-no-call">No sales call</p>
          <p className="offer-sub">Self-service · SaaS teams</p>
        </aside>
      </section>

      <div className="trust-row shell" aria-label="Offer guarantees">
        <span>Fixed fee</span>
        <span>Self-service</span>
        <span>No sales calls</span>
      </div>

      <section className="evidence-band">
        <div className="shell">
          <p className="eyebrow">Why this matters now</p>
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
                <CheckoutButton tier="full" tierName={tier.name} label={`Reserve ${tier.name.toLowerCase()}`} />
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
