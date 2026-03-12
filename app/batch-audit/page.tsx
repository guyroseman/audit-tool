"use client";
import { useState, useCallback } from "react";
import { fetchAudit } from "../lib/audit";
import type { AuditResult } from "../lib/audit";

// ─── Password gate ────────────────────────────────────────────────────────────
const GATE_PASSWORD = process.env.NEXT_PUBLIC_BATCH_PASSWORD ?? "nexus2024";

// ─── Types ────────────────────────────────────────────────────────────────────
type RowStatus = "pending" | "scanning" | "done" | "error";

interface BatchRow {
  id: string;
  url: string;
  status: RowStatus;
  result: AuditResult | null;
  error: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normaliseUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return "https://" + t;
}

function domain(url: string): string {
  try { return new URL(normaliseUrl(url)).hostname.replace("www.", ""); }
  catch { return url; }
}

function funnelLink(url: string): string {
  const base = (typeof window !== "undefined" ? window.location.origin : null)
    ?? process.env.NEXT_PUBLIC_SITE_URL
    ?? "https://usenexus.io";
  return `${base}/funnel?url=${encodeURIComponent(normaliseUrl(url))}`;
}

function scoreColor(s: number) {
  if (s < 50) return "#e8341a";
  if (s < 80) return "#f59e0b";
  return "#10b981";
}

function riskBadge(level: string) {
  const colors: Record<string, string> = { high: "#e8341a", medium: "#f59e0b", low: "#10b981" };
  return colors[level] ?? "#6b7280";
}

