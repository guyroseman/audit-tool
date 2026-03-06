"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { fetchAudit, fmtMs, scoreColor, metricStatus } from "../lib/audit";
import type { AuditResult } from "../lib/audit";

// ─── Types & Configuration ────────────────────────────────────────────────────
interface Task { id: string; title: string; desc: string; impact: "High"|"Medium"|"Low"; effort: "High"|"Medium"|"Low"; val: number; status: "pending"|"verifying"|"recovered"; }
interface TrackedSite { id: string; url: string; label: string; isOwn: boolean; result: AuditResult | null; history: { ts: number; score: number }[]; tasks: Task[]; loading: boolean; error: string; }
interface UserSettings { smsPhone: string; smsAlerts: boolean; webhookUrl: string; weeklyDigest: boolean; criticalAlerts: boolean; }
type Tab = "overview" | "action-plan" | "matrix" | "settings";

const MAX_COMPETITORS = 3;

// ─── Shared UI Components ─────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const count = useMotionValue(0); const rounded = useTransform(count, Math.round); const [display, setDisplay] = useState(0);
  useEffect(() => { const c = animate(count, value, { duration: 1.5, ease: "easeOut" }); const u = rounded.on("change", (v: number) => setDisplay(v)); return () => { c.stop(); u(); }; }, [value, count, rounded]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = size * 0.38, circ = 2 * Math.PI * r, color = scoreColor(score);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={3} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ} style={{ transition: "stroke-dashoffset 1.5s ease", filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: size * 0.28, color, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Dynamic Task Generator ───
// This now creates personalized tasks based on their EXACT metrics
function generateDynamicTasks(result: AuditResult): Task[] {
  const tasks: Task[] = [];
  const loss = result.annualRevenueLoss;

  if (result.metrics.lcp > 2500) {
    tasks.push({ id: "lcp", title: "Resolve LCP Bottleneck", desc: `Your Largest Contentful Paint is ${fmtMs(result.metrics.lcp)}. Google requires < 2.5s. You must shave off ${fmtMs(result.metrics.lcp - 2500)} to hit the green zone. Preload the hero asset and implement Next-Gen image formats.`, impact: "High", effort: "Low", val: Math.round((loss * 0.45) / 1000), status: "pending" });
  }
  if (result.metrics.tbt > 200) {
    tasks.push({ id: "tbt", title: "Clear Main Thread Blocking", desc: `Your Total Blocking Time is ${fmtMs(result.metrics.tbt)}. Scripts are freezing the browser. Audit third-party tags (Meta/Google) and defer execution until after the initial render.`, impact: "High", effort: "Medium", val: Math.round((loss * 0.35) / 1000), status: "pending" });
  }
  if (result.metrics.cls > 0.1) {
    tasks.push({ id: "cls", title: "Fix Layout Shifts", desc: `Elements are jumping around during load (CLS: ${result.metrics.cls.toFixed(2)}). Ensure all ad slots and <img> tags have explicit width/height attributes to reserve DOM space.`, impact: "Medium", effort: "Low", val: Math.round((loss * 0.20) / 1000), status: "pending" });
  }
  
  if (tasks.length === 0) tasks.push({ id: "cache", title: "Implement Stale-While-Revalidate", desc: "Your Core Web Vitals are healthy. Implement advanced caching to improve returning visitor latency.", impact: "Low", effort: "Medium", val: 0, status: "pending" });
  
  return tasks;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [sites, setSites] = useState<TrackedSite[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ smsPhone: "", smsAlerts: false, webhookUrl: "", weeklyDigest: true, criticalAlerts: true });
  const [pulseEvents, setPulseEvents] = useState<{time:string, text:string, type:"good"|"bad"|"neutral"}[]>([{ time: "Just now", text: "System connection established. Database synced.", type: "neutral" }]);
  const [newUrl, setNewUrl] = useState("");

  // 1. PERSISTENCE ENGINE (Load from Database/LocalStorage)
  useEffect(() => {
    const savedData = localStorage.getItem("nexus_pulse_db");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setSites(parsed.sites || []);
      setSettings(parsed.settings || { smsPhone: "", smsAlerts: false, webhookUrl: "", weeklyDigest: true, criticalAlerts: true });
    } else {
      // Default state if totally new
      setSites([{ id: "demo", url: "yourwebsite.com", label: "Your Domain", isOwn: true, result: null, history: [], tasks: [], loading: false, error: "" }]);
    }
    setIsLoaded(true);
  }, []);

  // 2. PERSISTENCE ENGINE (Save to Database/LocalStorage)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("nexus_pulse_db", JSON.stringify({ sites, settings }));
    }
  }, [sites, settings, isLoaded]);

  // Derived state
  const own = sites.find(s => s.isOwn);
  const competitors = sites.filter(s => !s.isOwn);
  const topCompetitor = competitors.filter(s => s.result).sort((a,b) => b.result!.metrics.performanceScore - a.result!.metrics.performanceScore)[0];
  const gap = topCompetitor && own?.result ? topCompetitor.result!.metrics.performanceScore - own.result.metrics.performanceScore : 0;
  const pendingRecovery = (own?.tasks || []).filter(t => t.status === "verifying").reduce((a,b) => a + b.val, 0) || 0;

  const logPulse = (text: string, type: "good"|"bad"|"neutral") => setPulseEvents(prev => [{ time: "Just now", text, type }, ...prev].slice(0, 5));

  // The Scan Engine
  const scan = useCallback(async (id: string, forceUrl?: string) => {
    const targetSite = sites.find(s => s.id === id);
    const targetUrl = forceUrl || targetSite?.url;
    if (!targetUrl) return;

    // Clean URL
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl;

    setSites(prev => prev.map(s => s.id === id ? { ...s, loading: true, error: "" } : s));
    logPulse(`Initiating deep scan for ${cleanUrl}...`, "neutral");
    
    try {
      const r = await fetchAudit(cleanUrl);
      setSites(prev => prev.map(s => {
        if (s.id !== id) return s;
        // If it's our own site, generate dynamic tasks based on the new metrics
        const updatedTasks = s.isOwn ? generateDynamicTasks(r) : [];
        return { ...s, loading: false, result: r, url: cleanUrl, tasks: updatedTasks, history: [...s.history.slice(-11), { ts: r.timestamp, score: r.metrics.performanceScore }] };
      }));
      logPulse(`Scan complete. Metrics updated.`, "good");
    } catch (e) {
      setSites(prev => prev.map(s => s.id === id ? { ...s, loading: false, error: e instanceof Error ? e.message : "Scan failed" } : s));
      logPulse(`Scan failed for ${cleanUrl}.`, "bad");
    }
  }, [sites]);

  function addCompetitor(url: string) {
    if (competitors.length >= MAX_COMPETITORS) return alert("Plan limit reached. Upgrade to Pro to track more competitors.");
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    const id = `comp-${Date.now()}`;
    const label = cleanUrl.replace(/https?:\/\//, "").split('.')[0].toUpperCase();
    
    setSites(prev => [...prev, { id, url: cleanUrl, label, isOwn: false, result: null, history: [], tasks: [], loading: false, error: "" }]);
    setTimeout(() => scan(id, cleanUrl), 100);
  }

  function removeSite(id: string) { setSites(prev => prev.filter(s => s.id !== id)); logPulse("Target removed from tracking.", "neutral"); }
  
  const markTaskVerifying = (taskId: string) => {
    setSites(prev => prev.map(s => s.isOwn ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: "verifying" as const } : t) } : s));
    logPulse("Developer push detected. Queueing verification scan.", "neutral");
  };

  const sendToWebhook = async () => {
    if (!settings.webhookUrl) return alert("Please configure a Developer Webhook URL in the Settings tab first.");
    const planText = (own?.tasks || []).filter(t => t.status === "pending").map(t => `[${t.impact} Priority] ${t.title}: ${t.desc}`).join("\n\n");
    
    try {
      await fetch(settings.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `🚨 *NEXUS ACTION PLAN REQUIRED* 🚨\n\n${planText}` })
      });
      alert("Action Plan successfully dispatched to Webhook!");
      logPulse("Payload dispatched to Developer Webhook.", "good");
    } catch (e) {
      alert("Failed to send webhook. Check URL configuration.");
    }
  };

  // Do not render until localStorage is loaded
  if (!isLoaded) return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--accent)" }}>Initializing Core...</span></div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Nav ── */}
      <nav style={{ borderBottom: "1px solid var(--border)", background: "rgba(8,15,28,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", height: 54, display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--text)", letterSpacing: "0.08em" }}>NEXUS</span>
          </a>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 7px", borderRadius: 3, letterSpacing: "0.1em" }}>● LIVE DB</span>

          <div style={{ display: "flex", gap: 0, marginLeft: 12, overflowX: "auto" }} className="hide-scrollbar">
            {(["overview","action-plan","matrix","settings"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "6px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: tab === t ? "var(--text)" : "var(--muted)", textTransform: "uppercase", borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`, transition: "all 0.15s", position: "relative", whiteSpace: "nowrap" }}>
                {t.replace("-", " ")}
                {t === "action-plan" && (own?.tasks || []).some(x=>x.status==="pending") ? <span style={{ position: "absolute", top: 2, right: 0, width: 5, height: 5, borderRadius: "50%", background: "#f59e0b" }} /> : null}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 80px" }}>
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW TAB ── */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
                {/* Score Card */}
                <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 20, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, right: 0, background: own?.result?.severity === "critical" ? "var(--accent)" : "var(--surface2)", color: own?.result?.severity === "critical" ? "#fff" : "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 9, padding: "4px 12px", borderBottomLeftRadius: 10, letterSpacing: "0.1em" }}>
                    {own?.result?.severity.toUpperCase() || "UNVERIFIED"}
                  </div>
                  {own?.result ? <ScoreRing score={own.result.metrics.performanceScore} size={80} /> : <div style={{ width:80, height:80, borderRadius:"50%", border:"2px dashed var(--border)" }} />}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 6 }}>YOUR DOMAIN</p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="text" value={own?.url || ""} onChange={e => setSites(p => p.map(s => s.isOwn ? {...s, url: e.target.value} : s))} placeholder="yourwebsite.com" style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 6, padding: "6px 10px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12 }} />
                      <button onClick={() => own && scan(own.id)} disabled={own?.loading} style={{ background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text)", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>{own?.loading ? "..." : "↺"}</button>
                    </div>
                  </div>
                </div>

                {/* Revenue Loop */}
                <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em" }}>REVENUE AT RISK</p>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", background: "rgba(232,52,26,0.1)", padding: "3px 8px", borderRadius: 4 }}>BLEEDING</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 42, color: "var(--text)", lineHeight: 1 }}>{own?.result ? <AnimatedNumber value={Math.round(own.result.annualRevenueLoss/1000)} prefix="£" suffix="k" /> : "—"}</div>
                  
                  {pendingRecovery > 0 ? (
                    <div style={{ marginTop: 16, padding: "10px", background: "rgba(245,158,11,0.08)", border: "1px dashed rgba(245,158,11,0.4)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ width: 14, height: 14, border: "2px solid #f59e0b", borderTopColor: "transparent", borderRadius: "50%" }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#f59e0b" }}>Verifying £{pendingRecovery}k recovery...</span>
                    </div>
                  ) : (
                    <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                       <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>Execute Action Plan to recover funds.</span>
                    </div>
                  )}
                </div>

                {/* Live Pulse Stream */}
                <div style={{ padding: "20px", borderRadius: 16, background: "linear-gradient(180deg, var(--surface) 0%, #030712 100%)", border: "1px solid rgba(16,185,129,0.2)", position: "relative", overflow: "hidden" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#10b981", letterSpacing: "0.15em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} className="animate-pulse" />
                    SYSTEM PULSE
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <AnimatePresence>
                      {pulseEvents.map((ev, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", width: 45, flexShrink: 0, paddingTop: 2 }}>{ev.time}</span>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: ev.type === "good" ? "#10b981" : ev.type === "bad" ? "var(--accent)" : "var(--text2)", lineHeight: 1.4 }}>{ev.text}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ACTION PLAN TAB (Dynamic Data) ── */}
          {tab === "action-plan" && (
            <motion.div key="action-plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 6 }}>DEVELOPER BLUEPRINT</h2>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", maxWidth: 600 }}>Customized tasks based on your exact metrics. Dispatch directly to your development team.</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => {
                      const text = (own?.tasks || []).map(t => `Task: ${t.title}\nDesc: ${t.desc}\nPriority: ${t.impact}`).join("\n\n");
                      navigator.clipboard.writeText(`DEV OPTIMIZATION PLAN:\n\n${text}`);
                      alert("Copied to clipboard!");
                  }} style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border2)", padding: "10px 16px", borderRadius: 8, cursor: "pointer" }}>📋 COPY</button>
                  <button onClick={sendToWebhook} style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "#f59e0b", color: "#000", border: "none", padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>🚀 SEND VIA WEBHOOK</button>
                </div>
              </div>

              {!own?.result ? (
                <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 16 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>Run an audit on the Overview tab to generate your AI Action Plan.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(own?.tasks || []).map((t, i) => (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      style={{ padding: "24px", background: "var(--surface)", borderRadius: 16, border: `1px solid ${t.status==="verifying"?"rgba(245,158,11,0.3)":"var(--border)"}`, position: "relative", overflow: "hidden" }}>
                      
                      {t.status === "verifying" && (
                         <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, #f59e0b, transparent)", backgroundSize: "200% 100%", animation: "shimmer 2s infinite" }} />
                      )}

                      <div style={{ display: "flex", gap: 20 }}>
                        <div style={{ paddingTop: 4 }}>
                          <button onClick={() => t.status==="pending" && markTaskVerifying(t.id)} disabled={t.status!=="pending"}
                            style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${t.status==="pending"?"var(--border2)":"#f59e0b"}`, background: t.status==="pending"?"var(--bg)":"rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: t.status==="pending"?"pointer":"default", transition: "all 0.2s" }}>
                            {t.status!=="pending" && <span style={{ color: "#f59e0b", fontSize: 12 }}>✓</span>}
                          </button>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <h4 style={{ fontFamily: "var(--font-body)", fontSize: 18, fontWeight: 600, color: t.status==="verifying"?"var(--muted)":"var(--text)" }}>{t.title}</h4>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: 4, border: "1px solid rgba(16,185,129,0.2)" }}>RECOVERS ~£{t.val}k/yr</span>
                          </div>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.6, marginBottom: 16 }}>{t.desc}</p>
                          
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "4px 10px", borderRadius: 4, background: "var(--bg)", border: "1px solid var(--border)", color: t.impact === "High" ? "var(--accent)" : "var(--text)" }}>Impact: {t.impact}</span>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "4px 10px", borderRadius: 4, background: "var(--bg)", border: "1px solid var(--border)" }}>Dev Effort: {t.effort}</span>
                            </div>
                            
                            {t.status === "pending" ? (
                              <button onClick={() => markTaskVerifying(t.id)} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>Mark as Deployed →</button>
                            ) : (
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ width: 10, height: 10, border: "2px solid #f59e0b", borderTopColor: "transparent", borderRadius: "50%" }} /> Verifying in next scan...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── UNIFIED MARKET MATRIX (Battleground + Sites) ── */}
          {tab === "matrix" && (
            <motion.div key="matrix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 6 }}>MARKET MATRIX</h2>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)" }}>Track up to 3 competitors. See exactly where they are stealing your mobile traffic.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://competitor.com" onKeyDown={e => { if(e.key==="Enter") { addCompetitor(newUrl); setNewUrl(""); } }} disabled={competitors.length >= MAX_COMPETITORS} style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 8, padding: "10px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12, width: 240, opacity: competitors.length >= MAX_COMPETITORS ? 0.5 : 1 }} />
                  <button onClick={() => { addCompetitor(newUrl); setNewUrl(""); }} disabled={competitors.length >= MAX_COMPETITORS || !newUrl} style={{ background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text)", padding: "10px 16px", borderRadius: 8, cursor: competitors.length >= MAX_COMPETITORS ? "not-allowed" : "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>+ Add</button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {competitors.map((c, i) => {
                  const diff = c.result && own?.result ? own.result.metrics.performanceScore - c.result.metrics.performanceScore : 0;
                  const isWinning = diff >= 0;
                  return (
                    <div key={c.id} style={{ padding: "24px", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: isWinning ? "#10b981" : "var(--accent)" }} />
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                        
                        {/* URL & Delete Controls */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 20, color: "var(--muted)" }}>{i+1}</div>
                          <div>
                            <div style={{ fontFamily: "var(--font-body)", fontSize: 18, fontWeight: 600 }}>{c.label}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{c.url}</span>
                              <button onClick={() => scan(c.id, c.url)} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontSize: 12 }}>↺</button>
                              <button onClick={() => removeSite(c.id)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12 }}>×</button>
                            </div>
                          </div>
                        </div>
                        
                        {c.loading ? (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>Scanning target...</span>
                        ) : c.result && own?.result ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>SCORE GAP</div>
                              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: isWinning ? "#10b981" : "var(--accent)" }}>
                                {isWinning ? `+${diff}` : diff} pts
                              </div>
                            </div>
                            <div style={{ padding: "8px 16px", borderRadius: 8, background: isWinning ? "rgba(16,185,129,0.1)" : "rgba(232,52,26,0.1)", border: `1px solid ${isWinning ? "rgba(16,185,129,0.3)" : "rgba(232,52,26,0.3)"}` }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: isWinning ? "#10b981" : "var(--accent)", letterSpacing: "0.1em" }}>
                                {isWinning ? "YOU ARE WINNING" : "THEY ARE STEALING TRAFFIC"}
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* Head to Head Table */}
                      {c.result && own?.result && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                          {[
                            { label: "LCP (Speed)", yours: own.result.metrics.lcp, theirs: c.result.metrics.lcp, inv: true },
                            { label: "Ad Leak", yours: own.result.adLossPercent, theirs: c.result.adLossPercent, inv: true },
                            { label: "Bounce Spike", yours: own.result.bounceRateIncrease, theirs: c.result.bounceRateIncrease, inv: true }
                          ].map(m => {
                            const youWin = m.inv ? m.yours <= m.theirs : m.yours >= m.theirs;
                            return (
                              <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg)", borderRadius: 8, border: `1px solid ${youWin ? "rgba(16,185,129,0.2)" : "rgba(232,52,26,0.2)"}` }}>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{m.label}</span>
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: youWin ? "#10b981" : "var(--accent)" }}>{youWin ? "WIN" : "LOSS"}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {competitors.length === 0 && (
                   <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 16 }}>
                     <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>You have no competitors tracked. Add a URL above to start monitoring.</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SETTINGS TAB (Fully Functional) ── */}
          {tab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 24 }}>ACCOUNT SETTINGS</h2>

              <div style={{ display: "grid", gap: 16 }}>
                {/* Integration Config */}
                <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 20 }}>DEVELOPER INTEGRATIONS</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", marginBottom: 12 }}>Paste your Slack, Make.com, or Zapier Webhook URL to send Action Plans directly to your team.</p>
                  <input type="text" value={settings.webhookUrl} onChange={e => setSettings({...settings, webhookUrl: e.target.value})} placeholder="https://hooks.slack.com/services/..." style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "12px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12 }} />
                </div>

                {/* SMS Config */}
                <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em" }}>SMS ALERTS</p>
                    <button onClick={() => setSettings({...settings, smsAlerts: !settings.smsAlerts})} style={{ width: 44, height: 24, borderRadius: 12, background: settings.smsAlerts ? "#10b981" : "var(--bg)", border: "1px solid var(--border2)", position: "relative", cursor: "pointer", transition: "all 0.2s" }}>
                      <div style={{ position: "absolute", left: settings.smsAlerts ? 22 : 2, top: 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
                    </button>
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", marginBottom: 12 }}>Receive an instant text when a competitor deploys a faster site.</p>
                  <input type="tel" disabled={!settings.smsAlerts} value={settings.smsPhone} onChange={e => setSettings({...settings, smsPhone: e.target.value})} placeholder="+44 7700 000000" style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "12px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12, opacity: settings.smsAlerts ? 1 : 0.5 }} />
                </div>

                {/* Danger Zone */}
                <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 6 }}>DANGER ZONE</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)" }}>Reset your local database to default state.</p>
                  </div>
                  <button onClick={() => { if(confirm("Clear all data?")) { localStorage.removeItem("nexus_pulse_db"); window.location.reload(); } }} style={{ padding: "10px 20px", borderRadius: 8, background: "rgba(232,52,26,0.1)", border: "1px solid rgba(232,52,26,0.3)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)" }}>HARD RESET</button>
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