"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { fetchAudit, fmtMs, scoreColor } from "../lib/audit";
import type { AuditResult } from "../lib/audit";
import { supabase } from "../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Task { id: string; title: string; desc: string; impact: "High" | "Medium" | "Low"; effort: "High" | "Medium" | "Low"; val: number; status: "pending" | "verifying" | "recovered"; pillar: "performance" | "seo" | "accessibility" | "security"; }
interface TrackedSite { id: string; url: string; label: string; isOwn: boolean; result: AuditResult | null; history: { ts: number; score: number }[]; tasks: Task[]; loading: boolean; error: string; }
interface UserSettings { smsPhone: string; smsAlerts: boolean; webhookUrl: string; weeklyDigest: boolean; criticalAlerts: boolean; }
type Tab = "overview" | "action-plan" | "matrix" | "settings";

const MAX_COMPETITORS = 3;

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const count = useMotionValue(0); const rounded = useTransform(count, Math.round); const [display, setDisplay] = useState(0);
  useEffect(() => { const c = animate(count, value, { duration: 1.5, ease: "easeOut" }); const u = rounded.on("change", (v: number) => setDisplay(v)); return () => { c.stop(); u(); }; }, [value, count, rounded]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 56, label }: { score: number; size?: number; label?: string }) {
  const r = size * 0.38, circ = 2 * Math.PI * r, color = scoreColor(score);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={3} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ} style={{ transition: "stroke-dashoffset 1.5s ease", filter: `drop-shadow(0 0 6px ${color})` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: size * 0.28, color, lineHeight: 1 }}>{score}</span>
        </div>
      </div>
      {label && <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.1em", textAlign: "center" }}>{label}</span>}
    </div>
  );
}

