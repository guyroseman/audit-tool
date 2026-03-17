"use client";
import React, { Suspense } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAudit } from "../lib/audit";
import type { AuditResult } from "../lib/audit";
import { ResultsPanel } from "../components/shared";
import { NavBar } from "../components/nav";
import { useAuth } from "../lib/auth-context";

type Step = "q1" | "q2" | "q3" | "url" | "loading" | "teaser" | "email" | "report" | "discover" | "pitch" | "phone" | "booked";
interface FunnelData { q1?: string; q2?: string; q3?: string; url?: string; email?: string; phone?: string; businessType?: string; goal?: string; }
interface PitchCard { icon: string; title: string; tag: string; price: string; bullets: string[]; cta: string; href: string; highlight?: boolean; }
interface PitchData { headline: string; sub: string; cards: PitchCard[]; }

// ─── Enhanced Scan Loader ─────────────────────────────────────────────────────
const SCAN_LINES = [
  { label: "Resolving DNS & HTTPS certificate chain...", pillar: null },
  { label: "Connecting to Google PageSpeed Insights API...", pillar: null },
  { label: "PILLAR 1 — Core Web Vitals analysis", pillar: "perf" },
  { label: "  ↳ Largest Contentful Paint (LCP) measurement", pillar: "perf" },
  { label: "  ↳ Total Blocking Time (TBT) — main thread scan", pillar: "perf" },
  { label: "  ↳ Cumulative Layout Shift (CLS) detection", pillar: "perf" },
  { label: "  ↳ Calculating Google Ads quality score penalty...", pillar: "perf" },
  { label: "PILLAR 2 — SEO crawlability deep-scan", pillar: "seo" },
  { label: "  ↳ Meta tags, title & OG tag coverage check", pillar: "seo" },
  { label: "  ↳ Mobile viewport & structured data signals", pillar: "seo" },
  { label: "  ↳ Crawlability & indexation flags", pillar: "seo" },
  { label: "  ↳ Estimating organic reach loss %...", pillar: "seo" },
  { label: "PILLAR 3 — WCAG 2.1 AA accessibility audit", pillar: "a11y" },
  { label: "  ↳ Alt text, ARIA labels, form field coverage", pillar: "a11y" },
  { label: "  ↳ Colour contrast & screen-reader compliance", pillar: "a11y" },
  { label: "  ↳ Computing ADA lawsuit exposure level...", pillar: "a11y" },
  { label: "PILLAR 4 — Security & trust signals scan", pillar: "sec" },
  { label: "  ↳ Vulnerable JavaScript library detection", pillar: "sec" },
  { label: "  ↳ Security response headers audit", pillar: "sec" },
  { label: "  ↳ HTTPS config & checkout trust risk...", pillar: "sec" },
  { label: "Running 4-pillar revenue leakage model...", pillar: null },
  { label: "  ↳ Google Ads overspend from performance penalty", pillar: null },
  { label: "  ↳ SEO organic traffic dollar loss estimate", pillar: null },
  { label: "  ↳ Compiling executive recovery blueprint...", pillar: null },
];

const PILLAR_COLORS: Record<string, string> = { perf: "#e8341a", seo: "#f59e0b", a11y: "#a78bfa", sec: "#22d3ee" };

