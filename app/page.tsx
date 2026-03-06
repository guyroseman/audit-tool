"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { fetchAudit, fmtMs, scoreColor, metricStatus } from "./lib/audit";
import type { AuditResult } from "./lib/audit";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreLabel(score: number) {
  if (score >= 80) return "HEALTHY";
  if (score >= 50) return "WARNING";
  return "CRITICAL";
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: [0.16, 1, 0.3, 1] });
    const unsub = rounded.on("change", v => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [value]);
  return <span>{display.toLocaleString()}{suffix}</span>;
}

// ─── Terminal Loader ──────────────────────────────────────────────────────────
const LINES = [
  "> Resolving DNS records...",
  "> Connecting to target host...",
  "> Parsing render-blocking resources...",
  "> Measuring Largest Contentful Paint...",
  "> Calculating Total Blocking Time...",
  "> Analysing Cumulative Layout Shift...",
  "> Cross-referencing Google ad quality signals...",
  "> Running revenue impact model...",
  "> Scanning for AI agent integration gaps...",
  "> Compiling full diagnostic report...",
];

function TerminalLoader({ url }: { url: string }) {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < LINES.length) { setLines(p => [...p, LINES[i]]); i++; }
      else clearInterval(t);
    }, 280);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl mx-auto space-y-4">
      <div className="text-center space-y-1">
        <p style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase" }}>NEXUS DIAGNOSTIC ENGINE v3.0</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,5vw,48px)", color: "var(--text)", letterSpacing: "0.05em" }}>
          SCANNING <span style={{ color: "var(--accent)" }} className="flicker">{url.replace(/https?:\/\//, "").replace(/\//g, "")}</span>
        </h2>
      </div>
      <div className="card" style={{ padding: "20px", minHeight: 260, fontFamily: "var(--font-mono)", fontSize: 12 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e8341a", display: "inline-block", opacity: 0.9 }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", display: "inline-block", opacity: 0.9 }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", display: "inline-block", opacity: 0.9 }} />
          <span style={{ marginLeft: 8, color: "var(--muted2)", fontSize: 11 }}>audit-engine — {url}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {lines.map((line, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}
              style={{ color: i === lines.length - 1 ? "var(--text)" : "var(--muted)" }}>
              {line}
            </motion.div>
          ))}
          {lines.length < LINES.length && <span className="typing-cursor" style={{ color: "var(--accent)" }} />}
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 2, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <motion.div style={{ height: "100%", background: "var(--accent)", boxShadow: "0 0 12px var(--accent-glow)" }}
          initial={{ width: 0 }} animate={{ width: `${(lines.length / LINES.length) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>
    </motion.div>
  );
}

// ─── Circular Score Gauge ────────────────────────────────────────────────────
function ScoreGauge({ score, animated }: { score: number; animated: boolean }) {
  const r = 72, circ = 2 * Math.PI * r;
  const color = scoreColor(score);
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    if (!animated) { setDisp(score); return; }
    let raf: number;
    const start = performance.now();
    const dur = 2000;
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisp(Math.round(eased * score));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
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

// ─── Metric Row ───────────────────────────────────────────────────────────────
function MetricRow({ label, value, formatted, thresholds }: {
  label: string; value: number; formatted: string; thresholds: [number, number];
}) {
  const s = metricStatus(value, thresholds);
  const c = { ok: "#10b981", warn: "#f59e0b", bad: "#e8341a" }[s];
  const l = { ok: "PASS", warn: "SLOW", bad: "FAIL" }[s];
  const pct = s === "ok" ? 100 : s === "warn" ? 60 : 25;
  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
        <div style={{ height: 2, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 }}
            style={{ height: "100%", background: c, boxShadow: `0 0 8px ${c}` }} />
        </div>
      </div>
      <div style={{ textAlign: "right", minWidth: 100 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{formatted}</span>
        <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 9, color: c, letterSpacing: "0.15em", marginTop: 2 }}>{l}</span>
      </div>
    </div>
  );
}

// ─── Email Gate ───────────────────────────────────────────────────────────────
function EmailGate({ onSubmit, loading }: { onSubmit: (e: string) => Promise<void>; loading: boolean }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  async function submit() {
    setErr("");
    const t = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) { setErr("Enter a valid business email."); return; }
    await onSubmit(t);
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
      style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(16px)", background: "rgba(3,7,15,0.9)" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid rgba(232,52,26,0.35)", borderRadius: 16, padding: "40px 32px", boxShadow: "0 0 80px rgba(232,52,26,0.2)" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", background: "rgba(232,52,26,0.12)", border: "1px solid rgba(232,52,26,0.3)", marginBottom: 16, position: "relative" }} className="pulse-ring">
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <path d="M12 2L21.66 18H2.34L12 2Z" stroke="#e8341a" strokeWidth={1.5} fill="none" />
              <line x1={12} y1={9} x2={12} y2={13} stroke="#e8341a" strokeWidth={1.5} />
              <circle cx={12} cy={15.5} r={0.8} fill="#e8341a" />
            </svg>
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>DIAGNOSTIC COMPLETE</p>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--text)", letterSpacing: "0.05em", lineHeight: 1.1 }}>YOUR REPORT IS READY</h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", marginTop: 10, lineHeight: 1.6 }}>
            Unlock your full revenue breakdown — including estimated annual loss and the exact 4-step fix plan.
          </p>
        </div>
        {/* Input */}
        <input ref={ref} type="email" value={email} placeholder="you@company.com"
          onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
          style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "14px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14, marginBottom: err ? 8 : 12 }} />
        {err && <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", marginBottom: 12 }}>{err}</p>}
        <button onClick={submit} disabled={loading} className="btn-primary" style={{ width: "100%", padding: "16px", borderRadius: 8, fontSize: 13, letterSpacing: "0.15em" }}>
          {loading ? "SENDING..." : "UNLOCK MY FULL REPORT →"}
        </button>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", textAlign: "center", marginTop: 14 }}>
          No spam · No obligation · Just your results
        </p>
      </div>
    </motion.div>
  );
}

// ─── Results Panel ────────────────────────────────────────────────────────────
function ResultsPanel({ result, url, isBlurred = false }: { result: AuditResult; url: string; isBlurred?: boolean }) {
  const [surveyPhase, setSurveyPhase] = useState<"hidden" | "questions" | "pitch">("hidden");
  const [trafficSource, setTrafficSource] = useState("");
  const [businessGoal, setBusinessGoal] = useState("");

  const score = result.metrics.performanceScore;
  const lcp = result.metrics.lcp;
  const color = scoreColor(score);

  // Trigger survey after unlocked (when blur is removed)
  useEffect(() => {
    if (!isBlurred) {
      const t = setTimeout(() => setSurveyPhase("questions"), 1500); // Wait 1.5s after reveal
      return () => clearTimeout(t);
    }
  }, [isBlurred]);

  // Dynamic Pitch Logic
  const getPitch = () => {
    if (businessGoal === "leads") {
      return {
        title: "Stop Your Lead Bleed.",
        desc: `Users on 3G/4G drop off when ${url} takes ${fmtMs(lcp)} to load. We rebuild your landing page for instant loading and deploy an AI Response Agent to capture leads 24/7, routing them directly to our white-glove Call Center.`,
        cta: "Deploy Lead Infrastructure →"
      };
    }
    if (trafficSource === "ads") {
      return {
        title: "Rescue Your ROAS & Ad Placements.",
        desc: `Google penalizes ads pointing to slow sites. Your ${fmtMs(lcp)} load time is increasing your Cost-Per-Click. We rebuild your infrastructure and optimize ad placements to ensure every paid click actually converts.`,
        cta: "Optimize Ad Infrastructure →"
      };
    }
    return {
      title: "Fix the Revenue Leak.",
      desc: `A ${fmtMs(lcp)} load time creates a massive bottleneck for your conversions. We migrate your site to our high-speed Next.js infrastructure, dropping your bounce rate and recovering your lost revenue.`,
      cta: "Claim Your Free Action Plan →"
    };
  };

  const pitch = getPitch();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl mx-auto space-y-6 bg-[#080d17] border border-[#1e293b] rounded-xl p-8 relative overflow-hidden">
      
      <div style={{ filter: isBlurred ? "blur(12px)" : "none", transition: "all 0.8s ease", pointerEvents: isBlurred ? "none" : "auto" }}>
        {/* Top Score Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="inline-block text-xs font-mono px-3 py-1 rounded mb-4" style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}40` }}>
              {scoreLabel(score)}
            </div>
            <div className="text-[#334155] font-mono text-xs mb-2">{url}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 52, color, textShadow: `0 0 25px ${color}`, lineHeight: 1 }}>
              <AnimatedNumber value={score} />
            </div>
          </div>
          <ScoreGauge score={score} animated={!isBlurred} />
        </div>

        {/* The Pain Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
            <div className="text-[#ef4444] text-2xl font-bold">{result.adLossPercent}%</div>
            <div className="text-[#64748b] text-xs font-mono uppercase mt-1">Ad Traffic Lost</div>
          </div>
          <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
            <div className="text-[#f59e0b] text-2xl font-bold">+{result.bounceRateIncrease}%</div>
            <div className="text-[#64748b] text-xs font-mono uppercase mt-1">Bounce Rate</div>
          </div>
        </div>

        <div className="border-t border-[#1e293b] my-6" />

        {/* Phase 2: The elegant Survey */}
        {surveyPhase === "questions" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-[#0a0f1a] p-6 rounded-lg border border-[#0ea5e930]">
            <h3 className="text-[#e2e8f0] font-bold mb-4">To generate your fix, how do you currently drive revenue?</h3>
            
            {!trafficSource ? (
              <div className="space-y-2">
                <p className="text-xs text-[#64748b] font-mono mb-2">1. What is your primary traffic source?</p>
                {["Paid Ads (Meta/Google)", "Organic / SEO", "Cold Outreach / Direct"].map(src => (
                  <button key={src} onClick={() => setTrafficSource(src.includes("Ads") ? "ads" : "organic")} className="w-full text-left p-3 rounded border border-[#1e293b] text-sm text-[#94a3b8] hover:border-[#0ea5e9] hover:text-[#e2e8f0] transition-colors">
                    {src}
                  </button>
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                <p className="text-xs text-[#64748b] font-mono mb-2">2. What is your primary conversion goal?</p>
                {["Lead Generation / Phone Calls", "E-commerce Sales", "SaaS Signups"].map(goal => (
                  <button key={goal} onClick={() => { setBusinessGoal(goal.includes("Lead") ? "leads" : "sales"); setSurveyPhase("pitch"); }} className="w-full text-left p-3 rounded border border-[#1e293b] text-sm text-[#94a3b8] hover:border-[#0ea5e9] hover:text-[#e2e8f0] transition-colors">
                    {goal}
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Phase 3: The Personalized Pitch */}
        {surveyPhase === "pitch" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#ef44440a] border border-[#ef444440] p-6 rounded-lg mt-6">
            <h3 className="text-[#ef4444] font-bold text-lg mb-2">{pitch.title}</h3>
            <p className="text-[#94a3b8] text-sm leading-relaxed mb-6">{pitch.desc}</p>
            <button onClick={() => window.location.href = `/call-center?url=${encodeURIComponent(url)}`} className="w-full bg-gradient-to-r from-[#ef4444] to-[#b91c1c] text-white font-bold py-4 rounded hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all uppercase tracking-wider text-sm">
              {pitch.cta}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── App State Machine ────────────────────────────────────────────────────────
type AppState = "idle" | "loading" | "email-gate" | "results" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const runAudit = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setError(""); setState("loading");
    try {
      const r = await fetchAudit(targetUrl);
      setResult(r); setState("email-gate");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach PageSpeed API. Check the URL.");
      setState("error");
    }
  }, []);

  const submitEmail = useCallback(async (email: string) => {
    if (!result) return;
    setEmailLoading(true);
    try {
      await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, url: result.url, score: result.metrics.performanceScore, adLossPercent: result.adLossPercent, bounceRateIncrease: result.bounceRateIncrease, annualRevenueLoss: result.annualRevenueLoss, severity: result.severity, timestamp: result.timestamp, source: "homepage" }),
      });
    } catch { /* swallow */ }
    finally { setEmailLoading(false); setState("results"); }
  }, [result]);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "72px 16px 32px", position: "relative", zIndex: 10 }}>

      {/* ── Nav ── */}
      <nav style={{ width: "100%", maxWidth: 860, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", letterSpacing: "0.1em" }}>NEXUS</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", borderLeft: "1px solid var(--border)", paddingLeft: 10, marginLeft: 2, display: "none" }} className="sm:!inline">PERFORMANCE AGENCY</span>
        </div>
        <a href="/funnel" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.12em", textDecoration: "none", border: "1px solid rgba(232,52,26,0.3)", padding: "6px 14px", borderRadius: 6, transition: "all 0.2s" }}>
          FREE AUDIT →
        </a>
      </nav>

      <AnimatePresence mode="wait">
        {/* ── IDLE / ERROR ── */}
        {(state === "idle" || state === "error") && (
          <motion.section key="hero" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 24 }}>

            {/* Live badge */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.25)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", boxShadow: "0 0 8px var(--accent)" }} className="animate-pulse" />
              FREE REVENUE DIAGNOSTIC · POWERED BY GOOGLE
            </motion.div>

            {/* Headline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.92, letterSpacing: "0.02em", color: "var(--text)" }} className="flicker">
                YOUR WEBSITE<br />
                <span style={{ color: "var(--accent)", textShadow: "0 0 60px rgba(232,52,26,0.4)" }}>IS COSTING</span><br />
                YOU MONEY
              </h1>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--text2)", maxWidth: 500, lineHeight: 1.7 }}>
              Enter your URL. In 60 seconds, we calculate the exact dollar value your slow website is leaking — and show you the 4-step fix.
            </motion.p>

            {/* Input */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ width: "100%", maxWidth: 600, display: "flex", gap: 10 }}>
              <input type="text" value={url} onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runAudit(url)} placeholder="https://yourwebsite.com"
                style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "18px 20px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14, transition: "border-color 0.2s" }} />
              <button onClick={() => runAudit(url)} className="btn-primary" style={{ padding: "18px 28px", borderRadius: 10, whiteSpace: "nowrap" }}>
                RUN AUDIT →
              </button>
            </motion.div>

            {state === "error" && (
              <div style={{ width: "100%", maxWidth: 600, padding: "12px 16px", borderRadius: 8, background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.25)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)" }}>⚠ {error}</span>
              </div>
            )}

            {/* Stats row */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              style={{ display: "flex", gap: 40, marginTop: 8 }}>
              {[["4.2s", "Avg LCP we fix"], ["61%", "Avg ad loss recovered"], ["30d", "Fix guarantee"]].map(([v, l]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text)", letterSpacing: "0.05em" }}>{v}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em" }}>
              USES GOOGLE PAGESPEED INSIGHTS API · NO SIGN-UP REQUIRED · FREE FOREVER
            </motion.p>
          </motion.section>
        )}

        {/* ── LOADING ── */}
        {state === "loading" && (
          <motion.section key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ width: "100%" }}>
            <TerminalLoader url={url} />
          </motion.section>
        )}

        {/* ── EMAIL GATE ── */}
        {state === "email-gate" && result && (
          <motion.section key="gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "relative", width: "100%", maxWidth: 860 }}>
            <div className="blur-veil">
              <ResultsPanel result={result} url={url} isBlurred={true} />
            </div>
            <EmailGate onSubmit={submitEmail} loading={emailLoading} />
          </motion.section>
        )}

        {/* ── RESULTS ── */}
        {state === "results" && result && (
          <motion.section key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ width: "100%" }}>
            <ResultsPanel result={result} url={url} isBlurred={false} />
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <footer style={{ width: "100%", maxWidth: 860, marginTop: 80, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width={18} height={18} viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.6" />
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--muted)", letterSpacing: "0.08em" }}>NEXUS</span>
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", textAlign: "center" }}>
          © {new Date().getFullYear()} Nexus Performance Agency · Powered by Google PageSpeed Insights
        </p>
      </footer>
    </main>
  );
}