import type { Metadata } from "next";
import { articleList } from "../lib/articles";
import { NavBar } from "../components/nav";

export const metadata: Metadata = {
  title: "Blog — Website Performance, SEO & Revenue Insights | Nexus",
  description: "Expert guides on Core Web Vitals, ADA compliance, AI search visibility, and website security — written for business owners, not developers.",
  alternates: { canonical: "https://nexusdiag.com/blog" },
  openGraph: {
    type: "website",
    title: "Nexus Blog — Website Performance, SEO & Revenue Insights",
    description: "Practical guides on performance, SEO, accessibility, security, and AI search visibility for business owners.",
    url: "https://nexusdiag.com/blog",
    siteName: "Nexus",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Nexus Blog", description: "Practical guides on website performance, SEO, and AI visibility." },
};

const CATS = ["All", "Performance", "SEO", "Accessibility", "Security", "AI Visibility"];

export default function BlogIndex() {
  const featured = articleList[0];
  const rest = articleList.slice(1);

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <NavBar page="blog" />

      {/* Hero */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "rgba(232,52,26,0.02)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 48px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 14 }}>NEXUS // INSIGHTS</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,5vw,56px)", color: "var(--text)", letterSpacing: "0.04em", lineHeight: 1.05, marginBottom: 16 }}>
            WEBSITE REVENUE INSIGHTS
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "var(--text2)", maxWidth: 520, lineHeight: 1.7, marginBottom: 28 }}>
            Practical guides on performance, SEO, accessibility, security, and AI search — written for business owners, not developers.
          </p>
          {/* Category pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATS.map(cat => (
              <span key={cat} style={{
                fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em",
                padding: "5px 12px", borderRadius: 20, cursor: "default",
                color: cat === "All" ? "#fff" : "var(--muted)",
                background: cat === "All" ? "var(--accent)" : "var(--surface)",
                border: `1px solid ${cat === "All" ? "transparent" : "var(--border)"}`,
              }}>{cat.toUpperCase()}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 100px" }}>

        {/* Featured article */}
        <a href={`/blog/${featured.slug}`} style={{ textDecoration: "none", display: "block", marginBottom: 32 }}>
          <article className="blog-card" style={{
            padding: "36px 40px", borderRadius: 14, border: "1px solid var(--border)",
            background: "var(--surface)", cursor: "pointer",
            display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.14em", padding: "3px 9px", borderRadius: 4, color: "#e8341a", background: "rgba(232,52,26,0.1)", border: "1px solid rgba(232,52,26,0.2)" }}>FEATURED</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", padding: "3px 9px", borderRadius: 4, color: featured.categoryColor, background: featured.categoryColor + "15", border: `1px solid ${featured.categoryColor}30` }}>{featured.category.toUpperCase()}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)" }}>{featured.date} · {featured.readTime}</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3vw,30px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1.25, marginBottom: 14 }}>
                {featured.title}
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.75, margin: 0, maxWidth: 620 }}>
                {featured.description}
              </p>
            </div>
            <div style={{ flexShrink: 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--accent)" }}>→</span>
              </div>
            </div>
          </article>
        </a>

        {/* Article count */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em" }}>
            {articleList.length} ARTICLES
          </p>
        </div>

        {/* 2-col grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 12 }}>
          {rest.map(article => (
            <a key={article.slug} href={`/blog/${article.slug}`} style={{ textDecoration: "none", display: "block" }}>
              <article className="blog-card" style={{
                padding: "24px 28px", borderRadius: 12, border: "1px solid var(--border)",
                background: "var(--surface)", cursor: "pointer", height: "100%",
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 4, color: article.categoryColor, background: article.categoryColor + "15", border: `1px solid ${article.categoryColor}30` }}>
                    {article.category.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted2)" }}>{article.readTime}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(15px,2vw,18px)", color: "var(--text)", letterSpacing: "0.02em", lineHeight: 1.35, marginBottom: 10 }}>
                    {article.title}
                  </h2>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>
                    {article.description}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted2)" }}>{article.date}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)" }}>READ →</span>
                </div>
              </article>
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 72, padding: "40px 44px", borderRadius: 16, background: "rgba(232,52,26,0.04)", border: "1px solid rgba(232,52,26,0.18)", display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center" }}>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.16em", marginBottom: 10 }}>FREE 60-SECOND AUDIT</p>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3vw,28px)", color: "var(--text)", marginBottom: 10, letterSpacing: "0.04em" }}>
              SEE HOW YOUR SITE SCORES
            </h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.65, margin: 0 }}>
              5-pillar audit: Performance · SEO · Accessibility · Security · AI Visibility — with a revenue impact estimate.
            </p>
          </div>
          <a href="/funnel" style={{
            display: "inline-block", padding: "14px 28px", background: "var(--accent)", color: "#fff",
            fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textDecoration: "none",
            borderRadius: 8, boxShadow: "0 0 24px rgba(232,52,26,0.3)", whiteSpace: "nowrap",
          }}>
            RUN FREE AUDIT →
          </a>
        </div>

      </div>
    </main>
  );
}
