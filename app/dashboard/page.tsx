"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { fetchAudit, scoreColor } from "../lib/audit";
import type { AuditResult } from "../lib/audit";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Task { id: number; title: string; desc: string; impact: "High"|"Medium"|"Low"; effort: "High"|"Medium"|"Low"; val: number; status: "pending"|"verifying"|"recovered"; }
interface TrackedSite { id: string; url: string; label: string; isOwn: boolean; result: AuditResult | null; history: { ts: number; score: number }[]; tasks: Task[]; loading: boolean; error: string; }
type Tab = "overview" | "action-plan" | "battleground" | "sites" | "alerts" | "settings";

// ─── Shared UI Components ─────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const [display, setDisplay] = useState(0);
  useEffect(() => { const c = animate(count, value, { duration: 1.5, ease: "easeOut" }); const u = rounded.on("change", (v: number) => setDisplay(v)); return () => { c.stop(); u(); }; }, [value, count, rounded]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

function Sparkline({ data, color, w = 80, h = 28 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (data.length < 2) return <div style={{ width: w, height: h }} />;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <circle cx={w} cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2} r={2.5} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
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

// ─── Fake AI Task Generator ───
function generateTasks(result: AuditResult): Task[] {
  const loss = result.annualRevenueLoss; const tasks: Task[] = [];
  if (result.metrics.lcp > 2500) tasks.push({ id: 1, title: "Preload Hero Asset & Optimize LCP", desc: "The main visible content takes too long to load. Instruct developers to add a <link rel='preload'> tag for the hero image and serve it in WebP.", impact: "High", effort: "Low", val: Math.round((loss * 0.4) / 1000), status: "pending" });
  if (result.metrics.tbt > 200) tasks.push({ id: 2, title: "Defer Third-Party Scripts", desc: "JS execution is blocking the main thread. Move Meta Pixel and Analytics to load asynchronously.", impact: "High", effort: "Medium", val: Math.round((loss * 0.35) / 1000), status: "pending" });
  if (result.metrics.cls > 0.1) tasks.push({ id: 3, title: "Set Explicit Image Dimensions", desc: "Page layout shifts while loading. Ensure all <img> tags have width and height attributes.", impact: "Medium", effort: "Low", val: Math.round((loss * 0.25) / 1000), status: "pending" });
  return tasks;
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [sites, setSites] = useState<TrackedSite[]>([{ id: "demo", url: "yourwebsite.com", label: "Primary Domain", isOwn: true, result: null, history: [], tasks: [], loading: false, error: "" }]);
  const [tab, setTab] = useState<Tab>("overview");
  const [pulseEvents, setPulseEvents] = useState<{time:string, text:string, type:"good"|"bad"|"neutral"}[]>([ { time: "Just now", text: "System connection established. Monitoring active.", type: "neutral" } ]);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsSaved, setSmsSaved] = useState(false);

  const planLimit = 4; // Max 4 tracking slots
  const competitors = sites.filter(s => !s.isOwn);
  const own = sites.find(s => s.isOwn);

  const scan = useCallback(async (id: string, customUrl?: string, isSilent = false) => {
    const urlToScan = customUrl || sites.find(s => s.id === id)?.url;
    if (!urlToScan) return;

    if (!isSilent) setSites(prev => prev.map(s => s.id === id ? { ...s, loading: true, error: "" } : s));
    
    try {
      const r = await fetchAudit(urlToScan);
      setSites(prev => prev.map(s => s.id === id ? { ...s, loading: false, result: r, tasks: s.isOwn && s.tasks.length === 0 ? generateTasks(r) : s.tasks, history: [...s.history.slice(-11), { ts: r.timestamp, score: r.metrics.performanceScore }] } : s));
      setPulseEvents(prev => [{ time: "Just now", text: `Automated scan completed.`, type: "neutral" as const }, ...prev].slice(0, 5));
    } catch (e) {
      setSites(prev => prev.map(s => s.id === id ? { ...s, loading: false, error: e instanceof Error ? e.message : "Scan failed" } : s));
    }
  }, [sites]);

  function addSite(url: string, label: string, isOwn: boolean = false) {
    const id = `site-${Date.now()}`;
    const cleanLabel = label.trim() || url.replace(/https?:\/\//, "").split('.')[0].toUpperCase();
    setSites(prev => [...prev, { id, url, label: cleanLabel, isOwn, result: null, history: [], tasks: [], loading: false, error: "" }]);
    setTimeout(() => scan(id, url), 100);
    setPulseEvents(prev => [{ time: "Just now", text: `Target locked: ${cleanLabel}. Beginning surveillance.`, type: "neutral" as const }, ...prev].slice(0, 5));
  }

  function removeSite(id: string) { setSites(prev => prev.filter(s => s.id !== id)); }

  useEffect(() => { scan("demo"); }, []);

  // Simulate ecosystem activity
  useEffect(() => {
    const intervals = [
      setTimeout(() => setPulseEvents(prev => [{ time: "2m ago", text: "Global CDN health verified. Optimal routing.", type: "good" as const }, ...prev].slice(0, 5)), 8000),
      setTimeout(() => setPulseEvents(prev => [{ time: "14m ago", text: "Competitor deployed code. Monitoring for regression.", type: "neutral" as const }, ...prev].slice(0, 5)), 18000)
    ];
    return () => intervals.forEach(clearTimeout);
  }, []);

  const markTaskVerifying = (taskId: number) => {
    setSites(prev => prev.map(s => s.isOwn ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: "verifying" as const } : t) } : s));
    setPulseEvents(prev => [{ time: "Just now", text: "Developer push detected. Queueing verification scan.", type: "neutral" as const }, ...prev].slice(0, 5));
  };

  const alerts = sites.flatMap(s => {
    if (!s.result) return [];
    const out = [];
    if (s.result.severity === "critical") out.push({ type: "critical" as const, site: s.label, msg: `Score dropped to ${s.result.metrics.performanceScore} — critical status` });
    if (s.result.adLossPercent > 30) out.push({ type: "warn" as const, site: s.label, msg: `Ad bleed spiked to ${s.result.adLossPercent}%` });
    return out;
  });

  const topCompetitor = competitors.filter(s => s.result).sort((a,b) => b.result!.metrics.performanceScore - a.result!.metrics.performanceScore)[0];
  const gap = topCompetitor && own?.result ? topCompetitor.result!.metrics.performanceScore - own.result.metrics.performanceScore : 0;
  const pendingRecovery = (own?.tasks || []).filter(t => t.status === "verifying").reduce((a,b) => a + b.val, 0) || 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Nav ── */}
      <nav style={{ borderBottom: "1px solid var(--border)", background: "rgba(8,15,28,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", height: 54, display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--text)", letterSpacing: "0.08em" }}>NEXUS</span>
          </a>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 7px", borderRadius: 3, letterSpacing: "0.1em" }}>● LIVE</span>

          <div style={{ display: "flex", gap: 0, marginLeft: 12, overflowX: "auto" }} className="hide-scrollbar">
            {(["overview","action-plan","battleground","sites","alerts","settings"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "6px 14px", background: "none", border: "none", cursor: "none", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: tab === t ? "var(--text)" : "var(--muted)", textTransform: "uppercase", borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`, transition: "all 0.15s", position: "relative", whiteSpace: "nowrap" }}>
                {t.replace("-", " ")}
                {t === "action-plan" && (own?.tasks || []).some(x=>x.status==="pending") ? <span style={{ position: "absolute", top: 2, right: 0, width: 5, height: 5, borderRadius: "50%", background: "#f59e0b" }} /> : null}
                {t === "alerts" && alerts.length > 0 && <span style={{ position: "absolute", top: 2, right: 0, width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} />}
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
                <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 20, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, right: 0, background: own?.result?.severity === "critical" ? "var(--accent)" : "var(--surface2)", color: own?.result?.severity === "critical" ? "#fff" : "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 9, padding: "4px 12px", borderBottomLeftRadius: 10, letterSpacing: "0.1em" }}>
                    {own?.result?.severity.toUpperCase() || "SCANNING"}
                  </div>
                  {own?.result ? <ScoreRing score={own.result.metrics.performanceScore} size={80} /> : <div style={{ width:80, height:80, borderRadius:"50%", border:"2px dashed var(--border)" }} />}
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 6 }}>YOUR DOMAIN</p>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)", letterSpacing: "0.05em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>{own?.label}</div>
                    {own?.result && <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginTop: 6 }}>Top 22% in industry</p>}
                  </div>
                </div>

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

              {(own?.tasks || []).some(t => t.status === "pending") && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ padding: "16px 24px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>⚠️</span>
                    <div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)", fontWeight: 500 }}>You have unresolved infrastructure bottlenecks.</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>These are currently costing you an estimated £{(own?.tasks || []).filter(t=>t.status==="pending").reduce((a,b)=>a+b.val,0)}k/year.</p>
                    </div>
                  </div>
                  <button onClick={() => setTab("action-plan")} className="btn-primary" style={{ padding: "10px 20px", borderRadius: 8, fontSize: 11, letterSpacing: "0.1em", background: "#f59e0b", color: "#000", border: "none" }}>VIEW ACTION PLAN →</button>
                </motion.div>
              )}

            </motion.div>
          )}

          {/* ── ACTION PLAN TAB ── */}
          {tab === "action-plan" && (
            <motion.div key="action-plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 6 }}>DEVELOPER BLUEPRINT</h2>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", maxWidth: 600 }}>Send this exact list to your technical team. Mark as deployed to verify revenue recovery.</p>
                </div>
                <button onClick={() => {
                    const text = (own?.tasks || []).map(t => `Task: ${t.title}\nDesc: ${t.desc}\nPriority: ${t.impact}`).join("\n\n");
                    navigator.clipboard.writeText(`DEV OPTIMIZATION PLAN:\n\n${text}`);
                    alert("Copied to clipboard! Send to your developer via Slack.");
                }} style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border2)", padding: "10px 16px", borderRadius: 8, cursor: "none" }}>📋 COPY FOR SLACK</button>
              </div>

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
                          style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${t.status==="pending"?"var(--border2)":"#f59e0b"}`, background: t.status==="pending"?"var(--bg)":"rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: t.status==="pending"?"none":"default", transition: "all 0.2s" }}>
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
                            <button onClick={() => markTaskVerifying(t.id)} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)", textDecoration: "underline", background: "none", border: "none", cursor: "none" }}>Mark as Deployed →</button>
                          ) : (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ width: 10, height: 10, border: "2px solid #f59e0b", borderTopColor: "transparent", borderRadius: "50%" }} /> Verifying in next scan...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── BATTLEGROUND TAB ── */}
          {tab === "battleground" && (
            <motion.div key="battleground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,4vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 6 }}>MARKET BATTLEGROUND</h2>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)" }}>Track exactly where your competitors are stealing your mobile traffic.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input type="text" placeholder="https://competitor.com" onKeyDown={e => { if(e.key==="Enter") { addSite(e.currentTarget.value, ""); e.currentTarget.value=""; } }} style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 8, padding: "10px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12, width: 240 }} />
                </div>
              </div>

              {competitors.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", background: "var(--surface)", borderRadius: 16, border: "1px dashed var(--border2)" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 8 }}>Identify Your Threats</h3>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--muted)", maxWidth: 400, margin: "0 auto" }}>Add your top competitors above to see exactly how much faster they are loading compared to you.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {competitors.map((c, i) => {
                    const diff = c.result && own?.result ? own.result.metrics.performanceScore - c.result.metrics.performanceScore : 0;
                    const isWinning = diff >= 0;
                    return (
                      <div key={c.id} style={{ padding: "24px", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: isWinning ? "#10b981" : "var(--accent)" }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 20, color: "var(--muted)" }}>{i+1}</div>
                            <div>
                              <div style={{ fontFamily: "var(--font-body)", fontSize: 18, fontWeight: 600 }}>{c.label}</div>
                              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{c.url}</div>
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

                        {c.result && own?.result && (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                            {[
                              { label: "LCP (Speed)", yours: own.result.metrics.lcp, theirs: c.result.metrics.lcp, inv: true },
                              { label: "Ad Leak", yours: own.result.adLossPercent, theirs: c.result.adLossPercent, inv: true },
                              { label: "Bounce Spike", yours: own.result.bounceRateIncrease, theirs: c.result.bounceRateIncrease, inv: true }
                            ].map(m => {
                              const youWin = m.inv ? m.yours < m.theirs : m.yours > m.theirs;
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
                </div>
              )}
            </motion.div>
          )}

          {/* ── SITES TAB ── */}
          {tab === "sites" && (
            <motion.div key="sites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 4 }}>MANAGE TRACKED SITES</h2>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{sites.length} / {planLimit} slots used in Nexus Pulse plan.</p>
                </div>
                <button onClick={() => sites.forEach(s => scan(s.id, s.url))} disabled={sites.some(s => s.loading)} className="btn-primary" style={{ padding: "10px 18px", borderRadius: 8, fontSize: 11, letterSpacing: "0.12em" }}>
                  {sites.some(s => s.loading) ? "SCANNING..." : "↺ RE-SCAN ALL"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sites.map(s => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "var(--surface)", border: `1px solid ${s.isOwn ? "rgba(167,139,250,0.3)" : "var(--border)"}`, borderRadius: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600 }}>{s.label}</span>
                        {s.isOwn && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa", background: "rgba(167,139,250,0.1)", padding: "2px 6px", borderRadius: 4 }}>YOUR DOMAIN</span>}
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{s.url}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      {s.loading ? (
                         <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>Scanning...</span>
                      ) : s.result ? (
                         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                           <ScoreRing score={s.result.metrics.performanceScore} size={40} />
                           <Sparkline data={s.history.map(h => h.score)} color={scoreColor(s.result.metrics.performanceScore)} w={60} h={24} />
                         </div>
                      ) : (
                         <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>No data</span>
                      )}
                      
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => scan(s.id, s.url)} style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid var(--border2)", background: "var(--bg)", color: "var(--text)", cursor: "none" }}>↺</button>
                        {!s.isOwn && <button onClick={() => removeSite(s.id)} style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid var(--border2)", background: "var(--bg)", color: "var(--accent)", cursor: "none" }}>×</button>}
                      </div>
                    </div>
                  </div>
                ))}
                
                {sites.length < planLimit && (
                  <div style={{ padding: "16px", borderRadius: 12, border: "1px dashed var(--border2)", background: "rgba(255,255,255,0.02)", display: "flex", gap: 10 }}>
                    <input type="text" placeholder="https://new-competitor.com" onKeyDown={e => { if(e.key==="Enter") { addSite(e.currentTarget.value, ""); e.currentTarget.value=""; } }} style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12 }} />
                    <button style={{ padding: "10px 16px", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--border2)", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 11, cursor: "none" }}>Add Site</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── ALERTS TAB ── */}
          {tab === "alerts" && (
            <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 20 }}>MONITORING & ALERTS</h2>

              <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 24 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 16 }}>SMS ALERT CONFIGURATION</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", marginBottom: 16, lineHeight: 1.6 }}>
                  Receive an instant text when your score drops into critical territory, or when a tracked competitor deploys a faster site than you.
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <input type="tel" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} placeholder="+44 7700 000000" style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "12px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14 }} />
                  <button onClick={() => { if (smsPhone) setSmsSaved(true); }} className="btn-primary" style={{ padding: "12px 24px", borderRadius: 8, fontSize: 11, letterSpacing: "0.12em", whiteSpace: "nowrap", background: smsSaved ? "#10b981" : undefined, border: "none" }}>
                    {smsSaved ? "✓ NUMBER SAVED" : "ENABLE SMS ALERTS"}
                  </button>
                </div>
                {smsSaved && <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#10b981", marginTop: 12 }}>✓ SMS alerts are now routing to {smsPhone}</p>}
              </div>

              {alerts.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 16 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#10b981", letterSpacing: "0.05em", marginBottom: 8 }}>ALL CLEAR</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--muted)" }}>No performance degradations detected. We&apos;ll SMS you the moment something breaks.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 4 }}>ACTIVE ANOMALIES</p>
                  {alerts.map((a, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ padding: "16px 20px", borderRadius: 12, background: a.type === "critical" ? "rgba(232,52,26,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${a.type === "critical" ? "rgba(232,52,26,0.22)" : "rgba(245,158,11,0.22)"}`, display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{a.type === "critical" ? "🔴" : "⚠️"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: a.type === "critical" ? "var(--accent)" : "var(--warn)", letterSpacing: "0.1em", marginBottom: 6 }}>{a.site}</div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.5 }}>{a.msg}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── SETTINGS TAB ── */}
          {tab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 24 }}>ACCOUNT SETTINGS</h2>

              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ padding: "24px", borderRadius: 16, background: "linear-gradient(135deg,rgba(167,139,250,0.07),rgba(167,139,250,0.02))", border: "1px solid rgba(167,139,250,0.22)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 6 }}>CURRENT SUBSCRIPTION</p>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "#a78bfa", letterSpacing: "0.05em" }}>NEXUS PULSE</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>£49/month · Renews automatically</p>
                    </div>
                    <a href="/subscribe" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#fff", background: "#a78bfa", textDecoration: "none", padding: "10px 18px", borderRadius: 8, letterSpacing: "0.1em" }}>UPGRADE TO PRO →</a>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                    {[["Tracked Slots", `${sites.length} / ${planLimit}`], ["Audit Frequency", "Weekly Automated"], ["Deliverable", "PDF Exec Summary"]].map(([l, v]) => (
                      <div key={l} style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.12)" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginBottom: 6 }}>{l}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text)" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 20 }}>NOTIFICATION PREFERENCES</p>
                  {[
                    { label: "Competitor overtakes your score", desc: "SMS + Email alert" },
                    { label: "Critical infrastructure failure", desc: "Immediate SMS" },
                    { label: "Weekly PDF Performance Digest", desc: "Sent via Email on Mondays" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text)", fontWeight: 500 }}>{item.label}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{item.desc}</div>
                      </div>
                      <div style={{ width: 44, height: 24, borderRadius: 12, background: "var(--accent)", border: "none", position: "relative" }}>
                        <div style={{ position: "absolute", right: 2, top: 2, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "24px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 6 }}>DANGER ZONE</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)" }}>Cancel your subscription or export your historical audit data.</p>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button style={{ padding: "10px 20px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border2)", cursor: "none", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)" }}>EXPORT CSV</button>
                    <button style={{ padding: "10px 20px", borderRadius: 8, background: "rgba(232,52,26,0.1)", border: "1px solid rgba(232,52,26,0.3)", cursor: "none", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)" }}>CANCEL PLAN</button>
                  </div>
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