function ScanLoader({ url, apiReady = false }: { url: string; apiReady?: boolean }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [dots, setDots] = useState(".");
  const [animDone, setAnimDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation: run through lines, hold at last line until apiReady
  useEffect(() => {
    let total = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Go up to second-to-last line quickly, then hold
    const holdAt = SCAN_LINES.length - 1;
    SCAN_LINES.forEach((_, idx) => {
      if (idx >= holdAt) return; // hold before last line
      const delay = total + 180 + Math.random() * 200;
      total = delay;
      timers.push(setTimeout(() => {
        setVisibleLines(idx + 1);
        if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }, delay));
    });
    timers.push(setTimeout(() => setAnimDone(true), total + 300));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Once API returns AND animation is done (or nearly), show final line
  useEffect(() => {
    if (apiReady && animDone) {
      setVisibleLines(SCAN_LINES.length);
    }
  }, [apiReady, animDone]);

  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 420);
    return () => clearInterval(id);
  }, []);

  const isComplete = visibleLines >= SCAN_LINES.length;
  const baseProgress = Math.round((Math.min(visibleLines, SCAN_LINES.length - 1) / SCAN_LINES.length) * 95);
  const progress = isComplete ? 100 : (apiReady ? Math.max(baseProgress, 90) : baseProgress);
  const displayUrl = url.replace(/https?:\/\//, "").replace(/\/$/, "") || "scanning...";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ width: "100%", maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 6 }}>NEXUS DIAGNOSTIC ENGINE v4.0</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,5vw,38px)", color: "var(--text)", letterSpacing: "0.05em", lineHeight: 1 }} className="flicker">
          SCANNING <span style={{ color: "var(--accent)" }}>{displayUrl}</span>
        </h2>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ padding: "10px 14px", background: "rgba(14,30,53,0.8)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["#e8341a", "#f59e0b", "#10b981"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.85 }} />)}
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", letterSpacing: "0.08em", flex: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            audit-engine — {url || "connecting..."}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#10b981", letterSpacing: "0.1em" }}>● LIVE</span>
        </div>

        <div ref={containerRef} style={{ padding: "14px 16px", minHeight: 260, maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}
          className="hide-scrollbar">
          {SCAN_LINES.slice(0, visibleLines).map((line, i) => {
            const isActive = i === visibleLines - 1;
            const isPillarHeader = line.pillar && !line.label.startsWith("  ");
            const color = isPillarHeader && line.pillar ? PILLAR_COLORS[line.pillar] : "var(--text2)";
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.1 }}
                style={{ fontFamily: "var(--font-mono)", fontSize: isPillarHeader ? 11 : 10, color: isActive ? "var(--text)" : color, lineHeight: 1.5, display: "flex", gap: 8, alignItems: "flex-start", fontWeight: isPillarHeader ? 500 : 400 }}>
                <span style={{ color: isActive ? "var(--accent)" : "#10b981", flexShrink: 0, fontSize: 10, marginTop: 1 }}>
                  {isActive ? "▶" : "✓"}
                </span>
                <span>{line.label}{isActive ? dots : ""}</span>
              </motion.div>
            );
          })}
          {visibleLines < SCAN_LINES.length && (
            <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 13 }} className="blink-cursor">█</span>
          )}
        </div>

        <div style={{ padding: "10px 14px 14px" }}>
          <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ height: "100%", background: "linear-gradient(90deg, var(--accent), #f59e0b)", borderRadius: 2, boxShadow: "0 0 10px rgba(232,52,26,0.5)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>4-PILLAR ANALYSIS</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.1em" }}>{progress}%</span>
          </div>
        </div>
      </div>

      {/* Pillar status cards */}
      <div className="funnel-pillar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 12 }}>
        {[
          { label: "PERFORMANCE", icon: "⚡", color: "#e8341a", done: 7, start: 3 },
          { label: "SEO", icon: "🔍", color: "#f59e0b", done: 12, start: 8 },
          { label: "ACCESSIBILITY", icon: "♿", color: "#a78bfa", done: 16, start: 13 },
          { label: "SECURITY", icon: "🔒", color: "#22d3ee", done: 20, start: 17 },
        ].map(({ label, icon, color, done, start }) => {
          const active = visibleLines >= start && visibleLines <= done;
          const completed = visibleLines > done;
          return (
            <div key={label} style={{ padding: "10px 8px", borderRadius: 8, background: "var(--surface)", border: `1px solid ${completed ? color + "50" : active ? color + "35" : "var(--border)"}`, textAlign: "center", transition: "all 0.4s" }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: completed ? color : active ? color + "99" : "var(--muted)", letterSpacing: "0.06em", lineHeight: 1.3, marginBottom: 3 }}>{label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: completed ? "#10b981" : active ? "var(--accent)" : "var(--muted2)" }}>
                {completed ? "✓ DONE" : active ? "SCANNING" : "WAITING"}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textAlign: "center", marginTop: 12, letterSpacing: "0.08em" }}>
        {isComplete ? "✓ ANALYSIS COMPLETE — PREPARING YOUR REPORT..." : apiReady ? "✓ DATA RECEIVED — COMPILING REPORT..." : "POWERED BY GOOGLE LIGHTHOUSE API · 30–60 SECONDS"}
      </p>
      <style>{`
        .hide-scrollbar { scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .blink-cursor { animation: blinkC 1s step-end infinite; }
        @keyframes blinkC { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </motion.div>
  );
}

// ─── URL Intelligence Panel ───────────────────────────────────────────────────
function URLIntelligencePanel({ result }: { result: AuditResult }) {
  const [expanded, setExpanded] = useState<string | null>("seo");

  type Severity = "critical" | "warning";
  interface Issue { id: string; cat: string; severity: Severity; title: string; impact: string; fix: string; icon: string; }

  const issues: Issue[] = [
    // SEO
    ...(!result.seo?.hasMeta ? [{ id: "meta", cat: "seo", severity: "critical" as Severity, title: "Missing Meta Description", impact: "Google uses this as your search snippet. Without it, your CTR drops 5–8% and you appear untrustworthy in SERPs.", fix: "Write a compelling 140–160 char description for every key page.", icon: "🔍" }] : []),
    ...(!result.seo?.mobileViewport ? [{ id: "viewport", cat: "seo", severity: "critical" as Severity, title: "No Mobile Viewport Tag", impact: "Google demotes you in mobile search — your single largest traffic source. This alone can halve your organic reach overnight.", fix: "Add <meta name='viewport' content='width=device-width, initial-scale=1'>.", icon: "🔍" }] : []),
    ...(!result.seo?.isCrawlable ? [{ id: "crawl", cat: "seo", severity: "critical" as Severity, title: "Google Can't Crawl Your Site", impact: "Googlebot is being blocked. You don't exist in search results. All SEO investment is wasted while this remains.", fix: "Check robots.txt. Ensure key pages aren't tagged noindex.", icon: "🔍" }] : []),
    ...(!result.seo?.hasH1 ? [{ id: "h1", cat: "seo", severity: "warning" as Severity, title: "No H1 Heading Found", impact: "H1 is your primary keyword signal to Google. Missing it makes ranking for competitive terms significantly harder.", fix: "Add one clear H1 per page matching your target keyword.", icon: "🔍" }] : []),
    ...(!result.seo?.hasStructuredData ? [{ id: "schema", cat: "seo", severity: "warning" as Severity, title: "No Structured Data (Schema)", impact: "Competitors with schema get rich snippets — stars, prices, FAQs. You get a plain blue link. CTR difference: up to 30%.", fix: "Add Organization, Product, or FAQ schema to key pages.", icon: "🔍" }] : []),
    // Technical
    ...(result.metrics.lcp > 4000 ? [{ id: "lcp", cat: "tech", severity: "critical" as Severity, title: `LCP ${(result.metrics.lcp/1000).toFixed(1)}s — Critically Slow`, impact: `Users wait ${(result.metrics.lcp/1000).toFixed(1)}s to see anything. Google penalises Ads quality score. You pay up to 60% more per click than faster rivals.`, fix: "Compress hero images to WebP, preload critical assets, enable CDN caching.", icon: "⚡" }] : result.metrics.lcp > 2500 ? [{ id: "lcp", cat: "tech", severity: "warning" as Severity, title: `LCP ${(result.metrics.lcp/1000).toFixed(1)}s — Borderline Performance`, impact: "Above Google's 2.5s threshold. Ad quality score is penalised. Competitors below 2s receive preferential ranking treatment.", fix: "Optimise hero images, defer non-critical JS, enable server compression.", icon: "⚡" }] : []),
    ...(result.metrics.tbt > 600 ? [{ id: "tbt", cat: "tech", severity: "critical" as Severity, title: `${result.metrics.tbt}ms Main Thread Blocked`, impact: "Page looks loaded but ignores user taps for 600ms+. On mobile, users assume it's broken and leave.", fix: "Split large JS bundles. Defer Meta Pixel & GTM scripts to post-load.", icon: "⚡" }] : result.metrics.tbt > 200 ? [{ id: "tbt", cat: "tech", severity: "warning" as Severity, title: `${result.metrics.tbt}ms Blocking Time`, impact: "Buttons feel unresponsive. On mobile this translates directly to checkout abandonment spikes.", fix: "Move render-blocking scripts to deferred or async loading.", icon: "⚡" }] : []),
    ...(result.tech?.renderBlockingResources ? [{ id: "rbl", cat: "tech", severity: "warning" as Severity, title: "Render-Blocking Resources", impact: "CSS/JS stalling first paint. Every 100ms of delay costs ~1% in conversion rate.", fix: "Defer non-critical CSS, async-load third-party scripts.", icon: "⚙️" }] : []),
    ...(result.tech?.noImageOptimisation ? [{ id: "img", cat: "tech", severity: "warning" as Severity, title: "Unoptimised Images", impact: "Large uncompressed images are the #1 cause of slow LCP. They inflate page weight and destroy mobile UX.", fix: "Convert all images to WebP/AVIF. Set explicit width/height attributes.", icon: "⚙️" }] : []),
    // Security
    ...((result.security?.vulnerableLibraryCount ?? 0) > 0 ? [{ id: "vuln", cat: "security", severity: "critical" as Severity, title: `${result.security!.vulnerableLibraryCount} Vulnerable JS ${result.security!.vulnerableLibraryCount === 1 ? "Library" : "Libraries"}`, impact: "Browsers display security warnings at checkout on sites running known-vulnerable scripts. One warning banner = abandoned sale.", fix: "Update jQuery, lodash, or other flagged dependencies to latest stable versions.", icon: "🔒" }] : []),
    ...(!result.security?.hasSecurityHeaders ? [{ id: "headers", cat: "security", severity: "warning" as Severity, title: "Security Headers Missing", impact: "CSP, HSTS, X-Frame-Options absent. B2B buyers run security checks before purchasing — your site will fail them.", fix: "Add security headers via server config or Cloudflare Transform Rules.", icon: "🔒" }] : []),
    // Accessibility
    ...(result.accessibility?.adaRiskLevel === "high" ? [{ id: "ada-h", cat: "accessibility", severity: "critical" as Severity, title: "HIGH ADA Compliance Risk", impact: `~${result.accessibility.estimatedMarketLockout}% of users locked out. ADA lawsuits average $20k–$75k settlement. Demand letters require no prior warning.`, fix: "WCAG 2.1 AA audit urgently needed. Fix alt text, contrast ratios, form labels.", icon: "♿" }] : result.accessibility?.adaRiskLevel === "medium" ? [{ id: "ada-m", cat: "accessibility", severity: "warning" as Severity, title: "MEDIUM ADA Compliance Risk", impact: "Multiple WCAG failures. Rising number of demand letters and lawsuits even for medium-risk sites.", fix: "Fix missing alt text, improve colour contrast to 4.5:1 ratio minimum.", icon: "♿" }] : []),
    // Lead capture
    ...((result.leads?.estimatedLeadScore ?? 100) < 50 ? [{ id: "leads", cat: "leads", severity: "warning" as Severity, title: `Lead Capture Score: ${result.leads?.estimatedLeadScore ?? 0}/100`, impact: `${!result.leads?.hasCTA ? "No clear CTA detected. " : ""}${!result.leads?.hasContactForm ? "No contact form found. " : ""}${!result.leads?.hasPhoneNumber ? "No phone number visible. " : ""}Visitors arrive and bounce with no conversion path.`, fix: "Add visible CTAs, a live chat widget, and a phone number above the fold.", icon: "💼" }] : []),
  ];

  const catMeta: Record<string, { label: string; color: string; desc: string }> = {
    seo: { label: "SEO GAPS", color: "#f59e0b", desc: "Why Google is hiding you" },
    tech: { label: "TECHNICAL ISSUES", color: "#e8341a", desc: "Why users leave before converting" },
    security: { label: "SECURITY RISKS", color: "#22d3ee", desc: "Why checkout trust is broken" },
    accessibility: { label: "ADA / ACCESSIBILITY", color: "#a78bfa", desc: "Legal exposure + market lockout" },
    leads: { label: "LEAD CAPTURE", color: "#10b981", desc: "Why visitors don't become customers" },
  };

  const grouped = Object.entries(catMeta)
    .map(([cat, meta]) => ({ cat, meta, items: issues.filter(i => i.cat === cat) }))
    .filter(g => g.items.length > 0);

  if (grouped.length === 0) return null;

  return (
    <div style={{ width: "100%", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em" }}>
          URL INTELLIGENCE — {issues.length} ISSUES CATEGORISED
        </p>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)" }}>
          {issues.filter(i => i.severity === "critical").length} critical · {issues.filter(i => i.severity === "warning").length} warnings
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {grouped.map(({ cat, meta, items }) => {
          const isOpen = expanded === cat;
          const critCount = items.filter(i => i.severity === "critical").length;
          return (
            <div key={cat} style={{ borderRadius: 10, border: `1px solid ${meta.color}25`, background: "var(--surface)", overflow: "hidden" }}>
              <button onClick={() => setExpanded(isOpen ? null : cat)}
                style={{ width: "100%", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${meta.color}14`, border: `1px solid ${meta.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 14 }}>{items[0]?.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: meta.color, letterSpacing: "0.1em" }}>{meta.label}</span>
                    {critCount > 0 && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#e8341a", background: "rgba(232,52,26,0.1)", border: "1px solid rgba(232,52,26,0.2)", padding: "1px 6px", borderRadius: 3, letterSpacing: "0.08em" }}>
                        {critCount} CRITICAL
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {meta.desc} · {items.length} {items.length === 1 ? "issue" : "issues"} found
                  </div>
                </div>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ color: "var(--muted)", fontSize: 11, flexShrink: 0 }}>▼</motion.span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }} style={{ overflow: "hidden" }}>
                    <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ height: 1, background: `${meta.color}20`, marginBottom: 4 }} />
                      {items.map(issue => (
                        <div key={issue.id} style={{ padding: "12px 14px", borderRadius: 8, background: issue.severity === "critical" ? "rgba(232,52,26,0.04)" : "rgba(245,158,11,0.03)", border: `1px solid ${issue.severity === "critical" ? "rgba(232,52,26,0.2)" : "rgba(245,158,11,0.15)"}` }}>
                          <div style={{ marginBottom: 6 }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.1em", padding: "2px 6px", borderRadius: 3, color: issue.severity === "critical" ? "#e8341a" : "#f59e0b", background: issue.severity === "critical" ? "rgba(232,52,26,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${issue.severity === "critical" ? "rgba(232,52,26,0.25)" : "rgba(245,158,11,0.2)"}` }}>
                              {issue.severity === "critical" ? "⚠ CRITICAL" : "⚡ WARNING"}
                            </span>
                          </div>
                          <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--text)", marginBottom: 5, lineHeight: 1.4 }}>{issue.title}</div>
                          <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.6, marginBottom: 8 }}>{issue.impact}</div>
                          <div style={{ padding: "7px 10px", borderRadius: 6, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#10b981", letterSpacing: "0.1em" }}>THE FIX: </span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text2)" }}>{issue.fix}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scan Teaser ──────────────────────────────────────────────────────────────
function ScanTeaser({ result, onContinue }: { result: AuditResult; onContinue: () => void }) {
  const critCount = result.explanations.filter(e => e.severity === "critical").length;
  const warnCount = result.explanations.filter(e => e.severity === "warning").length;
  const topFinding = result.explanations[0];
  const scores = [
    { label: "PERF", val: result.metrics.performanceScore },
    { label: "SEO", val: result.seo?.estimatedSeoScore ?? 0 },
    { label: "A11Y", val: result.accessibility?.estimatedA11yScore ?? 0 },
    { label: "SEC", val: result.security?.estimatedBestPracticesScore ?? 0 },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ width: "100%", maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.25)", marginBottom: 14 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} className="animate-pulse" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.12em" }}>4-PILLAR SCAN COMPLETE</span>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,6vw,46px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1, marginBottom: 8 }}>
          WE FOUND <span style={{ color: "var(--accent)" }}>{result.explanations.length} ISSUES</span>
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
          {critCount} critical · {warnCount} warnings ·{" "}
          <strong style={{ color: "var(--accent)" }}>${result.totalMonthlyCost.toLocaleString()}/mo</strong> estimated leak
        </p>
      </div>
      <div className="funnel-pillar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        {scores.map(({ label, val }) => {
          const color = val < 50 ? "#e8341a" : val < 80 ? "#f59e0b" : "#10b981";
          return (
            <div key={label} style={{ textAlign: "center", padding: "10px 6px", background: "var(--surface)", border: `1px solid ${color}25`, borderRadius: 8, borderTop: `2px solid ${color}` }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: "var(--muted)", marginTop: 3, letterSpacing: "0.1em" }}>{label}</div>
            </div>
          );
        })}
      </div>
      {topFinding && (
        <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(232,52,26,0.04)", border: "1px solid rgba(232,52,26,0.2)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--accent)", letterSpacing: "0.12em", background: "rgba(232,52,26,0.1)", padding: "2px 8px", borderRadius: 3 }}>⚠ TOP CRITICAL FINDING</span>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)", fontWeight: 600, margin: "8px 0 5px", lineHeight: 1.4 }}>{topFinding.headline}</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{topFinding.businessImpact}</p>
        </div>
      )}
      <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border2)" }}>
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6, filter: "blur(3px)", userSelect: "none", pointerEvents: "none" }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: 36, background: "var(--surface)", borderRadius: 6, opacity: 0.6 - i * 0.1 }} />)}
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(3,7,15,0.75)", backdropFilter: "blur(2px)" }}>
          <span style={{ fontSize: 22, marginBottom: 8 }}>🔐</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text2)", letterSpacing: "0.1em", marginBottom: 4 }}>
            {result.explanations.length - 1} more findings locked
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em" }}>
            + full fix blueprint
          </span>
        </div>
      </div>
      <button onClick={onContinue} className="btn-primary" style={{ width: "100%", padding: "16px", borderRadius: 10, fontSize: 13, letterSpacing: "0.12em" }}>
        UNLOCK MY FULL REPORT →
      </button>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textAlign: "center" }}>FREE · NO CREDIT CARD · 10 SECONDS</p>
    </motion.div>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────
