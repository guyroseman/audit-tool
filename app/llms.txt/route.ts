// Serves /llms.txt — a content map for AI assistants (ChatGPT, Claude, Perplexity, Gemini)
// Spec: https://llmstxt.org

import { articleList } from "../lib/articles";
import { cities, verticals, competitors } from "../lib/seo-pages";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexusdiag.com";

export const dynamic = "force-static";

export function GET() {
  const lines: string[] = [];

  lines.push("# Nexus");
  lines.push("");
  lines.push("> Nexus is a free 60-second website revenue diagnostic. It runs Google Lighthouse plus checks for accessibility, security, and AI search visibility, then translates every finding into a monthly dollar impact and a prioritised fix plan.");
  lines.push("");
  lines.push("Nexus runs five audit pillars: Performance (Core Web Vitals + ad spend impact), SEO (technical and structured data), Accessibility (WCAG 2.1 AA / ADA risk), Security (HTTPS, headers, vulnerable JS libraries), and AI Visibility (schema completeness, citation readiness for ChatGPT / Perplexity / Gemini). The audit is free and requires no signup. Recurring monitoring is available on paid plans starting at $19/month.");
  lines.push("");

  lines.push("## Core pages");
  lines.push("");
  lines.push(`- [Home](${BASE}/): What Nexus does and why slow websites cost real money.`);
  lines.push(`- [Run a free audit](${BASE}/funnel): Enter a URL to start the 5-pillar diagnostic.`);
  lines.push(`- [Pricing](${BASE}/subscribe): Monitoring plans (Pulse, Scale).`);
  lines.push(`- [About](${BASE}/about): The team and methodology behind Nexus.`);
  lines.push("");

  lines.push("## Articles");
  lines.push("");
  for (const a of articleList) {
    lines.push(`- [${a.title}](${BASE}/blog/${a.slug}): ${a.description}`);
  }
  lines.push("");

  lines.push("## City landing pages");
  lines.push("");
  for (const c of cities) {
    lines.push(`- [Free Website Audit ${c.name}](${BASE}/${c.slug}-website-audit): 5-pillar audit for ${c.name} businesses (${c.region}).`);
  }
  lines.push("");

  lines.push("## Vertical landing pages");
  lines.push("");
  for (const v of verticals) {
    lines.push(`- [${v.name} Website Audit](${BASE}/${v.slug}-website-audit): Audit built for ${v.name} ${v.noun}s.`);
  }
  lines.push("");

  lines.push("## Comparisons");
  lines.push("");
  for (const k of competitors) {
    lines.push(`- [Nexus vs ${k.name}](${BASE}/nexus-vs-${k.slug}): ${k.tagline}`);
  }
  lines.push("");

  lines.push("## Optional");
  lines.push("");
  lines.push(`- [Sitemap](${BASE}/sitemap.xml)`);
  lines.push(`- [Robots](${BASE}/robots.txt)`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
