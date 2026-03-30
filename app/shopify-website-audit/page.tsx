import type { Metadata } from "next";
import { NavBar } from "../components/nav";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexusdiag.com";

export const metadata: Metadata = {
  title: "Free Shopify Website Audit — Speed, SEO & Revenue Impact",
  description: "Free website audit built for Shopify stores. See your Core Web Vitals, Google Shopping Quality Score impact, ADA risk, and SEO gaps in 60 seconds. No sign-up.",
  keywords: "shopify website audit, free shopify audit, shopify speed test, shopify seo audit, shopify pagespeed, shopify core web vitals",
  alternates: { canonical: `${BASE}/shopify-website-audit` },
  openGraph: {
    type: "website",
    title: "Free Shopify Website Audit",
    description: "See your Shopify store's performance score, Google Shopping cost impact, ADA exposure, and SEO gaps. 60 seconds, no sign-up.",
    url: `${BASE}/shopify-website-audit`,
    siteName: "Nexus",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Free Shopify Website Audit",
  description: "Free 5-pillar website audit for Shopify stores covering performance, SEO, accessibility, security, and AI visibility.",
  provider: { "@type": "Organization", name: "Nexus", url: BASE },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const stats = [
  { value: "30–55", label: "typical PageSpeed score for default Shopify stores with a standard app stack" },
  { value: "60%+", label: "of mobile shoppers leave a Shopify store taking more than 3 seconds to load" },
  { value: "2.7×", label: "higher conversion rate for stores loading under 1 second vs 5 seconds" },
  { value: "6–12", label: "average number of apps installed on active Shopify stores — each adds load time" },
];

export default function ShopifyAuditPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(64px,10vw,112px) 24px clamp(48px,6vw,80px)", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 18 }}>SHOPIFY WEBSITE AUDIT</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,6vw,68px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1.1, marginBottom: 22 }}>
          Free Audit for<br />Shopify Stores
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(15px,2vw,18px)", color: "var(--text2)", lineHeight: 1.7, maxWidth: 620, margin: "0 auto 40px" }}>
          See exactly how your store's speed, Google Shopping Quality Score, ADA risk, and SEO gaps are costing you sales — in 60 seconds, no sign-up required.
        </p>
        <a href="/funnel" style={{ display: "inline-block", padding: "16px 40px", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", textDecoration: "none", borderRadius: 8, boxShadow: "0 0 30px rgba(232,52,26,0.35)" }}>
          AUDIT MY STORE →
        </a>
      </section>

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
          {stats.map(s => (
            <div key={s.value} style={{ padding: "28px 24px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px,4vw,38px)", color: "var(--accent)", letterSpacing: "0.02em", marginBottom: 10 }}>{s.value}</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.55, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3.5vw,34px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 32, textAlign: "center" }}>THE BIGGEST ISSUES ON SHOPIFY STORES</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
          {[
            { heading: "App Bloat", body: "Every app installed on your Shopify store that loads on the storefront adds JavaScript and HTTP requests. 6–12 apps can add 2–4 seconds to page load — the single biggest source of slow Shopify stores." },
            { heading: "Unoptimised Product Images", body: "Large product image files are almost always the LCP element on Shopify product pages. Uploading 3–5MB source images means slow LCP even after Shopify's automatic WebP conversion." },
            { heading: "Google Shopping CPCs", body: "Shopify product pages are direct landing pages for Google Shopping campaigns. A slow page reduces landing page Quality Score and increases your cost per click — you pay more for every sale." },
            { heading: "Accessibility Lawsuits Target Ecommerce", body: "US ecommerce stores are the most frequently targeted businesses in ADA accessibility lawsuits. Inaccessible checkout flows and unlabelled form fields are the most commonly cited failures." },
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
            { pillar: "Performance", detail: "Core Web Vitals (LCP, TBT, CLS), mobile speed, image weight, and estimated monthly revenue loss from slow load times.", color: "#e8341a" },
            { pillar: "SEO", detail: "Meta tags, canonical URLs, Product schema, robots.txt, and crawlability issues specific to Shopify's URL structure.", color: "#f59e0b" },
            { pillar: "Accessibility", detail: "WCAG 2.1 AA: alt text on product images, checkout form labels, keyboard navigation, and contrast ratios.", color: "#a78bfa" },
            { pillar: "Security", detail: "HTTPS across all pages, security headers, and vulnerable JavaScript libraries — including common Shopify app vulnerabilities.", color: "#22d3ee" },
            { pillar: "AI Visibility", detail: "Schema completeness (including Product schema), content structure, and AI citation readiness.", color: "#10b981" },
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
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3.5vw,30px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 14 }}>SEE WHAT YOUR STORE IS LOSING</h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.65, marginBottom: 28, maxWidth: 460, margin: "0 auto 28px" }}>
            Enter your Shopify store URL and get a full 5-pillar report with a monthly revenue impact estimate in under a minute.
          </p>
          <a href="/funnel" style={{ display: "inline-block", padding: "15px 36px", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textDecoration: "none", borderRadius: 7, boxShadow: "0 0 24px rgba(232,52,26,0.3)" }}>
            AUDIT MY STORE →
          </a>
        </div>
      </section>
    </main>
  );
}
