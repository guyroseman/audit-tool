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
    description: "Expert guides on Core Web Vitals, ADA compliance, AI search visibility, and website security for business owners.",
    url: "https://nexusdiag.com/blog",
    siteName: "Nexus",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus Blog",
    description: "Expert guides on Core Web Vitals, ADA compliance, AI search visibility, and website security.",
  },
};

export default function BlogIndex() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <NavBar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px 100px" }}>

        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 12 }}>NEXUS // BLOG</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,5vw,48px)", color: "var(--text)", letterSpacing: "0.04em", lineHeight: 1.1, marginBottom: 16 }}>
            WEBSITE REVENUE INSIGHTS
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--text2)", maxWidth: 560, lineHeight: 1.7 }}>
            Practical guides on performance, SEO, accessibility, security, and AI search visibility — written for business owners, not developers.
          </p>
        </div>

        {/* Article grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {articleList.map((article) => (
            <a
              key={article.slug}
              href={`/blog/${article.slug}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <article className="blog-card" style={{ padding: "28px 32px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", transition: "border-color 0.15s, background 0.15s", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em",
                        padding: "3px 9px", borderRadius: 4,
                        color: article.categoryColor,
                        background: article.categoryColor + "15",
                        border: `1px solid ${article.categoryColor}30`,
                      }}>
                        {article.category.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)" }}>{article.date}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)" }}>· {article.readTime}</span>
                    </div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(16px,2.5vw,22px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1.3, marginBottom: 10 }}>
                      {article.title}
                    </h2>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>
                      {article.description}
                    </p>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", whiteSpace: "nowrap", paddingTop: 4 }}>
                    READ →
                  </span>
                </div>
              </article>
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 64, padding: "32px 36px", borderRadius: 14, background: "rgba(232,52,26,0.05)", border: "1px solid rgba(232,52,26,0.2)", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 10 }}>FREE 60-SECOND AUDIT</p>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--text)", marginBottom: 10, letterSpacing: "0.04em" }}>SEE HOW YOUR SITE SCORES</h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", marginBottom: 20, lineHeight: 1.6 }}>
            Run a free 5-pillar audit across performance, SEO, accessibility, security, and AI visibility — with a revenue impact estimate.
          </p>
          <a href="/funnel" style={{
            display: "inline-block", padding: "12px 28px", background: "var(--accent)", color: "#fff",
            fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textDecoration: "none",
            borderRadius: 7, boxShadow: "0 0 20px rgba(232,52,26,0.3)",
          }}>
            RUN FREE AUDIT →
          </a>
        </div>

      </div>
    </main>
  );
}
