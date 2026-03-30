import type { Metadata } from "next";
import { NavBar } from "../components/nav";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexusdiag.com";

export const metadata: Metadata = {
  title: "Free Website Audit Chicago — Instant Performance & SEO Report",
  description: "Free website audit for Chicago businesses. See your performance score, Google Ads waste, ADA risk, and SEO gaps in 60 seconds. No sign-up required.",
  keywords: "website audit chicago, free website audit chicago, chicago seo audit, website performance audit chicago, chicago website checker",
  alternates: { canonical: `${BASE}/chicago-website-audit` },
  openGraph: {
    type: "website",
    title: "Free Website Audit for Chicago Businesses",
    description: "60-second audit: Performance · SEO · Accessibility · Security · AI Visibility. See exactly what your site is costing you.",
    url: `${BASE}/chicago-website-audit`,
    siteName: "Nexus",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Free Website Audit Chicago",
  description: "Free 5-pillar website audit for Chicago businesses covering performance, SEO, accessibility, security, and AI visibility.",
  provider: { "@type": "Organization", name: "Nexus", url: BASE },
  areaServed: { "@type": "City", name: "Chicago" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function ChicagoAuditPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(64px,10vw,112px) 24px clamp(48px,6vw,80px)", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 18 }}>CHICAGO WEBSITE AUDIT</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,6vw,68px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1.1, marginBottom: 22 }}>
          Free Website Audit<br />for Chicago Businesses
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(15px,2vw,18px)", color: "var(--text2)", lineHeight: 1.7, maxWidth: 620, margin: "0 auto 40px" }}>
          See your performance score, how much you're overpaying on Google Ads, your ADA litigation risk, and every SEO gap — in 60 seconds. No sign-up required.
        </p>
        <a href="/funnel" style={{ display: "inline-block", padding: "16px 40px", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", textDecoration: "none", borderRadius: 8, boxShadow: "0 0 30px rgba(232,52,26,0.35)" }}>
          RUN FREE AUDIT →
        </a>
      </section>

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3.5vw,34px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 32, textAlign: "center" }}>WHY CHICAGO BUSINESSES USE THIS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
          {[
            { heading: "Chicago Is a High-Competition Ad Market", body: "Chicago is one of the top 10 most competitive Google Ads markets in the US. Without an optimised landing page Quality Score, businesses routinely overpay 40–90% per click compared to competitors with faster sites." },
            { heading: "ADA Exposure Is Growing", body: "Illinois businesses have faced rising ADA website enforcement. Federal courts in the Northern District of Illinois process a significant volume of digital accessibility cases each year." },
            { heading: "B2B and Professional Services Dominate", body: "Chicago's economy is driven by professional services, finance, and B2B. These sectors have high-value leads — which makes conversion rate loss from slow load times especially costly." },
            { heading: "Local Pack Drives Inbound", body: "For any Chicago service business, the Google Maps local 3-pack drives a significant share of inbound calls and leads. Structured data, site speed, and review signals all affect your local pack ranking." },
          ].map(card => (
            <div key={card.heading} style={{ padding: 28, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--text)", letterSpacing: "0.04em", marginBottom: 12 }}>{card.heading}</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.65, margin: 0 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3vw,30px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 28, textAlign: "center" }}>WHAT THE AUDIT CHECKS</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { pillar: "Performance", detail: "Core Web Vitals (LCP, TBT, CLS), mobile speed, and a monthly Google Ads overspend estimate.", color: "#e8341a" },
            { pillar: "SEO", detail: "Meta tags, Open Graph, canonical URLs, structured data, robots.txt, and sitemap completeness.", color: "#f59e0b" },
            { pillar: "Accessibility", detail: "WCAG 2.1 AA: alt text, contrast ratios, keyboard navigation, form labels, and ARIA roles.", color: "#a78bfa" },
            { pillar: "Security", detail: "HTTPS, security headers (CSP, HSTS, X-Frame-Options), and vulnerable JavaScript libraries.", color: "#22d3ee" },
            { pillar: "AI Visibility", detail: "Schema completeness, content structure, question-format headings, and FAQ signal presence.", color: "#10b981" },
          ].map(row => (
            <div key={row.pillar} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "20px 24px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: row.color, background: row.color + "15", border: `1px solid ${row.color}30`, padding: "3px 10px", borderRadius: 4, flexShrink: 0, letterSpacing: "0.1em", marginTop: 2 }}>{row.pillar.toUpperCase()}</span>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>{row.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 100px", textAlign: "center" }}>
        <div style={{ padding: "48px 40px", borderRadius: 16, background: "rgba(232,52,26,0.05)", border: "1px solid rgba(232,52,26,0.2)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.16em", marginBottom: 12 }}>FREE · 60 SECONDS · NO SIGN-UP</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3.5vw,30px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 14 }}>SEE WHAT YOUR SITE IS COSTING YOU</h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.65, marginBottom: 28, maxWidth: 460, margin: "0 auto 28px" }}>
            Enter your URL and get a full 5-pillar report with a monthly revenue impact estimate in under a minute.
          </p>
          <a href="/funnel" style={{ display: "inline-block", padding: "15px 36px", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textDecoration: "none", borderRadius: 7, boxShadow: "0 0 24px rgba(232,52,26,0.3)" }}>
            RUN FREE AUDIT →
          </a>
        </div>
      </section>
    </main>
  );
}
