// @ts-nocheck
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { fetchAudit, fmtMs, scoreColor } from "../lib/audit";
import type { AuditResult } from "../lib/audit";
import { supabase } from "../lib/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Task { id: string; title: string; desc: string; impact: "High"|"Medium"|"Low"; effort: "High"|"Medium"|"Low"; val: number; status: "pending"|"verifying"|"recovered"; pillar: "performance"|"seo"|"accessibility"|"security"; }
interface HistoryPoint { ts: number; perf: number; seo: number; a11y: number; sec: number; leak: number; }
interface TrackedSite { id: string; url: string; label: string; isOwn: boolean; result: AuditResult|null; history: HistoryPoint[]; tasks: Task[]; loading: boolean; error: string; }
interface UserSettings { smsPhone: string; smsAlerts: boolean; webhookUrl: string; weeklyDigest: boolean; criticalAlerts: boolean; emailTo: string; }
type Tab = "overview"|"vitals"|"blueprint"|"matrix"|"settings";
type BlueprintFilter = Task["pillar"]|"all"|"verifying";
// maxCompetitors is set per-plan in the component (see PLAN_CONFIG in supabase.ts)

// ─── Enhanced Toggle Switch ───────────────────────────────────────────────────
function ToggleSwitch({ value, onChange, color = "#10b981" }: { value: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-checked={value}
      role="switch"
      style={{
        width: 52, height: 28, borderRadius: 14,
        background: value ? color : "var(--bg)",
        border: `1.5px solid ${value ? color : "var(--border2)"}`,
        cursor: "pointer", position: "relative",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        flexShrink: 0, padding: 0, outline: "none",
        boxShadow: value ? `0 0 16px ${color}55, inset 0 1px 0 rgba(255,255,255,0.1)` : "none",
      }}
    >
      <motion.div
        animate={{ x: value ? 26 : 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        style={{
          position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%",
          background: value ? "#fff" : "var(--muted)",
          boxShadow: value ? "0 2px 6px rgba(0,0,0,0.35)" : "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
      {value && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: 7, color: "#fff", letterSpacing: "0.05em", fontWeight: 700 }}>
          ON
        </motion.div>
      )}
    </button>
  );
}

// ─── Animated Number ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix="", suffix="" }: { value: number; prefix?: string; suffix?: string }) {
  const count = useMotionValue(0), rounded = useTransform(count, Math.round);
  const [d, setD] = useState(0);
  useEffect(() => { const c = animate(count, value, { duration: 1.5, ease: "easeOut" }); const u = rounded.on("change", v => setD(v)); return () => { c.stop(); u(); }; }, [value]);
  return <span>{prefix}{d.toLocaleString()}{suffix}</span>;
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size=56, label }: { score: number; size?: number; label?: string }) {
  const r = size*0.38, circ = 2*Math.PI*r, color = scoreColor(score);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <div style={{ position:"relative", width:size, height:size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={3}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ-(score/100)*circ}
            style={{ transition:"stroke-dashoffset 1.5s ease", filter:`drop-shadow(0 0 6px ${color})` }}/>
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontFamily:"var(--font-display)", fontSize:size*0.28, color, lineHeight:1 }}>{score}</span>
        </div>
      </div>
      {label && <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", letterSpacing:"0.1em", textAlign:"center" }}>{label}</span>}
    </div>
  );
}

// ─── Composite Health Score ───────────────────────────────────────────────────
function CompositeScore({ result, simpleMode }: { result: AuditResult; simpleMode: boolean }) {
  const perf = result.metrics.performanceScore;
  const seo = result.seo?.estimatedSeoScore ?? 0;
  const a11y = result.accessibility?.estimatedA11yScore ?? 0;
  const sec = result.security?.estimatedBestPracticesScore ?? 0;
  const composite = Math.round(perf * 0.35 + seo * 0.30 + a11y * 0.20 + sec * 0.15);
  const color = scoreColor(composite);
  const grade = composite >= 90
    ? { label: "EXCELLENT", desc: "Your website is in great shape — keep it maintained", emoji: "🏆" }
    : composite >= 75
    ? { label: "GOOD", desc: "Performing well, but a few issues are costing you revenue", emoji: "✅" }
    : composite >= 50
    ? { label: "NEEDS WORK", desc: "Several issues are quietly draining customers and ad spend", emoji: "⚠️" }
    : { label: "CRITICAL", desc: "Serious problems are costing you customers every single day", emoji: "🚨" };
  const pillars = [
    { label: simpleMode ? "Speed" : "PERFORMANCE", score: perf, color: "#e8341a", weight: "35%", simple: "How fast your pages load" },
    { label: simpleMode ? "Google Rank" : "SEO", score: seo, color: "#f59e0b", weight: "30%", simple: "How visible you are on Google" },
    { label: simpleMode ? "Everyone Can Use It" : "ACCESSIBILITY", score: a11y, color: "#a78bfa", weight: "20%", simple: "Can all users access your site?" },
    { label: simpleMode ? "Safety" : "SECURITY", score: sec, color: "#3b82f6", weight: "15%", simple: "Protection from threats" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden", border: `1.5px solid ${color}30`, background: `linear-gradient(135deg, ${color}08 0%, var(--surface) 50%)`, boxShadow: `0 0 80px ${color}08` }}>
      {/* Header */}
      <div style={{ padding: "14px 22px", borderBottom: `1px solid ${color}18`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width={14} height={14} viewBox="0 0 28 28" fill="none"><path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)"/><path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7"/></svg>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.18em" }}>NEXUS HEALTH SCORE</span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted2)" }}>COMPOSITE · 4-PILLAR WEIGHTED</span>
      </div>
      {/* Body */}
      <div style={{ padding: "22px", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        {/* Big score */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(64px,10vw,100px)", color, lineHeight: 1, textShadow: `0 0 60px ${color}50`, letterSpacing: "-0.02em" }}>{composite}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.15em", marginTop: 4 }}>OUT OF 100</div>
        </div>
        {/* Grade + leak */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{grade.emoji}</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 26, color, letterSpacing: "0.06em", lineHeight: 1 }}>{grade.label}</span>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.6, marginBottom: 10 }}>{grade.desc}</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: "rgba(232,52,26,0.06)", border: "1px solid rgba(232,52,26,0.18)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} className="animate-pulse"/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)" }}>Revenue leaking: <strong>${result.totalMonthlyCost.toLocaleString()}/mo</strong></span>
          </div>
        </div>
        {/* 4 sub-pillars */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {pillars.map(({ label, score, color: c, weight, simple }) => (
            <div key={label} style={{ textAlign: "center", minWidth: 64 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 32, color: c, lineHeight: 1 }}>{score}</div>
              <div style={{ height: 3, background: "var(--border)", borderRadius: 2, margin: "5px 0", overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.2 }}
                  style={{ height: "100%", background: c, borderRadius: 2 }}/>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.06em", marginBottom: 2 }}>{simpleMode ? simple : label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)" }}>{weight} weight</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Site Screenshot ──────────────────────────────────────────────────────────
function SiteScreenshot({ url, result }: { url: string; result: AuditResult }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const cleanUrl = url.startsWith("http") ? url : `https://${url}`;
  const screenshotUrl = result.screenshot ?? null;
  const issues: { label: string; color: string; x: string; y: string }[] = [];
  if (result.metrics.lcp > 4000) issues.push({ label: "Slow load (LCP)", color: "#e8341a", x: "65%", y: "28%" });
  if (result.metrics.cls > 0.1) issues.push({ label: "Layout shift", color: "#f59e0b", x: "35%", y: "55%" });
  if (!result.seo?.hasMeta) issues.push({ label: "Missing meta tag", color: "#f59e0b", x: "50%", y: "6%" });
  if ((result.security?.vulnerableLibraryCount ?? 0) > 0) issues.push({ label: "Vuln. JS lib", color: "#e8341a", x: "18%", y: "78%" });
  if (!result.accessibility?.missingAltText === false) issues.push({ label: "Missing alt text", color: "#a78bfa", x: "80%", y: "50%" });
  const visibleIssues = issues.slice(0, 4);
  if (errored || !screenshotUrl) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      style={{ borderRadius: 13, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 14, background: "var(--surface)" }}>
      <div style={{ padding: "11px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} className="animate-pulse"/>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.14em" }}>SITE SNAPSHOT — CAPTURED DURING AUDIT</span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted2)" }}>{cleanUrl.replace(/https?:\/\//, "").substring(0, 44)}</span>
      </div>
      <div style={{ position: "relative", overflow: "hidden", maxHeight: 300, minHeight: loaded ? undefined : 180 }}>
        {!loaded && (
          <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", flexDirection: "column", gap: 8 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              style={{ width: 18, height: 18, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)" }}>Loading snapshot...</span>
          </div>
        )}
        <img src={screenshotUrl} onLoad={() => setLoaded(true)} onError={() => setErrored(true)}
          style={{ width: "100%", display: loaded ? "block" : "none", filter: "brightness(0.88) saturate(0.85)" }} alt="Site snapshot"/>
        {loaded && <>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(3,7,15,0.9) 100%)" }}/>
          {visibleIssues.map((issue, i) => (
            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.15, type: "spring", stiffness: 260 }}
              style={{ position: "absolute", left: issue.x, top: issue.y, transform: "translate(-50%,-50%)", zIndex: 2 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: issue.color, border: "2px solid rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: "bold", color: "#fff", boxShadow: `0 0 18px ${issue.color}80, 0 2px 8px rgba(0,0,0,0.5)`, cursor: "default" }}>{i + 1}</div>
              <div style={{ position: "absolute", top: "calc(100% + 5px)", left: "50%", transform: "translateX(-50%)", background: "rgba(3,7,15,0.92)", border: `1px solid ${issue.color}55`, borderRadius: 5, padding: "3px 8px", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: 8, color: issue.color, backdropFilter: "blur(4px)" }}>{issue.label}</div>
            </motion.div>
          ))}
          <div style={{ position: "absolute", bottom: 14, left: 16, right: 16, zIndex: 2 }}>
            {visibleIssues.length > 0
              ? <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text2)" }}>{visibleIssues.length} issue{visibleIssues.length > 1 ? "s" : ""} detected on your live site — see Blueprint tab to fix</p>
              : <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#10b981" }}>✓ No critical visual issues detected on live snapshot</p>}
          </div>
        </>}
      </div>
    </motion.div>
  );
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Spark({ data, color="#e8341a", w=80, h=28 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (data.length < 2) return <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted2)" }}>—</span>;
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h-((v-min)/range)*(h-4)-2}`).join(" ");
  const delta = data[data.length-1]-data[data.length-2];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round"/></svg>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color: delta>=0?"#10b981":"#e8341a" }}>{delta>=0?"+":""}{delta}</span>
    </div>
  );
}

// ─── History Multi-Line Chart ─────────────────────────────────────────────────
function HistoryChart({ history }: { history: HistoryPoint[] }) {
  const [hov, setHov] = useState<number|null>(null);
  const LINES = [
    { key:"perf" as const, label:"PERF", color:"#e8341a" },
    { key:"seo" as const, label:"SEO", color:"#f59e0b" },
    { key:"a11y" as const, label:"A11Y", color:"#a78bfa" },
    { key:"sec" as const, label:"SEC", color:"#3b82f6" },
  ];
  if (history.length < 2) return (
    <div style={{ padding:"28px", textAlign:"center", border:"1px dashed var(--border)", borderRadius:10 }}>
      <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)" }}>Run 2+ scans to see your trend history</p>
    </div>
  );
  const W=580, H=150, PX=36, PY=12;
  const cW=W-PX*2, cH=H-PY*2;
  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ minWidth:340, position:"relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto" }}>
          {[0,25,50,75,100].map(v => {
            const y = PY+cH-(v/100)*cH;
            return <g key={v}>
              <line x1={PX} x2={W-PX} y1={y} y2={y} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3,3"/>
              <text x={PX-5} y={y+3} textAnchor="end" fontSize={7} fill="var(--muted)" fontFamily="monospace">{v}</text>
            </g>;
          })}
          {LINES.map(({ key, color }) => {
            const pts = history.map((h,i) => {
              const x = PX+(i/(history.length-1))*cW;
              const y = PY+cH-((h[key]??0)/100)*cH;
              return `${x},${y}`;
            }).join(" ");
            return <polyline key={key} points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9}/>;
          })}
          {history.map((_,i) => {
            const x = PX+(i/(history.length-1))*cW;
            return <rect key={i} x={x-9} y={PY} width={18} height={cH} fill="transparent"
              style={{ cursor:"pointer" }} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}/>;
          })}
          {hov!==null && <line x1={PX+(hov/(history.length-1))*cW} x2={PX+(hov/(history.length-1))*cW} y1={PY} y2={PY+cH} stroke="rgba(255,255,255,0.12)" strokeWidth={1}/>}
        </svg>
        {hov!==null && (
          <div style={{ position:"absolute", top:0, left:`clamp(50px, ${(hov/(history.length-1))*100}%, calc(100% - 50px))`, transform:"translateX(-50%)", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:8, padding:"8px 12px", pointerEvents:"none", zIndex:10, minWidth:100 }}>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)", marginBottom:5 }}>{new Date(history[hov].ts).toLocaleDateString()}</p>
            {LINES.map(({ key, label, color }) => (
              <div key={key} style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color }}>{label}</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text)" }}>{history[hov][key]??0}</span>
              </div>
            ))}
            <div style={{ borderTop:"1px solid var(--border)", marginTop:4, paddingTop:4 }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--accent)" }}>LEAK</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text)" }}>${history[hov].leak?.toLocaleString()}/mo</span>
              </div>
            </div>
          </div>
        )}
        <div style={{ display:"flex", gap:14, marginTop:8, flexWrap:"wrap" }}>
          {LINES.map(({ label, color }) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:14, height:2, background:color, borderRadius:1 }}/>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Vital Card ───────────────────────────────────────────────────────────────
function VitalCard({ label, value, unit, good, poor, desc, fix }: { label: string; value: number; unit: string; good: number; poor: number; desc: string; fix: string }) {
  const isGood = value<=good, isBad = value>poor;
  const color = isGood?"#10b981":isBad?"#e8341a":"#f59e0b";
  const status = isGood?"GOOD":isBad?"POOR":"NEEDS WORK";
  const display = unit==="ms" ? fmtMs(value) : unit==="cls" ? value.toFixed(2) : value;
  const pct = Math.min(100, (value/(poor*1.6))*100);
  return (
    <div style={{ padding:"18px 20px", borderRadius:14, background:"var(--surface)", border:`1px solid ${color}22` }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)", letterSpacing:"0.1em" }}>{label}</span>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color, background:`${color}15`, border:`1px solid ${color}30`, padding:"2px 7px", borderRadius:4 }}>{status}</span>
      </div>
      <div style={{ fontFamily:"var(--font-display)", fontSize:30, color, lineHeight:1, marginBottom:6 }}>{display}</div>
      <div style={{ height:3, background:"var(--border)", borderRadius:2, marginBottom:10, overflow:"hidden" }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1, ease:"easeOut" }}
          style={{ height:"100%", background:color, borderRadius:2 }}/>
      </div>
      <p style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--muted)", lineHeight:1.5, marginBottom:8 }}>{desc}</p>
      <div style={{ padding:"7px 10px", borderRadius:8, background:"var(--bg)", border:"1px solid var(--border)" }}>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"#f59e0b" }}>Fix → {fix}</p>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:7 }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"#10b981" }}>✓ ≤{unit==="ms"?fmtMs(good):good}</span>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"#e8341a" }}>✗ {'>'}{unit==="ms"?fmtMs(poor):poor}</span>
      </div>
    </div>
  );
}

// ─── Recovery Tracker ─────────────────────────────────────────────────────────
function RecoveryTracker({ tasks }: { tasks: Task[] }) {
  const total = tasks.reduce((a,t)=>a+t.val,0);
  const recovered = tasks.filter(t=>t.status==="recovered").reduce((a,t)=>a+t.val,0);
  const verifying = tasks.filter(t=>t.status==="verifying").reduce((a,t)=>a+t.val,0);
  const pct = total>0 ? Math.round((recovered/total)*100) : 0;
  return (
    <div style={{ padding:"18px 22px", borderRadius:14, background:"var(--surface)", border:"1px solid var(--border)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.14em" }}>REVENUE RECOVERY TRACKER</p>
        <span style={{ fontFamily:"var(--font-display)", fontSize:13, color:"#10b981" }}>{pct}% RECOVERED</span>
      </div>
      <div style={{ height:6, background:"var(--border)", borderRadius:3, marginBottom:14, overflow:"hidden", position:"relative" }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${((recovered+verifying)/Math.max(total,1))*100}%` }}
          transition={{ duration:1.2 }} style={{ position:"absolute", left:0, top:0, height:"100%", background:"#f59e0b", borderRadius:3, opacity:0.35 }}/>
        <motion.div initial={{ width:0 }} animate={{ width:`${(recovered/Math.max(total,1))*100}%` }}
          transition={{ duration:1.2 }} style={{ position:"absolute", left:0, top:0, height:"100%", background:"#10b981", borderRadius:3 }}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {[
          { label:"POTENTIAL", val:`$${total}k/yr`, color:"var(--muted)" },
          { label:"VERIFYING", val:verifying>0?`$${verifying}k/yr`:"—", color:"#f59e0b" },
          { label:"RECOVERED", val:recovered>0?`$${recovered}k/yr`:"—", color:"#10b981" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:15, color, marginBottom:2 }}>{val}</div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--muted2)", letterSpacing:"0.08em" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Technical Health Panel ───────────────────────────────────────────────────
