"use client";
import React, { Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAudit } from "../lib/audit";
import type { AuditResult } from "../lib/audit";
import { ResultsPanel } from "../components/shared";
import { NavBar } from "../components/nav";
import { useAuth } from "../lib/auth-context";

type Step = "q1" | "q2" | "q3" | "url" | "loading" | "teaser" | "email" | "report" | "discover" | "pitch" | "phone" | "booked";

interface FunnelData {
  q1?: string; q2?: string; q3?: string; url?: string;
  email?: string; phone?: string; businessType?: string; goal?: string;
}
interface PitchCard {
  icon: string; title: string; tag: string; price: string;
  bullets: string[]; cta: string; href: string; highlight?: boolean;
}
interface PitchData { headline: string; sub: string; cards: PitchCard[]; }

// ─── Scan stages ──────────────────────────────────────────────────────────────
const SCAN_STAGES = [
  { label: "Connecting to Google PageSpeed Insights...", duration: 1200 },
  { label: "Pillar 1: Core Web Vitals & performance score...", duration: 2000 },
  { label: "Pillar 2: SEO crawlability & meta analysis...", duration: 1800 },
  { label: "Pillar 3: WCAG accessibility & ADA risk...", duration: 2000 },
  { label: "Pillar 4: Security headers & vulnerable libraries...", duration: 1800 },
  { label: "Calculating ad overspend & revenue leakage...", duration: 1600 },
  { label: "Generating executive recovery blueprint...", duration: 1400 },
];

function ScanLoader({ url }: { url: string }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [dots, setDots] = useState(".");
  useEffect(() => {
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    SCAN_STAGES.forEach((s, idx) => { const t = setTimeout(() => setStageIdx(idx), i); timers.push(t); i += s.duration; });
    return () => timers.forEach(clearTimeout);
  }, []);
  useEffect(() => { const id = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500); return () => clearInterval(id); }, []);
  const progress = Math.min(95, Math.round(((stageIdx + 1) / SCAN_STAGES.length) * 100));
  return (
    <div style={{ width: "100%", maxWidth: 560, margin: "0 auto", padding: "28px 16px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 5 }}>{["#e8341a", "#f59e0b", "#10b981"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.7 }} />)}</div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.06em", flex: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>nexus-4pillar — {url}</span>
        </div>
        <div style={{ padding: "16px 14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {SCAN_STAGES.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", opacity: i > stageIdx ? 0.2 : 1, transition: "opacity 0.4s" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: i < stageIdx ? "#10b981" : i === stageIdx ? "var(--accent)" : "var(--muted)", flexShrink: 0, width: 10 }}>{i < stageIdx ? "✓" : i === stageIdx ? "▶" : "○"}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: i === stageIdx ? "var(--text)" : i < stageIdx ? "var(--text2)" : "var(--muted)", lineHeight: 1.5 }}>{s.label}{i === stageIdx ? dots : ""}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 14px 16px" }}>
          <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: "easeOut" }} style={{ height: "100%", background: "var(--accent)", borderRadius: 2 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>4-PILLAR SCAN</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.1em" }}>{progress}%</span>
          </div>
        </div>
      </div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textAlign: "center", marginTop: 12, letterSpacing: "0.08em" }}>POWERED BY GOOGLE PAGESPEED INSIGHTS · 30–60 SECONDS</p>
    </div>
  );
}

