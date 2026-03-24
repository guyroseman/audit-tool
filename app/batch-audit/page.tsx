"use client";
import { useState, useCallback, useRef } from "react";
import { fetchAudit } from "../lib/audit";
import type { AuditResult } from "../lib/audit";

const GATE_PASSWORD = process.env.NEXT_PUBLIC_BATCH_PASSWORD ?? "nexus2024";

// ─── Types ────────────────────────────────────────────────────────────────────
type RowStatus = "pending" | "scanning" | "done" | "error";

interface BatchRow {
  id: string;
  url: string;
  email: string;
  firstName: string;
  company: string;
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

function funnelLink(url: string, result?: import("../lib/audit").AuditResult | null): string {
  const base = (typeof window !== "undefined" ? window.location.origin : null)
    ?? process.env.NEXT_PUBLIC_SITE_URL
    ?? "https://nexusdiag.com";
  if (result) {
    try {
      const encoded = btoa(JSON.stringify(result));
      return `${base}/funnel?url=${encodeURIComponent(normaliseUrl(url))}&data=${encodeURIComponent(encoded)}`;
    } catch { /* fall through */ }
  }
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

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseApolloCsv(text: string): Omit<BatchRow, "id" | "status" | "result" | "error">[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // Parse CSV respecting quoted fields
  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, "").trim());
  const firstNameIdx = headers.indexOf("first name");
  const emailIdx = headers.indexOf("email");
  const websiteIdx = headers.indexOf("website");
  const companyIdx = headers.indexOf("company name");

