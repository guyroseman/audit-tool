import type { Metadata } from "next";
import { NavBar } from "../components/nav";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexusdiag.com";

export const metadata: Metadata = {
  title: "Free Ecommerce Website Audit — Speed, SEO & Revenue Impact",
  description: "Free website audit built for ecommerce. See your Core Web Vitals, conversion rate impact, ADA risk, Google Shopping eligibility, and SEO gaps in 60 seconds.",
  keywords: "ecommerce website audit, free ecommerce audit, shopify audit, woocommerce audit, ecommerce seo audit, ecommerce performance audit",
  alternates: { canonical: `${BASE}/ecommerce-website-audit` },
  openGraph: {
    type: "website",
    title: "Free Ecommerce Website Audit",
    description: "See your performance score, conversion rate impact, ADA exposure, and SEO gaps. Built for online stores — 60 seconds, no sign-up.",
    url: `${BASE}/ecommerce-website-audit`,
    siteName: "Nexus",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Free Ecommerce Website Audit",
  description: "Free 5-pillar website audit for ecommerce businesses covering performance, SEO, accessibility, security, and AI visibility.",
  provider: { "@type": "Organization", name: "Nexus", url: BASE },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const stats = [
  { value: "53%", label: "of mobile shoppers leave a page taking more than 3 seconds to load" },
  { value: "£2,400", label: "average monthly Google Ads overspend for ecommerce sites scoring below 50/100" },
  { value: "2.7×", label: "higher conversion rate for sites loading in under 1 second vs 5 seconds" },
  { value: "4,000+", label: "ADA accessibility lawsuits filed against ecommerce stores annually in the US" },
];

export default function EcommerceAuditPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(64px,10vw,112px) 24px clamp(48px,6vw,80px)", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 18 }}>
          ECOMMERCE WEBSITE AUDIT
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,6vw,68px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1.1, marginBottom: 22 }}>
          Free Website Audit<br />for Online Stores
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(15px,2vw,18px)", color: "var(--text2)", lineHeight: 1.7, maxWidth: 620, margin: "0 auto 40px" }}>
          See exactly how much your store's speed, SEO gaps, and accessibility failures are costing you
          in lost sales and ad overspend — in 60 seconds, no sign-up required.
        </p>
        <a href="/funnel" style={{
          display: "inline-block", padding: "16px 40px",
          background: "var(--accent)", color: "#fff",
          fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em",
          textDecoration: "none", borderRadius: 8,
          boxShadow: "0 0 30px rgba(232,52,26,0.35)",
        }}>
          AUDIT MY STORE →
        </a>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
          {stats.map(s => (
            <div key={s.value} style={{ padding: "28px 24px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,40px)", color: "var(--accent)", letterSpacing: "0.02em", marginBottom: 10 }}>{s.value}</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.55, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ecommerce-specific issues */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3.5vw,34px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 32, textAlign: "center" }}>
          WHAT HURTS ECOMMERCE STORES MOST
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
          {[
            { heading: "Product Image Weight", body: "Large, unoptimised product images are the single biggest cause of slow load times on ecommerce sites. A product gallery page with 12 JPEGs can load 8–15 seconds without optimisation. Each second costs conversions." },
            { heading: "Google Shopping Quality Score", body: "Google Shopping campaigns are also affected by landing page quality. Slow product pages mean higher CPCs and lower impression share — you're bidding against yourself by not fixing the underlying speed." },
            { heading: "Cart and Checkout Accessibility", body: "ADA lawsuits against ecommerce stores frequently cite inaccessible checkout flows — unlabelled form fields, no keyboard navigation in address forms, and modals that trap keyboard focus." },
            { heading: "Missing Product Schema", body: "Product pages without structured data (Product schema with price, availability, and reviews) miss out on Google Shopping rich results, review stars in organic results, and AI search citations." },
          ].map(card => (
            <div key={card.heading} style={{ padding: 28, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--text)", letterSpacing: "0.04em", marginBottom: 12 }}>{card.heading}</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.65, margin: 0 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What the audit checks */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3vw,30px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 28, textAlign: "center" }}>
          WHAT THE AUDIT CHECKS
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { pillar: "Performance", detail: "Core Web Vitals (LCP, TBT, CLS), mobile page speed, image optimisation gaps, and estimated monthly revenue loss from slow load times.", color: "#e8341a" },
            { pillar: "SEO", detail: "Meta tags, canonical URLs, structured data (including Product schema), robots.txt, and crawlability.", color: "#f59e0b" },
            { pillar: "Accessibility", detail: "WCAG 2.1 AA: alt text on product images, form field labels, checkout keyboard navigation, and contrast ratios.", color: "#a78bfa" },
            { pillar: "Security", detail: "HTTPS on all pages (especially checkout), security headers, and vulnerable JavaScript libraries.", color: "#22d3ee" },
            { pillar: "AI Visibility", detail: "Schema completeness, FAQ signals, question-format content, and AI citability score.", color: "#10b981" },
          ].map(row => (
            <div key={row.pillar} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "20px 24px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: row.color, background: row.color + "15", border: `1px solid ${row.color}30`, padding: "3px 10px", borderRadius: 4, flexShrink: 0, letterSpacing: "0.1em", marginTop: 2 }}>{row.pillar.toUpperCase()}</span>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>{row.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 100px", textAlign: "center" }}>
        <div style={{ padding: "48px 40px", borderRadius: 16, background: "rgba(232,52,26,0.05)", border: "1px solid rgba(232,52,26,0.2)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.16em", marginBottom: 12 }}>FREE · 60 SECONDS · NO SIGN-UP</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3.5vw,30px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 14 }}>
            SEE WHAT YOUR STORE IS LOSING
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.65, marginBottom: 28, maxWidth: 460, margin: "0 auto 28px" }}>
            Enter your store URL and get a full 5-pillar report with a monthly revenue impact estimate in under a minute.
          </p>
          <a href="/funnel" style={{
            display: "inline-block", padding: "15px 36px",
            background: "var(--accent)", color: "#fff",
            fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em",
            textDecoration: "none", borderRadius: 7,
            boxShadow: "0 0 24px rgba(232,52,26,0.3)",
          }}>
            AUDIT MY STORE →
          </a>
        </div>
      </section>
    </main>
  );
}
