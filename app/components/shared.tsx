"use client";
// SHARED — single source of truth. Both app/page.tsx and app/funnel/page.tsx import from here.
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { fmtMs, scoreColor, metricStatus } from "../lib/audit";
import type { AuditResult } from "../lib/audit";

export function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const c = animate(count, value, { duration: 2, ease: [0.16, 1, 0.3, 1] });
    const u = rounded.on("change", (v: number) => setDisplay(v));
    return () => { c.stop(); u(); };
  }, [value]);
  return <span>{display.toLocaleString()}{suffix}</span>;
}

const SCAN_LINES = [
  "> Resolving DNS records...","> Connecting to target host...","> Parsing render-blocking resources...",
  "> Measuring Largest Contentful Paint...","> Calculating Total Blocking Time...","> Analysing Cumulative Layout Shift...",
  "> Cross-referencing Google ad quality signals...","> Running revenue impact model...",
  "> Scanning for AI agent integration gaps...","> Compiling full diagnostic report...",
];
export function TerminalLoader({ url }: { url: string }) {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { if (i < SCAN_LINES.length) { setLines(p => [...p, SCAN_LINES[i]]); i++; } else clearInterval(t); }, 280);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 6 }}>NEXUS DIAGNOSTIC ENGINE v3.0</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,5vw,42px)", color: "var(--text)", letterSpacing: "0.05em" }}>
          SCANNING <span style={{ color: "var(--accent)" }} className="flicker">{url.replace(/https?:\/\//, "").replace(/\/$/, "")}</span>
        </h2>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px", minHeight: 220, fontFamily: "var(--font-mono)", fontSize: 12 }}>
        <div style={{ display: "flex", gap: 7, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
          {["#e8341a","#f59e0b","#10b981"].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, display: "inline-block" }} />)}
          <span style={{ marginLeft: 6, color: "var(--muted2)", fontSize: 10 }}>audit-engine — {url}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {lines.map((line, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.12 }}
              style={{ color: i === lines.length - 1 ? "var(--text)" : "var(--muted)" }}>{line}</motion.div>
          ))}
          {lines.length < SCAN_LINES.length && <span style={{ color: "var(--accent)" }}>█</span>}
        </div>
      </div>
      <div style={{ marginTop: 10, height: 2, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <motion.div style={{ height: "100%", background: "var(--accent)", boxShadow: "0 0 10px var(--accent-glow)" }}
          initial={{ width: 0 }} animate={{ width: `${(lines.length / SCAN_LINES.length) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>
    </motion.div>
  );
}

export function ScoreGauge({ score, animated }: { score: number; animated: boolean }) {
  const r = 72, circ = 2 * Math.PI * r, color = scoreColor(score);
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    if (!animated) { setDisp(score); return; }
    let raf: number;
    const t0 = performance.now(), dur = 2000;
    function tick(now: number) { const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3); setDisp(Math.round(e * score)); if (p < 1) raf = requestAnimationFrame(tick); }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, animated]);
  return (
    <div style={{ position: "relative", width: 180, height: 180 }}>
      <svg width={180} height={180} style={{ transform: "rotate(-90deg)" }} viewBox="0 0 180 180">
        <circle cx={90} cy={90} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
        <circle cx={90} cy={90} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={animated ? circ - (score / 100) * circ : circ}
          className="gauge-progress" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 52, color, textShadow: `0 0 25px ${color}`, lineHeight: 1, letterSpacing: "0.02em" }}>{disp}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em", marginTop: 2 }}>SCORE</span>
      </div>
    </div>
  );
}

export function MetricRow({ label, value, formatted, thresholds, ragequit }: {
  label: string; value: number; formatted: string; thresholds: [number, number]; ragequit?: string;
}) {
  const s = metricStatus(value, thresholds);
  const c = { ok: "#10b981", warn: "#f59e0b", bad: "#e8341a" }[s];
  const l = { ok: "PASS", warn: "SLOW", bad: "FAIL" }[s];
  const pct = s === "ok" ? 100 : s === "warn" ? 60 : 25;
  return (
    <div style={{ padding: "13px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
          <div style={{ height: 2, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 }}
              style={{ height: "100%", background: c, boxShadow: `0 0 8px ${c}` }} />
          </div>
        </div>
        <div style={{ textAlign: "right", minWidth: 96 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{formatted}</span>
          <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 9, color: c, letterSpacing: "0.15em", marginTop: 2 }}>{l}</span>
        </div>
      </div>
      {s === "bad" && ragequit && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ delay: 0.5 }}
          style={{ overflow: "hidden", marginTop: 8, padding: "8px 12px", borderRadius: 6, background: "rgba(232,52,26,0.06)", border: "1px solid rgba(232,52,26,0.15)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(232,52,26,0.85)", lineHeight: 1.55 }}>💭 {ragequit}</p>
        </motion.div>
      )}
    </div>
  );
}

export function AdBanner() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
      style={{ margin: "14px 0", padding: "12px 16px", borderRadius: 8, background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.13)", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(59,130,246,0.55)", letterSpacing: "0.12em", marginBottom: 2 }}>SPONSORED</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)" }}>
          Track competitor performance automatically with <strong style={{ color: "var(--text)" }}>SiteIntel Pro</strong> — 7-day free trial.
        </div>
      </div>
      <a href="#" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(59,130,246,0.8)", textDecoration: "none", border: "1px solid rgba(59,130,246,0.22)", padding: "5px 10px", borderRadius: 5, whiteSpace: "nowrap", flexShrink: 0 }}>Try Free →</a>
    </motion.div>
  );
}

export function NexusPulsePitch({ result }: { result: AuditResult }) {
  const score = result.metrics.performanceScore;
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      style={{ marginBottom: 14, borderRadius: 12, overflow: "hidden", background: "linear-gradient(135deg,rgba(167,139,250,0.07),rgba(167,139,250,0.02))", border: "1px solid rgba(167,139,250,0.25)" }}>
      <button onClick={() => setOpen(p => !p)} style={{ width: "100%", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "none", textAlign: "left" }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>📊</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)", letterSpacing: "0.05em" }}>NEXUS PULSE</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", padding: "2px 7px", borderRadius: 4, letterSpacing: "0.1em" }}>£49/MO</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 7px", borderRadius: 4, letterSpacing: "0.1em" }}>7-DAY FREE TRIAL</span>
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)" }}>24/7 monitoring + competitor tracking. SMS alert when a rival overtakes your score.</div>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} style={{ color: "var(--muted)", fontSize: 12, flexShrink: 0 }}>▼</motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{ height: 1, background: "rgba(167,139,250,0.15)", marginBottom: 16 }} />
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#a78bfa", marginBottom: 14, lineHeight: 1.6 }}>
                ⚠ {score < 50 ? `Your score is ${score}. Any competitor above 75 is actively stealing your Google traffic.` : `Your score is ${score}. A competitor at 90+ already gets preferential ranking treatment.`}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[["📡","Weekly re-audit — automatic"],["🔍","Track 3 competitors side-by-side"],["📱","SMS if a competitor overtakes you"],["📈","Monthly PDF report to your inbox"]].map(([icon, text]) => (
                  <div key={text} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 8, background: "var(--surface2)", border: "1px solid var(--border2)", marginBottom: 16 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)", fontStyle: "italic", lineHeight: 1.6 }}>
                  &ldquo;Found out my competitor dropped from 81 to 47 overnight. Called 3 of their clients that week.&rdquo; — James, SaaS founder
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <a href="/subscribe" style={{ flex: 1, display: "block", padding: "13px", borderRadius: 8, textAlign: "center", textDecoration: "none", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", background: "#a78bfa", color: "#fff", boxShadow: "0 0 20px rgba(167,139,250,0.3)", fontWeight: 500 }}>
                  START FREE 7-DAY TRIAL →
                </a>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>£49/mo after</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function EmailGate({ onSubmit, loading }: { onSubmit: (email: string) => Promise<void>; loading: boolean }) {
  const [email, setEmail] = useState(""); const [err, setErr] = useState(""); const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  async function submit() { setErr(""); const t = email.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) { setErr("Enter a valid email."); return; } await onSubmit(t); }
  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
      style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(16px)", background: "rgba(3,7,15,0.9)" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid rgba(232,52,26,0.35)", borderRadius: 16, padding: "40px 32px", boxShadow: "0 0 80px rgba(232,52,26,0.2)", textAlign: "center" }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", background: "rgba(232,52,26,0.12)", border: "1px solid rgba(232,52,26,0.3)", marginBottom: 16, fontSize: 26, position: "relative" }}
          className="pulse-ring">🔍</motion.div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 10 }}>DIAGNOSTIC COMPLETE</p>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--text)", letterSpacing: "0.05em", marginBottom: 12 }}>YOUR REPORT IS READY</h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.65, marginBottom: 24 }}>
          Unlock your full revenue breakdown — the exact £ cost and the step-by-step fix.
        </p>
        <input ref={ref} type="email" value={email} placeholder="you@company.com"
          onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
          style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "14px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14, marginBottom: err ? 8 : 12 }} />
        {err && <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", marginBottom: 12 }}>{err}</p>}
        <button onClick={submit} disabled={loading} className="btn-primary" style={{ width: "100%", padding: "16px", borderRadius: 8, fontSize: 13, letterSpacing: "0.15em" }}>
          {loading ? "UNLOCKING..." : "UNLOCK MY FULL REPORT →"}
        </button>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", marginTop: 14 }}>No spam · No obligation · Just your results</p>
      </div>
    </motion.div>
  );
}

// THE single ResultsPanel — used identically on both routes
export function ResultsPanel({ result, onDiscover }: {
  result: AuditResult;
  onDiscover?: () => void; // funnel passes this; homepage omits it
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  const { metrics, adLossPercent, bounceRateIncrease, annualRevenueLoss, severity } = result;
  const sev = { critical: { label: "CRITICAL FAILURE", color: "#e8341a" }, warning: { label: "NEEDS ATTENTION", color: "#f59e0b" }, ok: { label: "HEALTHY", color: "#10b981" } }[severity];
  const loss = Math.round(annualRevenueLoss / 1000);
  const rageQuits = {
    lcp: metrics.lcp > 4000 ? `Your users wait ${(metrics.lcp/1000).toFixed(1)}s to see anything. They assume the site is broken and leave.` : metrics.lcp > 2500 ? `${(metrics.lcp/1000).toFixed(1)}s to load main content. Users are already reaching for the back button.` : undefined,
    fcp: metrics.fcp > 3000 ? `A blank screen for ${(metrics.fcp/1000).toFixed(1)}s. Mobile users think the page crashed.` : undefined,
    tbt: metrics.tbt > 600 ? `${metrics.tbt}ms of completely frozen UI. Tapped buttons do nothing. Users assume it's broken.` : metrics.tbt > 200 ? `${metrics.tbt}ms where the page looks ready but does nothing. Users feel ignored.` : undefined,
    cls: metrics.cls > 0.25 ? `Layout jumps ${metrics.cls.toFixed(2)} units mid-load. Buttons shift as users tap — they hit the wrong thing.` : undefined,
  };

  return (
    <motion.div ref={topRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      style={{ width: "100%", maxWidth: 860, margin: "0 auto" }}>

      {/* Status banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "11px 18px", borderRadius: 8, background: `${sev.color}10`, border: `1px solid ${sev.color}25` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: sev.color, display: "inline-block", boxShadow: `0 0 10px ${sev.color}` }} className={severity === "critical" ? "animate-pulse" : ""} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: sev.color, letterSpacing: "0.15em" }}>STATUS: {sev.label}</span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
          {result.url.replace(/https?:\/\//, "").substring(0, 30)} · {new Date(result.timestamp).toLocaleTimeString()}
        </span>
      </motion.div>

      {/* Score + revenue */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, marginBottom: 14 }}>
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "26px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <ScoreGauge score={metrics.performanceScore} animated={animated} />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: scoreColor(metrics.performanceScore), letterSpacing: "0.1em" }}>
            {metrics.performanceScore < 50 ? "FAILING" : metrics.performanceScore < 80 ? "AVERAGE" : "GOOD"}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          style={{ background: "rgba(232,52,26,0.05)", border: "1px solid rgba(232,52,26,0.2)", borderRadius: 12, padding: "24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} className="animate-pulse" />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.18em" }}>REVENUE HAEMORRHAGE DETECTED</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
            {[{v:adLossPercent,suf:"%",l:"Ad Revenue Lost",c:"var(--accent)"},{v:bounceRateIncrease,suf:"%",l:"Bounce Rate Spike",c:"var(--warn)"},{v:loss,suf:"k",l:"Annual £ Leak",c:"var(--text)"}].map((s,i)=>(
              <div key={i}>
                <div style={{ fontFamily:"var(--font-display)",fontSize:40,color:s.c,textShadow:s.c==="var(--accent)"?"0 0 20px rgba(232,52,26,0.5)":"none",lineHeight:1,letterSpacing:"0.02em" }}>
                  {animated ? <AnimatedNumber value={s.v} suffix={s.suf} /> : `0${s.suf}`}
                </div>
                <div style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--muted)",marginTop:5 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--muted2)",paddingTop:12,borderTop:"1px solid rgba(232,52,26,0.15)",lineHeight:1.7 }}>
            Google: every +100ms load time = ~1% conversion drop. Every bounce = a lost lead.
          </p>
        </motion.div>
      </div>

      {/* Core Web Vitals */}
      <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }}
        style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"22px",marginBottom:14 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4 }}>
          <p style={{ fontFamily:"var(--font-mono)",fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",textTransform:"uppercase" }}>Core Web Vitals — Mobile</p>
          <p style={{ fontFamily:"var(--font-mono)",fontSize:9,color:"var(--muted2)" }}>💭 = what your visitor feels</p>
        </div>
        <MetricRow label="Largest Contentful Paint (LCP)" value={metrics.lcp} formatted={fmtMs(metrics.lcp)} thresholds={[2500,4000]} ragequit={rageQuits.lcp} />
        <MetricRow label="First Contentful Paint (FCP)" value={metrics.fcp} formatted={fmtMs(metrics.fcp)} thresholds={[1800,3000]} ragequit={rageQuits.fcp} />
        <MetricRow label="Total Blocking Time (TBT)" value={metrics.tbt} formatted={fmtMs(metrics.tbt)} thresholds={[200,600]} ragequit={rageQuits.tbt} />
        <MetricRow label="Cumulative Layout Shift (CLS)" value={metrics.cls} formatted={metrics.cls.toFixed(3)} thresholds={[0.1,0.25]} ragequit={rageQuits.cls} />
        <MetricRow label="Speed Index" value={metrics.speedIndex} formatted={fmtMs(metrics.speedIndex)} thresholds={[3400,5800]} />
      </motion.div>

      <AdBanner />
      <NexusPulsePitch result={result} />

      {/* Bottom CTA — differs by route */}
      <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.6 }}>
        {onDiscover ? (
          <motion.button onClick={onDiscover} whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
            style={{ width:"100%",padding:"22px",borderRadius:12,background:"linear-gradient(135deg,rgba(232,52,26,0.1),rgba(232,52,26,0.04))",border:"1px solid rgba(232,52,26,0.28)",cursor:"none",textAlign:"center",marginBottom:14 }}>
            <div style={{ fontFamily:"var(--font-display)",fontSize:24,color:"var(--text)",letterSpacing:"0.05em",marginBottom:5 }}>How do I actually fix this? ↓</div>
            <div style={{ fontFamily:"var(--font-body)",fontSize:13,color:"var(--text2)" }}>Tell us about your business — we'll build a personalised plan in 30 seconds</div>
          </motion.button>
        ) : (
          <div style={{ padding:"36px 28px",textAlign:"center",borderRadius:16,background:"linear-gradient(135deg,rgba(232,52,26,0.08),rgba(232,52,26,0.03))",border:"1px solid rgba(232,52,26,0.22)",marginBottom:14 }}>
            <p style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--muted)",letterSpacing:"0.18em",marginBottom:14 }}>PREFER A HUMAN TO HANDLE THIS?</p>
            <h3 style={{ fontFamily:"var(--font-display)",fontSize:"clamp(26px,5vw,44px)",color:"var(--text)",letterSpacing:"0.05em",lineHeight:1,marginBottom:8 }}>
              WE FIX THIS IN <span style={{ color:"var(--accent)",textShadow:"0 0 30px rgba(232,52,26,0.5)" }}>30 DAYS.</span>
            </h3>
            <p style={{ fontFamily:"var(--font-display)",fontSize:"clamp(16px,3vw,22px)",color:"var(--text2)",letterSpacing:"0.05em",marginBottom:20 }}>GUARANTEED.</p>
            <p style={{ fontFamily:"var(--font-body)",fontSize:14,color:"var(--text2)",maxWidth:460,margin:"0 auto 24px",lineHeight:1.7 }}>
              15-minute call. Fixed-price proposal. We&apos;ll tell you honestly what&apos;s worth doing and what isn&apos;t.
            </p>
            <a href="/funnel" className="btn-primary" style={{ display:"inline-block",padding:"16px 44px",borderRadius:10,fontSize:13,textDecoration:"none",letterSpacing:"0.15em" }}>
              SPEAK TO AN AGENT →
            </a>
            <p style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--muted2)",marginTop:12 }}>No pitch · No obligation · 2hr callback</p>
            <div style={{ display:"flex",justifyContent:"center",gap:28,marginTop:22,paddingTop:20,borderTop:"1px solid var(--border)" }}>
              {[["500+","Sites fixed"],["34%","Avg conversion uplift"],["30d","Guarantee"]].map(([v,l])=>(
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"var(--font-display)",fontSize:26,color:"var(--accent)",letterSpacing:"0.05em" }}>{v}</div>
                  <div style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--muted)",marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <div style={{ textAlign:"center",paddingBottom:30 }}>
        <button onClick={() => window.location.reload()}
          style={{ fontFamily:"var(--font-mono)",fontSize:11,color:"var(--muted)",background:"none",border:"none",textDecoration:"underline",textUnderlineOffset:4,cursor:"pointer" }}>
          ↩ Audit another website
        </button>
      </div>
    </motion.div>
  );
}