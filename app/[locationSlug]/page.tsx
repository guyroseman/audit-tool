import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NavBar } from "../components/nav";
import {
  allSeoSlugs,
  cities,
  verticals,
  competitors,
  resolveSeoPage,
  getCityCards,
  type City,
  type Vertical,
  type Competitor,
} from "../lib/seo-pages";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nexusdiag.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return allSeoSlugs.map(locationSlug => ({ locationSlug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locationSlug: string }> }
): Promise<Metadata> {
  const { locationSlug } = await params;
  const page = resolveSeoPage(locationSlug);
  if (!page) return {};
  const url = `${BASE}/${locationSlug}`;

  if (page.kind === "city") {
    const c = page.city;
    return {
      title: `Free Website Audit ${c.name} — Instant Performance & SEO Report`,
      description: `Free website audit for ${c.name} businesses. See your performance score, Google Ads waste, accessibility risk, and SEO gaps in 60 seconds. No sign-up required.`,
      keywords: `website audit ${c.name.toLowerCase()}, free website audit ${c.name.toLowerCase()}, ${c.name.toLowerCase()} seo audit, ${c.name.toLowerCase()} website performance, ${c.name.toLowerCase()} website checker`,
      alternates: { canonical: url },
      openGraph: {
        type: "website",
        title: `Free Website Audit for ${c.name} Businesses`,
        description: "60-second audit: Performance · SEO · Accessibility · Security · AI Visibility. See exactly what your site is costing you.",
        url,
        siteName: "Nexus",
      },
    };
  }
  if (page.kind === "vertical") {
    const v = page.vertical;
    return {
      title: `Free ${v.name} Website Audit — Speed, SEO & Revenue Impact`,
      description: `Free website audit built for ${v.name} ${v.noun}s. See your Core Web Vitals, ad spend impact, ADA risk, and SEO gaps in 60 seconds. No sign-up.`,
      keywords: `${v.slug} website audit, ${v.slug} seo audit, ${v.slug} pagespeed, ${v.slug} performance audit`,
      alternates: { canonical: url },
      openGraph: {
        type: "website",
        title: `Free ${v.name} Website Audit`,
        description: `5-pillar audit built for ${v.name} ${v.noun}s. 60 seconds, no sign-up.`,
        url,
        siteName: "Nexus",
      },
    };
  }
  // competitor
  const k = page.competitor;
  return {
    title: `Nexus vs ${k.name} — Which Website Audit Tool Should You Use?`,
    description: `Comparing Nexus and ${k.name}: features, scope, pricing, and what each tool actually tells you about your website's revenue impact.`,
    keywords: `nexus vs ${k.slug}, ${k.slug} alternative, ${k.slug} comparison, website audit tool comparison`,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `Nexus vs ${k.name}`,
      description: k.tagline,
      url,
      siteName: "Nexus",
    },
  };
}

export default async function SeoLandingPage(
  { params }: { params: Promise<{ locationSlug: string }> }
) {
  const { locationSlug } = await params;
  const page = resolveSeoPage(locationSlug);
  if (!page) notFound();

  if (page.kind === "city") return <CityPage city={page.city} slug={locationSlug} />;
  if (page.kind === "vertical") return <VerticalPage vertical={page.vertical} slug={locationSlug} />;
  return <CompetitorPage competitor={page.competitor} slug={locationSlug} />;
}

// ─── Shared UI ───────────────────────────────────────────────────────────────

function HeroCta({ label = "RUN FREE AUDIT →" }: { label?: string }) {
  return (
    <a href="/funnel" style={{
      display: "inline-block", padding: "16px 40px",
      background: "var(--accent)", color: "#fff",
      fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em",
      textDecoration: "none", borderRadius: 8,
      boxShadow: "0 0 30px rgba(232,52,26,0.35)",
    }}>{label}</a>
  );
}

function PillarList({ items }: { items: { pillar: string; detail: string; color: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map(row => (
        <div key={row.pillar} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "20px 24px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: row.color, background: row.color + "15", border: `1px solid ${row.color}30`, padding: "3px 10px", borderRadius: 4, flexShrink: 0, letterSpacing: "0.1em", marginTop: 2 }}>{row.pillar.toUpperCase()}</span>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>{row.detail}</p>
        </div>
      ))}
    </div>
  );
}