// ─── Teaser ───────────────────────────────────────────────────────────────────
function ScanTeaser({ result, onContinue }: { result: AuditResult; onContinue: () => void }) {
  const topFinding = result.explanations[0];
  const criticalCount = result.explanations.filter(e => e.severity === "critical").length;
  const warningCount = result.explanations.filter(e => e.severity === "warning").length;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ width: "100%", maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.22)", marginBottom: 14 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.12em" }}>4-PILLAR SCAN COMPLETE</span>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,6vw,46px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1, marginBottom: 8 }}>
          WE FOUND <span style={{ color: "var(--accent)" }}>{result.explanations.length} ISSUES</span>
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
          {criticalCount} critical · {warningCount} warnings · est. <strong style={{ color: "var(--text)" }}>${result.totalMonthlyCost.toLocaleString()}/month</strong> leaking
        </p>
      </div>
      {/* 4 score pills */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
        {[
          { label: "Performance", value: result.metrics.performanceScore },
          { label: "SEO", value: result.seo?.estimatedSeoScore ?? 0 },
          { label: "Accessibility", value: result.accessibility?.estimatedA11yScore ?? 0 },
          { label: "Security", value: result.security?.estimatedBestPracticesScore ?? 0 },
        ].map(({ label, value }) => {
          const color = value < 50 ? "#e8341a" : value < 80 ? "#f59e0b" : "#10b981";
          return (
            <div key={label} style={{ textAlign: "center", padding: "10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, borderLeft: `3px solid ${color}` }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color, letterSpacing: "0.02em" }}>{value}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", marginTop: 2, letterSpacing: "0.1em" }}>{label.toUpperCase()}</div>
            </div>
          );
        })}
      </div>
      {topFinding && (
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(232,52,26,0.04)", border: "1px solid rgba(232,52,26,0.2)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--accent)", letterSpacing: "0.12em", padding: "2px 8px", borderRadius: 4, background: "rgba(232,52,26,0.1)" }}>⚠ TOP CRITICAL FINDING</span>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)", fontWeight: 600, margin: "8px 0 5px", lineHeight: 1.4 }}>{topFinding.headline}</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{topFinding.businessImpact}</p>
        </div>
      )}
      <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text2)", letterSpacing: "0.07em" }}>+ {result.explanations.length - 1} more findings locked</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Itemised fixes, recovery timeline & dollar breakdown</p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>{[...Array(Math.min(5, result.explanations.length - 1))].map((_, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i < criticalCount - 1 ? "var(--accent)" : "#f59e0b", opacity: 0.5 + i * 0.1 }} />)}</div>
      </div>
      <button onClick={onContinue} className="btn-primary" style={{ width: "100%", padding: "16px", borderRadius: 10, fontSize: 13, letterSpacing: "0.12em" }}>UNLOCK MY FULL REPORT →</button>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textAlign: "center", letterSpacing: "0.08em" }}>FREE · NO CREDIT CARD · 10 SECONDS</p>
    </motion.div>
  );
}