function ProgressDots({ step }: { step: Step }) {
  const steps: Step[] = ["q1", "q2", "q3", "url", "loading", "teaser", "email", "report"];
  const idx = steps.indexOf(step);
  return (
    <div style={{ display: "flex", gap: 5, justifyContent: "center", marginBottom: 20 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ width: i === idx ? 20 : 5, height: 5, borderRadius: 3, background: i <= idx ? "var(--accent)" : "var(--border2)", transition: "all 0.3s" }} />
      ))}
    </div>
  );
}

function Q({ q, sub, children }: { q: string; sub?: string; children?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,5vw,40px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1.05, marginBottom: sub ? 8 : 16, textAlign: "center" }}>{q}</h2>
      {sub && <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", textAlign: "center", marginBottom: 18, lineHeight: 1.6 }}>{sub}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </motion.div>
  );
}

function Choice({ label, sub, icon, onClick }: { label: string; sub?: string; icon: string; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
      style={{ width: "100%", padding: "14px 16px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border2)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 12 }}>
      <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.5 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)", fontWeight: 500, lineHeight: 1.35 }}>{label}</div>
        {sub && <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
      </div>
    </motion.button>
  );
}

const BIZ = [
  { val: "ecom", icon: "🛒", label: "E-commerce / Online store", sub: "Sell products directly online" },
  { val: "service", icon: "🏢", label: "Service business / Agency", sub: "Sell time, skills, or expertise" },
  { val: "local", icon: "📍", label: "Local / Bricks and mortar", sub: "Restaurant, clinic, trade, retail" },
  { val: "saas", icon: "💻", label: "SaaS / App / Tech product", sub: "Software or subscription product" },
];
const GOALS = [
  { val: "ads", icon: "📉", label: "Cut my Google Ads overspend", sub: "Stop paying the slow-site penalty" },
  { val: "seo", icon: "🔍", label: "Rank higher, get more organic traffic" },
  { val: "compliance", icon: "⚖️", label: "Fix ADA / accessibility risk now", sub: "Before it becomes a lawsuit" },
  { val: "convert", icon: "💰", label: "Convert more of the traffic I already have" },
];

function Discover({ onDone }: { onDone: (bt: string, goal: string) => void }) {
  const [bt, setBt] = useState<string | null>(null);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,5vw,36px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1.05, marginBottom: 8, textAlign: "center" }}>
        {!bt ? "WHAT KIND OF BUSINESS IS THIS?" : "WHAT'S YOUR #1 GOAL?"}
      </h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", textAlign: "center", marginBottom: 18 }}>
        {!bt ? "We tailor the fix plan to your revenue model." : "We'll order fixes by dollar ROI for your situation."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!bt
          ? BIZ.map(({ val, icon, label, sub }) => <Choice key={val} icon={icon} label={label} sub={sub} onClick={() => setBt(val)} />)
          : GOALS.map(({ val, icon, label, sub }) => <Choice key={val} icon={icon} label={label} sub={sub} onClick={() => onDone(bt, val)} />)
        }
      </div>
    </motion.div>
  );
}