function BottomCta({ heading, body, label = "RUN FREE AUDIT →" }: { heading: string; body: string; label?: string }) {
  return (
    <section style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 100px", textAlign: "center" }}>
      <div style={{ padding: "48px 40px", borderRadius: 16, background: "rgba(232,52,26,0.05)", border: "1px solid rgba(232,52,26,0.2)" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.16em", marginBottom: 12 }}>FREE · 60 SECONDS · NO SIGN-UP</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3.5vw,30px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 14 }}>{heading}</h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.65, marginBottom: 28, maxWidth: 460, margin: "0 auto 28px" }}>{body}</p>
        <a href="/funnel" style={{
          display: "inline-block", padding: "15px 36px",
          background: "var(--accent)", color: "#fff",
          fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em",
          textDecoration: "none", borderRadius: 7,
          boxShadow: "0 0 24px rgba(232,52,26,0.3)",
        }}>{label}</a>
      </div>
    </section>
  );
}

function RelatedLinks({ heading, links }: { heading: string; links: { href: string; label: string }[] }) {
  if (!links.length) return null;
  return (
    <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 64px" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 14, textAlign: "center" }}>{heading}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {links.map(l => (
          <a key={l.href} href={l.href} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textDecoration: "none", border: "1px solid var(--border)", padding: "8px 14px", borderRadius: 6, background: "var(--surface)" }}>{l.label}</a>
        ))}
      </div>
    </section>
  );
}

// ─── Standard pillar list (used by city + vertical) ─────────────────────────

const STANDARD_PILLARS = [
  { pillar: "Performance", detail: "Core Web Vitals (LCP, TBT, CLS), mobile speed, server response time, and a monthly Google Ads overspend estimate.", color: "#e8341a" },
  { pillar: "SEO", detail: "Meta tags, Open Graph, canonical URLs, structured data, robots.txt, and sitemap completeness.", color: "#f59e0b" },
  { pillar: "Accessibility", detail: "WCAG 2.1 AA compliance: alt text, contrast ratios, keyboard navigation, form labels, and ARIA roles.", color: "#a78bfa" },
  { pillar: "Security", detail: "HTTPS, security headers (CSP, HSTS, X-Frame-Options), and vulnerable JavaScript libraries.", color: "#22d3ee" },
  { pillar: "AI Visibility", detail: "Schema markup completeness, content structure, question-format headings, and FAQ signal presence.", color: "#10b981" },
];

// ─── City page ───────────────────────────────────────────────────────────────