function ProgressDots({ step }: { step: Step }) {
  const steps: Step[] = ["q1", "q2", "q3", "url", "loading", "teaser", "email", "report"];
  const idx = steps.indexOf(step);
  return (
    <div style={{ display: "flex", gap: 5, justifyContent: "center", marginBottom: 20 }}>
      {steps.map((s, i) => <div key={s} style={{ width: i === idx ? 16 : 5, height: 5, borderRadius: 3, background: i <= idx ? "var(--accent)" : "var(--border2)", transition: "all 0.3s" }} />)}
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
      style={{ width: "100%", padding: "14px 16px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border2)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 12, WebkitTapHighlightColor: "transparent", minHeight: 54 }}>
      <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.5 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)", fontWeight: 500, lineHeight: 1.35 }}>{label}</div>
        {sub && <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
      </div>
    </motion.button>
  );
}

const BUSINESS_TYPES = [
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
          ? BUSINESS_TYPES.map(({ val, icon, label, sub }) => <Choice key={val} icon={icon} label={label} sub={sub} onClick={() => setBt(val)} />)
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
        adaRisk === "high" ? "HIGH risk — avg ADA lawsuit settlement $25k–$90k" : "MEDIUM ADA risk — fix before enforcement",
        vulnCount > 0 ? `${vulnCount} vulnerable JS ${vulnCount === 1 ? "library" : "libraries"} patched` : "Full WCAG 2.1 AA remediation",
        "Fixed price, 5 business days",
        "Compliance certificate on completion",
      ],
      cta: "BOOK A CALL →", href: `/call-center?score=${score}&leak=${leak}`,
    });
  }

  if (score < 65) {
    cards.push({
      icon: "⚡", title: "Performance Rebuild", tag: "FIXED PRICE", price: "$1,200",
      bullets: [
        `Score ${score}/100 → guaranteed sub-1.5s LCP`,
        "5-day turnaround, no retainer",
        "Mobile-first, all Core Web Vitals green",
        "30-day money-back performance guarantee",
      ],
      cta: "BOOK A CALL →", href: `/call-center?score=${score}&leak=${leak}`,
    });
  }

  return {
    headline: leak > 800 ? `You're leaking ~$${Math.round(leak / 100) * 100}/month. Here's the fix order.` : `Highest-ROI moves for your ${bt} site.`,
    sub: `Based on your ${bt} and 4-pillar scores — ordered by dollar impact.`,
    cards,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function FunnelInner() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("q1");
  const [fd, setFd] = useState<FunnelData>({});
  const [result, setResult] = useState<AuditResult | null>(null);
  const [pitch, setPitch] = useState<PitchData | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isAuthed } = useAuth();

  useEffect(() => {
    const fromHome = searchParams.get("url");
    if (fromHome) {
      setUrlInput(fromHome);
      setFd(p => ({ ...p, url: fromHome }));
      setStep("loading");
      fetchAudit(fromHome).then(r => { setResult(r); setStep(isAuthed ? "report" : "teaser"); })
        .catch(e => { setUrlError(e instanceof Error ? e.message : "Could not reach PageSpeed API"); setStep("url"); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCentred = !["report", "pitch"].includes(step);
  const go = (update: Partial<FunnelData>, next: Step) => { setFd(p => ({ ...p, ...update })); setStep(next); };

  const runAudit = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setUrlError(""); setFd(p => ({ ...p, url: targetUrl })); setStep("loading");
    try { const r = await fetchAudit(targetUrl); setResult(r); setStep(isAuthed ? "report" : "teaser"); }
    catch (e) { setUrlError(e instanceof Error ? e.message : "Could not reach PageSpeed API"); setStep("url"); }
  }, [isAuthed]);

  const submitEmail = useCallback(async () => {
    if (!emailInput.trim() || !result) return;
    setSubmitting(true);
    try { await fetch("/api/capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailInput, url: result.url, score: result.metrics.performanceScore, totalMonthlyCost: result.totalMonthlyCost, severity: result.severity, source: "funnel", ...fd }) }); }
    catch { /* swallow */ }
    setSubmitting(false); setFd(p => ({ ...p, email: emailInput })); setStep("report");
  }, [emailInput, result, fd]);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
      <NavBar page="funnel" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: isCentred ? "center" : "flex-start", padding: isCentred ? "28px 16px 40px" : "0 16px 40px" }}>
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
              <Q q="How much annual revenue flows through your site?" sub="Lets us calculate your exact dollars at risk.">
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
              <Q q="Has the site ever had a full 4-pillar audit?" sub="Performance · SEO · Accessibility · Security">
                <Choice icon="🙈" label="Never — flying completely blind" onClick={() => go({ q3: "never" }, "url")} />
                <Choice icon="⚡" label="Speed only — never checked SEO or compliance" sub="Most teams only look at Lighthouse" onClick={() => go({ q3: "speed-only" }, "url")} />
                <Choice icon="📅" label="Over a year ago — a lot has changed" onClick={() => go({ q3: "year+" }, "url")} />
                <Choice icon="✅" label="Recently — want an independent second opinion" onClick={() => go({ q3: "recent" }, "url")} />
              </Q>
            </motion.div>
          )}

          {step === "url" && (
            <motion.div key="url" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ width: "100%" }}>
              <ProgressDots step="url" />
              <Q q="Run your free 4-pillar diagnostic." sub="Performance · SEO · Accessibility · Security — real Google data.">
                <input type="url" inputMode="url" autoComplete="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && urlInput.trim() && runAudit(urlInput)}
                  placeholder="https://yourwebsite.com" autoFocus
                  style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "14px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 16, marginBottom: urlError ? 8 : 10 }}
                />
                {urlError && <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", marginBottom: 10 }}>⚠ {urlError}</p>}
                <button onClick={() => urlInput.trim() && runAudit(urlInput)} disabled={!urlInput.trim()}
                  className="btn-primary" style={{ width: "100%", padding: "16px", borderRadius: 10, fontSize: 13, letterSpacing: "0.12em" }}>
                  RUN FREE 4-PILLAR AUDIT →
                </button>
              </Q>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: "100%" }}>
              <ScanLoader url={urlInput || fd.url || ""} />
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
              <div style={{ padding: "26px 22px", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 16 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 8 }}>ONE STEP AWAY</p>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,5vw,28px)", color: "var(--text)", letterSpacing: "0.04em", lineHeight: 1.05, marginBottom: 10 }}>WHERE DO WE SEND YOUR BREAKDOWN?</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", marginBottom: 16, lineHeight: 1.6 }}>
                  Score: <strong style={{ color: "var(--accent)" }}>{result.metrics.performanceScore}/100</strong> · Monthly leak: <strong style={{ color: "var(--accent)" }}>${result.totalMonthlyCost.toLocaleString()}</strong>
                </p>
                <input type="email" inputMode="email" autoComplete="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitEmail()} placeholder="your@email.com" autoFocus
                  style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "13px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 16, marginBottom: 10 }}
                />
                <button onClick={submitEmail} disabled={submitting || !emailInput.trim()} className="btn-primary"
                  style={{ width: "100%", padding: "15px", borderRadius: 8, fontSize: 12, letterSpacing: "0.14em" }}>
                  {submitting ? "SENDING…" : "UNLOCK MY FULL REPORT →"}
                </button>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textAlign: "center", marginTop: 10 }}>
                  No spam · <a href="/legal/privacy" style={{ color: "var(--muted2)", textDecoration: "underline" }}>Privacy Policy</a>
                </p>
              </div>
            </motion.div>
          )}

          {step === "report" && result && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%" }}>
              <ResultsPanel result={result} onDiscover={() => setStep("discover")} />
            </motion.div>
          )}

          {step === "discover" && (
            <motion.div key="discover" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ width: "100%" }}>
              <Discover onDone={(bt, goal) => { const u = { ...fd, businessType: bt, goal }; setFd(u); if (result) setPitch(buildPitch(result, u)); setStep("pitch"); }} />
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
                    <a href={card.href} style={{ display: "block", padding: "12px", borderRadius: 8, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textDecoration: "none", background: card.highlight ? "#a78bfa" : "none", color: card.highlight ? "#fff" : "var(--text2)", border: card.highlight ? "none" : "1px solid var(--border2)" }}>{card.cta}</a>
                  </motion.div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <button onClick={() => setStep("phone")} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
                  Want someone to walk you through this? →
                </button>
              </div>
            </motion.div>
          )}

          {step === "phone" && (
            <motion.div key="phone" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
              <div style={{ padding: "26px 22px", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 16, textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 10 }}>FREE 20-MIN CALL</p>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,5vw,28px)", color: "var(--text)", letterSpacing: "0.04em", lineHeight: 1.05, marginBottom: 10 }}>WE&apos;LL CALL WITHIN 2 HOURS</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", marginBottom: 18, lineHeight: 1.6 }}>No pitch. Just a live walkthrough of your results and the highest-ROI fix.</p>
                <input type="tel" inputMode="tel" autoComplete="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && phoneInput.trim() && setStep("booked")} placeholder="+1 (555) 000-0000" autoFocus
                  style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "13px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 16, marginBottom: 10 }}
                />
                <button onClick={() => phoneInput.trim() && setStep("booked")} disabled={!phoneInput.trim()}
                  className="btn-primary" style={{ width: "100%", padding: "15px", borderRadius: 8, fontSize: 12, letterSpacing: "0.14em" }}>
                  BOOK MY FREE CALL →
                </button>
              </div>
            </motion.div>
          )}

          {step === "booked" && (
            <motion.div key="booked" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", maxWidth: 460, margin: "0 auto", padding: "20px 16px" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px,6vw,44px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 10 }}>YOU&apos;RE BOOKED.</h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.7, marginBottom: 22 }}>We&apos;ll call within 2 hours. Have your site open — we&apos;ll walk through the exact fixes live.</p>
              <a href="/subscribe" className="btn-primary" style={{ display: "inline-block", padding: "14px 36px", borderRadius: 10, textDecoration: "none", fontSize: 12, letterSpacing: "0.14em" }}>EXPLORE NEXUS PULSE →</a>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}

export default function Funnel() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", letterSpacing: "0.1em" }}>LOADING...</span></main>}>
      <FunnelInner />
    </Suspense>
  );
}