function buildPitch(result: AuditResult, fd: FunnelData): PitchData {
  const score = result.metrics.performanceScore;
  const leak = result.totalMonthlyCost;
  const bt = fd.businessType ?? "service";
  const adaRisk = result.accessibility?.adaRiskLevel;
  const vulnCount = result.security?.vulnerableLibraryCount ?? 0;
  const cards: PitchCard[] = [];
  cards.push({
    icon: "📡", title: "Nexus Pulse — 4-Pillar Monitoring", tag: "MOST POPULAR", price: "$49/mo",
    bullets: [
      "Weekly automated scans across all 4 pillars",
      "SMS + Slack alert the moment any score drops",
      bt === "ecom" ? "Track 3 competitor stores side-by-side" : "3 competitor URLs tracked continuously",
      "ADA compliance monitoring — catch regressions before lawsuits",
    ],
    cta: "ACTIVATE PULSE →", href: "/subscribe", highlight: true,
  });
  if (adaRisk && adaRisk !== "low") {
    cards.push({
      icon: "⚖️", title: adaRisk === "high" ? "ADA Compliance Fix — Urgent" : "Accessibility Remediation",
      tag: adaRisk === "high" ? "HIGH ADA RISK" : "COMPLIANCE FIX", price: "$800",
      bullets: [
        adaRisk === "high" ? "HIGH risk — avg ADA settlement $20k–$75k" : "MEDIUM ADA risk — fix before enforcement",
        vulnCount > 0 ? `${vulnCount} vulnerable JS ${vulnCount === 1 ? "library" : "libraries"} patched` : "Full WCAG 2.1 AA remediation",
        "Fixed price, 5 business days", "Compliance certificate on completion",
      ],
      cta: "BOOK A CALL →", href: `/call-center?score=${score}&leak=${leak}`,
    });
  }
  if (score < 65) {
    cards.push({
      icon: "⚡", title: "Performance Rebuild", tag: "FIXED PRICE", price: "$1,200",
      bullets: [
        `Score ${score}/100 → guaranteed sub-1.5s LCP`, "5-day turnaround, no retainer",
        "Mobile-first, all Core Web Vitals green", "30-day money-back performance guarantee",
      ],
      cta: "BOOK A CALL →", href: `/call-center?score=${score}&leak=${leak}`,
    });
  }
  return {
    headline: leak > 800 ? `You're leaking ~$${Math.round(leak / 100) * 100}/month. Here's the fix order.` : `Highest-ROI moves for your ${bt} site.`,
    sub: `Based on your ${bt} business and 4-pillar scores — ordered by revenue impact.`,
    cards,
  };
}