function CityPage({ city, slug }: { city: City; slug: string }) {
  const cards = getCityCards(city);
  const url = `${BASE}/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Free Website Audit ${city.name}`,
    description: `Free 5-pillar website audit for ${city.name} businesses covering performance, SEO, accessibility, security, and AI visibility.`,
    provider: { "@type": "Organization", name: "Nexus", url: BASE },
    areaServed: { "@type": "City", name: city.name },
    url,
    offers: { "@type": "Offer", price: "0", priceCurrency: city.currency },
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(64px,10vw,112px) 24px clamp(48px,6vw,80px)", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 18 }}>
          {city.name.toUpperCase()} WEBSITE AUDIT
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,6vw,68px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1.1, marginBottom: 22 }}>
          Free Website Audit<br />for {city.short ?? city.name} Businesses
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(15px,2vw,18px)", color: "var(--text2)", lineHeight: 1.7, maxWidth: 620, margin: "0 auto 40px" }}>
          See your performance score, how much you&rsquo;re overpaying on Google Ads, your accessibility risk, and every SEO gap — in 60 seconds. No sign-up required.
        </p>
        <HeroCta />
      </section>

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3.5vw,34px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 32, textAlign: "center" }}>
          WHY {(city.short ?? city.name).toUpperCase()} BUSINESSES USE THIS
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
          {cards.map(card => (
            <div key={card.heading} style={{ padding: 28, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--text)", letterSpacing: "0.04em", marginBottom: 12 }}>{card.heading}</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.65, margin: 0 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3vw,30px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 28, textAlign: "center" }}>WHAT THE AUDIT CHECKS</h2>
        <PillarList items={STANDARD_PILLARS} />
      </section>

      <CityRelated current={city} />

      <BottomCta heading="SEE WHAT YOUR SITE IS COSTING YOU" body="Enter your URL and get a full 5-pillar report with a monthly revenue impact estimate in under a minute." />
    </main>
  );
}

function CityRelated({ current }: { current: City }) {
  // 6 nearby cities: same country first, fall back globally
  const others = cities.filter(c => c.slug !== current.slug);
  const sameCountry = others.filter(c => c.country === current.country).slice(0, 6);
  const list = sameCountry.length ? sameCountry : others.slice(0, 6);
  return (
    <RelatedLinks
      heading="OTHER CITIES"
      links={list.map(c => ({ href: `/${c.slug}-website-audit`, label: c.name }))}
    />
  );
}

// ─── Vertical page ───────────────────────────────────────────────────────────

function VerticalPage({ vertical, slug }: { vertical: Vertical; slug: string }) {
  const url = `${BASE}/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Free ${vertical.name} Website Audit`,
    description: `Free 5-pillar website audit for ${vertical.name} ${vertical.noun}s covering performance, SEO, accessibility, security, and AI visibility.`,
    provider: { "@type": "Organization", name: "Nexus", url: BASE },
    url,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(64px,10vw,112px) 24px clamp(48px,6vw,80px)", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 18 }}>
          {vertical.name.toUpperCase()} WEBSITE AUDIT
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,6vw,68px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1.1, marginBottom: 22 }}>
          Free Audit for<br />{vertical.name} {vertical.noun === "store" ? "Stores" : vertical.noun === "practice" ? "Practices" : "Sites"}
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(15px,2vw,18px)", color: "var(--text2)", lineHeight: 1.7, maxWidth: 620, margin: "0 auto 40px" }}>
          {vertical.heroLine}
        </p>
        <HeroCta label={vertical.ctaLabel} />
      </section>

      {vertical.stats && (
        <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
            {vertical.stats.map(s => (
              <div key={s.value} style={{ padding: "28px 24px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px,4vw,38px)", color: "var(--accent)", letterSpacing: "0.02em", marginBottom: 10 }}>{s.value}</div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.55, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3.5vw,34px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 32, textAlign: "center" }}>
          {vertical.cardsHeading}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
          {vertical.cards.map(card => (
            <div key={card.heading} style={{ padding: 28, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--text)", letterSpacing: "0.04em", marginBottom: 12 }}>{card.heading}</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.65, margin: 0 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3vw,30px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 28, textAlign: "center" }}>WHAT THE AUDIT CHECKS</h2>
        <PillarList items={STANDARD_PILLARS} />
      </section>

      <VerticalRelated currentSlug={vertical.slug} />

      <BottomCta heading="SEE WHAT YOUR SITE IS LOSING" body={`Enter your ${vertical.noun} URL and get a full 5-pillar report with a monthly revenue impact estimate in under a minute.`} label={vertical.ctaLabel} />
    </main>
  );
}

function VerticalRelated({ currentSlug }: { currentSlug: string }) {
  const others = verticals.filter(v => v.slug !== currentSlug).slice(0, 6);
  return (
    <RelatedLinks
      heading="OTHER VERTICALS"
      links={others.map(v => ({ href: `/${v.slug}-website-audit`, label: v.name }))}
    />
  );
}

// ─── Competitor page ─────────────────────────────────────────────────────────

function CompetitorPage({ competitor, slug }: { competitor: Competitor; slug: string }) {
  const url = `${BASE}/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What's the difference between Nexus and ${competitor.name}?`,
        acceptedAnswer: { "@type": "Answer", text: competitor.summary },
      },
      {
        "@type": "Question",
        name: `Is Nexus a free alternative to ${competitor.name}?`,
        acceptedAnswer: { "@type": "Answer", text: `Yes — Nexus runs a full 5-pillar website audit (Performance, SEO, Accessibility, Security, AI Visibility) free, with no signup required. Recurring monitoring is available on paid plans starting at $19/month.` },
      },
      {
        "@type": "Question",
        name: `Does Nexus check accessibility (ADA / WCAG) like ${competitor.name}?`,
        acceptedAnswer: { "@type": "Answer", text: `Nexus runs a full WCAG 2.1 AA scan as one of its 5 pillars and flags the specific failures most commonly cited in ADA litigation. Most competing tools either don't include accessibility or treat it as a generic checkbox.` },
      },
    ],
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(64px,10vw,112px) 24px clamp(40px,5vw,64px)", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 18 }}>
          NEXUS VS {competitor.name.toUpperCase()}
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,6vw,68px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1.05, marginBottom: 22 }}>
          Nexus vs {competitor.name}
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(15px,2vw,18px)", color: "var(--text2)", lineHeight: 1.7, maxWidth: 640, margin: "0 auto 36px" }}>
          {competitor.tagline}
        </p>
        <HeroCta label="RUN FREE NEXUS AUDIT →" />
      </section>

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 64px" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.75, maxWidth: 720, margin: "0 auto 40px", textAlign: "center" }}>
          {competitor.summary}
        </p>

        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ padding: "16px 20px", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.14em" }}>FEATURE</div>
            <div style={{ padding: "16px 20px", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.14em", textAlign: "center" }}>{competitor.name.toUpperCase()}</div>
            <div style={{ padding: "16px 20px", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.14em", textAlign: "center", background: "rgba(232,52,26,0.06)" }}>NEXUS</div>
          </div>
          {competitor.rows.map((r, i) => (
            <div key={r.feature} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", background: i % 2 === 0 ? "var(--bg)" : "var(--surface)", borderBottom: i === competitor.rows.length - 1 ? "none" : "1px solid var(--border)" }}>
              <div style={{ padding: "16px 20px", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text)" }}>{r.feature}</div>
              <div style={{ padding: "16px 20px", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>{r.them}</div>
              <div style={{ padding: "16px 20px", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text)", textAlign: "center", background: "rgba(232,52,26,0.04)" }}>{r.us}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3.5vw,34px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 28, textAlign: "center" }}>
          FAQ: NEXUS VS {competitor.name.toUpperCase()}
        </h2>
        {[
          { q: `What's the difference between Nexus and ${competitor.name}?`, a: competitor.summary },
          { q: `Is Nexus a free alternative to ${competitor.name}?`, a: `Yes — Nexus runs a full 5-pillar website audit (Performance, SEO, Accessibility, Security, AI Visibility) free, with no signup required. Recurring monitoring is available on paid plans starting at $19/month.` },
          { q: `Does Nexus check accessibility (ADA / WCAG) like ${competitor.name}?`, a: `Nexus runs a full WCAG 2.1 AA scan as one of its 5 pillars and flags the specific failures most commonly cited in ADA litigation. Most competing tools either don't include accessibility or treat it as a generic checkbox.` },
        ].map(f => (
          <div key={f.q} style={{ padding: "20px 24px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 12 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--text)", letterSpacing: "0.03em", marginBottom: 10 }}>{f.q}</h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.65, margin: 0 }}>{f.a}</p>
          </div>
        ))}
      </section>

      <CompetitorRelated currentSlug={competitor.slug} />

      <BottomCta heading="RUN A FREE NEXUS AUDIT" body="Enter your URL and get a 5-pillar diagnostic with monthly dollar-impact estimates in 60 seconds. No signup, no credit card." label="RUN FREE AUDIT →" />
    </main>
  );
}

function CompetitorRelated({ currentSlug }: { currentSlug: string }) {
  const others = competitors.filter(c => c.slug !== currentSlug).slice(0, 6);
  return (
    <RelatedLinks
      heading="OTHER COMPARISONS"
      links={others.map(c => ({ href: `/nexus-vs-${c.slug}`, label: `vs ${c.name}` }))}
    />
  );
}