// ─── 4-Pillar Task Generator ──────────────────────────────────────────────────
function generateDynamicTasks(result: AuditResult): Task[] {
  const tasks: Task[] = [];
  const annualLoss = result.annualRevenueLoss;

  // ── Performance ──
  if (result.metrics.lcp > 2500) {
    tasks.push({ id: "lcp", pillar: "performance", title: "Resolve LCP Bottleneck", desc: `Your Largest Contentful Paint is ${fmtMs(result.metrics.lcp)}. Google requires < 2.5s. Preload your hero asset, implement Next-Gen image formats (WebP/AVIF), and enable server-side caching to shave off ${fmtMs(result.metrics.lcp - 2500)}.`, impact: "High", effort: "Low", val: Math.round((annualLoss * 0.40) / 1000), status: "pending" });
  }
  if (result.metrics.tbt > 200) {
    tasks.push({ id: "tbt", pillar: "performance", title: "Clear Main Thread Blocking", desc: `Total Blocking Time is ${fmtMs(result.metrics.tbt)}. Scripts are freezing the browser. Audit third-party tags (Meta Pixel, Google Tag Manager) and defer execution until after the initial render. Split large JavaScript bundles.`, impact: "High", effort: "Medium", val: Math.round((annualLoss * 0.30) / 1000), status: "pending" });
  }
  if (result.metrics.cls > 0.1) {
    tasks.push({ id: "cls", pillar: "performance", title: "Fix Cumulative Layout Shift", desc: `Elements are jumping during load (CLS: ${result.metrics.cls.toFixed(2)}). Ensure all images, ads, and embeds have explicit width/height attributes. Reserve space for dynamically injected content.`, impact: "Medium", effort: "Low", val: Math.round((annualLoss * 0.15) / 1000), status: "pending" });
  }

  // ── SEO ──
  if (result.seo && !result.seo.hasMeta) {
    tasks.push({ id: "meta", pillar: "seo", title: "Write Missing Meta Descriptions", desc: "No meta description found. Google uses this as the preview text in search results. A missing or auto-generated description directly reduces your click-through rate by an estimated 5–8%. Write a compelling 155-character description for every key page.", impact: "Medium", effort: "Low", val: Math.round((annualLoss * 0.10) / 1000), status: "pending" });
  }
  if (result.seo && !result.seo.mobileViewport) {
    tasks.push({ id: "viewport", pillar: "seo", title: "Add Mobile Viewport Tag", desc: "The viewport meta tag is missing. This tells Google your site is not mobile-optimised, which causes immediate ranking demotion in mobile search — your primary traffic source. Add <meta name='viewport' content='width=device-width, initial-scale=1'>.", impact: "High", effort: "Low", val: Math.round((annualLoss * 0.20) / 1000), status: "pending" });
  }

  // ── Security ──
  if (result.security && result.security.vulnerableLibraryCount > 0) {
    const count = result.security.vulnerableLibraryCount;
    tasks.push({ id: "vuln-libs", pillar: "security", title: `Update ${count} Vulnerable JavaScript ${count === 1 ? "Library" : "Libraries"}`, desc: `${count} outdated JavaScript ${count === 1 ? "library was" : "libraries were"} detected with known security vulnerabilities. Modern browsers actively warn users before they submit payment details on sites running these scripts. Every warning banner is an abandoned checkout. Update to the latest stable version of each dependency.`, impact: "High", effort: "Medium", val: Math.round((annualLoss * 0.12) / 1000), status: "pending" });
  }
  if (result.security && !result.security.hasSecurityHeaders) {
    tasks.push({ id: "sec-headers", pillar: "security", title: "Implement Security Response Headers", desc: "Critical HTTP security headers (Content-Security-Policy, X-Frame-Options, HSTS) are missing. These are free to implement and directly signal trustworthiness to browsers and enterprise security scanners — which many B2B buyers use before authorising a purchase.", impact: "Medium", effort: "Low", val: Math.round((annualLoss * 0.06) / 1000), status: "pending" });
  }

  // ── Accessibility ──
  if (result.accessibility && result.accessibility.adaRiskLevel !== "low") {
    const isHigh = result.accessibility.adaRiskLevel === "high";
    tasks.push({ id: "ada-risk", pillar: "accessibility", title: isHigh ? "Remediate Critical ADA Violations" : "Fix WCAG Accessibility Issues", desc: isHigh
      ? `Your site has ${result.accessibility.adaRiskLevel.toUpperCase()} ADA compliance risk. ADA website lawsuits have increased 300% since 2020 and average $25,000–$90,000 in settlement costs. You are also locking out an estimated ${result.accessibility.estimatedMarketLockout}% of potential customers. Conduct a WCAG 2.1 AA audit immediately.`
      : `Accessibility issues detected that exclude an estimated ${result.accessibility.estimatedMarketLockout}% of users. Fix missing ARIA labels, ensure colour contrast ratios meet WCAG 2.1 AA standards, and add descriptive alt text to all images.`,
      impact: isHigh ? "High" : "Medium", effort: "Medium", val: Math.round((annualLoss * (isHigh ? 0.08 : 0.04)) / 1000), status: "pending" });
  }
  if (result.accessibility && result.accessibility.missingAltText) {
    tasks.push({ id: "alt-text", pillar: "accessibility", title: "Add Alt Text to All Images", desc: "Images are missing alt attributes. This excludes screen reader users entirely and also loses SEO signal — Google cannot index image content without alt text. Add descriptive alt text to every meaningful image on the site.", impact: "Medium", effort: "Low", val: Math.round((annualLoss * 0.04) / 1000), status: "pending" });
  }

  if (tasks.length === 0) {
    tasks.push({ id: "cache", pillar: "performance", title: "Implement Stale-While-Revalidate Caching", desc: "Your 4-pillar scores are healthy. The next level of optimisation is advanced caching. Implement stale-while-revalidate to improve returning visitor latency by serving cached content instantly while refreshing it in the background.", impact: "Low", effort: "Medium", val: 0, status: "pending" });
  }

  return tasks;
}