function TechPanel({ result }: { result: AuditResult }) {
  const { tech, metrics } = result;
  const checks = [
    { label:"Render-Blocking Resources", bad:tech.renderBlockingResources, impact:"Delays first paint by 1–3s", fix:"Add defer/async to scripts. Inline critical CSS." },
    { label:"Unused JavaScript", bad:tech.unusedJavascript, impact:"Dead code loaded by every visitor", fix:"Tree-shake bundles. Remove unused dependencies." },
    { label:"Image Optimisation", bad:tech.noImageOptimisation, impact:"Largest contributor to slow LCP", fix:"Convert to WebP/AVIF. Set explicit width/height." },
    { label:"Browser Caching", bad:tech.noBrowserCache, impact:"Return visitors re-download everything", fix:"Cache-Control: max-age=31536000 on static assets." },
    { label:"Text Compression", bad:tech.noCompression, impact:"HTML/CSS/JS served uncompressed", fix:"Enable gzip or Brotli on your server or CDN." },
  ];
  const passing = checks.filter(c=>!c.bad).length;
  const color = passing===checks.length?"#10b981":passing>=3?"#f59e0b":"#e8341a";
  return (
    <div style={{ padding:"18px 22px", borderRadius:14, background:"var(--surface)", border:"1px solid var(--border)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.14em" }}>TECHNICAL HEALTH</p>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color }}>{passing}/{checks.length} PASSING</span>
      </div>
      {tech.thirdPartyImpact>400 && (
        <div style={{ marginBottom:10, padding:"6px 10px", borderRadius:7, background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.2)", display:"flex", gap:7, alignItems:"center" }}>
          <span>⚠️</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"#f59e0b" }}>3rd-party scripts blocking main thread for {fmtMs(tech.thirdPartyImpact)}</span>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {checks.map(({ label, bad, impact, fix }) => (
          <div key={label} style={{ padding:"9px 11px", borderRadius:9, background:bad?"rgba(232,52,26,0.04)":"rgba(16,185,129,0.03)", border:`1px solid ${bad?"rgba(232,52,26,0.12)":"rgba(16,185,129,0.12)"}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <span style={{ fontSize:9 }}>{bad?"🔴":"🟢"}</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:bad?"var(--text)":"var(--muted)", flex:1 }}>{label}</span>
              {!bad && <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"#10b981" }}>PASS</span>}
            </div>
            {bad && <>
              <p style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--muted)", marginLeft:16, marginTop:3 }}>{impact}</p>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"#f59e0b", marginLeft:16, marginTop:2 }}>→ {fix}</p>
            </>}
          </div>
        ))}
      </div>
      <div style={{ marginTop:10, display:"flex", gap:12, padding:"8px 10px", borderRadius:8, background:"var(--bg)", border:"1px solid var(--border)" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:16, color:metrics.speedIndex<3400?"#10b981":metrics.speedIndex<5800?"#f59e0b":"#e8341a" }}>{fmtMs(metrics.speedIndex)}</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--muted)" }}>SPEED INDEX</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:16, color:metrics.fcp<1800?"#10b981":metrics.fcp<3000?"#f59e0b":"#e8341a" }}>{fmtMs(metrics.fcp)}</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--muted)" }}>FIRST PAINT</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:16, color:tech.estimatedTechScore>75?"#10b981":tech.estimatedTechScore>50?"#f59e0b":"#e8341a" }}>{tech.estimatedTechScore}</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--muted)" }}>TECH SCORE</div>
        </div>
      </div>
    </div>
  );
}

// ─── Conversion Signals Panel ─────────────────────────────────────────────────
function ConversionPanel({ result }: { result: AuditResult }) {
  const { leads, seo } = result;
  const signals = [
    { label:"Live Chat Widget", has:leads.hasLiveChatWidget, tip:"+15% avg lead capture rate" },
    { label:"Contact / Lead Form", has:leads.hasContactForm, tip:"Primary conversion mechanism" },
    { label:"Clear CTA Button", has:leads.hasCTA, tip:"Drives visitor to next step" },
    { label:"Phone Number Visible", has:leads.hasPhoneNumber, tip:"Trust signal + direct contact" },
    { label:"Meta Description", has:seo.hasMeta, tip:"~35% CTR boost from Google" },
    { label:"OG / Social Tags", has:seo.hasOGTags, tip:"Controls how links look on social" },
    { label:"Structured Data", has:seo.hasStructuredData, tip:"Enables rich results in SERP" },
    { label:"HTTPS Secure", has:seo.httpsEnabled, tip:"Trust + direct ranking signal" },
  ];
  const score = Math.round((signals.filter(s=>s.has).length/signals.length)*100);
  return (
    <div style={{ padding:"18px 22px", borderRadius:14, background:"var(--surface)", border:"1px solid var(--border)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.14em" }}>CONVERSION SIGNALS</p>
        <span style={{ fontFamily:"var(--font-display)", fontSize:17, color:scoreColor(score) }}>{score}/100</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        {signals.map(({ label, has, tip }) => (
          <div key={label} style={{ display:"flex", gap:7, padding:"7px 9px", borderRadius:8, background:has?"rgba(16,185,129,0.04)":"rgba(232,52,26,0.04)", border:`1px solid ${has?"rgba(16,185,129,0.14)":"rgba(232,52,26,0.12)"}` }}>
            <span style={{ fontSize:9, marginTop:1 }}>{has?"✅":"❌"}</span>
            <div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:has?"#10b981":"var(--text2)" }}>{label}</div>
              <div style={{ fontFamily:"var(--font-body)", fontSize:9, color:"var(--muted)", marginTop:1 }}>{tip}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Since-Last-Scan Digest ───────────────────────────────────────────────────
function ScanDigest({ history }: { history: HistoryPoint[] }) {
  if (history.length<2) return null;
  const now = history[history.length-1], prev = history[history.length-2];
  const deltas = [
    { label:"Performance", now:now.perf, d:now.perf-prev.perf, icon:"⚡" },
    { label:"SEO", now:now.seo, d:now.seo-prev.seo, icon:"🔍" },
    { label:"Accessibility", now:now.a11y, d:now.a11y-prev.a11y, icon:"♿" },
    { label:"Security", now:now.sec, d:now.sec-prev.sec, icon:"🔒" },
  ];
  const leakDelta = now.leak-prev.leak;
  return (
    <div style={{ padding:"13px 18px", borderRadius:12, background:"linear-gradient(135deg,rgba(167,139,250,0.06),rgba(167,139,250,0.02))", border:"1px solid rgba(167,139,250,0.2)", marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ width:5, height:5, borderRadius:"50%", background:"#a78bfa", display:"inline-block" }}/>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"#a78bfa", letterSpacing:"0.14em" }}>SINCE LAST SCAN — {new Date(prev.ts).toLocaleDateString()}</p>
        {leakDelta!==0 && (
          <span style={{ marginLeft:"auto", fontFamily:"var(--font-mono)", fontSize:8, color:leakDelta>0?"#e8341a":"#10b981" }}>
            Revenue leak {leakDelta>0?"↑":"↓"} ${Math.abs(leakDelta).toLocaleString()}/mo
          </span>
        )}
      </div>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
        {deltas.map(({ label, now:n, d, icon }) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:10 }}>{icon}</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text2)" }}>{label}</span>
            <span style={{ fontFamily:"var(--font-display)", fontSize:13, color:scoreColor(n) }}>{n}</span>
            {d!==0 && <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:d>0?"#10b981":"#e8341a" }}>{d>0?"+":""}{d}</span>}
            {d===0 && <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted2)" }}>—</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Task Generator ───────────────────────────────────────────────────────────
function generateTasks(result: AuditResult): Task[] {
  const tasks: Task[] = [];
  const L = result.annualRevenueLoss;
  if (result.metrics.lcp>2500) tasks.push({ id:"lcp", pillar:"performance", title:"Resolve LCP Bottleneck", desc:`LCP is ${fmtMs(result.metrics.lcp)} — ${fmtMs(result.metrics.lcp-2500)} over Google's threshold. Preload hero asset, use WebP/AVIF, enable server caching.`, impact:"High", effort:"Low", val:Math.round((L*0.4)/1000), status:"pending" });
  if (result.metrics.tbt>200) tasks.push({ id:"tbt", pillar:"performance", title:"Clear Main Thread Blocking", desc:`TBT is ${fmtMs(result.metrics.tbt)}. Third-party scripts are freezing the browser. Defer execution until after first paint.`, impact:"High", effort:"Medium", val:Math.round((L*0.3)/1000), status:"pending" });
  if (result.metrics.cls>0.1) tasks.push({ id:"cls", pillar:"performance", title:"Fix Layout Shift (CLS)", desc:`CLS: ${result.metrics.cls.toFixed(2)}. Elements are jumping mid-load — users click the wrong buttons. Set explicit dimensions on all images and embeds.`, impact:"Medium", effort:"Low", val:Math.round((L*0.15)/1000), status:"pending" });
  if (result.seo && !result.seo.hasMeta) tasks.push({ id:"meta", pillar:"seo", title:"Write Meta Descriptions", desc:"No meta description detected. Google auto-generates one users ignore — reducing CTR by ~35%. Write 155-char descriptions for every page.", impact:"Medium", effort:"Low", val:Math.round((L*0.10)/1000), status:"pending" });
  if (result.seo && !result.seo.mobileViewport) tasks.push({ id:"viewport", pillar:"seo", title:"Add Mobile Viewport Tag", desc:"Missing viewport tag. Google demotes non-mobile-optimised sites in all rankings — 68% of your traffic is mobile.", impact:"High", effort:"Low", val:Math.round((L*0.20)/1000), status:"pending" });
  if (result.security?.vulnerableLibraryCount>0) tasks.push({ id:"vuln", pillar:"security", title:`Update ${result.security.vulnerableLibraryCount} Vulnerable Libraries`, desc:`${result.security.vulnerableLibraryCount} JS libraries with known CVEs. Browsers warn users at checkout. Update dependencies immediately.`, impact:"High", effort:"Medium", val:Math.round((L*0.12)/1000), status:"pending" });
  if (result.security && !result.security.hasSecurityHeaders) tasks.push({ id:"headers", pillar:"security", title:"Add Security Response Headers", desc:"CSP, X-Frame-Options, and HSTS missing. Free to implement — directly signals trustworthiness to B2B buyers.", impact:"Medium", effort:"Low", val:Math.round((L*0.06)/1000), status:"pending" });
  if (result.accessibility?.adaRiskLevel!=="low") {
    const high = result.accessibility.adaRiskLevel==="high";
    tasks.push({ id:"ada", pillar:"accessibility", title:high?"Remediate Critical ADA Violations":"Fix WCAG Issues", desc:high?`HIGH ADA risk. Lawsuits avg $25k–$90k. Locking out ~${result.accessibility.estimatedMarketLockout}% of potential customers.`:`~${result.accessibility.estimatedMarketLockout}% of users can't fully access your site.`, impact:high?"High":"Medium", effort:"Medium", val:Math.round((L*(high?0.08:0.04))/1000), status:"pending" });
  }
  if (result.accessibility?.missingAltText) tasks.push({ id:"alt", pillar:"accessibility", title:"Add Alt Text to All Images", desc:"Missing alt attributes breaks screen readers and loses Google Images SEO signal entirely.", impact:"Medium", effort:"Low", val:Math.round((L*0.04)/1000), status:"pending" });
  if (tasks.length===0) tasks.push({ id:"cache", pillar:"performance", title:"Implement SWR Caching", desc:"All 4 pillars healthy. Next level: stale-while-revalidate caching improves returning visitor speed.", impact:"Low", effort:"Medium", val:0, status:"pending" });
  return tasks;
}

const PM: Record<Task["pillar"], { icon: string; color: string; label: string }> = {
  performance: { icon:"⚡", color:"#e8341a", label:"Performance" },
  seo:         { icon:"🔍", color:"#f59e0b", label:"SEO" },
  security:    { icon:"🔒", color:"#3b82f6", label:"Security" },
  accessibility:{ icon:"♿", color:"#a78bfa", label:"Accessibility" },
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string|null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [plan, setPlan] = useState<"pulse"|"scale">("pulse");
  const maxCompetitors = plan === "scale" ? 10 : 3;
  const [tab, setTab] = useState<Tab>("overview");
  const [sites, setSites] = useState<TrackedSite[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ smsPhone:"", smsAlerts:false, webhookUrl:"", weeklyDigest:true, criticalAlerts:true, emailTo:"" });
  const [pdfLoading, setPdfLoading] = useState(false);
  const [simpleMode, setSimpleMode] = useState(false);
  const [pulse, setPulse] = useState<{ time:string; text:string; type:"good"|"bad"|"neutral" }[]>([{ time:"Just now", text:"Secure connection established. Cloud synced.", type:"neutral" }]);
  const [newUrl, setNewUrl] = useState("");
  const [pillarFilter, setPillarFilter] = useState<BlueprintFilter>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scoreToast, setScoreToast] = useState<string|null>(null);
  const [scanStartedAt, setScanStartedAt] = useState<number|null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    (async () => {
      const { data:{ session } } = await supabase.auth.getSession();
      if (!session) { window.location.href="/login"; return; }
      setUserId(session.user.id);
      setUserEmail(session.user.email ?? "");
      const { data } = await supabase.from("profiles").select("app_data,tier").eq("id",session.user.id).single();
      if (data?.tier) setPlan(data.tier as "pulse"|"scale");
      if (data?.app_data && Object.keys(data.app_data).length>0) {
        const validP = new Set(["performance","seo","security","accessibility"]);
        const raw: TrackedSite[] = data.app_data.sites||[];
        setSites(raw.map(s => ({ ...s, tasks:(s.tasks||[]).filter((t:Task)=>validP.has(t.pillar)) })));
        setSettings(data.app_data.settings||{ smsPhone:"", smsAlerts:false, webhookUrl:"", weeklyDigest:true, criticalAlerts:true, emailTo:"" });
      } else setSites([]);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded && userId) {
      supabase.from("profiles").update({ app_data:{ sites, settings } }).eq("id",userId)
        .then(({ error }) => { if (error) console.error("Sync failed:", error); });
    }
  }, [sites, settings, loaded, userId]);

  const isScanning = sites.some(s=>s.isOwn && s.loading);
  useEffect(() => {
    if (!isScanning) { setScanStartedAt(null); return; }
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - (scanStartedAt??Date.now()))/1000)), 1000);
    return () => clearInterval(t);
  }, [isScanning, scanStartedAt]);

  const own = sites.find(s=>s.isOwn);
  const competitors = sites.filter(s=>!s.isOwn);
  const allTasks = own?.tasks||[];
  const pendingVerify = allTasks.filter(t=>t.status==="verifying").reduce((a,b)=>a+b.val,0)||0;
  const totalRecovered = allTasks.filter(t=>t.status==="recovered").reduce((a,b)=>a+b.val,0)||0;
  const log = (text: string, type: "good"|"bad"|"neutral") => setPulse(p=>[{ time:"Just now", text, type }, ...p].slice(0,6));

  const scan = useCallback((id: string, forceUrl?: string) => {
    const site = sites.find(s=>s.id===id);
    let url = (forceUrl||site?.url||"").trim();
    if (!url) return;
    if (!url.startsWith("http")) url="https://"+url;
    setScanStartedAt(Date.now()); setElapsed(0);
    setSites(p=>p.map(s=>s.id===id?{ ...s, loading:true, error:"" }:s));
    log(`Scanning ${url}...`, "neutral");
    setTimeout(async () => {
      try {
        const r = await fetchAudit(url);
        const pt: HistoryPoint = { ts:r.timestamp, perf:r.metrics.performanceScore, seo:r.seo?.estimatedSeoScore??0, a11y:r.accessibility?.estimatedA11yScore??0, sec:r.security?.estimatedBestPracticesScore??0, leak:r.totalMonthlyCost };
        // ── Critical drop alert ──────────────────────────────────────────────
        if (site?.isOwn && site.result && settings.criticalAlerts && settings.webhookUrl) {
          const drops = [
            { label:"Performance", prev:site.result.metrics.performanceScore,           now:r.metrics.performanceScore },
            { label:"SEO",         prev:site.result.seo?.estimatedSeoScore??0,           now:r.seo?.estimatedSeoScore??0 },
            { label:"Accessibility",prev:site.result.accessibility?.estimatedA11yScore??0, now:r.accessibility?.estimatedA11yScore??0 },
            { label:"Security",    prev:site.result.security?.estimatedBestPracticesScore??0, now:r.security?.estimatedBestPracticesScore??0 },
          ].filter(d=>d.prev-d.now>=10);
          if (drops.length>0) {
            const alertText = `🚨 NEXUS CRITICAL DROP — ${url}\n\n${drops.map(d=>`${d.label}: ${d.prev} → ${d.now} (−${d.prev-d.now} pts)`).join("\n")}\n\nRevenue leak: $${r.totalMonthlyCost.toLocaleString()}/mo`;
            fetch(settings.webhookUrl,{ method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ text:alertText }) }).catch(()=>{});
            log(`⚠ Critical drop detected on ${drops.map(d=>d.label).join(", ")} — alert fired.`, "bad");
          }
        }
        // ────────────────────────────────────────────────────────────────────
        const prevOwn = sites.find(s=>s.id===id&&s.isOwn);
        const prevComposite = prevOwn?.result ? Math.round(prevOwn.result.metrics.performanceScore*0.35+(prevOwn.result.seo?.estimatedSeoScore??0)*0.30+(prevOwn.result.accessibility?.estimatedA11yScore??0)*0.20+(prevOwn.result.security?.estimatedBestPracticesScore??0)*0.15) : null;
        const newComposite = Math.round(r.metrics.performanceScore*0.35+(r.seo?.estimatedSeoScore??0)*0.30+(r.accessibility?.estimatedA11yScore??0)*0.20+(r.security?.estimatedBestPracticesScore??0)*0.15);
        if (prevComposite!==null && newComposite>prevComposite) {
          setTimeout(()=>{ setScoreToast(`🎉 Score improved +${newComposite-prevComposite} pts! Now ${newComposite}/100`); setTimeout(()=>setScoreToast(null),5000); },800);
        }
        setSites(p=>p.map(s=>{
          if (s.id!==id) return s;
          const prevTasks = s.tasks||[];
          const freshTasks = s.isOwn ? generateTasks(r) : [];
          // Merge: preserve verifying/recovered status where task still exists
          const mergedTasks = freshTasks.map(ft=>{
            const prev = prevTasks.find(pt=>pt.id===ft.id);
            if (prev?.status==="verifying") {
              const resolved = isTaskResolved(ft.id, r);
              return { ...ft, status: resolved ? "recovered" as const : "verifying" as const };
            }
            if (prev?.status==="recovered") return { ...ft, status:"recovered" as const };
            return ft;
          });
          // Log resolved tasks
          const resolved = mergedTasks.filter(t=>t.status==="recovered" && prevTasks.find(pt=>pt.id===t.id&&pt.status==="verifying"));
          resolved.forEach(t=>log(`✓ ${t.title} — verified & recovered!`, "good"));
          return { ...s, loading:false, result:r, url, tasks:s.isOwn?mergedTasks:[], history:[...(s.history||[]).slice(-11), pt] };
        }));
        log("Scan complete. 4 pillars updated.", "good");
      } catch(e) {
        setSites(p=>p.map(s=>s.id===id?{ ...s, loading:false, error:e instanceof Error?e.message:"Scan failed" }:s));
        log("Scan failed.", "bad");
      }
    }, 3500);
  }, [sites, settings]);

  function addComp(url: string) {
    if (competitors.length>=maxCompetitors) { log("Competitor limit reached — upgrade to Scale for up to 10.", "bad"); return; }
    if (!url.trim()) return;
    const id=`comp-${Date.now()}`, label=url.replace(/https?:\/\//,"").split(".")[0].toUpperCase();
    setSites(p=>[...p,{ id, url:url.trim(), label, isOwn:false, result:null, history:[], tasks:[], loading:false, error:"" }]);
    setTimeout(()=>scan(id,url.trim()),100);
  }

  function removeSite(id: string) { setSites(p=>p.filter(s=>s.id!==id)); log("Target removed.", "neutral"); }

  function isTaskResolved(taskId: string, r: AuditResult): boolean {
    switch(taskId) {
      case "lcp": return r.metrics.lcp <= 2500;
      case "tbt": return r.metrics.tbt <= 200;
      case "cls": return r.metrics.cls <= 0.1;
      case "meta": return !!r.seo?.hasMeta;
      case "viewport": return !!r.seo?.mobileViewport;
      case "vuln": return (r.security?.vulnerableLibraryCount ?? 0) === 0;
      case "headers": return !!r.security?.hasSecurityHeaders;
      case "ada": return r.accessibility?.adaRiskLevel === "low";
      case "alt": return !r.accessibility?.missingAltText;
      default: return false;
    }
  }

  function markVerifying(taskId: string) {
    setSites(p=>p.map(s=>s.isOwn?{ ...s, tasks:s.tasks.map(t=>t.id===taskId?{ ...t, status:"verifying" as const }:t) }:s));
    log("Task marked for verification — run RESCAN to confirm.", "neutral");
  }

  async function downloadPDF() {
    if (!own?.result) return;
    setPdfLoading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { AuditPDF } = await import("./pdf-report");
      const blob = await pdf(React.createElement(AuditPDF, { own, competitors, plan })).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.style.display = "none";
      const domain = own.url.replace(/https?:\/\//, "").replace(/\/.*/, "");
      a.download = `nexus-audit-${domain}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      // Delay cleanup — browser needs time to start the download before the URL is revoked
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 30000);
      log("PDF report downloaded.", "good");
    } catch(e) {
      console.error("PDF error:", e);
      log("PDF generation failed.", "bad");
    } finally {
      setPdfLoading(false);
    }
  }

  async function sendWebhook() {
    if (!settings.webhookUrl) { alert("Set a Webhook URL in Settings first."); return; }
    const body = allTasks.filter(t=>t.status==="pending").map(t=>`[${t.impact} | ${PM[t.pillar].label}] ${t.title}:\n${t.desc}`).join("\n\n");
    try {
      await fetch(settings.webhookUrl,{ method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ text:`🚨 NEXUS 4-PILLAR ACTION PLAN\n\n${body}` }) });
      alert("Dispatched!"); log("Payload sent to webhook.", "good");
    } catch { alert("Failed. Check your Webhook URL."); }
  }

  if (!loaded) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1.5, ease:"linear" }}
        style={{ width:24, height:24, border:"2px solid var(--accent)", borderTopColor:"transparent", borderRadius:"50%" }}/>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", letterSpacing:"0.14em" }}>AUTHENTICATING...</span>
    </div>
  );

  const visibleTasks = pillarFilter==="verifying"
    ? allTasks.filter(t=>t.status==="verifying")
    : allTasks.filter(t=>t.status!=="recovered"&&(pillarFilter==="all"||t.pillar===pillarFilter));
  const pendingCount = allTasks.filter(t=>t.status==="pending").length;

  const TABS: { id: Tab; label: string }[] = [
    { id:"overview", label:"OVERVIEW" },
    { id:"vitals", label:"VITALS" },
    { id:"blueprint", label:"BLUEPRINT" },
    { id:"matrix", label:"MATRIX" },
    { id:"settings", label:"SETTINGS" },
  ];

  return (
    <div role="main" style={{ minHeight:"100vh", background:"var(--bg)", color:"var(--text)" }}>

      {/* ── Top Nav ── */}
      <nav style={{ borderBottom:"1px solid var(--border)", background:"rgba(8,15,28,0.97)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ width:"100%", padding:"0 16px", height:58, display:"flex", alignItems:"center", gap:8, boxSizing:"border-box" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:7, textDecoration:"none", flexShrink:0 }}>
            <svg width={15} height={15} viewBox="0 0 28 28" fill="none">
              <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)"/>
              <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7"/>
            </svg>
            <span style={{ fontFamily:"var(--font-display)", fontSize:16, color:"var(--text)", letterSpacing:"0.08em" }}>NEXUS</span>
          </a>
          <span className="dash-badge-live" style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"#10b981", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", padding:"2px 7px", borderRadius:3, flexShrink:0 }}>● LIVE</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:plan==="scale"?"#e8341a":"#a78bfa", background:plan==="scale"?"rgba(232,52,26,0.1)":"rgba(167,139,250,0.1)", border:`1px solid ${plan==="scale"?"rgba(232,52,26,0.25)":"rgba(167,139,250,0.25)"}`, padding:"2px 8px", borderRadius:3, flexShrink:0 }}>{plan.toUpperCase()}</span>
          {totalRecovered>0 && <span className="dash-badge-recovered" style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"#10b981", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", padding:"2px 8px", borderRadius:3, flexShrink:0 }}>↑ ${totalRecovered}k RECOVERED</span>}

          {/* Desktop: scrollable tab bar */}
          <div style={{ display:"flex", overflowX:"auto", marginLeft:4, flex:1 }} className="hide-scrollbar dash-tabs-scroll dash-tabs-desktop">
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"6px 14px", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.1em", color:tab===t.id?"var(--text)":"var(--muted)", borderBottom:`2px solid ${tab===t.id?"var(--accent)":"transparent"}`, transition:"all 0.15s", whiteSpace:"nowrap", position:"relative" }}>
                {t.label}
                {t.id==="blueprint"&&pendingCount>0 && <span style={{ position:"absolute", top:3, right:1, width:5, height:5, borderRadius:"50%", background:"#f59e0b" }}/>}
              </button>
            ))}
          </div>
          <div className="dash-tabs-desktop" style={{ marginLeft:"auto", flexShrink:0 }}>
            {own && (own?.loading ? (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 14px", borderRadius:6, border:"1px solid rgba(232,52,26,0.3)", background:"rgba(232,52,26,0.05)" }}>
                <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1.2, ease:"linear" }} style={{ width:8, height:8, border:"2px solid var(--accent)", borderTopColor:"transparent", borderRadius:"50%", flexShrink:0 }}/>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--accent)", letterSpacing:"0.08em" }}>SCANNING {elapsed}s</span>
              </div>
            ) : (
              <button onClick={()=>scan(own.id)} style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--accent)", background:"none", border:"1px solid rgba(232,52,26,0.3)", padding:"5px 12px", borderRadius:6, cursor:"pointer", letterSpacing:"0.08em" }}>↺ RESCAN</button>
            ))}
          </div>

          {/* Mobile: current tab label + hamburger */}
          <div className="dash-hamburger-area" style={{ display:"none", alignItems:"center", gap:8, marginLeft:"auto", flexShrink:0 }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.1em", position:"relative" }}>
              {TABS.find(t=>t.id===tab)?.label}
              {tab==="blueprint"&&pendingCount>0 && <span style={{ position:"absolute", top:-2, right:-8, width:5, height:5, borderRadius:"50%", background:"#f59e0b" }}/>}
            </span>
            <button onClick={()=>setMenuOpen(o=>!o)}
              style={{ width:40, height:40, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5, background:"none", border:"1px solid var(--border2)", borderRadius:8, cursor:"pointer", padding:0, flexShrink:0 }}>
              {menuOpen ? (
                <span style={{ fontFamily:"var(--font-mono)", fontSize:16, color:"var(--text)", lineHeight:1 }}>✕</span>
              ) : (
                <>
                  <span style={{ width:18, height:1.5, background:"var(--text)", borderRadius:1, display:"block" }}/>
                  <span style={{ width:18, height:1.5, background:"var(--text)", borderRadius:1, display:"block" }}/>
                  <span style={{ width:12, height:1.5, background:"var(--muted)", borderRadius:1, display:"block" }}/>
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu Overlay ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div key="mobile-menu" initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.18 }}
            style={{ position:"fixed", top:58, left:0, right:0, bottom:0, zIndex:99, background:"rgba(3,7,15,0.97)", backdropFilter:"blur(16px)", display:"flex", flexDirection:"column", padding:"12px 16px 32px" }}>
            {/* Tabs */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4, marginBottom:16 }}>
              {TABS.map(t=>{
                const active = tab===t.id;
                return (
                  <button key={t.id} onClick={()=>{ setTab(t.id); setMenuOpen(false); }}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px", borderRadius:12, background:active?"rgba(232,52,26,0.08)":"var(--surface)", border:`1px solid ${active?"rgba(232,52,26,0.3)":"var(--border)"}`, cursor:"pointer", transition:"all 0.15s", position:"relative" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:16 }}>{ {overview:"📊",vitals:"⚡",blueprint:"📋",matrix:"🎯",settings:"⚙️"}[t.id] }</span>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:13, letterSpacing:"0.1em", color:active?"var(--text)":"var(--text2)" }}>{t.label}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {t.id==="blueprint"&&pendingCount>0 && <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"#f59e0b", background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.3)", padding:"1px 7px", borderRadius:10 }}>{pendingCount} tasks</span>}
                      {active && <span style={{ color:"var(--accent)", fontSize:14 }}>●</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Rescan */}
            {own && (
              <button onClick={()=>{ scan(own.id); setMenuOpen(false); }} disabled={own?.loading}
                style={{ width:"100%", padding:"16px", borderRadius:12, background:own?.loading?"var(--surface)":"rgba(232,52,26,0.08)", border:`1px solid ${own?.loading?"var(--border)":"rgba(232,52,26,0.3)"}`, cursor:own?.loading?"not-allowed":"pointer", fontFamily:"var(--font-mono)", fontSize:12, color:own?.loading?"var(--muted)":"var(--accent)", letterSpacing:"0.12em" }}>
                {own?.loading?"SCANNING...":"↺ RESCAN SITE"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ width:"100%", padding:"24px 24px 100px", boxSizing:"border-box" }}>
        <AnimatePresence mode="wait">

          {/* ══════════════ OVERVIEW ══════════════ */}
          {tab==="overview" && (
            <motion.div key="overview" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              {!own ? (
                <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} style={{ padding:"72px 20px", textAlign:"center", border:"1px dashed rgba(167,139,250,0.4)", borderRadius:16, background:"linear-gradient(180deg,rgba(167,139,250,0.05) 0%,transparent 100%)" }}>
                  <div style={{ fontSize:38, marginBottom:14 }}>🎯</div>
                  <h3 style={{ fontFamily:"var(--font-display)", fontSize:26, marginBottom:10, color:"var(--text)", letterSpacing:"0.05em" }}>Engine Calibrated & Ready</h3>
                  <p style={{ fontFamily:"var(--font-body)", color:"var(--text2)", maxWidth:400, margin:"0 auto 28px", lineHeight:1.6 }}>Enter your domain to run your first 4-pillar diagnostic.</p>
                  <div style={{ display:"flex", gap:10, justifyContent:"center", maxWidth:460, margin:"0 auto" }}>
                    <input type="text" value={newUrl} onChange={e=>setNewUrl(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&newUrl){ const id=`own-${Date.now()}`; setSites([{ id, url:newUrl.trim(), label:"Your Domain", isOwn:true, result:null, history:[], tasks:[], loading:false, error:"" }]); setTimeout(()=>scan(id,newUrl.trim()),100); setNewUrl(""); }}} placeholder="https://yourwebsite.com" style={{ flex:1, padding:"13px 17px", borderRadius:9, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", fontFamily:"var(--font-mono)", fontSize:12 }}/>
                    <button onClick={()=>{ if(!newUrl) return; const id=`own-${Date.now()}`; setSites([{ id, url:newUrl.trim(), label:"Your Domain", isOwn:true, result:null, history:[], tasks:[], loading:false, error:"" }]); setTimeout(()=>scan(id,newUrl.trim()),100); setNewUrl(""); }} style={{ padding:"0 26px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:9, fontFamily:"var(--font-mono)", fontSize:11, cursor:"pointer", letterSpacing:"0.1em" }}>INITIALIZE →</button>
                  </div>
                </motion.div>
              ) : (<>
                {(own.history?.length??0)>=2 && <ScanDigest history={own.history}/>}

              {/* ── Plain English toggle ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, padding:"9px 14px", borderRadius:9, background:"var(--surface)", border:"1px solid var(--border)", flexWrap:"wrap", gap:8 }}>
                <div>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text)", letterSpacing:"0.1em" }}>PLAIN ENGLISH MODE</span>
                  <span style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--muted)", marginLeft:10 }}>{simpleMode ? "Showing simplified labels for non-technical users" : "Showing technical metric names"}</span>
                </div>
                <ToggleSwitch value={simpleMode} onChange={setSimpleMode} color="#a78bfa"/>
              </div>

              {/* ── Composite NEXUS Health Score ── */}
              {own.result && <CompositeScore result={own.result} simpleMode={simpleMode}/>}

                <div className="dash-stat-grid-top" style={{ display:"grid", gridTemplateColumns:`repeat(${allTasks.length>0?"4":"3"},1fr)`, gap:11, marginBottom:16 }}>
                  <div style={{ padding:"17px 19px", borderRadius:13, background:"var(--surface)", border:"1px solid var(--border)", display:"flex", alignItems:"center", gap:13, position:"relative" }}>
                    <div style={{ position:"absolute", top:0, right:0, background:own.result?.severity==="critical"?"var(--accent)":own.result?.severity==="warning"?"#f59e0b":"#10b981", color:"#fff", fontFamily:"var(--font-mono)", fontSize:7, padding:"2px 9px", borderBottomLeftRadius:8 }}>{own.result?.severity?.toUpperCase()||"PENDING"}</div>
                    {own.result?<ScoreRing score={own.result.metrics.performanceScore} size={62}/>:(
                      <div style={{ width:62, height:62, borderRadius:"50%", border:"2px dashed var(--border)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1.5, ease:"linear" }} style={{ width:16, height:16, border:"2px solid var(--accent)", borderTopColor:"transparent", borderRadius:"50%" }}/>
                      </div>
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.14em", marginBottom:4 }}>YOUR DOMAIN</p>
                      <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{own.url}</p>
                      {own.result && <p style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--muted)", marginTop:3 }}>{new Date(own.result.timestamp).toLocaleString()}</p>}
                    </div>
                  </div>
                  <div style={{ padding:"17px 19px", borderRadius:13, background:"var(--surface)", border:"1px solid var(--border)" }}>
                    <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.14em", marginBottom:7 }}>MONTHLY REVENUE LEAK</p>
                    <div style={{ fontFamily:"var(--font-display)", fontSize:34, color:own.result?"var(--accent)":"var(--muted)", lineHeight:1, marginBottom:3 }}>{own.result?<AnimatedNumber value={own.result.totalMonthlyCost} prefix="$"/>:"—"}</div>
                    {own.result && <>
                      <p style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--muted)" }}>${Math.round(own.result.totalMonthlyCost*12).toLocaleString()}/yr annualised</p>
                      <div style={{ marginTop:8, display:"flex", gap:12 }}>
                        <div><div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)" }}>AD WASTE</div><div style={{ fontFamily:"var(--font-display)", fontSize:16, color:"#f59e0b" }}>${own.result.monthlyAdOverspend}/mo</div></div>
                        <div><div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)" }}>SEO LOSS</div><div style={{ fontFamily:"var(--font-display)", fontSize:16, color:"#f59e0b" }}>${own.result.monthlyOrganicLoss}/mo</div></div>
                      </div>
                    </>}
                  </div>
                  {allTasks.length>0 && <RecoveryTracker tasks={allTasks}/>}
                  <div style={{ padding:"17px 19px", borderRadius:13, background:"linear-gradient(180deg,var(--surface) 0%,#030712 100%)", border:"1px solid rgba(16,185,129,0.2)" }}>
                    <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"#10b981", letterSpacing:"0.14em", marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:"#10b981", boxShadow:"0 0 6px #10b981" }} className="animate-pulse"/> SYSTEM PULSE
                    </p>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {pulse.map((ev,i)=>(
                        <motion.div key={i} initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} style={{ display:"flex", gap:7 }}>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted2)", width:36, flexShrink:0 }}>{ev.time}</span>
                          <span style={{ fontFamily:"var(--font-body)", fontSize:10, color:ev.type==="good"?"#10b981":ev.type==="bad"?"var(--accent)":"var(--text2)", lineHeight:1.4 }}>{ev.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
                {own.result && (
                  <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
                    style={{ padding:"17px 21px", borderRadius:13, background:"var(--surface)", border:"1px solid var(--border)", marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:15 }}>
                      <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", letterSpacing:"0.14em" }}>4-PILLAR DIGITAL HEALTH</p>
                      <div style={{ display:"flex", gap:7 }}>
                        <button onClick={downloadPDF} disabled={pdfLoading} style={{ fontFamily:"var(--font-mono)", fontSize:7, color:pdfLoading?"var(--muted)":"#10b981", background:pdfLoading?"var(--bg)":"rgba(16,185,129,0.08)", border:`1px solid ${pdfLoading?"var(--border)":"rgba(16,185,129,0.3)"}`, padding:"2px 10px", borderRadius:4, cursor:pdfLoading?"not-allowed":"pointer" }}>{pdfLoading?"GENERATING...":"⬇ PDF REPORT"}</button>
                        <button onClick={()=>setTab("vitals")} style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--accent)", background:"none", border:"1px solid rgba(232,52,26,0.25)", padding:"2px 9px", borderRadius:4, cursor:"pointer" }}>DEEP DIVE →</button>
                      </div>
                    </div>
                    <div className="pillar-rings" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
                      <ScoreRing score={own.result.metrics.performanceScore} size={66} label="PERFORMANCE"/>
                      <ScoreRing score={own.result.seo?.estimatedSeoScore??0} size={66} label="SEO"/>
                      <ScoreRing score={own.result.accessibility?.estimatedA11yScore??0} size={66} label="ACCESSIBILITY"/>
                      <ScoreRing score={own.result.security?.estimatedBestPracticesScore??0} size={66} label="SECURITY"/>
                    </div>
                    <div className="dash-4pillar-stats" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, paddingTop:12, borderTop:"1px solid var(--border)" }}>
                      {[
                        { label:"Ad Tax", value:`${own.result.adLossPercent}%`, bad:own.result.adLossPercent>20 },
                        { label:"SEO Reach Lost", value:`${own.result.seo?.seoReachLossPercent??0}%`, bad:(own.result.seo?.seoReachLossPercent??0)>20 },
                        { label:"Market Lockout", value:`${own.result.accessibility?.estimatedMarketLockout??0}%`, bad:(own.result.accessibility?.estimatedMarketLockout??0)>10 },
                        { label:"Vuln. Libraries", value:(own.result.security?.vulnerableLibraryCount??0)>0?`${own.result.security.vulnerableLibraryCount} found`:"Clean", bad:(own.result.security?.vulnerableLibraryCount??0)>0 },
                      ].map(({ label, value, bad })=>(
                        <div key={label} style={{ textAlign:"center" }}>
                          <div style={{ fontFamily:"var(--font-display)", fontSize:16, color:bad?"#e8341a":"#10b981", marginBottom:2 }}>{value}</div>
                          <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.1em" }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                {/* ── Site Screenshot ── */}
                {own.result && <SiteScreenshot url={own.url} result={own.result}/>}

                {(own.history?.length??0)>=1 && (
                  <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
                    style={{ padding:"17px 21px", borderRadius:13, background:"var(--surface)", border:"1px solid var(--border)", marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", letterSpacing:"0.14em" }}>SCORE HISTORY — ALL 4 PILLARS</p>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted2)" }}>{own.history?.length??0} SCANS RECORDED</span>
                    </div>
                    <HistoryChart history={own.history||[]}/>
                  </motion.div>
                )}
                {own.result && (
                  <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.16 }}
                    style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:13 }}>
                    <TechPanel result={own.result}/>
                    <ConversionPanel result={own.result}/>
                  </motion.div>
                )}
              </>)}
            </motion.div>
          )}

          {/* ══════════════ VITALS ══════════════ */}
          {tab==="vitals" && (
            <motion.div key="vitals" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <div style={{ marginBottom:20 }}>
                <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(22px,4vw,30px)", color:"var(--text)", letterSpacing:"0.05em", marginBottom:5 }}>CORE WEB VITALS</h2>
                <p style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text2)" }}>Google's official thresholds — each metric directly impacts your ad spend and search ranking.</p>
              </div>
              {!own?.result ? (
                <div style={{ padding:"40px", textAlign:"center", border:"1px dashed var(--border)", borderRadius:13 }}><p style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--muted)" }}>Run an audit on Overview first.</p></div>
              ) : (<>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:11, marginBottom:18 }}>
                  <VitalCard label="LARGEST CONTENTFUL PAINT (LCP)" value={own.result.metrics.lcp} unit="ms" good={2500} poor={4000} desc="Time until the main content is visible. Google's #1 UX ranking factor — affects both rankings and Ad Quality Score." fix="Preload hero image. Use WebP. Reduce TTFB with server caching."/>
                  <VitalCard label="TOTAL BLOCKING TIME (TBT)" value={own.result.metrics.tbt} unit="ms" good={200} poor={600} desc="How long the page can't respond to input. High TBT means buttons feel frozen — users assume the site is broken and leave." fix="Defer 3rd-party scripts. Split large JS bundles. Remove unused code."/>
                  <VitalCard label="CUMULATIVE LAYOUT SHIFT (CLS)" value={own.result.metrics.cls} unit="cls" good={0.1} poor={0.25} desc="Visual instability as the page loads. High CLS means elements jump — users click the wrong button mid-load and abandon." fix="Set explicit width/height on all images and embeds. Reserve space for ads."/>
                  <VitalCard label="FIRST CONTENTFUL PAINT (FCP)" value={own.result.metrics.fcp} unit="ms" good={1800} poor={3000} desc="Time until first content appears on screen. Sets perceived speed — users form their first impression in 100ms." fix="Eliminate render-blocking CSS. Preload critical fonts. Serve from edge CDN."/>
                  <VitalCard label="SPEED INDEX" value={own.result.metrics.speedIndex} unit="ms" good={3400} poor={5800} desc="How quickly content visually populates during load. Composite of multiple paint metrics — Google includes this in ranking." fix="Reduce unused CSS/JS. Enable compression. Use a CDN for static assets."/>
                  <VitalCard label="PERFORMANCE SCORE" value={own.result.metrics.performanceScore} unit="score" good={90} poor={50} desc="Google Lighthouse composite score (0–100). Directly determines your Ad Quality Score and search ranking position." fix="Address LCP, TBT, and CLS above — they account for ~80% of this score."/>
                </div>
                <div style={{ padding:"17px 21px", borderRadius:13, background:"var(--surface)", border:"1px solid var(--border)", marginBottom:13 }}>
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", letterSpacing:"0.14em", marginBottom:13 }}>SEO SIGNAL BREAKDOWN</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:7, marginBottom:13 }}>
                    {[
                      { label:"Meta Description", has:own.result.seo.hasMeta, impact:"~35% CTR increase when present" },
                      { label:"Mobile Viewport Tag", has:own.result.seo.mobileViewport, impact:"Required for mobile-first indexing" },
                      { label:"HTTPS Enabled", has:own.result.seo.httpsEnabled, impact:"Direct ranking signal + trust" },
                      { label:"Site is Crawlable", has:own.result.seo.isCrawlable, impact:"Without this Google can't index you" },
                      { label:"OG / Social Tags", has:own.result.seo.hasOGTags, impact:"Controls social sharing appearance" },
                      { label:"Structured Data", has:own.result.seo.hasStructuredData, impact:"Enables rich results in SERP" },
                    ].map(({ label, has, impact })=>(
                      <div key={label} style={{ display:"flex", gap:7, padding:"7px 9px", borderRadius:8, background:has?"rgba(16,185,129,0.04)":"rgba(232,52,26,0.04)", border:`1px solid ${has?"rgba(16,185,129,0.14)":"rgba(232,52,26,0.12)"}` }}>
                        <span style={{ fontSize:9, marginTop:1 }}>{has?"✅":"❌"}</span>
                        <div>
                          <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:has?"#10b981":"var(--text2)", marginBottom:1 }}>{label}</div>
                          <div style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--muted)" }}>{impact}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:16, padding:"8px 11px", borderRadius:9, background:"var(--bg)", border:"1px solid var(--border)", flexWrap:"wrap" }}>
                    {[
                      { label:"SEO SCORE", val:own.result.seo.estimatedSeoScore, color:scoreColor(own.result.seo.estimatedSeoScore) },
                      { label:"REACH LOST", val:`${own.result.seo.seoReachLossPercent}%`, color:own.result.seo.seoReachLossPercent>30?"#e8341a":"#f59e0b" },
                      { label:"CTR LOSS", val:`${own.result.seo.ctrLoss}%`, color:own.result.seo.ctrLoss>20?"#e8341a":"#f59e0b" },
                      { label:"ORGANIC LOSS/MO", val:`$${own.result.monthlyOrganicLoss.toLocaleString()}`, color:"var(--accent)" },
                    ].map(({ label, val, color })=>(
                      <div key={label} style={{ textAlign:"center" }}>
                        <div style={{ fontFamily:"var(--font-display)", fontSize:18, color, marginBottom:1 }}>{val}</div>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)" }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding:"17px 21px", borderRadius:13, background:"var(--surface)", border:"1px solid var(--border)", marginBottom:13 }}>
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)", letterSpacing:"0.14em", marginBottom:13 }}>ACCESSIBILITY / ADA RISK</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))", gap:7, marginBottom:11 }}>
                    {[
                      { label:"Image Alt Text", pass:!own.result.accessibility.missingAltText, detail:"Screen readers & Google Images" },
                      { label:"Form Labels", pass:!own.result.accessibility.missingFormLabels, detail:"Required for WCAG 2.1 AA" },
                      { label:"Colour Contrast", pass:!own.result.accessibility.lowContrastRatio, detail:"4.5:1 minimum for body text" },
                      { label:"HTML Lang Attribute", pass:!own.result.accessibility.missingLangAttr, detail:"Required for screen reader context" },
                    ].map(({ label, pass, detail })=>(
                      <div key={label} style={{ padding:"8px 10px", borderRadius:8, background:pass?"rgba(16,185,129,0.04)":"rgba(232,52,26,0.05)", border:`1px solid ${pass?"rgba(16,185,129,0.14)":"rgba(232,52,26,0.18)"}` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                          <span style={{ fontSize:9 }}>{pass?"✅":"❌"}</span>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:pass?"#10b981":"var(--text)" }}>{label}</span>
                        </div>
                        <p style={{ fontFamily:"var(--font-body)", fontSize:9, color:"var(--muted)", marginLeft:14 }}>{detail}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:16, padding:"8px 11px", borderRadius:9, background:"var(--bg)", border:`1px solid ${own.result.accessibility.adaRiskLevel==="high"?"rgba(232,52,26,0.3)":own.result.accessibility.adaRiskLevel==="medium"?"rgba(245,158,11,0.3)":"rgba(16,185,129,0.2)"}`, flexWrap:"wrap", alignItems:"center" }}>
                    {[
                      { label:"ADA RISK", val:own.result.accessibility.adaRiskLevel.toUpperCase(), color:own.result.accessibility.adaRiskLevel==="high"?"#e8341a":own.result.accessibility.adaRiskLevel==="medium"?"#f59e0b":"#10b981" },
                      { label:"MARKET LOCKOUT", val:`${own.result.accessibility.estimatedMarketLockout}%`, color:own.result.accessibility.estimatedMarketLockout>10?"#e8341a":"#f59e0b" },
                      { label:"A11Y SCORE", val:`${own.result.accessibility.estimatedA11yScore}/100`, color:scoreColor(own.result.accessibility.estimatedA11yScore) },
                    ].map(({ label, val, color })=>(
                      <div key={label}><div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--muted)", marginBottom:1 }}>{label}</div><div style={{ fontFamily:"var(--font-display)", fontSize:17, color }}>{val}</div></div>
                    ))}
                    {own.result.accessibility.adaRiskLevel==="high" && <p style={{ fontFamily:"var(--font-body)", fontSize:11, color:"var(--text2)", flex:1, minWidth:180 }}>ADA lawsuits up 300% since 2020. Avg settlement $25k–$90k. Fix before receiving a demand letter.</p>}
                  </div>
                </div>
                <div style={{ padding:"17px 21px", borderRadius:13, background:"var(--surface)", border:"1px solid var(--border)" }}>
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)", letterSpacing:"0.14em", marginBottom:13 }}>SECURITY & BEST PRACTICES</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))", gap:7, marginBottom:11 }}>
                    {[
                      { label:"HTTPS Enabled", pass:own.result.security.usesHTTPS, detail:"SSL certificate is active" },
                      { label:"No Vulnerable Libraries", pass:own.result.security.noVulnerableLibraries, detail:`${own.result.security.vulnerableLibraryCount} CVEs found` },
                      { label:"Security Headers", pass:own.result.security.hasSecurityHeaders, detail:"CSP, HSTS, X-Frame-Options" },
                    ].map(({ label, pass, detail })=>(
                      <div key={label} style={{ padding:"9px 11px", borderRadius:8, background:pass?"rgba(16,185,129,0.04)":"rgba(232,52,26,0.05)", border:`1px solid ${pass?"rgba(16,185,129,0.14)":"rgba(232,52,26,0.18)"}` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                          <span style={{ fontSize:10 }}>{pass?"✅":"❌"}</span>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:pass?"#10b981":"var(--text)" }}>{label}</span>
                        </div>
                        <p style={{ fontFamily:"var(--font-body)", fontSize:9, color:"var(--muted)", marginLeft:18 }}>{detail}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:16, padding:"8px 11px", borderRadius:9, background:"var(--bg)", border:"1px solid var(--border)" }}>
                    <div><div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--muted)", marginBottom:1 }}>TRUST RISK</div><div style={{ fontFamily:"var(--font-display)", fontSize:17, color:own.result.security.trustRiskLevel==="high"?"#e8341a":own.result.security.trustRiskLevel==="medium"?"#f59e0b":"#10b981" }}>{own.result.security.trustRiskLevel.toUpperCase()}</div></div>
                    <div><div style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--muted)", marginBottom:1 }}>BEST PRACTICES</div><div style={{ fontFamily:"var(--font-display)", fontSize:17, color:scoreColor(own.result.security.estimatedBestPracticesScore) }}>{own.result.security.estimatedBestPracticesScore}/100</div></div>
                  </div>
                </div>
              </>)}
            </motion.div>
          )}

          {/* ══════════════ BLUEPRINT ══════════════ */}
          {tab==="blueprint" && (
            <motion.div key="blueprint" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                    <svg width={14} height={14} viewBox="0 0 28 28" fill="none"><path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)"/><path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7"/></svg>
                    <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(22px,4vw,30px)", color:"var(--text)", letterSpacing:"0.05em" }}>NEXUS BLUEPRINT</h2>
                  </div>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text2)" }}>Issues from your scan, ordered by revenue impact. ⚡ Quick Wins recover money with the least effort.</p>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>{ const text=allTasks.map(t=>`[${t.impact}|${PM[t.pillar].label}] ${t.title}\n${t.desc}`).join("\n\n"); navigator.clipboard.writeText(`NEXUS 4-PILLAR DEV PLAN:\n\n${text}`); alert("Copied!"); }} style={{ fontFamily:"var(--font-mono)", fontSize:9, background:"var(--surface)", color:"var(--text)", border:"1px solid var(--border2)", padding:"7px 12px", borderRadius:7, cursor:"pointer" }}>📋 COPY</button>
                  <button onClick={sendWebhook} style={{ fontFamily:"var(--font-mono)", fontSize:9, background:"#f59e0b", color:"#000", border:"none", padding:"7px 12px", borderRadius:7, cursor:"pointer", fontWeight:"bold" }}>🚀 WEBHOOK</button>
                  <button onClick={downloadPDF} disabled={pdfLoading} style={{ fontFamily:"var(--font-mono)", fontSize:9, background:pdfLoading?"var(--surface)":"#10b981", color:pdfLoading?"var(--muted)":"#000", border:"none", padding:"7px 12px", borderRadius:7, cursor:pdfLoading?"not-allowed":"pointer", fontWeight:"bold" }}>{pdfLoading?"GENERATING...":"⬇ PDF"}</button>
                </div>
              </div>
              {allTasks.length>0 && <div style={{ marginBottom:14 }}><RecoveryTracker tasks={allTasks}/></div>}
              {own?.result && (
                <div style={{ display:"flex", gap:5, marginBottom:13, flexWrap:"wrap" }}>
                  {([
                    { id:"all" as const, label:"All", count:allTasks.filter(t=>t.status==="pending").length },
                    { id:"verifying" as const, label:"⏳ Verifying", count:allTasks.filter(t=>t.status==="verifying").length, color:"#f59e0b" },
                    ...Object.entries(PM).map(([id,m])=>({ id:id as Task["pillar"], label:m.label, count:allTasks.filter(t=>t.pillar===id&&t.status!=="recovered").length, color:m.color }))
                  ]).map(item=>(
                    <button key={item.id} onClick={()=>setPillarFilter(item.id as BlueprintFilter)} style={{ padding:"4px 12px", borderRadius:20, border:`1px solid ${"color" in item?item.color+"40":"var(--border2)"}`, cursor:"pointer", fontFamily:"var(--font-mono)", fontSize:10, transition:"all 0.15s", background:pillarFilter===item.id?("color" in item?item.color:"var(--accent)"):"none", color:pillarFilter===item.id?"#fff":"var(--muted)" }}>
                      {item.label} ({item.count})
                    </button>
                  ))}
                </div>
              )}
              {!own?.result ? (
                <div style={{ padding:"38px", textAlign:"center", border:"1px dashed var(--border)", borderRadius:13 }}>
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--muted)" }}>Run an audit on Overview first — tasks will reflect your actual scan results.</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {visibleTasks.map((t,i)=>{
                    const pm = PM[t.pillar]??PM["performance"];
                    const codeSnippets: Record<string,string> = {
                      lcp: `<!-- Preload hero image -->\n<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">\n<!-- Convert to WebP in Next.js -->\n<Image src="/hero.jpg" priority quality={85}/>`,
                      tbt: `// next.config.js — split vendor bundles\nmodule.exports = {\n  experimental: { optimizePackageImports: ['lodash'] }\n};\n// Use dynamic import for heavy libs\nconst Chart = dynamic(()=>import('chart.js'),{ssr:false})`,
                      cls: `/* Fix layout shift — always set dimensions */\nimg { width: 100%; height: auto; aspect-ratio: 16/9; }\n/* For web fonts */\n@font-face { font-display: swap; }`,
                      meta: `<!-- Add to every page <head> -->\n<meta name="description" content="[155 chars max — your unique value prop + keyword]">\n<meta property="og:title" content="Page Title | Brand">\n<meta property="og:description" content="Same 155-char desc">`,
                      viewport: `<!-- Add to <head> if missing -->\n<meta name="viewport" content="width=device-width, initial-scale=1">`,
                      vuln: `# Check & update vulnerable packages\nnpm audit\nnpm audit fix\n# Or manually:\nnpm update [package-name]\nnpm install [package]@latest`,
                      headers: `# nginx.conf — add security headers\nadd_header X-Frame-Options "SAMEORIGIN";\nadd_header X-Content-Type-Options "nosniff";\nadd_header Content-Security-Policy "default-src 'self'";\nadd_header Strict-Transport-Security "max-age=31536000";`,
                      ada: `<!-- Fix common ADA issues -->\n<img src="..." alt="Descriptive text here">\n<label for="email">Email address</label>\n<input id="email" type="email">\n<!-- Check contrast: target 4.5:1 for body text -->`,
                      alt: `<!-- Every img needs alt text -->\n<img src="product.jpg" alt="Blue wireless headphones, overhead view">\n<!-- For decorative images -->\n<img src="divider.svg" alt="" role="presentation">`,
                      cache: `# nginx — cache static assets 1 year\nlocation ~* \\.(js|css|png|jpg|webp|woff2)$ {\n  add_header Cache-Control "public, max-age=31536000, immutable";\n}`,
                    };
                    const timeEst: Record<string,string> = {
                      lcp:"30–90 min", tbt:"1–3 hrs", cls:"30–60 min", meta:"2–4 hrs", viewport:"5 min",
                      vuln:"30–60 min", headers:"15–30 min", ada:"2–8 hrs", alt:"1–2 hrs", cache:"15–30 min",
                    };
                    const simpleTerms: Record<string,string> = {
                      lcp:"Your page takes too long to show anything. Visitors see a blank screen and leave before they even read your headline. This directly costs you ad money.",
                      tbt:"After the page looks loaded, clicking buttons does nothing for a moment. People think it's broken and close the tab.",
                      cls:"Elements jump around while loading — visitors accidentally tap the wrong button. Frustrating and bad for sales.",
                      meta:"When people search Google, your site shows up without a proper description. Fewer people click on your result.",
                      viewport:"Your site wasn't built to work on phones. Google ranks phone-friendly sites higher, and most of your visitors are on mobile.",
                      vuln:"Your website uses outdated software with known security holes. Browsers warn visitors 'this site may be unsafe' — that kills conversions.",
                      headers:"Missing security settings that tell browsers your site is safe. Enterprise clients check for this before buying.",
                      ada:"Some people using your site with a screen reader or keyboard can't use it properly. This is both a legal risk and lost revenue.",
                      alt:"Your images have no descriptions. Google can't understand them for search, and screen readers can't describe them to visually impaired users.",
                      cache:"Every time someone visits, they download everything fresh. Returning visitors should see your site instantly — this wastes their time and your server costs.",
                    };
                    const whyItMatters: Record<string,string> = {
                      lcp:"Google's Core Web Vital threshold is 2.5s. Every 100ms delay reduces conversions by ~1%. LCP is the single biggest ranking factor in Performance.",
                      tbt:"Total Blocking Time freezes the browser — users think the page is broken and bounce. Direct Google ranking signal since 2021.",
                      cls:"Layout shifts break click targets mid-load. Users accidentally tap the wrong thing and leave. CLS above 0.1 triggers Google ranking penalties.",
                      meta:"Meta descriptions control CTR from search results. No description = Google picks random text. Well-written descriptions improve CTR by 20–35%.",
                      viewport:"Without the viewport meta tag, Google's crawler treats your site as desktop-only. 68% of traffic is mobile — you're being ranked lower for all of them.",
                      vuln:"Known CVE libraries trigger browser security warnings at payment pages. B2B buyers see this and leave immediately. Also a direct liability risk.",
                      headers:"Security headers signal to enterprise buyers that your infrastructure is professionally managed. Direct trust signal during due diligence.",
                      ada:"ADA lawsuits increased 300% since 2020 and average $25k–$90k in settlement costs. Beyond legal risk, ~26% of adults have a disability — you're locking out revenue.",
                      alt:"Alt text is how Google Images indexes your content AND how screen readers describe your site. Both impact SEO reach and accessibility compliance.",
                      cache:"First-time visitors are slow — return visitors should be instant. Cache-Control headers reduce server load and improve repeat-visit LCP by 60–80%.",
                    };
                    const isQuickWin = t.impact==="High" && t.effort==="Low";
                    return (
                      <motion.div key={t.id} initial={{ opacity:0, y:7 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                        style={{ background:"var(--surface)", borderRadius:13, border:`1px solid ${isQuickWin?"rgba(16,185,129,0.3)":t.status==="verifying"?"rgba(245,158,11,0.4)":"var(--border)"}`, position:"relative", overflow:"hidden" }}>
                        {/* Color accent bar */}
                        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:isQuickWin?"#10b981":pm.color }}/>
                        {t.status==="verifying" && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,#f59e0b,transparent)", animation:"shimmer 2s infinite" }}/>}
                        <div style={{ display:"flex", gap:14, padding:"18px 20px 14px 20px" }}>
                          {/* Priority number + checkbox */}
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flexShrink:0 }}>
                            <div style={{ fontFamily:"var(--font-display)", fontSize:20, color:`${pm.color}50`, lineHeight:1 }}>#{i+1}</div>
                            <button onClick={()=>t.status==="pending"&&markVerifying(t.id)} disabled={t.status!=="pending"}
                              style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${t.status==="pending"?"var(--border2)":"#f59e0b"}`, background:t.status==="pending"?"var(--bg)":"rgba(245,158,11,0.12)", display:"flex", alignItems:"center", justifyContent:"center", cursor:t.status==="pending"?"pointer":"default" }}>
                              {t.status!=="pending" && <span style={{ color:"#f59e0b", fontSize:10 }}>✓</span>}
                            </button>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6, flexWrap:"wrap", gap:6 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                                <span style={{ fontSize:13 }}>{pm.icon}</span>
                                <h4 style={{ fontFamily:"var(--font-body)", fontSize:16, fontWeight:600, color:t.status==="verifying"?"var(--muted)":"var(--text)", margin:0 }}>{t.title}</h4>
                                {isQuickWin && <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"#10b981", background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.3)", padding:"2px 8px", borderRadius:10, letterSpacing:"0.1em" }}>⚡ QUICK WIN</span>}
                              </div>
                              <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
                                {t.val>0 && <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"#10b981", background:"rgba(16,185,129,0.1)", padding:"2px 8px", borderRadius:4, border:"1px solid rgba(16,185,129,0.2)" }}>~${t.val}k/yr recoverable</span>}
                                {timeEst[t.id] && <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", background:"var(--bg)", padding:"2px 8px", borderRadius:4, border:"1px solid var(--border)" }}>⏱ {timeEst[t.id]}</span>}
                              </div>
                            </div>
                            <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--text2)", lineHeight:1.65, marginBottom:10 }}>{t.desc}</p>
                            {/* Plain English explanation */}
                            {simpleTerms[t.id] && (
                              <div style={{ padding:"9px 12px", borderRadius:8, background:"rgba(167,139,250,0.05)", border:"1px solid rgba(167,139,250,0.15)", marginBottom:10 }}>
                                <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"#a78bfa", letterSpacing:"0.1em", marginBottom:3 }}>💬 IN PLAIN ENGLISH</p>
                                <p style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text2)", lineHeight:1.65, margin:0 }}>{simpleTerms[t.id]}</p>
                              </div>
                            )}
                            {whyItMatters[t.id] && (
                              <div style={{ padding:"9px 12px", borderRadius:8, background:"rgba(232,52,26,0.05)", border:"1px solid rgba(232,52,26,0.12)", marginBottom:10 }}>
                                <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", letterSpacing:"0.08em", marginBottom:3 }}>📊 WHY THIS MATTERS</p>
                                <p style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text2)", lineHeight:1.6, margin:0 }}>{whyItMatters[t.id]}</p>
                              </div>
                            )}
                            {codeSnippets[t.id] && (
                              <div style={{ marginBottom:10, borderRadius:8, overflow:"hidden", border:"1px solid rgba(167,139,250,0.18)" }}>
                                <div style={{ padding:"5px 11px", background:"rgba(167,139,250,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"#a78bfa", letterSpacing:"0.1em" }}>HOW TO FIX — CODE</span>
                                  <button onClick={()=>navigator.clipboard.writeText(codeSnippets[t.id])} style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--muted)", background:"none", border:"none", cursor:"pointer" }}>Copy</button>
                                </div>
                                <pre style={{ margin:0, padding:"10px 13px", background:"rgba(0,0,0,0.3)", overflowX:"auto", fontFamily:"var(--font-mono)", fontSize:10, color:"#a78bfa", lineHeight:1.7 }}>{codeSnippets[t.id]}</pre>
                              </div>
                            )}
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
                              <div style={{ display:"flex", gap:4 }}>
                                {[
                                  { label:`Impact: ${t.impact}`, color:t.impact==="High"?pm.color:"var(--text2)" },
                                  { label:`Effort: ${t.effort}`, color:"var(--muted)" },
                                  { label:pm.label, color:pm.color },
                                ].map(({ label, color })=>(
                                  <span key={label} style={{ fontFamily:"var(--font-mono)", fontSize:9, padding:"2px 7px", borderRadius:4, background:"var(--bg)", border:"1px solid var(--border)", color }}>{label}</span>
                                ))}
                              </div>
                              {t.status==="pending"
                                ? <button onClick={()=>markVerifying(t.id)} style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#10b981", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", padding:"7px 14px", borderRadius:6, cursor:"pointer" }}>✓ Mark Deployed →</button>
                                : <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                                    <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"#f59e0b", display:"flex", alignItems:"center", gap:5 }}>
                                      <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:2, ease:"linear" }} style={{ width:8, height:8, border:"2px solid #f59e0b", borderTopColor:"transparent", borderRadius:"50%", flexShrink:0 }}/> Awaiting verification
                                    </span>
                                    <button onClick={()=>own&&scan(own.id)} style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"#fff", background:"#f59e0b", border:"none", padding:"5px 12px", borderRadius:6, cursor:"pointer", letterSpacing:"0.08em" }}>VERIFY — RESCAN →</button>
                                  </div>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {visibleTasks.length===0 && pillarFilter==="verifying" && (
                    <div style={{ padding:"26px", textAlign:"center", border:"1px dashed rgba(245,158,11,0.3)", borderRadius:12, background:"rgba(245,158,11,0.03)" }}>
                      <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#f59e0b" }}>⏳ No tasks currently verifying.</p>
                      <p style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--muted)", marginTop:5 }}>Mark a task as deployed and it will appear here. The next RESCAN will confirm recovery.</p>
                    </div>
                  )}
                  {visibleTasks.length===0 && pillarFilter!=="verifying" && <div style={{ padding:"26px", textAlign:"center", border:"1px dashed var(--border)", borderRadius:12 }}><p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#10b981" }}>✓ No pending tasks in this pillar.</p></div>}
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════ MATRIX ══════════════ */}
          {tab==="matrix" && (
            <motion.div key="matrix" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, flexWrap:"wrap", gap:10 }}>
                <div>
                  <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(22px,4vw,30px)", color:"var(--text)", letterSpacing:"0.05em", marginBottom:4 }}>MARKET MATRIX</h2>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text2)" }}>4-pillar competitor intelligence. Know where rivals beat you — and where they're exposed.</p>
                </div>
                <div className="matrix-input-row" style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                  <input type="text" value={newUrl} onChange={e=>setNewUrl(e.target.value)} placeholder="https://competitor.com" onKeyDown={e=>{ if(e.key==="Enter"){ addComp(newUrl); setNewUrl(""); }}} disabled={competitors.length>=maxCompetitors} style={{ background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:7, padding:"8px 12px", color:"var(--text)", fontFamily:"var(--font-mono)", fontSize:10, width:180, opacity:competitors.length>=maxCompetitors?0.5:1 }}/>
                  <button onClick={()=>{ addComp(newUrl); setNewUrl(""); }} disabled={competitors.length>=maxCompetitors||!newUrl} style={{ background:"var(--surface2)", border:"1px solid var(--border2)", color:"var(--text)", padding:"8px 12px", borderRadius:7, cursor:"pointer", fontFamily:"var(--font-mono)", fontSize:9 }}>+ ADD</button>
                  {competitors.length>0 && <button onClick={()=>competitors.forEach(c=>scan(c.id,c.url))} style={{ background:"rgba(232,52,26,0.08)", border:"1px solid rgba(232,52,26,0.3)", color:"var(--accent)", padding:"8px 12px", borderRadius:7, cursor:"pointer", fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.08em" }}>↺ SCAN ALL</button>}
                </div>
              </div>
              {competitors.length===0 ? (
                <div style={{ padding:"44px", textAlign:"center", border:"1px dashed var(--border)", borderRadius:13 }}>
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--muted)", marginBottom:5 }}>No competitors tracked.</p>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--muted2)" }}>Add a URL above to compare 4-pillar scores side by side.</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                  {competitors.map((c,i)=>{
                    const diff = c.result&&own?.result ? own.result.metrics.performanceScore-c.result.metrics.performanceScore : 0;
                    const winning = diff>=0;
                    return (
                      <div key={c.id} style={{ background:"var(--surface)", borderRadius:13, border:"1px solid var(--border)", overflow:"hidden" }}>
                        <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border)", flexWrap:"wrap", gap:8 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:33, height:33, borderRadius:7, background:"var(--bg)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontSize:13, color:"var(--muted)" }}>{i+1}</div>
                            <div>
                              <div style={{ fontFamily:"var(--font-body)", fontSize:13, fontWeight:600 }}>{c.label}</div>
                              <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
                                <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)" }}>{c.url}</span>
                                <button onClick={()=>scan(c.id,c.url)} aria-label={`Rescan ${c.label}`} title={`Rescan ${c.label}`} style={{ background:"none", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:10 }}>↺</button>
                                <button onClick={()=>removeSite(c.id)} aria-label={`Remove ${c.label}`} title={`Remove ${c.label}`} style={{ background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontSize:11 }}>×</button>
                              </div>
                            </div>
                          </div>
                          {(c.history?.length??0)>=2 && (
                            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                              {[{ key:"perf", color:"#e8341a" },{ key:"seo", color:"#f59e0b" }].map(({ key, color })=>(
                                <div key={key} style={{ display:"flex", alignItems:"center", gap:4 }}>
                                  <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"var(--muted)" }}>{key.toUpperCase()}</span>
                                  <Spark data={(c.history||[]).map(h=>h[key]??0)} color={color} w={60} h={22}/>
                                </div>
                              ))}
                            </div>
                          )}
                          {c.loading ? <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)" }}>Scanning...</span>
                            : c.result&&own?.result ? (
                              <div style={{ padding:"5px 11px", borderRadius:7, background:winning?"rgba(16,185,129,0.1)":"rgba(232,52,26,0.1)", border:`1px solid ${winning?"rgba(16,185,129,0.3)":"rgba(232,52,26,0.3)"}` }}>
                                <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:winning?"#10b981":"var(--accent)" }}>{winning?`YOU LEAD +${diff}`:`BEHIND ${Math.abs(diff)}`}</span>
                              </div>
                            ):null}
                        </div>
                        {c.result&&own?.result && (
                          <div style={{ padding:"11px 18px" }}>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:6 }}>
                              {[
                                { icon:"⚡", label:"Performance", yours:own.result.metrics.performanceScore, theirs:c.result.metrics.performanceScore, higherWins:true, unit:"/100" },
                                { icon:"🔍", label:"SEO", yours:own.result.seo?.estimatedSeoScore??0, theirs:c.result.seo?.estimatedSeoScore??0, higherWins:true, unit:"/100" },
                                { icon:"♿", label:"Accessibility", yours:own.result.accessibility?.estimatedA11yScore??0, theirs:c.result.accessibility?.estimatedA11yScore??0, higherWins:true, unit:"/100" },
                                { icon:"🔒", label:"Security", yours:own.result.security?.estimatedBestPracticesScore??0, theirs:c.result.security?.estimatedBestPracticesScore??0, higherWins:true, unit:"/100" },
                                { icon:"💰", label:"Ad Tax", yours:own.result.adLossPercent, theirs:c.result.adLossPercent, higherWins:false, unit:"%" },
                                { icon:"⚖️", label:"ADA Risk", yours:own.result.accessibility?.adaRiskLevel==="high"?0:own.result.accessibility?.adaRiskLevel==="medium"?1:2, theirs:c.result.accessibility?.adaRiskLevel==="high"?0:c.result.accessibility?.adaRiskLevel==="medium"?1:2, higherWins:true, unit:"", displayYours:(own.result.accessibility?.adaRiskLevel??"low").toUpperCase(), displayTheirs:(c.result.accessibility?.adaRiskLevel??"low").toUpperCase() },
                                { icon:"🐛", label:"Vuln. Libs", yours:-(own.result.security?.vulnerableLibraryCount??0), theirs:-(c.result.security?.vulnerableLibraryCount??0), higherWins:true, unit:"", displayYours:String(own.result.security?.vulnerableLibraryCount??0), displayTheirs:String(c.result.security?.vulnerableLibraryCount??0) },
                                { icon:"👥", label:"Mkt Lockout", yours:-(own.result.accessibility?.estimatedMarketLockout??0), theirs:-(c.result.accessibility?.estimatedMarketLockout??0), higherWins:true, unit:"%", displayYours:`${own.result.accessibility?.estimatedMarketLockout??0}%`, displayTheirs:`${c.result.accessibility?.estimatedMarketLockout??0}%` },
                              ].map(m=>{
                                const win = m.higherWins?m.yours>=m.theirs:m.yours<=m.theirs;
                                const wc = win?"#10b981":"#e8341a";
                                const dY = "displayYours" in m?m.displayYours:`${m.yours}${m.unit}`;
                                const dT = "displayTheirs" in m?m.displayTheirs:`${m.theirs}${m.unit}`;
                                return (
                                  <div key={m.label} style={{ padding:"8px 10px", background:"var(--bg)", borderRadius:8, border:`1px solid ${wc}20` }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:5 }}>
                                      <span style={{ fontSize:10 }}>{m.icon}</span>
                                      <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)" }}>{m.label}</span>
                                    </div>
                                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                      <div><div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted2)", marginBottom:1 }}>YOU</div><div style={{ fontFamily:"var(--font-display)", fontSize:16, color:wc }}>{dY}</div></div>
                                      <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted2)" }}>vs</span>
                                      <div style={{ textAlign:"right" }}><div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted2)", marginBottom:1 }}>THEM</div><div style={{ fontFamily:"var(--font-display)", fontSize:16, color:"var(--muted)" }}>{dT}</div></div>
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

          {/* ══════════════ SETTINGS ══════════════ */}
          {tab==="settings" && (
            <motion.div key="settings" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
                <svg width={16} height={16} viewBox="0 0 28 28" fill="none"><path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)"/><path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7"/></svg>
                <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(22px,4vw,32px)", color:"var(--text)", letterSpacing:"0.05em" }}>NEXUS SETTINGS</h2>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted2)", background:"var(--surface)", border:"1px solid var(--border)", padding:"3px 9px", borderRadius:4 }}>{plan.toUpperCase()} PLAN</span>
              </div>

              {/* ─ Section: Plan ─ */}
              <div style={{ marginBottom:18 }}>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted2)", letterSpacing:"0.16em", marginBottom:10, paddingBottom:6, borderBottom:"1px solid var(--border)" }}>YOUR PLAN</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:10 }}>
                  <div style={{ padding:"18px 22px", borderRadius:13, background:"var(--surface)", border:`1.5px solid ${plan==="scale"?"rgba(232,52,26,0.3)":"rgba(167,139,250,0.3)"}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                    <div>
                      <div style={{ fontFamily:"var(--font-display)", fontSize:28, color:plan==="scale"?"#e8341a":"#a78bfa", lineHeight:1, marginBottom:4 }}>{plan.toUpperCase()}</div>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)" }}>{plan==="scale"?"$149/mo · Daily scans · 10 competitors":"$49/mo · Weekly scans · 3 competitors"}</div>
                    </div>
                    {plan==="pulse" && <a href="/subscribe" style={{ padding:"9px 18px", borderRadius:8, background:"rgba(232,52,26,0.1)", border:"1px solid rgba(232,52,26,0.3)", fontFamily:"var(--font-mono)", fontSize:9, color:"var(--accent)", textDecoration:"none", whiteSpace:"nowrap" }}>UPGRADE TO SCALE →</a>}
                  </div>
                  <div style={{ padding:"18px 22px", borderRadius:13, background:"var(--surface)", border:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:8 }}>
                    {[
                      { label:"Your site scan cadence", val:plan==="scale"?"Daily":"Weekly", color:plan==="scale"?"#10b981":"#a78bfa" },
                      { label:"Competitor tracking", val:plan==="scale"?"10 URLs":"3 URLs", color:"var(--text2)" },
                      { label:"Last scan", val:own?.result?new Date(own.result.timestamp).toLocaleDateString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"Not yet scanned", color:"var(--muted)" },
                    ].map(({label,val,color})=>(
                      <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", borderRadius:7, background:"var(--bg)", border:"1px solid var(--border)" }}>
                        <span style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text2)" }}>{label}</span>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ─ Section: Alerts ─ */}
              <div style={{ marginBottom:18 }}>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted2)", letterSpacing:"0.16em", marginBottom:10, paddingBottom:6, borderBottom:"1px solid var(--border)" }}>ALERTS & NOTIFICATIONS</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:10 }}>

                  {/* Weekly digest */}
                  <div style={{ padding:"16px 18px", borderRadius:12, background:"var(--surface)", border:"1px solid var(--border)", opacity:0.75 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                          <span style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text)", fontWeight:500 }}>Weekly Score Digest</span>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"#f59e0b", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)", padding:"1px 6px", borderRadius:3 }}>COMING SOON</span>
                        </div>
                        <p style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)", margin:0 }}>Monday summary email — all 4 pillar scores</p>
                      </div>
                      <ToggleSwitch value={settings.weeklyDigest} onChange={v=>setSettings(s=>({...s,weeklyDigest:v}))} color="#10b981"/>
                    </div>
                    {settings.weeklyDigest && (
                      <div style={{ marginTop:10 }}>
                        <p style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)", letterSpacing:"0.08em", marginBottom:5 }}>SEND TO EMAIL</p>
                        <input type="email" value={settings.emailTo||userEmail} onChange={e=>setSettings(s=>({...s,emailTo:e.target.value}))} placeholder={userEmail||"you@company.com"} style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--border2)", borderRadius:7, padding:"8px 11px", color:"var(--text)", fontFamily:"var(--font-mono)", fontSize:11, boxSizing:"border-box" as const }}/>
                      </div>
                    )}
                  </div>

                  {/* Critical drop alerts */}
                  <div style={{ padding:"16px 18px", borderRadius:12, background:settings.criticalAlerts?"rgba(232,52,26,0.04)":"var(--surface)", border:`1px solid ${settings.criticalAlerts?"rgba(232,52,26,0.2)":"var(--border)"}`, transition:"all 0.2s" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                          <span style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text)", fontWeight:500 }}>Critical Drop Alerts</span>
                          {settings.criticalAlerts && settings.webhookUrl && <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"#10b981", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", padding:"1px 6px", borderRadius:3 }}>● LIVE</span>}
                          {settings.criticalAlerts && !settings.webhookUrl && <span style={{ fontFamily:"var(--font-mono)", fontSize:7, color:"#f59e0b", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)", padding:"1px 6px", borderRadius:3 }}>SET WEBHOOK BELOW</span>}
                        </div>
                        <p style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)", margin:0 }}>Auto-fires when any pillar drops {">"}10 pts on rescan</p>
                      </div>
                      <ToggleSwitch value={settings.criticalAlerts} onChange={v=>setSettings(s=>({...s,criticalAlerts:v}))} color="#e8341a"/>
                    </div>
                  </div>

                  {/* SMS alerts — coming soon */}
                  <div style={{ padding:"16px 18px", borderRadius:12, background:"var(--surface)", border:"1px solid var(--border)", opacity:0.7 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                          <span style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text)", fontWeight:500 }}>SMS Alerts</span>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"#f59e0b", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)", padding:"1px 6px", borderRadius:3, marginLeft:6, letterSpacing:"0.08em" }}>COMING SOON</span>
                        </div>
                        <p style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)", margin:0 }}>Instant SMS when a critical drop is detected</p>
                      </div>
                      <ToggleSwitch value={settings.smsAlerts} onChange={v=>setSettings(s=>({...s,smsAlerts:v}))} color="#f59e0b"/>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─ Section: Integrations ─ */}
              <div style={{ marginBottom:18 }}>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted2)", letterSpacing:"0.16em", marginBottom:10, paddingBottom:6, borderBottom:"1px solid var(--border)" }}>INTEGRATIONS</p>
                <div style={{ padding:"18px 22px", borderRadius:13, background:"var(--surface)", border:"1px solid var(--border)", maxWidth:560 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                    <span style={{ fontSize:14 }}>🔗</span>
                    <span style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text)", fontWeight:500 }}>Developer Webhook</span>
                  </div>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text2)", marginBottom:11, lineHeight:1.6 }}>Push your Blueprint to Slack, Make.com, Zapier or n8n. Fires automatically on critical drops when enabled above.</p>
                  <input type="text" value={settings.webhookUrl} onChange={e=>setSettings({...settings,webhookUrl:e.target.value})} placeholder="https://hooks.slack.com/services/..." style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--border2)", borderRadius:8, padding:"11px 14px", color:"var(--text)", fontFamily:"var(--font-mono)", fontSize:11, boxSizing:"border-box" as const }}/>
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)", marginTop:6 }}>Works with: Slack · Make · Zapier · n8n · any HTTP endpoint</p>
                </div>
              </div>

              {/* ─ Section: Account ─ */}
              <div>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted2)", letterSpacing:"0.16em", marginBottom:10, paddingBottom:6, borderBottom:"1px solid var(--border)" }}>ACCOUNT</p>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <a href={`https://nexus-diagnostics.lemonsqueezy.com/billing?prefilled_email=${encodeURIComponent(userEmail)}`} target="_blank" rel="noopener"
                    style={{ padding:"11px 20px", borderRadius:9, background:"var(--surface)", border:"1px solid var(--border)", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text2)", textDecoration:"none" }}>
                    MANAGE BILLING ↗
                  </a>
                  <a href="/account" style={{ padding:"11px 20px", borderRadius:9, background:"var(--surface)", border:"1px solid var(--border)", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text2)", textDecoration:"none" }}>
                    ACCOUNT PAGE →
                  </a>
                  <button onClick={async()=>{ await supabase.auth.signOut(); window.location.href="/login"; }}
                    style={{ padding:"11px 20px", borderRadius:9, background:"rgba(232,52,26,0.08)", border:"1px solid rgba(232,52,26,0.25)", cursor:"pointer", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--accent)" }}>
                    LOG OUT →
                  </button>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
      {/* ── Score improvement toast ── */}
      <AnimatePresence>
        {scoreToast && (
          <motion.div
            initial={{ opacity:0, y:60, scale:0.9 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:60, scale:0.9 }}
            style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", zIndex:9999, padding:"14px 24px", borderRadius:12, background:"linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.08))", border:"1px solid rgba(16,185,129,0.4)", boxShadow:"0 8px 32px rgba(0,0,0,0.4)", backdropFilter:"blur(12px)", whiteSpace:"nowrap" }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:13, color:"#10b981", letterSpacing:"0.08em" }}>{scoreToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
        @media (max-width: 640px) {
          .dash-nav-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .dash-nav-tabs::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </div>
  );
}