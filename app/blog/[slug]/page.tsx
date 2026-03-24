import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticle, articleList } from "../../lib/articles";
import { NavBar } from "../../components/nav";

interface Props { params: Promise<{ slug: string }> }

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexusdiag.com";

export function generateStaticParams() {
  return articleList.map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords.join(", "),
    alternates: { canonical: `${BASE}/blog/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: `${BASE}/blog/${article.slug}`,
      siteName: "Nexus",
      publishedTime: article.isoDate,
      authors: ["Nexus"],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.isoDate,
    dateModified: article.isoDate,
    author: { "@type": "Organization", name: "Nexus", url: BASE },
    publisher: { "@type": "Organization", name: "Nexus", url: BASE },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/blog/${article.slug}` },
    keywords: article.keywords.join(", "),
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <NavBar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "56px 24px 100px" }}>

        {/* Back link */}
        <a href="/blog" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 36 }}>
          ← BACK TO BLOG
        </a>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
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
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,40px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1.2, marginBottom: 18 }}>
            {article.title}
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "var(--text2)", lineHeight: 1.7 }}>
            {article.description}
          </p>
        </div>

        <div style={{ height: 1, background: "var(--border)", marginBottom: 48 }} />

        {/* Article body */}
        <div
          className="article-prose"
          dangerouslySetInnerHTML={{ __html: article.html }}
          style={{ color: "var(--text2)" }}
        />

        <div style={{ height: 1, background: "var(--border)", margin: "56px 0" }} />

        {/* CTA */}
        <div style={{ padding: "36px", borderRadius: 14, background: "rgba(232,52,26,0.05)", border: "1px solid rgba(232,52,26,0.2)", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", marginBottom: 10 }}>FREE 60-SECOND AUDIT</p>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", marginBottom: 10, letterSpacing: "0.04em" }}>
            SEE HOW YOUR SITE SCORES ACROSS ALL 5 PILLARS
          </h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", marginBottom: 24, lineHeight: 1.6, maxWidth: 480, margin: "0 auto 24px" }}>
            Performance · SEO · Accessibility · Security · AI Visibility — with a revenue impact estimate. No sign-up required.
          </p>
          <a href="/funnel" style={{
            display: "inline-block", padding: "13px 32px", background: "var(--accent)", color: "#fff",
            fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textDecoration: "none",
            borderRadius: 7, boxShadow: "0 0 20px rgba(232,52,26,0.3)",
          }}>
            RUN FREE AUDIT →
          </a>
        </div>

        {/* Related articles */}
        <div style={{ marginTop: 64 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.14em", marginBottom: 20 }}>MORE FROM THE BLOG</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {articleList
              .filter(a => a.slug !== article.slug)
              .slice(0, 3)
              .map(related => (
                <a key={related.slug} href={`/blog/${related.slug}`} style={{ textDecoration: "none", padding: "16px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: related.categoryColor, marginRight: 10, letterSpacing: "0.1em" }}>{related.category.toUpperCase()}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)" }}>{related.title}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>→</span>
                </a>
              ))}
          </div>
        </div>

      </div>
    </main>
  );
}