function buildColdEmail(row: BatchRow): string {
  if (!row.result) return "";

  const r = row.result;
  const d = domain(row.url);
  const link = funnelLink(row.url);

  const perf = r.metrics.performanceScore;
  const seoScore = r.seo?.estimatedSeoScore ?? 0;
  const a11y = r.accessibility?.estimatedA11yScore ?? 0;
  const sec = r.security?.estimatedBestPracticesScore ?? 0;
  const adLoss = r.adLossPercent;
  const seoLoss = r.seo?.seoReachLossPercent ?? 0;
  const leak = r.totalMonthlyCost;
  const annualLoss = Math.round(leak * 12);
  const adaRisk = r.accessibility?.adaRiskLevel ?? "low";
  const vulnLibs = r.security?.vulnerableLibraryCount ?? 0;
  const missingAlt = r.accessibility?.missingAltText;
  const noOG = !r.seo?.hasOGTags;
  const noStructured = !r.seo?.hasStructuredData;
  const unusedJS = r.tech?.unusedJavascript;
  const noCache = r.tech?.noBrowserCache;
  const noCompression = r.tech?.noCompression;
  const renderBlocking = r.tech?.renderBlockingResources;

  // ── Subject line: pick the most urgent angle ──
  let subject = "";
  if (perf < 50 && adLoss > 30) {
    subject = `Quick note about ${d}'s Google ad spend`;
  } else if (adaRisk === "high") {
    subject = `Accessibility issue flagged on ${d}`;
  } else if (seoLoss > 40) {
    subject = `${d} — organic traffic finding`;
  } else if (vulnLibs > 0) {
    subject = `Security flag on ${d}`;
  } else {
    subject = `${d} — site diagnostic results`;
  }

  // ── Performance section ──
  let perfSection = "";
  if (perf >= 80) {
    perfSection = `Performance (${perf}/100) — solid. Your site loads quickly, which means Google isn't penalising your ad campaigns and visitors aren't bouncing before the page loads. Good foundation to build on.`;
  } else if (perf >= 60) {
    perfSection = `Performance (${perf}/100) — room to improve. Your site is functional but slower than Google's preferred threshold. This is likely adding ~${adLoss}% to your cost-per-click on paid campaigns, because Google charges more to advertise slow sites.${renderBlocking ? " Render-blocking resources are the likely culprit — these are scripts that force the browser to pause before displaying anything." : ""}${unusedJS ? " There's also unused JavaScript loading on every page visit that isn't needed." : ""}`;
  } else {
    perfSection = `Performance (${perf}/100) — this is the main issue. At this score, Google classifies your site as slow and applies a direct penalty to your ad campaigns — inflating your cost-per-click by approximately ${adLoss}%. That's an estimated £${r.monthlyAdOverspend.toLocaleString()}/month in ad overspend.${renderBlocking ? " Render-blocking scripts are preventing the page from loading." : ""}${unusedJS ? " Unused JavaScript is adding unnecessary weight to every page load." : ""}${noCache ? " Browser caching isn't configured, so returning visitors re-download the full site every time." : ""}${noCompression ? " Files aren't being compressed before being sent to the browser." : ""}`;
  }

  // ── SEO section ──
  let seoSection = "";
  if (seoScore >= 80) {
    seoSection = `SEO (${seoScore}/100) — well structured. Your meta tags, headings, and crawlability look good. Google can read and index the site without issues.`;
  } else if (seoScore >= 60) {
    seoSection = `SEO (${seoScore}/100) — a few gaps. Technical SEO issues are suppressing an estimated ${seoLoss}% of potential organic reach.${noOG ? " Open Graph tags are missing, which affects how the site appears when shared on LinkedIn or social media." : ""}${noStructured ? " Structured data isn't present, which means you're missing out on rich snippets in Google results." : ""}`;
  } else {
    seoSection = `SEO (${seoScore}/100) — significant issues. Google is suppressing an estimated ${seoLoss}% of potential organic traffic due to technical gaps.${noOG ? " Open Graph tags are missing." : ""}${noStructured ? " No structured data — Google can't generate rich results for your pages." : ""} This is traffic you're currently having to pay for through ads that should be coming organically.`;
  }

  // ── Accessibility section ──
  let a11ySection = "";
  if (a11y >= 80 && adaRisk === "low") {
    a11ySection = `Accessibility (${a11y}/100) — good. Your site is accessible to the majority of users, including those using screen readers or assistive technology. Low legal risk.`;
  } else if (adaRisk === "high") {
    a11ySection = `Accessibility (${a11y}/100) — high risk flagged. ADA web accessibility lawsuits have increased significantly year over year. Businesses receive demand letters with no prior warning.${missingAlt ? " Images on the site are missing alt text, which is one of the most commonly cited issues in ADA claims." : ""} This is worth reviewing with a developer regardless of other priorities.`;
  } else {
    a11ySection = `Accessibility (${a11y}/100) — some issues present. An estimated ${r.accessibility?.estimatedMarketLockout ?? 0}% of potential visitors may struggle to use the site properly.${missingAlt ? " Missing image alt text affects both accessibility and SEO." : ""}`;
  }

  // ── Security section ──
  let secSection = "";
  if (sec >= 80 && vulnLibs === 0) {
    secSection = `Security (${sec}/100) — clean. No vulnerable libraries detected and HTTPS is properly configured. Visitor trust signals are intact.`;
  } else if (vulnLibs > 0) {
    secSection = `Security (${sec}/100) — ${vulnLibs} vulnerable JavaScript ${vulnLibs === 1 ? "library" : "libraries"} detected. Outdated libraries are one of the most common entry points for site compromises. This also affects how Google scores the site's trustworthiness, which has a small but measurable impact on rankings.`;
  } else {
    secSection = `Security (${sec}/100) — a few best practice gaps. Nothing critical, but worth tidying up to maintain visitor trust and Google's trust signals.`;
  }

  // ── Closing CTA based on severity ──
  let cta = "";
  if (r.severity === "critical") {
    cta = `The full report includes a prioritised developer blueprint — the fixes are ranked by revenue impact so your team knows exactly where to start. I'd suggest at least having someone take a look at the performance issues first, as those are directly inflating your ad spend right now.`;
  } else {
    cta = `The full report includes a prioritised fix list your developer can work through. Some of these are quick wins that can be resolved in an afternoon.`;
  }

  return `Subject: ${subject}

Hi,

I put together a free diagnostic report for ${d} and wanted to share the findings — figured it's more useful than keeping them to myself.

Here's a plain-English breakdown across the four areas we check:

---

${perfSection}

${seoSection}

${a11ySection}

${secSection}

---

Overall, the site is estimated to be losing around £${leak.toLocaleString()}/month (£${annualLoss.toLocaleString()}/year) in recoverable revenue from these combined issues.

${cta}

Your full report is here — no account needed:
${link}

Happy to answer any questions if anything's unclear.

Best,
[Your name]`;
}

// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyBtn({ text, label = "COPY" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: copied ? "#10b981" : "var(--muted)", background: "none", border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "var(--border2)"}`, padding: "3px 9px", borderRadius: 4, cursor: "pointer", letterSpacing: "0.08em", transition: "all 0.2s" }}
    >
      {copied ? "✓ COPIED" : label}
    </button>
  );
}