// ─── MAIN FUNNEL ──────────────────────────────────────────────────────────────
function FunnelInner() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("q1");
  const [fd, setFd] = useState<FunnelData>({});
  const [result, setResult] = useState<AuditResult | null>(null);
  const [pitch, setPitch] = useState<PitchData | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(true);
  const [apiReady, setApiReady] = useState(false);
  const pendingResult = useRef<AuditResult | null>(null);
  const { isAuthed } = useAuth();

  useEffect(() => {
    // Mode 1: pre-computed result in ?data= — instant report, no scan
    const preData = searchParams.get("data");
    if (preData) {
      try {
        const r = JSON.parse(atob(preData));
        const siteUrl = r.url || searchParams.get("url") || "";
        setUrlInput(siteUrl);
        setFd(p => ({ ...p, url: siteUrl }));
        pendingResult.current = r;
        setResult(r);
        setStep("teaser");
        return;
      } catch { /* fall through */ }
    }
    // Mode 2: URL only — run scan
    const fromHome = searchParams.get("url");
    if (fromHome) {
      setUrlInput(fromHome);
      setFd(p => ({ ...p, url: fromHome }));
      setApiReady(false);
      setStep("loading");
      fetchAudit(fromHome)
        .then(r => { pendingResult.current = r; setResult(r); setApiReady(true); })
        .catch(e => { setUrlError(e instanceof Error ? e.message : "Could not reach PageSpeed API"); setStep("url"); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transition out of loading step when API is ready
  // The ScanLoader itself signals when it's displayed 100% — we use apiReady + a small delay
  useEffect(() => {
    if (apiReady && step === "loading" && result) {
      const t = setTimeout(() => {
        if (isAuthed) {
          setStep("report");
        } else {
          setStep("teaser");
        }
      }, 800);
      return () => clearTimeout(t);
    }
  }, [apiReady, step, result, isAuthed]);

  const isCentred = !["report", "pitch"].includes(step);
  const go = (update: Partial<FunnelData>, next: Step) => { setFd(p => ({ ...p, ...update })); setStep(next); };

  const runAudit = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setUrlError(""); setFd(p => ({ ...p, url: targetUrl })); setApiReady(false); setStep("loading");
    try {
      const r = await fetchAudit(targetUrl);
      pendingResult.current = r;
      setResult(r);
      setApiReady(true);
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : "Could not reach PageSpeed API");
      setStep("url");
    }
  }, [isAuthed]);

  const submitEmail = useCallback(async () => {
    if (!emailInput.trim() || !result) return;
    setSubmitting(true);
    try {
      await fetch("/api/capture", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, url: result.url, score: result.metrics.performanceScore, totalMonthlyCost: result.totalMonthlyCost, severity: result.severity, source: "funnel", ...fd }),
      });
    } catch { /* swallow */ }
    setSubmitting(false);
    setFd(p => ({ ...p, email: emailInput }));
    setStep("report");
  }, [emailInput, result, fd]);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      <NavBar page="funnel" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: isCentred ? "center" : "flex-start", padding: isCentred ? "28px 16px 48px" : "0 16px 48px" }}>
        <AnimatePresence mode="wait">

          {step === "q1" && (
            <motion.div key="q1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ width: "100%" }}>
              <ProgressDots step="q1" />
              <Q q="What's costing you the most right now?" sub="We check all 4 pillars — pick your biggest pain.">
                <Choice icon="💸" label="Google Ads are bleeding money" sub="Slow site = Google charges more per click" onClick={() => go({ q1: "ads" }, "q2")} />
                <Choice icon="🔍" label="Invisible in Google search" sub="Competitors outrank me despite being worse" onClick={() => go({ q1: "seo" }, "q2")} />
                <Choice icon="⚖️" label="Worried about ADA / accessibility lawsuits" sub="WCAG violations = legal exposure" onClick={() => go({ q1: "ada" }, "q2")} />
                <Choice icon="🔥" label="All of it — the site is a liability" onClick={() => go({ q1: "all" }, "q2")} />
              </Q>
            </motion.div>
          )}

          {step === "q2" && (
            <motion.div key="q2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ width: "100%" }}>
              <ProgressDots step="q2" />
              <Q q="How much annual revenue flows through this site?" sub="We calculate your exact dollars at risk.">
                <Choice icon="🌱" label="Under $25,000" sub="Early-stage or side business" onClick={() => go({ q2: "sub25k" }, "q3")} />
                <Choice icon="📈" label="$25k – $150k" sub="Growing — leaks are real but recoverable" onClick={() => go({ q2: "25-150k" }, "q3")} />
                <Choice icon="💼" label="$150k – $500k" sub="Every percentage point matters" onClick={() => go({ q2: "150-500k" }, "q3")} />
                <Choice icon="🏆" label="$500k+" sub="Enterprise — compliance is non-negotiable" onClick={() => go({ q2: "500k+" }, "q3")} />
              </Q>
            </motion.div>
          )}

          {step === "q3" && (
            <motion.div key="q3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ width: "100%" }}>
              <ProgressDots step="q3" />
              <Q q="Has this site had a full 4-pillar audit?" sub="Performance · SEO · Accessibility · Security">
                <Choice icon="🙈" label="Never — flying completely blind" onClick={() => go({ q3: "never" }, "url")} />
                <Choice icon="⚡" label="Speed only — never checked SEO or compliance" sub="Most teams only check Lighthouse" onClick={() => go({ q3: "speed-only" }, "url")} />
                <Choice icon="📅" label="Over a year ago — a lot has changed" onClick={() => go({ q3: "year+" }, "url")} />
                <Choice icon="✅" label="Recently — want an independent second opinion" onClick={() => go({ q3: "recent" }, "url")} />
              </Q>
            </motion.div>
          )}

          {step === "url" && (
            <motion.div key="url" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ width: "100%" }}>
              <ProgressDots step="url" />
              <Q q="Run your free 4-pillar diagnostic." sub="Performance · SEO · Accessibility · Security — real Google data, zero cost.">
                <input type="url" inputMode="url" autoComplete="url"
                  value={urlInput} onChange={e => { setUrlInput(e.target.value); setUrlError(""); }}
                  onKeyDown={e => e.key === "Enter" && urlInput.trim() && runAudit(urlInput)}
                  placeholder="https://yourwebsite.com" autoFocus
                  style={{ width: "100%", background: "var(--surface)", border: `1px solid ${urlError ? "rgba(232,52,26,0.6)" : "var(--border2)"}`, borderRadius: 10, padding: "14px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 16, marginBottom: urlError ? 8 : 10 }}
                />
                {urlError && <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", marginBottom: 10 }}>⚠ {urlError}</p>}
                <button onClick={() => urlInput.trim() && runAudit(urlInput)} disabled={!urlInput.trim()} className="btn-primary"
                  style={{ width: "100%", padding: "16px", borderRadius: 10, fontSize: 13, letterSpacing: "0.12em", opacity: !urlInput.trim() ? 0.6 : 1 }}>
                  SHOW ME MY LEAK NUMBER →
                </button>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textAlign: "center" }}>
                  Free · No account needed · We&apos;ll ask for your email after the scan to send your report
                </p>
              </Q>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: "100%" }}>
              <ScanLoader url={urlInput || fd.url || searchParams.get("url") || ""} apiReady={apiReady} />
            </motion.div>
          )}

          {step === "teaser" && result && (
            <motion.div key="teaser" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: "100%", padding: "20px 0" }}>
              <ScanTeaser result={result} onContinue={() => setStep("email")} />
            </motion.div>
          )}

          {step === "email" && result && (
            <motion.div key="email" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ width: "100%", maxWidth: 460, margin: "0 auto" }}>
              <div style={{ padding: "28px 24px", background: "var(--surface)", border: "1px solid rgba(232,52,26,0.3)", borderRadius: 16, boxShadow: "0 0 60px rgba(232,52,26,0.1)" }}>
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "50%", background: "rgba(232,52,26,0.1)", border: "1px solid rgba(232,52,26,0.25)", fontSize: 24, marginBottom: 12 }}>🔍</div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 8 }}>YOUR REPORT IS READY</p>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,5vw,30px)", color: "var(--text)", letterSpacing: "0.04em", lineHeight: 1.05, marginBottom: 6 }}>
                    YOUR SITE IS LEAKING<br /><span style={{ color: "var(--accent)" }}>${result.totalMonthlyCost.toLocaleString()}/MO</span>
                  </h3>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.55, marginBottom: 10 }}>Enter your email to unlock all {result.explanations.length} findings and the full fix plan.</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
                  <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: 8, border: "1px solid rgba(232,52,26,0.15)", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--accent)" }}>{result.metrics.performanceScore}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.08em", marginTop: 2 }}>SCORE/100</div>
                  </div>
                  <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: 8, border: "1px solid rgba(232,52,26,0.15)", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--accent)" }}>${result.totalMonthlyCost.toLocaleString()}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.08em", marginTop: 2 }}>LEAKING /MO</div>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" id="email-consent" checked={emailConsent}
                      onChange={e => setEmailConsent(e.target.checked)}
                      style={{ marginTop: 3, accentColor: "var(--accent)", flexShrink: 0, width: 16, height: 16 }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>
                      I agree to receive my report and occasional product updates by email. Unsubscribe anytime.{" "}
                      <a href="/legal/privacy" target="_blank" style={{ color: "var(--accent)", textDecoration: "none" }}>Privacy Policy</a>
                    </span>
                  </label>
                </div>
                <input type="email" inputMode="email" autoComplete="email"
                  value={emailInput} onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitEmail()}
                  placeholder="your@email.com" autoFocus
                  style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "13px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 16, marginBottom: 10 }}
                />
                <button onClick={submitEmail} disabled={submitting || !emailInput.trim() || !emailConsent} className="btn-primary"
                  style={{ width: "100%", padding: "15px", borderRadius: 8, fontSize: 12, letterSpacing: "0.14em", opacity: (!emailInput.trim() || !emailConsent) ? 0.5 : 1 }}>
                  {submitting ? "UNLOCKING..." : "UNLOCK MY FULL REPORT →"}
                </button>
                {!emailConsent && emailInput.trim() && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--warn)", textAlign: "center", marginTop: 6, letterSpacing: "0.06em" }}>
                    ⚠ Please tick the box above to continue
                  </p>
                )}
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textAlign: "center", marginTop: 10 }}>
                  No spam ·{" "}
                  <a href="/legal/privacy" style={{ color: "var(--muted2)", textDecoration: "underline" }}>Privacy Policy</a>
                </p>
              </div>
            </motion.div>
          )}

          {step === "report" && result && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%" }}>
              <div style={{ width: "100%", maxWidth: 880, margin: "0 auto", paddingTop: 20 }}>
                <button onClick={() => setShowIntelligence(p => !p)}
                  style={{ width: "100%", padding: "12px 18px", marginBottom: 12, borderRadius: 10, background: showIntelligence ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.03)", border: `1px solid ${showIntelligence ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.15)"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, transition: "all 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16 }}>🔬</span>
                    <div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#f59e0b", letterSpacing: "0.1em" }}>URL INTELLIGENCE — CATEGORISED BREAKDOWN</span>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>See exactly what&apos;s broken: SEO gaps, tech debt, security risks, lead capture issues</div>
                    </div>
                  </div>
                  <motion.span animate={{ rotate: showIntelligence ? 180 : 0 }} style={{ color: "var(--muted)", fontSize: 11, flexShrink: 0 }}>▼</motion.span>
                </button>
                <AnimatePresence>
                  {showIntelligence && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden", marginBottom: 16 }}>
                      <URLIntelligencePanel result={result} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <ResultsPanel result={result} onDiscover={() => setStep("discover")} />
            </motion.div>
          )}

          {step === "discover" && (
            <motion.div key="discover" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ width: "100%" }}>
              <Discover onDone={(bt, goal) => {
                const u = { ...fd, businessType: bt, goal };
                setFd(u);
                if (result) setPitch(buildPitch(result, u));
                setStep("pitch");
              }} />
            </motion.div>
          )}

          {step === "pitch" && pitch && (
            <motion.div key="pitch" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ width: "100%", maxWidth: 640, margin: "0 auto", padding: "20px 0" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.16em", marginBottom: 10, textAlign: "center" }}>YOUR PERSONALISED RECOVERY PLAN</p>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,5vw,38px)", color: "var(--text)", textAlign: "center", letterSpacing: "0.03em", lineHeight: 1.05, marginBottom: 8 }}>{pitch.headline}</h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", textAlign: "center", marginBottom: 22, lineHeight: 1.6 }}>{pitch.sub}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pitch.cards.map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    style={{ padding: "18px", borderRadius: 14, background: card.highlight ? "linear-gradient(135deg,rgba(167,139,250,0.08),rgba(167,139,250,0.03))" : "var(--surface)", border: `1px solid ${card.highlight ? "rgba(167,139,250,0.3)" : "var(--border)"}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{card.icon}</span>
                        <div>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: card.highlight ? "#a78bfa" : "var(--muted)", letterSpacing: "0.12em", marginBottom: 2 }}>{card.tag}</p>
                          <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{card.title}</p>
                        </div>
                      </div>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: card.highlight ? "#a78bfa" : "var(--text)", whiteSpace: "nowrap" }}>{card.price}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                      {card.bullets.map((b, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ color: card.highlight ? "#a78bfa" : "#10b981", fontSize: 10, marginTop: 3, flexShrink: 0 }}>✓</span>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>{b}</span>
                        </div>
                      ))}
                    </div>
                    <a href={card.href} style={{ display: "block", padding: "12px", borderRadius: 8, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textDecoration: "none", background: card.highlight ? "#a78bfa" : "none", color: card.highlight ? "#fff" : "var(--text2)", border: card.highlight ? "none" : "1px solid var(--border2)" }}>
                      {card.cta}
                    </a>
                  </motion.div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <button onClick={() => setStep("phone")}
                  style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
                  Want someone to walk you through this? →
                </button>
              </div>
            </motion.div>
          )}

          {step === "phone" && (
            <motion.div key="phone" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
              <div style={{ padding: "28px 24px", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 16, textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 10 }}>FREE 20-MIN CALL</p>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,5vw,30px)", color: "var(--text)", letterSpacing: "0.04em", lineHeight: 1.05, marginBottom: 10 }}>WE&apos;LL CALL WITHIN 2 HOURS</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", marginBottom: 18, lineHeight: 1.6 }}>No pitch. Just a live walkthrough of your results and the highest-ROI fix.</p>
                <input type="tel" inputMode="tel" autoComplete="tel"
                  value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && phoneInput.trim() && setStep("booked")}
                  placeholder="+1 (555) 000-0000" autoFocus
                  style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "13px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 16, marginBottom: 10 }}
                />
                <button onClick={() => phoneInput.trim() && setStep("booked")} disabled={!phoneInput.trim()} className="btn-primary"
                  style={{ width: "100%", padding: "15px", borderRadius: 8, fontSize: 12, letterSpacing: "0.14em" }}>
                  BOOK MY FREE CALL →
                </button>
              </div>
            </motion.div>
          )}

          {step === "booked" && (
            <motion.div key="booked" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", maxWidth: 460, margin: "0 auto", padding: "20px 16px" }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,6vw,46px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 10 }}>YOU&apos;RE BOOKED.</h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.7, marginBottom: 24 }}>We&apos;ll call within 2 hours. Have your site open — we&apos;ll walk through the exact fixes live.</p>
              <a href="/subscribe" className="btn-primary" style={{ display: "inline-block", padding: "14px 36px", borderRadius: 10, textDecoration: "none", fontSize: 12, letterSpacing: "0.14em" }}>
                EXPLORE NEXUS PULSE →
              </a>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}

export default function Funnel() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", letterSpacing: "0.1em" }}>LOADING...</span>
      </main>
    }>
      <FunnelInner />
    </Suspense>
  );
}