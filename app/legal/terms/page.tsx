import React from "react";

const LAST_UPDATED = "March 2026";
const COMPANY = "Nexus Diagnostics";
const EMAIL = "legal@nexus-diagnostics.com";

export const metadata = { title: "Terms of Service — Nexus" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", letterSpacing: "0.06em", marginBottom: 12 }}>{title}</h2>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

export default function TermsOfService() {
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
          <a href="/legal/refund" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "none" }}>Refunds</a>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.16em", marginBottom: 10 }}>LEGAL</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,6vw,56px)", letterSpacing: "0.04em", lineHeight: 1, marginBottom: 12 }}>TERMS OF SERVICE</h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}>Last updated: {LAST_UPDATED}</p>
        </div>
        <div style={{ height: 1, background: "var(--border)", marginBottom: 36 }} />

        <Section title="1. Agreement to Terms">
          <p>By accessing or using {COMPANY} (&ldquo;Nexus&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) services, you agree to be bound by these Terms of Service. If you do not agree, do not use our service. These terms apply to all users, including free-tier users and paid subscribers.</p>
        </Section>

        <Section title="2. Description of Service">
          <p style={{ marginBottom: 8 }}>Nexus provides automated website diagnostic and monitoring services including:</p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>4-pillar analysis of Performance, SEO, Accessibility, and Security via Google PageSpeed Insights API</li>
            <li>Competitor URL tracking and automated re-scanning (paid tiers)</li>
            <li>Email and webhook alerts for score changes (paid tiers); SMS alerts are in development</li>
            <li>AI-generated developer action plans and recovery blueprints</li>
            <li>White-label PDF reports (Scale plan — currently in development)</li>
          </ul>
          <p style={{ marginTop: 10 }}>We do not guarantee specific performance outcomes or revenue improvements. Results vary by site, industry, and implementation.</p>
        </Section>

        <Section title="3. Account Registration">
          <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials. You are responsible for all activity that occurs under your account. Notify us immediately at <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{EMAIL}</a> if you suspect unauthorised access.</p>
        </Section>

        <Section title="4. Subscriptions and Billing">
          <p style={{ marginBottom: 8 }}><strong style={{ color: "var(--text)" }}>Free tier:</strong> Available to all registered users. Limited to manual audits as specified on the pricing page. No credit card required.</p>
          <p style={{ marginBottom: 8 }}><strong style={{ color: "var(--text)" }}>Paid plans:</strong> Pulse (£49/mo) and Scale (£149/mo) are billed monthly or annually through Lemon Squeezy. Subscriptions renew automatically unless cancelled.</p>
          <p style={{ marginBottom: 8 }}><strong style={{ color: "var(--text)" }}>Price changes:</strong> We will notify you at least 30 days before any price increase. Continued use after the effective date constitutes acceptance.</p>
          <p><strong style={{ color: "var(--text)" }}>Taxes:</strong> Prices are exclusive of applicable taxes. You are responsible for any sales tax, VAT, or other taxes applicable in your jurisdiction.</p>
        </Section>

        <Section title="5. Cancellation and Refunds">
          <p>You may cancel your subscription at any time via the Lemon Squeezy customer portal. Cancellation takes effect at the end of the current billing period. You retain access until then. For refunds, see our <a href="/legal/refund" style={{ color: "var(--accent)", textDecoration: "none" }}>Refund Policy</a>.</p>
        </Section>

        <Section title="6. Acceptable Use">
          <p style={{ marginBottom: 8 }}>You agree not to:</p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Submit URLs for domains you do not own or have authorisation to audit</li>
            <li>Use the service to scrape, spam, or harm third-party sites</li>
            <li>Attempt to reverse-engineer, decompile, or hack any part of the service</li>
            <li>Resell or sublicense access to the service (except as expressly permitted under the Scale agency licence)</li>
            <li>Use the service to violate any applicable law or regulation</li>
            <li>Create multiple free accounts to circumvent usage limits</li>
          </ul>
        </Section>

        <Section title="7. Intellectual Property">
          <p>All content, trademarks, software, and technology associated with Nexus are our exclusive property. You are granted a limited, non-exclusive, non-transferable licence to use the service for its intended purpose. Report data generated for your websites remains yours.</p>
          <p style={{ marginTop: 10 }}>Scale plan holders receive a limited agency licence to share white-label reports with their clients. You may not claim ownership of the underlying Nexus platform or methodology.</p>
        </Section>

        <Section title="8. Disclaimer of Warranties">
          <p>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES. DIAGNOSTIC SCORES AND REVENUE ESTIMATES ARE INDICATIVE ONLY AND NOT GUARANTEES OF SPECIFIC OUTCOMES.</p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 3 MONTHS PRECEDING THE CLAIM.</p>
        </Section>

        <Section title="10. Indemnification">
          <p>You agree to indemnify and hold harmless {COMPANY}, its officers, directors, and employees from any claims, damages, or expenses arising from your use of the service, your violation of these terms, or your violation of any third-party rights.</p>
        </Section>

        <Section title="11. Termination">
          <p>We may suspend or terminate your account at our discretion, with or without notice, if you violate these terms or engage in behaviour that we determine is harmful to the service or other users. You may delete your account at any time.</p>
        </Section>

        <Section title="12. Governing Law">
          <p>These terms are governed by and construed in accordance with applicable law. Any disputes shall be resolved through binding arbitration or in a court of competent jurisdiction, as applicable.</p>
        </Section>

        <Section title="13. Changes to Terms">
          <p>We may update these Terms from time to time. We will notify you via email of material changes. Continued use after the effective date constitutes acceptance of the updated terms.</p>
        </Section>

        <Section title="14. Contact">
          <p>Legal enquiries: <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{EMAIL}</a></p>
        </Section>

        <div style={{ height: 1, background: "var(--border)", marginTop: 40, marginBottom: 24 }} />
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/legal/privacy" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "underline" }}>Privacy Policy</a>
          <a href="/legal/refund" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "underline" }}>Refund Policy</a>
        </div>
      </div>
    </main>
  );
}