  const rows: Omit<BatchRow, "id" | "status" | "result" | "error">[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const url = cols[websiteIdx]?.replace(/"/g, "").trim() ?? "";
    const email = cols[emailIdx]?.replace(/"/g, "").trim() ?? "";
    if (!url || !email) continue;
    rows.push({
      url,
      email,
      firstName: cols[firstNameIdx]?.replace(/"/g, "").trim() ?? "",
      company: cols[companyIdx]?.replace(/"/g, "").trim() ?? "",
    });
  }
  return rows;
}

// ─── Email builder ────────────────────────────────────────────────────────────
function buildEmailContent(row: BatchRow): { subject: string; body: string } {
  if (!row.result) return { subject: "", body: "" };

  const r = row.result;
  const d = domain(row.url);
  const link = funnelLink(row.url, row.result);
  const name = row.firstName;

  const perf = r.metrics.performanceScore;
  const seoScore = r.seo?.estimatedSeoScore ?? 0;
  const adLoss = r.adLossPercent;
  const seoLoss = r.seo?.seoReachLossPercent ?? 0;
  const adaRisk = r.accessibility?.adaRiskLevel ?? "low";
  const vulnLibs = r.security?.vulnerableLibraryCount ?? 0;
  const geoScore = r.geo?.geoScore ?? 0;

  const hi = name ? `Hi ${name},` : "Hi,";
  const entropy = d.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  // Rotate CTA phrasing — avoid spam-flagged phrases like "free" or "no sign-up"
  const cta = ["Here's the full breakdown:", "I put the report here:", "Details are here:"][entropy % 3];
  const intro = `I run Nexus — we build website auditing tools that show businesses exactly where they're losing revenue online.`;
  const footer = `Alex\nNexus — nexusdiag.com\nalex@nexusdiag.com`;

  type Draft = { subject: string; body: string };
  const drafts: Draft[] = [];

  // 1. Ad spend penalty (highest $$ signal)
  // Avoided: "click", "score", "$X", "%", "extra"
  if (perf < 55 && adLoss > 20) {
    const overspend = r.monthlyAdOverspend.toLocaleString();
    drafts.push({
      subject: `${d} — ad spend finding`,
      body: `${hi}\n\n${intro}\n\nI ran ${d} through our tool and wanted to flag something. The site rated ${perf} out of 100 — Google's ad auction penalises slower sites, meaning your campaigns are likely paying more per placement than faster competitors in the same auction. The gap works out to roughly ${overspend} a month in avoidable ad spend.\n\n${cta}\n${link}\n\n${footer}`,
    });
  }

  // 2. ADA risk
  if (adaRisk === "high") {
    drafts.push({
      subject: `accessibility flag — ${d}`,
      body: `${hi}\n\n${intro}\n\nI ran ${d} through our tool and flagged a high ADA compliance risk. Most businesses find out about this when a demand letter arrives — the issues are usually fixable without a full rebuild.\n\n${cta}\n${link}\n\n${footer}`,
    });
  }

  // 3. SEO reach loss
  // Avoided: "%"
  if (seoLoss > 30 && seoScore < 65) {
    drafts.push({
      subject: `${d} — organic visibility gap`,
      body: `${hi}\n\n${intro}\n\nI ran ${d} through our tool — a significant portion of potential organic reach is being blocked by technical issues Google is sensitive to. The report has the specifics.\n\n${cta}\n${link}\n\n${footer}`,
    });
  }

  // 4. Security
  if (vulnLibs > 0) {
    drafts.push({
      subject: `${d} — ${vulnLibs} security flag${vulnLibs > 1 ? "s" : ""}`,
      body: `${hi}\n\n${intro}\n\nI ran ${d} through our tool and found ${vulnLibs} JavaScript ${vulnLibs === 1 ? "library" : "libraries"} with known vulnerabilities. Worth patching before they cause a problem — whoever manages the site would know how to handle it.\n\n${cta}\n${link}\n\n${footer}`,
    });
  }

  // 5. AI search visibility
  // Avoided: "score"
  if (geoScore < 50) {
    drafts.push({
      subject: `${d} — AI search visibility`,
      body: `${hi}\n\n${intro}\n\nI ran ${d} through our AI visibility audit — it rated ${geoScore} out of 100 for citation readiness. ChatGPT, Perplexity, and Gemini rely on specific structural signals to surface and reference sites. A few targeted changes can move this significantly.\n\n${cta}\n${link}\n\n${footer}`,
    });
  }

  // 6. General performance fallback
  // Avoided: "score", "click", "%"
  if (perf < 75) {
    drafts.push({
      subject: `quick look at ${d}`,
      body: `${hi}\n\n${intro}\n\nI ran ${d} through our tool — the site came back at ${perf} out of 100, ${adLoss > 10 ? `with some knock-on impact on ad campaigns` : `with a few things worth knowing about`}. The report has the detail.\n\n${cta}\n${link}\n\n${footer}`,
    });
  }

  // Absolute fallback
  const top = drafts[0] ?? {
    subject: `quick look at ${d}`,
    body: `${hi}\n\n${intro}\n\nI ran ${d} through our tool — worth a look at what came up.\n\n${cta}\n${link}\n\n${footer}`,
  };

  return top;
}

// ─── Gmail deep link ──────────────────────────────────────────────────────────
function gmailLink(row: BatchRow): string {
  if (!row.result || !row.email) return "";
  const { subject, body } = buildEmailContent(row);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(row.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
type SendStatus = "idle" | "sending" | "sent" | "error";

function ResultRow({ row, idx }: { row: BatchRow; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const r = row.result;
  const { subject, body } = r ? buildEmailContent(row) : { subject: "", body: "" };

  const sendViaBrevo = async () => {
    if (!row.email || !r) return;
    setSendStatus("sending");
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: row.email, toName: row.firstName || "", subject, body }),
      });
      setSendStatus(res.ok ? "sent" : "error");
    } catch {
      setSendStatus("error");
    }
  };

  return (
    <div style={{ borderBottom: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 72px 72px 72px 90px 90px 140px 36px", gap: 0, alignItems: "center", padding: "10px 16px", background: expanded ? "rgba(255,255,255,0.02)" : "transparent", transition: "background 0.15s" }}>

        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)" }}>{String(idx + 1).padStart(2, "0")}</span>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.firstName ? `${row.firstName} · ` : ""}{domain(row.url)}
          </div>
          {row.email && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {row.email}
            </div>
          )}
          {row.status === "scanning" && <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--accent)", marginTop: 2 }}>▶ scanning...</div>}
          {row.status === "error" && <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#e8341a", marginTop: 2 }}>✗ {row.error}</div>}
        </div>

        <div style={{ textAlign: "center" }}>
          {r ? <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: scoreColor(r.metrics.performanceScore) }}>{r.metrics.performanceScore}</span> : <span style={{ color: "var(--muted2)", fontSize: 10 }}>—</span>}
        </div>

        <div style={{ textAlign: "center" }}>
          {r ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#e8341a" }}>${r.totalMonthlyCost.toLocaleString()}</span> : <span style={{ color: "var(--muted2)", fontSize: 10 }}>—</span>}
        </div>

        <div style={{ textAlign: "center" }}>
          {r ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: r.adLossPercent > 20 ? "#e8341a" : "#f59e0b" }}>{r.adLossPercent}%</span> : <span style={{ color: "var(--muted2)", fontSize: 10 }}>—</span>}
        </div>

        <div style={{ textAlign: "center" }}>
          {r ? (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: riskBadge(r.accessibility?.adaRiskLevel ?? "low"), background: riskBadge(r.accessibility?.adaRiskLevel ?? "low") + "18", border: `1px solid ${riskBadge(r.accessibility?.adaRiskLevel ?? "low")}30`, padding: "2px 7px", borderRadius: 3 }}>
              {(r.accessibility?.adaRiskLevel ?? "low").toUpperCase()}
            </span>
          ) : <span style={{ color: "var(--muted2)", fontSize: 10 }}>—</span>}
        </div>

        <div style={{ textAlign: "center" }}>
          {r ? (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: r.severity === "critical" ? "#e8341a" : r.severity === "warning" ? "#f59e0b" : "#10b981", background: (r.severity === "critical" ? "rgba(232,52,26," : r.severity === "warning" ? "rgba(245,158,11," : "rgba(16,185,129,") + "0.1)", border: `1px solid ${r.severity === "critical" ? "rgba(232,52,26,0.3)" : r.severity === "warning" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`, padding: "2px 7px", borderRadius: 3 }}>
              {r.severity?.toUpperCase()}
            </span>
          ) : <span style={{ color: "var(--muted2)", fontSize: 10 }}>—</span>}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
          {r && row.email && (
            <button
              onClick={sendViaBrevo}
              disabled={sendStatus === "sending" || sendStatus === "sent"}
              style={{
                fontFamily: "var(--font-mono)", fontSize: 9, border: "none", padding: "4px 10px", borderRadius: 4, cursor: sendStatus === "sent" ? "default" : "pointer", letterSpacing: "0.06em", display: "inline-flex", alignItems: "center", gap: 4,
                color: "#fff",
                background: sendStatus === "sent" ? "#10b981" : sendStatus === "error" ? "#ef4444" : sendStatus === "sending" ? "rgba(232,52,26,0.5)" : "#e8341a",
                boxShadow: sendStatus === "sent" ? "0 0 10px rgba(16,185,129,0.3)" : "0 0 10px rgba(232,52,26,0.3)",
              }}
            >
              {sendStatus === "sending" ? "..." : sendStatus === "sent" ? "✓ SENT" : sendStatus === "error" ? "✗ ERR" : "✉ SEND"}
            </button>
          )}
          {r && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: expanded ? "var(--accent)" : "var(--muted)", background: "none", border: `1px solid ${expanded ? "rgba(232,52,26,0.3)" : "var(--border2)"}`, padding: "3px 8px", borderRadius: 4, cursor: "pointer" }}
            >
              {expanded ? "HIDE" : "VIEW"}
            </button>
          )}
          {row.status === "scanning" && (
            <div style={{ width: 14, height: 14, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          {r && <button onClick={() => setExpanded(e => !e)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 11 }}>{expanded ? "▲" : "▼"}</button>}
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && r && (
        <div style={{ padding: "0 16px 16px 44px", background: "rgba(0,0,0,0.2)" }}>
          {/* Email preview */}
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(232,52,26,0.2)", marginBottom: 10 }}>
            <div style={{ padding: "8px 14px", background: "rgba(232,52,26,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.1em" }}>TO: {row.email}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)" }}>· SUBJ: {subject}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <CopyBtn text={`${subject}\n\n${body}`} label="COPY EMAIL" />
                {row.email && (
                  <a href={gmailLink(row)} target="_blank" rel="noopener"
                    style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#fff", background: "#e8341a", padding: "3px 10px", borderRadius: 4, textDecoration: "none", letterSpacing: "0.08em" }}>
                    OPEN IN GMAIL →
                  </a>
                )}
              </div>
            </div>
            <pre style={{ margin: 0, padding: "12px 14px", background: "rgba(0,0,0,0.3)", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text2)", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {body}
            </pre>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "SEO", val: `${r.seo?.estimatedSeoScore ?? 0}/100` },
              { label: "A11Y", val: `${r.accessibility?.estimatedA11yScore ?? 0}/100` },
              { label: "SECURITY", val: `${r.security?.estimatedBestPracticesScore ?? 0}/100` },
              { label: "VULN LIBS", val: `${r.security?.vulnerableLibraryCount ?? 0}` },
              { label: "ANNUAL LOSS", val: `$${Math.round(r.totalMonthlyCost * 12).toLocaleString()}` },
            ].map(({ label, val }) => (
              <div key={label} style={{ padding: "5px 10px", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: "var(--muted)", marginBottom: 2 }}>{label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)" }}>{val}</div>
              </div>
            ))}
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
  const [mode, setMode] = useState<"manual" | "csv">("csv");
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvRows, setCsvRows] = useState<Omit<BatchRow, "id" | "status" | "result" | "error">[]>([]);

  const handleCsvUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseApolloCsv(text);
      setCsvRows(parsed);
      setMode("csv");
    };
    reader.readAsText(file);
  }, []);

  const runBatch = useCallback(async () => {
    let initial: BatchRow[] = [];

    if (mode === "csv" && csvRows.length > 0) {
      initial = csvRows.map((r, i) => ({
        ...r,
        id: `row-${i}-${Date.now()}`,
        status: "pending" as RowStatus,
        result: null,
        error: "",
      }));
    } else {
      const urls = input.split("\n").map(l => l.trim()).filter(Boolean);
      if (!urls.length) return;
      initial = urls.map((url, i) => ({
        id: `row-${i}-${Date.now()}`,
        url,
        email: "",
        firstName: "",
        company: "",
        status: "pending" as RowStatus,
        result: null,
        error: "",
      }));
    }

    setRunning(true);
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
  }, [mode, csvRows, input]);

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
            placeholder="access code" autoFocus
            style={{ width: "100%", background: "var(--bg)", border: `1px solid ${pwError ? "rgba(232,52,26,0.5)" : "var(--border2)"}`, borderRadius: 8, padding: "12px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14, marginBottom: 10, boxSizing: "border-box" as const }}
          />
          {pwError && <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", marginBottom: 10 }}>⚠ incorrect access code</p>}
          <button onClick={() => { if (pw === GATE_PASSWORD) setAuthed(true); else setPwError(true); }}
            style={{ width: "100%", padding: "12px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", cursor: "pointer" }}>
            AUTHENTICATE →
          </button>
        </div>
      </main>
    );
  }

  const done = rows.filter(r => r.status === "done");
  const criticalCount = done.filter(r => r.result?.severity === "critical").length;
  const totalLeak = done.reduce((a, r) => a + (r.result?.totalMonthlyCost ?? 0), 0);
  const withEmail = done.filter(r => r.email).length;

  function exportCsv() {
    const headers = ["Name", "Email", "Company", "Domain", "Perf Score", "Monthly Leak ($)", "Ad Loss %", "ADA Risk", "Severity", "Gmail Link"];
    const rows2 = done.map(r => {
      const res = r.result!;
      return [
        r.firstName, r.email, r.company, domain(r.url),
        res.metrics.performanceScore, res.totalMonthlyCost, res.adLossPercent,
        res.accessibility?.adaRiskLevel ?? "low", res.severity,
        r.email ? gmailLink(r) : "",
      ].map(v => `"${v}"`).join(",");
    });
    const csv = [headers.join(","), ...rows2].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nexus-outreach-${new Date().toISOString().slice(0, 10)}.csv`;
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
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.2)", padding: "2px 8px", borderRadius: 3 }}>INTERNAL // COLD EMAIL SNIPER</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {done.length > 0 && (
            <button onClick={exportCsv} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#10b981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", padding: "5px 12px", borderRadius: 6, cursor: "pointer", letterSpacing: "0.08em" }}>
              ↓ EXPORT CSV
            </button>
          )}
          <button onClick={() => { setRows([]); setInput(""); setCsvRows([]); }} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", background: "none", border: "1px solid var(--border2)", padding: "5px 12px", borderRadius: 6, cursor: "pointer" }}>
            CLEAR
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,5vw,44px)", color: "var(--text)", letterSpacing: "0.04em", lineHeight: 1, marginBottom: 8 }}>
            COLD EMAIL <span style={{ color: "var(--accent)" }}>SNIPER</span>
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)" }}>
            Upload your Apollo CSV or paste URLs manually. Scans each site, generates a personalised email, opens Gmail pre-filled — one click to send.
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["csv", "manual"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "6px 16px", borderRadius: 6, border: `1px solid ${mode === m ? "rgba(232,52,26,0.4)" : "var(--border2)"}`, background: mode === m ? "rgba(232,52,26,0.08)" : "none", color: mode === m ? "var(--accent)" : "var(--muted)", cursor: "pointer", letterSpacing: "0.08em" }}>
              {m === "csv" ? "↑ APOLLO CSV" : "✎ MANUAL URLS"}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div style={{ marginBottom: 20 }}>
          {mode === "csv" ? (
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: "1px dashed var(--border2)", borderRadius: 10, padding: "32px 20px", textAlign: "center", cursor: "pointer", background: csvRows.length > 0 ? "rgba(16,185,129,0.04)" : "var(--surface)", transition: "all 0.2s" }}
            >
              <input ref={fileRef} type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: "none" }} />
              {csvRows.length > 0 ? (
                <>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "#10b981", marginBottom: 4 }}>{csvRows.length}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#10b981", marginBottom: 8 }}>CONTACTS LOADED FROM APOLLO CSV</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)" }}>
                    {csvRows.filter(r => r.email).length} with email · {csvRows.filter(r => r.url).length} with website · click to replace
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--muted)", marginBottom: 6 }}>DROP APOLLO CSV HERE</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)" }}>or click to browse · exports your Apollo contact list with email + website columns</div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "flex-start" }}>
              <div>
                <textarea
                  value={input} onChange={e => setInput(e.target.value)}
                  placeholder={"acmeplumbing.co.uk\nhttps://shopexample.com\n..."} disabled={running} rows={6}
                  style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "13px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12, resize: "vertical", lineHeight: 1.8, boxSizing: "border-box" as const, opacity: running ? 0.5 : 1 }}
                />
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", marginTop: 5 }}>
                  {input.split("\n").filter(l => l.trim()).length} URLs · no email = no Gmail button, just audit data
                </p>
              </div>
              <button onClick={runBatch} disabled={running || !input.trim()}
                style={{ padding: "14px 28px", background: running ? "var(--surface)" : "var(--accent)", color: running ? "var(--muted)" : "#fff", border: `1px solid ${running ? "var(--border)" : "transparent"}`, borderRadius: 10, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", cursor: running ? "not-allowed" : "pointer", whiteSpace: "nowrap", boxShadow: running ? "none" : "0 0 24px rgba(232,52,26,0.3)" }}>
                {running ? "SCANNING..." : "RUN BATCH →"}
              </button>
            </div>
          )}

          {mode === "csv" && csvRows.length > 0 && (
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button onClick={runBatch} disabled={running}
                style={{ padding: "14px 36px", background: running ? "var(--surface)" : "var(--accent)", color: running ? "var(--muted)" : "#fff", border: `1px solid ${running ? "var(--border)" : "transparent"}`, borderRadius: 10, fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: "0.12em", cursor: running ? "not-allowed" : "pointer", boxShadow: running ? "none" : "0 0 28px rgba(232,52,26,0.35)" }}>
                {running ? `SCANNING ${rows.filter(r => r.status === "done" || r.status === "error").length}/${rows.length}...` : `SCAN ALL ${csvRows.length} CONTACTS →`}
              </button>
            </div>
          )}
        </div>

        {/* Summary bar */}
        {done.length > 0 && (
          <div style={{ display: "flex", gap: 16, padding: "12px 16px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { label: "SCANNED", val: `${done.length}/${rows.length}`, color: "var(--text)" },
              { label: "CRITICAL", val: criticalCount, color: criticalCount > 0 ? "#e8341a" : "var(--muted)" },
              { label: "TOTAL MONTHLY LEAK", val: `$${totalLeak.toLocaleString()}`, color: "#e8341a" },
              { label: "AVG SCORE", val: `${Math.round(done.reduce((a, r) => a + (r.result?.metrics.performanceScore ?? 0), 0) / done.length)}/100`, color: "var(--text)" },
              { label: "EMAILS READY TO SEND", val: withEmail, color: withEmail > 0 ? "#10b981" : "var(--muted)" },
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
            <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 72px 72px 72px 90px 90px 140px 36px", gap: 0, padding: "8px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              {["#", "CONTACT / DOMAIN", "PERF", "LEAK/MO", "AD TAX", "ADA RISK", "SEVERITY", "ACTIONS", ""].map(h => (
                <span key={h} style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.1em" }}>{h}</span>
              ))}
            </div>
            {rows.map((row, i) => <ResultRow key={row.id} row={row} idx={i} />)}
          </div>
        )}

        {rows.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed rgba(167,139,250,0.2)", borderRadius: 12 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "rgba(167,139,250,0.2)", marginBottom: 12 }}>TARGET LIST EMPTY</div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>Upload an Apollo CSV above — emails + websites load automatically</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}