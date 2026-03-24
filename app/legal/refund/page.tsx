import React from "react";

const LAST_UPDATED = "March 2026";
const EMAIL = "billing@nexusdiag.com";

export const metadata = { title: "Refund Policy — Nexus" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", letterSpacing: "0.06em", marginBottom: 12 }}>{title}</h2>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

export default function RefundPolicy() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", position: "relative", zIndex: 10 }}>
      <nav style={{ maxWidth: 800, margin: "0 auto", padding: "18px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <svg width={18} height={18} viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)", letterSpacing: "0.1em" }}>NEXUS</span>
        </a>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="/legal/privacy" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "none" }}>Privacy</a>
          <a href="/legal/terms" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "none" }}>Terms</a>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.16em", marginBottom: 10 }}>LEGAL</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,6vw,56px)", letterSpacing: "0.04em", lineHeight: 1, marginBottom: 12 }}>REFUND POLICY</h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}>Last updated: {LAST_UPDATED}</p>
        </div>
        <div style={{ height: 1, background: "var(--border)", marginBottom: 36 }} />

        {/* TL;DR box */}
        <div style={{ padding: "18px 20px", borderRadius: 12, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.2)", marginBottom: 36 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa", letterSpacing: "0.12em", marginBottom: 8 }}>TL;DR</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>
            New subscribers can request a full refund within <strong>7 days</strong> of their first payment, no questions asked. After 7 days, we handle refund requests case-by-case. Email <a href={`mailto:${EMAIL}`} style={{ color: "#a78bfa", textDecoration: "none" }}>{EMAIL}</a>.
          </p>
        </div>

        <Section title="1. Free Tier">
          <p>The free tier of Nexus costs nothing and there is nothing to refund. You may delete your account at any time with no financial obligation.</p>
        </Section>

        <Section title="2. New Subscriber Guarantee (7-Day Refund)">
          <p>If you subscribe to Nexus Pulse or Nexus Scale and are not satisfied for any reason, you may request a full refund within <strong style={{ color: "var(--text)" }}>7 calendar days</strong> of your initial payment.</p>
          <p style={{ marginTop: 10 }}>To claim: email <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{EMAIL}</a> with your account email and the subject line &ldquo;Refund Request&rdquo;. No explanation required. We will process the refund within 5 business days via the original payment method.</p>
        </Section>

        <Section title="3. Renewals and Ongoing Subscriptions">
          <p style={{ marginBottom: 8 }}>After the 7-day guarantee window, subscriptions are generally non-refundable. However, we will issue a refund or credit in the following circumstances:</p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>You were charged due to a system error or technical fault on our part</li>
            <li>The service was unavailable for more than 72 continuous hours in a given billing month</li>
            <li>You did not receive the features described for your plan</li>
          </ul>
          <p style={{ marginTop: 10 }}>Refund requests for renewals must be submitted within 14 days of the charge. We evaluate these requests at our discretion.</p>
        </Section>

        <Section title="4. Annual Subscriptions">
          <p>Annual subscribers are eligible for the 7-day new subscriber guarantee. After 7 days, annual subscriptions may receive a pro-rated refund for unused months if you cancel, evaluated on a case-by-case basis. Contact <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{EMAIL}</a> to request.</p>
        </Section>

        <Section title="5. How to Cancel (Without Refund)">
          <p>To stop future charges without requesting a refund, log into your account and cancel via the Lemon Squeezy customer portal. You&apos;ll retain access until the end of the paid period. No data is lost immediately upon cancellation.</p>
        </Section>

        <Section title="6. Chargebacks">
          <p>We ask that you contact us before initiating a chargeback. Chargebacks filed without prior contact may result in account suspension. We are committed to resolving billing disputes quickly and fairly.</p>
        </Section>

        <Section title="7. Contact">
          <p>Billing disputes and refund requests: <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{EMAIL}</a></p>
          <p style={{ marginTop: 6 }}>We aim to respond within 1 business day.</p>
        </Section>

        <div style={{ height: 1, background: "var(--border)", marginTop: 40, marginBottom: 24 }} />
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/legal/privacy" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "underline" }}>Privacy Policy</a>
          <a href="/legal/terms" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "underline" }}>Terms of Service</a>
        </div>
      </div>
    </main>
  );
}