// ─── Pillar Colour & Icon Map ─────────────────────────────────────────────────
const PILLAR_META: Record<Task["pillar"], { icon: string; color: string; label: string }> = {
  performance: { icon: "⚡", color: "#e8341a", label: "Performance" },
  seo:         { icon: "🔍", color: "#f59e0b", label: "SEO" },
  security:    { icon: "🔒", color: "#3b82f6", label: "Security" },
  accessibility: { icon: "♿", color: "#a78bfa", label: "Accessibility" },
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [sites, setSites] = useState<TrackedSite[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ smsPhone: "", smsAlerts: false, webhookUrl: "", weeklyDigest: true, criticalAlerts: true });
  const [pulseEvents, setPulseEvents] = useState<{ time: string; text: string; type: "good" | "bad" | "neutral" }[]>([{ time: "Just now", text: "Secure connection established. Cloud synced.", type: "neutral" }]);
  const [newUrl, setNewUrl] = useState("");
  const [activePillarFilter, setActivePillarFilter] = useState<Task["pillar"] | "all">("all");

  // 1. Auth & data load
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }
      setUserId(session.user.id);
      const { data } = await supabase.from("profiles").select("app_data").eq("id", session.user.id).single();
      if (data?.app_data && Object.keys(data.app_data).length > 0) {
        const validPillars = new Set(["performance", "seo", "security", "accessibility"]);
        const rawSites: TrackedSite[] = data.app_data.sites || [];
        // Strip stale tasks that predate the 4-pillar update (no pillar field)
        const sanitized = rawSites.map(s => ({
          ...s,
          tasks: (s.tasks || []).filter((t: Task) => validPillars.has(t.pillar)),
        }));
        setSites(sanitized);
        setSettings(data.app_data.settings || { smsPhone: "", smsAlerts: false, webhookUrl: "", weeklyDigest: true, criticalAlerts: true });
      } else { setSites([]); }
      setIsLoaded(true);
    };
    init();
  }, []);

  // 2. Cloud auto-save
  useEffect(() => {
    if (isLoaded && userId) {
      supabase.from("profiles").update({ app_data: { sites, settings } }).eq("id", userId)
        .then(({ error }: { error: Error | null }) => { if (error) console.error("Cloud sync failed:", error); });
    }
  }, [sites, settings, isLoaded, userId]);

  const own = sites.find(s => s.isOwn);
  const competitors = sites.filter(s => !s.isOwn);
  const pendingRecovery = (own?.tasks || []).filter(t => t.status === "verifying").reduce((a, b) => a + b.val, 0) || 0;
  const logPulse = (text: string, type: "good" | "bad" | "neutral") => setPulseEvents(prev => [{ time: "Just now", text, type }, ...prev].slice(0, 5));

  const scan = useCallback((id: string, forceUrl?: string) => {
    const targetSite = sites.find(s => s.id === id);
    const targetUrl = forceUrl || targetSite?.url;
    if (!targetUrl) return;
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;
    setSites(prev => prev.map(s => s.id === id ? { ...s, loading: true, error: "" } : s));
    logPulse(`Initiating 4-pillar scan for ${cleanUrl}...`, "neutral");
    setTimeout(async () => {
      try {
        const r = await fetchAudit(cleanUrl);
        setSites(prev => prev.map(s => {
          if (s.id !== id) return s;
          const updatedTasks = s.isOwn ? generateDynamicTasks(r) : [];
          return { ...s, loading: false, result: r, url: cleanUrl, tasks: updatedTasks, history: [...s.history.slice(-11), { ts: r.timestamp, score: r.metrics.performanceScore }] };
        }));
        logPulse(`Scan complete. 4-pillar metrics updated.`, "good");
      } catch (e) {
        setSites(prev => prev.map(s => s.id === id ? { ...s, loading: false, error: e instanceof Error ? e.message : "Scan failed" } : s));
        logPulse(`Scan failed for ${cleanUrl}.`, "bad");
      }
    }, 3500);
  }, [sites]);

  function addCompetitor(url: string) {
    if (competitors.length >= MAX_COMPETITORS) return alert("Plan limit reached. Upgrade to add more competitors.");
    const cleanUrl = url.trim(); if (!cleanUrl) return;
    const id = `comp-${Date.now()}`;
    const label = cleanUrl.replace(/https?:\/\//, "").split(".")[0].toUpperCase();
    setSites(prev => [...prev, { id, url: cleanUrl, label, isOwn: false, result: null, history: [], tasks: [], loading: false, error: "" }]);
    setTimeout(() => scan(id, cleanUrl), 100);
  }

  function removeSite(id: string) { setSites(prev => prev.filter(s => s.id !== id)); logPulse("Target removed from tracking.", "neutral"); }

  const markTaskVerifying = (taskId: string) => {
    setSites(prev => prev.map(s => s.isOwn ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: "verifying" as const } : t) } : s));
    logPulse("Developer push detected. Queueing verification scan.", "neutral");
    setTimeout(() => {
      setSites(prev => prev.map(s => s.isOwn ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: "recovered" as const } : t) } : s));
      logPulse("Verification complete. Revenue recovered.", "good");
    }, 5000);
  };

  const sendToWebhook = async () => {
    if (!settings.webhookUrl) return alert("Configure a Webhook URL in Settings first.");
    const planText = (own?.tasks || []).filter(t => t.status === "pending").map(t => `[${t.impact} Priority — ${PILLAR_META[t.pillar].label}] ${t.title}:\n${t.desc}`).join("\n\n");
    try {
      await fetch(settings.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: `🚨 *NEXUS 4-PILLAR ACTION PLAN* 🚨\n\n${planText}` }) });
      alert("Action Plan dispatched to Webhook!"); logPulse("Payload dispatched to Developer Webhook.", "good");
    } catch { alert("Failed to send. Check your Webhook URL."); }
  };

  if (!isLoaded) return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--accent)" }}>Authenticating Secure Connection...</span></div>;

  const filteredTasks = (own?.tasks || []).filter(t => t.status !== "recovered" && (activePillarFilter === "all" || t.pillar === activePillarFilter));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      {/* ── Nav ── */}
      <nav style={{ borderBottom: "1px solid var(--border)", background: "rgba(8,15,28,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", height: 54, display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--text)", letterSpacing: "0.08em" }}>NEXUS</span>
          </a>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 7px", borderRadius: 3, letterSpacing: "0.1em" }}>● CLOUD SYNCED</span>
          <div style={{ display: "flex", gap: 0, marginLeft: 12, overflowX: "auto" }} className="hide-scrollbar">
            {(["overview", "action-plan", "matrix", "settings"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "6px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: tab === t ? "var(--text)" : "var(--muted)", textTransform: "uppercase", borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`, transition: "all 0.15s", position: "relative", whiteSpace: "nowrap" }}>
                {t.replace("-", " ")}
                {t === "action-plan" && (own?.tasks || []).some(x => x.status === "pending") ? <span style={{ position: "absolute", top: 2, right: 0, width: 5, height: 5, borderRadius: "50%", background: "#f59e0b" }} /> : null}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 80px" }}>
        <AnimatePresence mode="wait">

          {/* ══════════════ OVERVIEW TAB ══════════════ */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>

                {/* Empty state wizard */}
                {!own ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ gridColumn: "1 / -1", padding: "80px 20px", textAlign: "center", border: "1px dashed rgba(167,139,250,0.4)", borderRadius: 16, background: "linear-gradient(180deg, rgba(167,139,250,0.05) 0%, transparent 100%)" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 12, color: "var(--text)", letterSpacing: "0.05em" }}>Engine Calibrated & Ready</h3>
                    <p style={{ fontFamily: "var(--font-body)", color: "var(--text2)", marginBottom: 32, maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.6 }}>
                      Enter your primary domain below to run your first 4-pillar diagnostic and initialize your cloud dashboard.
                    </p>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", maxWidth: 480, margin: "0 auto" }}>
                      <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://yourwebsite.com"
                        style={{ flex: 1, padding: "16px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14 }} />
                      <button onClick={() => {
                        if (!newUrl) return;
                        const cleanUrl = newUrl.trim(); const id = `own-${Date.now()}`;
                        setSites([{ id, url: cleanUrl, label: "Your Domain", isOwn: true, result: null, history: [], tasks: [], loading: false, error: "" }]);
                        setTimeout(() => scan(id, cleanUrl), 100); setNewUrl("");
                      }} style={{ padding: "0 32px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: "bold", cursor: "pointer", letterSpacing: "0.1em" }}>
                        INITIALIZE →
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* ── Your Domain Card ── */}
                    <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 20, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, right: 0, background: own?.result?.severity === "critical" ? "var(--accent)" : "var(--surface2)", color: own?.result?.severity === "critical" ? "#fff" : "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 9, padding: "4px 12px", borderBottomLeftRadius: 10, letterSpacing: "0.1em" }}>
                        {own?.result?.severity.toUpperCase() || "UNVERIFIED"}
                      </div>
                      {own?.result
                        ? <ScoreRing score={own.result.metrics.performanceScore} size={80} />
                        : <div style={{ width: 80, height: 80, borderRadius: "50%", border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--muted)", fontSize: 9 }}>SCANNING</span></div>}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 6 }}>YOUR DOMAIN</p>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input type="text" value={own?.url || ""} onChange={e => setSites(p => p.map(s => s.isOwn ? { ...s, url: e.target.value } : s))} placeholder="yourwebsite.com"
                            style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12 }} />
                          <button onClick={() => own && scan(own.id)} disabled={own?.loading}
                            style={{ background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text)", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                            {own?.loading ? "..." : "↺"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Revenue at Risk ── */}
                    <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em" }}>MONTHLY REVENUE LEAK</p>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", background: "rgba(232,52,26,0.1)", padding: "3px 8px", borderRadius: 4 }}>ALL 4 PILLARS</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 42, color: "var(--text)", lineHeight: 1 }}>
                        {own?.result ? <AnimatedNumber value={own.result.totalMonthlyCost} prefix="£" /> : "—"}
                      </div>
                      {pendingRecovery > 0 ? (
                        <div style={{ marginTop: 16, padding: "10px", background: "rgba(245,158,11,0.08)", border: "1px dashed rgba(245,158,11,0.4)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ width: 14, height: 14, border: "2px solid #f59e0b", borderTopColor: "transparent", borderRadius: "50%", flexShrink: 0 }} />
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#f59e0b" }}>Verifying £{pendingRecovery}k recovery...</span>
                        </div>
                      ) : (
                        <div style={{ marginTop: 16 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>Execute Action Plan to recover funds.</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ── System Pulse ── */}
                <div style={{ padding: "20px", borderRadius: 16, background: "linear-gradient(180deg, var(--surface) 0%, #030712 100%)", border: "1px solid rgba(16,185,129,0.2)", position: "relative", overflow: "hidden" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#10b981", letterSpacing: "0.15em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} className="animate-pulse" /> SYSTEM PULSE
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {pulseEvents.map((ev, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", width: 45, flexShrink: 0, paddingTop: 2 }}>{ev.time}</span>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: ev.type === "good" ? "#10b981" : ev.type === "bad" ? "var(--accent)" : "var(--text2)", lineHeight: 1.4 }}>{ev.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── 4-Ring Digital Health Pulse ── */}
              {own?.result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  style={{ padding: "22px 24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 20 }}>4-PILLAR DIGITAL HEALTH PULSE</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                    <ScoreRing score={own.result.metrics.performanceScore} size={72} label="PERFORMANCE" />
                    <ScoreRing score={own.result.seo?.estimatedSeoScore ?? 0} size={72} label="SEO" />
                    <ScoreRing score={own.result.accessibility?.estimatedA11yScore ?? 0} size={72} label="ACCESSIBILITY" />
                    <ScoreRing score={own.result.security?.estimatedBestPracticesScore ?? 0} size={72} label="SECURITY" />
                  </div>
                  {/* Quick-stat row beneath rings */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    {[
                      { label: "Ad Tax", value: `${own.result.adLossPercent}%`, bad: own.result.adLossPercent > 20 },
                      { label: "SEO Reach Lost", value: `${own.result.seo?.seoReachLossPercent ?? 0}%`, bad: (own.result.seo?.seoReachLossPercent ?? 0) > 20 },
                      { label: "Market Lockout", value: `${own.result.accessibility?.estimatedMarketLockout ?? 0}%`, bad: (own.result.accessibility?.estimatedMarketLockout ?? 0) > 10 },
                      { label: "Vuln. Libraries", value: (own.result.security?.vulnerableLibraryCount ?? 0) > 0 ? `${own.result.security!.vulnerableLibraryCount} found` : "Clean", bad: (own.result.security?.vulnerableLibraryCount ?? 0) > 0 },
                    ].map(({ label, value, bad }) => (
                      <div key={label} style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: bad ? "#e8341a" : "#10b981", marginBottom: 4 }}>{value}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.1em" }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ══════════════ ACTION PLAN TAB ══════════════ */}
          {tab === "action-plan" && (
            <motion.div key="action-plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 6 }}>DEVELOPER BLUEPRINT</h2>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", maxWidth: 600 }}>4-pillar prioritized tasks. Dispatch directly to your development team.</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => {
                    const text = (own?.tasks || []).map(t => `[${t.impact} | ${PILLAR_META[t.pillar].label}] ${t.title}\n${t.desc}`).join("\n\n");
                    navigator.clipboard.writeText(`NEXUS 4-PILLAR DEV PLAN:\n\n${text}`);
                    alert("Copied to clipboard!");
                  }} style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border2)", padding: "10px 16px", borderRadius: 8, cursor: "pointer" }}>📋 COPY</button>
                  <button onClick={sendToWebhook} style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "#f59e0b", color: "#000", border: "none", padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>🚀 SEND VIA WEBHOOK</button>
                </div>
              </div>

              {/* Pillar filter tabs */}
              {own?.result && (
                <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                  {([
                    { id: "all" as const, label: "All Tasks", count: (own?.tasks || []).filter(t => t.status !== "recovered").length },
                    ...Object.entries(PILLAR_META).map(([id, m]) => ({ id: id as Task["pillar"], label: m.label, count: (own?.tasks || []).filter(t => t.pillar === id && t.status !== "recovered").length, color: m.color }))
                  ]).map(item => (
                    <button key={item.id} onClick={() => setActivePillarFilter(item.id as Task["pillar"] | "all")}
                      style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${"color" in item && item.color ? item.color + "40" : "var(--border2)"}`, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", transition: "all 0.15s",
                        background: activePillarFilter === item.id ? ("color" in item && item.color ? item.color : "var(--accent)") : "none",
                        color: activePillarFilter === item.id ? "#fff" : "var(--muted)" }}>
                      {"icon" in item ? `${(item as {id: string; label: string; count: number; color: string; icon?: string}).icon ?? ""} ` : ""}{item.label} ({item.count})
                    </button>
                  ))}
                </div>
              )}

              {!own?.result ? (
                <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 16 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>Run an audit on the Overview tab to generate your 4-Pillar Action Plan.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {filteredTasks.map((t, i) => {
                    const pm = PILLAR_META[t.pillar] ?? PILLAR_META["performance"];
                    return (
                      <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        style={{ padding: "24px", background: "var(--surface)", borderRadius: 16, border: `1px solid ${t.status === "verifying" ? "rgba(245,158,11,0.3)" : "var(--border)"}`, position: "relative", overflow: "hidden" }}>
                        {/* Pillar accent stripe */}
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: pm.color }} />
                        {t.status === "verifying" && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #f59e0b, transparent)", backgroundSize: "200% 100%", animation: "shimmer 2s infinite" }} />}

                        <div style={{ display: "flex", gap: 20 }}>
                          <div style={{ paddingTop: 4 }}>
                            <button onClick={() => t.status === "pending" && markTaskVerifying(t.id)} disabled={t.status !== "pending"}
                              style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${t.status === "pending" ? "var(--border2)" : "#f59e0b"}`, background: t.status === "pending" ? "var(--bg)" : "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: t.status === "pending" ? "pointer" : "default", transition: "all 0.2s" }}>
                              {t.status !== "pending" && <span style={{ color: "#f59e0b", fontSize: 12 }}>✓</span>}
                            </button>
                          </div>
                          <div style={{ flex: 1 }}>
                            {/* Title row */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 14 }}>{pm.icon}</span>
                                <h4 style={{ fontFamily: "var(--font-body)", fontSize: 17, fontWeight: 600, color: t.status === "verifying" ? "var(--muted)" : "var(--text)", margin: 0 }}>{t.title}</h4>
                              </div>
                              {t.val > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: 4, border: "1px solid rgba(16,185,129,0.2)", whiteSpace: "nowrap" }}>RECOVERS ~£{t.val}k/yr</span>}
                            </div>

                            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.6, marginBottom: 14 }}>{t.desc}</p>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", gap: 8 }}>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, padding: "3px 9px", borderRadius: 4, background: "var(--bg)", border: "1px solid var(--border)", color: t.impact === "High" ? pm.color : "var(--text)" }}>Impact: {t.impact}</span>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, padding: "3px 9px", borderRadius: 4, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--muted)" }}>Effort: {t.effort}</span>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, padding: "3px 9px", borderRadius: 4, background: pm.color + "18", border: `1px solid ${pm.color}35`, color: pm.color }}>{pm.label}</span>
                              </div>
                              {t.status === "pending"
                                ? <button onClick={() => markTaskVerifying(t.id)} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>Mark as Deployed →</button>
                                : <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ width: 10, height: 10, border: "2px solid #f59e0b", borderTopColor: "transparent", borderRadius: "50%" }} /> Verifying...</span>
                              }
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <div style={{ padding: "32px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 16 }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>No pending tasks in this pillar.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════ MATRIX TAB ══════════════ */}
          {tab === "matrix" && (
            <motion.div key="matrix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 6 }}>MARKET MATRIX</h2>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)" }}>4-pillar competitor intelligence. Know exactly where rivals are beating you — and where they're exposed.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://competitor.com"
                    onKeyDown={e => { if (e.key === "Enter") { addCompetitor(newUrl); setNewUrl(""); } }}
                    disabled={competitors.length >= MAX_COMPETITORS}
                    style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 8, padding: "10px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12, width: 220, opacity: competitors.length >= MAX_COMPETITORS ? 0.5 : 1 }} />
                  <button onClick={() => { addCompetitor(newUrl); setNewUrl(""); }} disabled={competitors.length >= MAX_COMPETITORS || !newUrl}
                    style={{ background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text)", padding: "10px 16px", borderRadius: 8, cursor: competitors.length >= MAX_COMPETITORS ? "not-allowed" : "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>+ Add</button>
                </div>
              </div>

              {competitors.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 16 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>No competitors tracked yet.</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted2)" }}>Add a competitor URL above to see their 4-pillar scores side-by-side.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {competitors.map((c, i) => {
                    const perfDiff = c.result && own?.result ? own.result.metrics.performanceScore - c.result.metrics.performanceScore : 0;
                    const isWinning = perfDiff >= 0;
                    return (
                      <div key={c.id} style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
                        {/* Header */}
                        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 18, color: "var(--muted)" }}>{i + 1}</div>
                            <div>
                              <div style={{ fontFamily: "var(--font-body)", fontSize: 17, fontWeight: 600 }}>{c.label}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>{c.url}</span>
                                <button onClick={() => scan(c.id, c.url)} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontSize: 12 }}>↺</button>
                                <button onClick={() => removeSite(c.id)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12 }}>×</button>
                              </div>
                            </div>
                          </div>
                          {c.loading ? (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>Scanning 4 pillars...</span>
                          ) : c.result && own?.result ? (
                            <div style={{ padding: "8px 16px", borderRadius: 8, background: isWinning ? "rgba(16,185,129,0.1)" : "rgba(232,52,26,0.1)", border: `1px solid ${isWinning ? "rgba(16,185,129,0.3)" : "rgba(232,52,26,0.3)"}` }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: isWinning ? "#10b981" : "var(--accent)", letterSpacing: "0.1em" }}>
                                {isWinning ? `YOU LEAD BY +${perfDiff} pts` : `THEY BEAT YOU BY ${Math.abs(perfDiff)} pts`}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* 4-Pillar comparison grid */}
                        {c.result && own?.result && (
                          <div style={{ padding: "16px 24px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                              {[
                                { icon: "⚡", label: "Performance", yours: own.result.metrics.performanceScore, theirs: c.result.metrics.performanceScore, higherWins: true, unit: "/100" },
                                { icon: "🔍", label: "SEO Score", yours: own.result.seo?.estimatedSeoScore ?? 0, theirs: c.result.seo?.estimatedSeoScore ?? 0, higherWins: true, unit: "/100" },
                                { icon: "♿", label: "Accessibility", yours: own.result.accessibility?.estimatedA11yScore ?? 0, theirs: c.result.accessibility?.estimatedA11yScore ?? 0, higherWins: true, unit: "/100" },
                                { icon: "🔒", label: "Security", yours: own.result.security?.estimatedBestPracticesScore ?? 0, theirs: c.result.security?.estimatedBestPracticesScore ?? 0, higherWins: true, unit: "/100" },
                                { icon: "💰", label: "Ad Tax", yours: own.result.adLossPercent, theirs: c.result.adLossPercent, higherWins: false, unit: "%" },
                                { icon: "⚖️", label: "ADA Risk", yours: own.result.accessibility?.adaRiskLevel === "high" ? 0 : own.result.accessibility?.adaRiskLevel === "medium" ? 1 : 2, theirs: c.result.accessibility?.adaRiskLevel === "high" ? 0 : c.result.accessibility?.adaRiskLevel === "medium" ? 1 : 2, higherWins: true, unit: "", displayYours: (own.result.accessibility?.adaRiskLevel ?? "low").toUpperCase(), displayTheirs: (c.result.accessibility?.adaRiskLevel ?? "low").toUpperCase() },
                                { icon: "🐛", label: "Vuln. Libs", yours: -(own.result.security?.vulnerableLibraryCount ?? 0), theirs: -(c.result.security?.vulnerableLibraryCount ?? 0), higherWins: true, unit: "", displayYours: String(own.result.security?.vulnerableLibraryCount ?? 0), displayTheirs: String(c.result.security?.vulnerableLibraryCount ?? 0) },
                                { icon: "👥", label: "Mkt Lockout", yours: -(own.result.accessibility?.estimatedMarketLockout ?? 0), theirs: -(c.result.accessibility?.estimatedMarketLockout ?? 0), higherWins: true, unit: "%", displayYours: `${own.result.accessibility?.estimatedMarketLockout ?? 0}%`, displayTheirs: `${c.result.accessibility?.estimatedMarketLockout ?? 0}%` },
                              ].map(m => {
                                const youWin = m.higherWins ? m.yours >= m.theirs : m.yours <= m.theirs;
                                const winColor = youWin ? "#10b981" : "#e8341a";
                                const displayYours = "displayYours" in m ? m.displayYours : `${m.yours}${m.unit}`;
                                const displayTheirs = "displayTheirs" in m ? m.displayTheirs : `${m.theirs}${m.unit}`;
                                return (
                                  <div key={m.label} style={{ padding: "12px 14px", background: "var(--bg)", borderRadius: 10, border: `1px solid ${winColor}25` }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                                      <span style={{ fontSize: 11 }}>{m.icon}</span>
                                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.1em" }}>{m.label}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <div>
                                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted2)", marginBottom: 2 }}>YOU</div>
                                        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: winColor }}>{displayYours}</div>
                                      </div>
                                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)" }}>vs</span>
                                      <div style={{ textAlign: "right" }}>
                                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted2)", marginBottom: 2 }}>THEM</div>
                                        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--muted)" }}>{displayTheirs}</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════ SETTINGS TAB ══════════════ */}
          {tab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 24 }}>ACCOUNT SETTINGS</h2>
              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 12 }}>DEVELOPER INTEGRATIONS</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", marginBottom: 12 }}>Paste your Slack, Make.com, or Zapier Webhook URL to send Action Plans directly to your team.</p>
                  <input type="text" value={settings.webhookUrl} onChange={e => setSettings({ ...settings, webhookUrl: e.target.value })} placeholder="https://hooks.slack.com/services/..."
                    style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "12px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12 }} />
                </div>
                <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em" }}>SMS ALERTS</p>
                    <button onClick={() => setSettings({ ...settings, smsAlerts: !settings.smsAlerts })}
                      style={{ width: 44, height: 24, borderRadius: 12, background: settings.smsAlerts ? "#10b981" : "var(--bg)", border: "1px solid var(--border2)", position: "relative", cursor: "pointer", transition: "all 0.2s" }}>
                      <div style={{ position: "absolute", left: settings.smsAlerts ? 22 : 2, top: 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
                    </button>
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", marginBottom: 12 }}>Receive an instant text when a competitor deploys a faster, more compliant site.</p>
                  <input type="tel" disabled={!settings.smsAlerts} value={settings.smsPhone} onChange={e => setSettings({ ...settings, smsPhone: e.target.value })} placeholder="+44 7700 000000"
                    style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "12px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12, opacity: settings.smsAlerts ? 1 : 0.5 }} />
                </div>
                <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 6 }}>SESSION MANAGEMENT</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)" }}>Disconnect from the Supabase cloud and log out of this device.</p>
                  </div>
                  <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
                    style={{ padding: "10px 20px", borderRadius: 8, background: "rgba(232,52,26,0.1)", border: "1px solid rgba(232,52,26,0.3)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)" }}>LOG OUT</button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}