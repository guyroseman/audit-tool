import React from "react";

const LAST_UPDATED = "March 2026";
const COMPANY = "Nexus Diagnostics";
const EMAIL = "privacy@nexus-diagnostics.com";
const SITE = "nexus-diagnostics.com";

export const metadata = { title: "Privacy Policy — Nexus" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", letterSpacing: "0.06em", marginBottom: 12 }}>{title}</h2>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
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
          <a href="/legal/terms" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "none" }}>Terms</a>
          <a href="/legal/refund" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "none" }}>Refunds</a>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.16em", marginBottom: 10 }}>LEGAL</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,6vw,56px)", letterSpacing: "0.04em", lineHeight: 1, marginBottom: 12 }}>PRIVACY POLICY</h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}>Last updated: {LAST_UPDATED}</p>
        </div>

        <div style={{ height: 1, background: "var(--border)", marginBottom: 36 }} />

        <Section title="1. Who We Are">
          <p>This Privacy Policy applies to {COMPANY} (&ldquo;Nexus&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), the operator of {SITE} and related services. We provide automated website diagnostic and monitoring services.</p>
          <p style={{ marginTop: 10 }}>For privacy-related questions, contact us at: <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{EMAIL}</a></p>
        </Section>

        <Section title="2. Information We Collect">
          <p style={{ marginBottom: 10 }}>We collect the following categories of information:</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "var(--text)" }}>Account information:</strong> Email address, name, and password when you create an account.</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "var(--text)" }}>Payment information:</strong> Billing details are processed by Lemon Squeezy. We do not store your card number or full payment details.</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "var(--text)" }}>URLs you submit:</strong> Website URLs you enter for auditing are processed through the Google PageSpeed Insights API and stored to generate your reports.</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "var(--text)" }}>Usage data:</strong> Pages visited, features used, audit history, and interaction logs for service improvement.</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "var(--text)" }}>Device & technical data:</strong> IP address, browser type, operating system, and referrer URL collected automatically.</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "var(--text)" }}>Communications:</strong> Emails, support messages, or phone numbers you voluntarily provide.</p>
        </Section>

        <Section title="3. How We Use Your Information">
          <p style={{ marginBottom: 8 }}>We use collected information to:</p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Provide, operate, and improve our diagnostic and monitoring services</li>
            <li>Process subscription payments and manage your account</li>
            <li>Send audit reports, alerts, and service notifications</li>
            <li>Respond to your support requests and enquiries</li>
            <li>Detect and prevent fraudulent or abusive activity</li>
            <li>Comply with legal obligations</li>
            <li>Send marketing communications (only with your consent; you may opt out at any time)</li>
          </ul>
        </Section>

        <Section title="4. Third-Party Services">
          <p style={{ marginBottom: 8 }}>We share data with the following third parties to operate our service:</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "var(--text)" }}>Supabase:</strong> Authentication and database hosting. Your account data is stored securely on Supabase infrastructure.</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "var(--text)" }}>Lemon Squeezy:</strong> Payment processing and subscription management. Subject to their Privacy Policy.</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "var(--text)" }}>Google PageSpeed Insights API:</strong> URLs you submit are sent to Google for performance analysis. Subject to Google&apos;s Privacy Policy.</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: "var(--text)" }}>Vercel:</strong> Hosting and deployment. Infrastructure subject to Vercel&apos;s privacy terms.</p>
          <p style={{ marginTop: 10 }}>We do not sell your personal data to any third party.</p>
        </Section>

        <Section title="5. Cookies">
          <p>We use cookies and similar technologies for authentication sessions, user preferences, and analytics. You may disable cookies in your browser settings, but this may affect your ability to log in.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>We retain your personal data for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymise your data within 30 days, except where we are required to retain it for legal or financial compliance purposes.</p>
        </Section>

        <Section title="7. Your Rights">
          <p style={{ marginBottom: 8 }}>Depending on your jurisdiction, you may have the following rights:</p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li><strong style={{ color: "var(--text)" }}>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong style={{ color: "var(--text)" }}>Rectification:</strong> Ask us to correct inaccurate data.</li>
            <li><strong style={{ color: "var(--text)" }}>Erasure:</strong> Request deletion of your personal data.</li>
            <li><strong style={{ color: "var(--text)" }}>Portability:</strong> Receive your data in a machine-readable format.</li>
            <li><strong style={{ color: "var(--text)" }}>Objection:</strong> Object to processing for marketing purposes at any time.</li>
          </ul>
          <p style={{ marginTop: 10 }}>To exercise any of these rights, email <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{EMAIL}</a>.</p>
        </Section>

        <Section title="8. Data Security">
          <p>We implement industry-standard security measures including HTTPS encryption, hashed passwords, and access controls. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.</p>
        </Section>

        <Section title="9. Children">
          <p>Our services are not directed to children under 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, contact us immediately.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on our site. Your continued use of the service after changes constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="11. Contact">
          <p>Questions about this policy: <a href={`mailto:${EMAIL}`} style={{ color: "var(--accent)", textDecoration: "none" }}>{EMAIL}</a></p>
        </Section>

        <div style={{ height: 1, background: "var(--border)", marginTop: 40, marginBottom: 24 }} />
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/legal/terms" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "underline" }}>Terms of Service</a>
          <a href="/legal/refund" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "underline" }}>Refund Policy</a>
        </div>
      </div>
    </main>
  );
}