// ─── Result row ───────────────────────────────────────────────────────────────
function ResultRow({ row, idx }: { row: BatchRow; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const r = row.result;

  return (
    <div style={{ borderBottom: "1px solid var(--border)", overflow: "hidden" }}>
      {/* Main row */}
      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 72px 72px 72px 90px 90px 100px 36px", gap: 0, alignItems: "center", padding: "10px 16px", background: expanded ? "rgba(255,255,255,0.02)" : "transparent", transition: "background 0.15s" }}>

        {/* Index */}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)" }}>{String(idx + 1).padStart(2, "0")}</span>

        {/* Domain */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {domain(row.url)}
          </div>
          {row.status === "scanning" && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--accent)", marginTop: 2 }}>
              ▶ scanning...
            </div>
          )}
          {row.status === "error" && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#e8341a", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              ✗ {row.error}
            </div>
          )}
        </div>

        {/* Perf score */}
        <div style={{ textAlign: "center" }}>
          {r ? (
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: scoreColor(r.metrics.performanceScore) }}>
              {r.metrics.performanceScore}
            </span>
          ) : <span style={{ color: "var(--muted2)", fontSize: 10 }}>—</span>}
        </div>

        {/* Monthly leak */}
        <div style={{ textAlign: "center" }}>
          {r ? (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#e8341a" }}>
              £{r.totalMonthlyCost.toLocaleString()}
            </span>
          ) : <span style={{ color: "var(--muted2)", fontSize: 10 }}>—</span>}
        </div>

        {/* Ad loss */}
        <div style={{ textAlign: "center" }}>
          {r ? (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: r.adLossPercent > 20 ? "#e8341a" : "#f59e0b" }}>
              {r.adLossPercent}%
            </span>
          ) : <span style={{ color: "var(--muted2)", fontSize: 10 }}>—</span>}
        </div>

        {/* ADA risk */}
        <div style={{ textAlign: "center" }}>
          {r ? (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: riskBadge(r.accessibility?.adaRiskLevel ?? "low"), background: riskBadge(r.accessibility?.adaRiskLevel ?? "low") + "18", border: `1px solid ${riskBadge(r.accessibility?.adaRiskLevel ?? "low")}30`, padding: "2px 7px", borderRadius: 3 }}>
              {(r.accessibility?.adaRiskLevel ?? "low").toUpperCase()}
            </span>
          ) : <span style={{ color: "var(--muted2)", fontSize: 10 }}>—</span>}
        </div>

        {/* Severity */}
        <div style={{ textAlign: "center" }}>
          {r ? (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: r.severity === "critical" ? "#e8341a" : r.severity === "warning" ? "#f59e0b" : "#10b981", background: (r.severity === "critical" ? "rgba(232,52,26," : r.severity === "warning" ? "rgba(245,158,11," : "rgba(16,185,129,") + "0.1)", border: `1px solid ${r.severity === "critical" ? "rgba(232,52,26,0.3)" : r.severity === "warning" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`, padding: "2px 7px", borderRadius: 3 }}>
              {r.severity?.toUpperCase()}
            </span>
          ) : <span style={{ color: "var(--muted2)", fontSize: 10 }}>—</span>}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
          {r && (
            <>
              <CopyBtn text={funnelLink(row.url)} label="LINK" />
              <button
                onClick={() => setExpanded(e => !e)}
                style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: expanded ? "var(--accent)" : "var(--muted)", background: "none", border: `1px solid ${expanded ? "rgba(232,52,26,0.3)" : "var(--border2)"}`, padding: "3px 9px", borderRadius: 4, cursor: "pointer", letterSpacing: "0.08em" }}
              >
                {expanded ? "CLOSE" : "EMAIL"}
              </button>
            </>
          )}
          {row.status === "scanning" && (
            <div style={{ width: 14, height: 14, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          )}
        </div>

        {/* Expand toggle */}
        <div style={{ textAlign: "center" }}>
          {r && (
            <button onClick={() => setExpanded(e => !e)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 11 }}>
              {expanded ? "▲" : "▼"}
            </button>
          )}
        </div>
      </div>

      {/* Expanded email panel */}
      {expanded && r && (
        <div style={{ padding: "0 16px 16px 44px", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ padding: "8px 14px", background: "rgba(167,139,250,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa", letterSpacing: "0.1em" }}>✉ COLD EMAIL — READY TO SEND</span>
              <CopyBtn text={buildColdEmail(row)} label="COPY EMAIL" />
            </div>
            <pre style={{ margin: 0, padding: "12px 14px", background: "rgba(0,0,0,0.3)", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text2)", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {buildColdEmail(row)}
            </pre>
          </div>

          {/* Quick stats row */}
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            {[
              { label: "SEO SCORE", val: `${r.seo?.estimatedSeoScore ?? 0}/100` },
              { label: "A11Y SCORE", val: `${r.accessibility?.estimatedA11yScore ?? 0}/100` },
              { label: "SECURITY", val: `${r.security?.estimatedBestPracticesScore ?? 0}/100` },
              { label: "VULN LIBS", val: `${r.security?.vulnerableLibraryCount ?? 0} found` },
              { label: "SEO REACH LOST", val: `${r.seo?.seoReachLossPercent ?? 0}%` },
              { label: "MARKET LOCKOUT", val: `${r.accessibility?.estimatedMarketLockout ?? 0}%` },
              { label: "ANNUAL LOSS", val: `£${Math.round(r.totalMonthlyCost * 12).toLocaleString()}` },
            ].map(({ label, val }) => (
              <div key={label} style={{ padding: "5px 10px", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: "var(--muted)", marginBottom: 2 }}>{label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)" }}>{val}</div>
              </div>
            ))}
            <a href={funnelLink(row.url)} target="_blank" rel="noopener"
              style={{ padding: "5px 14px", borderRadius: 6, background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.25)", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center" }}>
              VIEW REPORT ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BatchAudit() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [running, setRunning] = useState(false);

  // ── Run batch — must be declared before any conditional return ──
  const runBatch = useCallback(async () => {
    const urls = input.split("\n").map(l => l.trim()).filter(Boolean);
    if (!urls.length) return;
    setRunning(true);

    const initial: BatchRow[] = urls.map((url, i) => ({
      id: `row-${i}-${Date.now()}`,
      url,
      status: "pending",
      result: null,
      error: "",
    }));
    setRows(initial);

    for (let i = 0; i < initial.length; i++) {
      setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: "scanning" } : r));
      try {
        const result = await fetchAudit(normaliseUrl(initial[i].url));
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: "done", result } : r));
      } catch (e) {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: "error", error: e instanceof Error ? e.message : "Failed" } : r));
      }
      if (i < initial.length - 1) await new Promise(res => setTimeout(res, 1200));
    }
    setRunning(false);
  }, [input]);

  // ── Auth ──
  if (!authed) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 360, padding: "36px 32px", background: "var(--surface)", border: `1px solid ${pwError ? "rgba(232,52,26,0.4)" : "var(--border2)"}`, borderRadius: 14 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.16em", marginBottom: 8 }}>NEXUS // INTERNAL</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text)", letterSpacing: "0.06em", marginBottom: 24 }}>BATCH AUDIT ENGINE</h1>
          <input
            type="password" value={pw} onChange={e => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={e => { if (e.key === "Enter") { if (pw === GATE_PASSWORD) setAuthed(true); else setPwError(true); } }}
            placeholder="access code"
            autoFocus
            style={{ width: "100%", background: "var(--bg)", border: `1px solid ${pwError ? "rgba(232,52,26,0.5)" : "var(--border2)"}`, borderRadius: 8, padding: "12px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14, marginBottom: 10, boxSizing: "border-box" as const }}
          />
          {pwError && <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", marginBottom: 10 }}>⚠ incorrect access code</p>}
          <button
            onClick={() => { if (pw === GATE_PASSWORD) setAuthed(true); else setPwError(true); }}
            style={{ width: "100%", padding: "12px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", cursor: "pointer" }}
          >
            AUTHENTICATE →
          </button>
        </div>
      </main>
    );
  }

  const done = rows.filter(r => r.status === "done");
  const criticalCount = done.filter(r => r.result?.severity === "critical").length;
  const totalLeak = done.reduce((a, r) => a + (r.result?.totalMonthlyCost ?? 0), 0);

  // Build a combined CSV export
  function exportCsv() {
    const headers = ["Domain", "URL", "Perf Score", "Monthly Leak (£)", "Ad Loss %", "SEO Score", "A11Y Score", "Security Score", "ADA Risk", "Severity", "Funnel Link"];
    const rows2 = done.map(r => {
      const res = r.result!;
      return [
        domain(r.url), r.url,
        res.metrics.performanceScore,
        res.totalMonthlyCost,
        res.adLossPercent,
        res.seo?.estimatedSeoScore ?? 0,
        res.accessibility?.estimatedA11yScore ?? 0,
        res.security?.estimatedBestPracticesScore ?? 0,
        res.accessibility?.adaRiskLevel ?? "low",
        res.severity,
        funnelLink(r.url),
      ].join(",");
    });
    const csv = [headers.join(","), ...rows2].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nexus-batch-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)", background: "rgba(8,15,28,0.97)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100, height: 54, display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
          <svg width={14} height={14} viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--text)", letterSpacing: "0.08em" }}>NEXUS</span>
        </a>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.2)", padding: "2px 8px", borderRadius: 3 }}>INTERNAL // BATCH ENGINE</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {done.length > 0 && (
            <button onClick={exportCsv} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#10b981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", padding: "5px 12px", borderRadius: 6, cursor: "pointer", letterSpacing: "0.08em" }}>
              ↓ EXPORT CSV
            </button>
          )}
          <button onClick={() => { setRows([]); setInput(""); }} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", background: "none", border: "1px solid var(--border2)", padding: "5px 12px", borderRadius: 6, cursor: "pointer" }}>
            CLEAR
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,5vw,44px)", color: "var(--text)", letterSpacing: "0.04em", lineHeight: 1, marginBottom: 8 }}>
            COLD EMAIL <span style={{ color: "var(--accent)" }}>SNIPER</span>
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)" }}>
            Paste up to 20 URLs — one per line. We scan each one and generate a personalised cold email ready to send.
          </p>
        </div>

        {/* Input area */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 20, alignItems: "flex-start" }}>
          <div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={"acmeplumbing.co.uk\nhttps://shopexample.com\nbestlawfirm.com\n..."}
              disabled={running}
              rows={6}
              style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "13px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12, resize: "vertical", lineHeight: 1.8, boxSizing: "border-box" as const, opacity: running ? 0.5 : 1 }}
            />
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", marginTop: 5 }}>
              {input.split("\n").filter(l => l.trim()).length} URLs entered · Scans run sequentially (~30–60s each)
            </p>
          </div>
          <button
            onClick={runBatch}
            disabled={running || !input.trim()}
            style={{ padding: "14px 28px", background: running ? "var(--surface)" : "var(--accent)", color: running ? "var(--muted)" : "#fff", border: `1px solid ${running ? "var(--border)" : "transparent"}`, borderRadius: 10, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", cursor: running ? "not-allowed" : "pointer", whiteSpace: "nowrap", boxShadow: running ? "none" : "0 0 24px rgba(232,52,26,0.3)", transition: "all 0.2s" }}
          >
            {running ? "SCANNING..." : "RUN BATCH →"}
          </button>
        </div>

        {/* Summary bar */}
        {done.length > 0 && (
          <div style={{ display: "flex", gap: 16, padding: "12px 16px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { label: "SCANNED", val: `${done.length}/${rows.length}`, color: "var(--text)" },
              { label: "CRITICAL", val: criticalCount, color: criticalCount > 0 ? "#e8341a" : "var(--muted)" },
              { label: "TOTAL MONTHLY LEAK", val: `£${totalLeak.toLocaleString()}`, color: "#e8341a" },
              { label: "AVG SCORE", val: `${Math.round(done.reduce((a, r) => a + (r.result?.metrics.performanceScore ?? 0), 0) / done.length)}/100`, color: scoreColor(Math.round(done.reduce((a, r) => a + (r.result?.metrics.performanceScore ?? 0), 0) / done.length)) },
              { label: "HIGH ADA RISK", val: done.filter(r => r.result?.accessibility?.adaRiskLevel === "high").length, color: "#f59e0b" },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: "var(--muted)", letterSpacing: "0.1em", marginBottom: 2 }}>{label}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Results table */}
        {rows.length > 0 && (
          <div style={{ borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 72px 72px 72px 90px 90px 100px 36px", gap: 0, padding: "8px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              {["#", "DOMAIN", "PERF", "LEAK/MO", "AD TAX", "ADA RISK", "SEVERITY", "ACTIONS", ""].map(h => (
                <span key={h} style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.1em" }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {rows.map((row, i) => (
              <ResultRow key={row.id} row={row} idx={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {rows.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed rgba(167,139,250,0.2)", borderRadius: 12 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "rgba(167,139,250,0.2)", marginBottom: 12 }}>TARGET LIST EMPTY</div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>Paste URLs above and hit RUN BATCH to generate cold email assets</p>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}