"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { fetchAudit, fmtMs, scoreColor, metricStatus } from "./lib/audit";
import type { AuditResult } from "./lib/audit";

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

// ─── Upsell Tier Card ─────────────────────────────────────────────────────────
function UpsellTier({ num, icon, title, subtitle, pitch, tag, tagColor, delay }: {
  num: string; icon: string; title: string; subtitle: string; pitch: string;
  tag: string; tagColor: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      className="upsell-tier card" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
      <div className="upsell-tier-number">{num}</div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div className="service-tag" style={{ background: `${tagColor}15`, color: tagColor, border: `1px solid ${tagColor}30`, marginBottom: 10 }}>
            {tag}
          </div>
          <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", letterSpacing: "0.05em", marginBottom: 4 }}>{title}</h4>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>{subtitle}</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{pitch}</p>
        </div>
      </div>
    </motion.div>
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
function ResultsPanel({ result }: { result: AuditResult }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 150); return () => clearTimeout(t); }, []);
  const { metrics, adLossPercent, bounceRateIncrease, annualRevenueLoss, severity } = result;
  const sevConfig = {
    critical: { label: "CRITICAL FAILURE", color: "#e8341a", bg: "rgba(232,52,26,0.08)" },
    warning:  { label: "NEEDS ATTENTION",  color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    ok:       { label: "HEALTHY",           color: "#10b981", bg: "rgba(16,185,129,0.08)" },
  }[severity];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
      className="w-full" style={{ maxWidth: 860, margin: "0 auto" }}>

      {/* ── Status Banner ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, padding: "12px 20px", borderRadius: 8, background: sevConfig.bg, border: `1px solid ${sevConfig.color}30` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: sevConfig.color, display: "inline-block", boxShadow: `0 0 10px ${sevConfig.color}` }} className={severity === "critical" ? "animate-pulse" : ""} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: sevConfig.color, letterSpacing: "0.15em" }}>STATUS: {sevConfig.label}</span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{result.url} · {new Date(result.timestamp).toLocaleTimeString()}</span>
      </motion.div>

      {/* ── Score + Revenue ── */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, marginBottom: 16 }}>
        {/* Score gauge */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="card" style={{ padding: "28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Performance</p>
          <ScoreGauge score={metrics.performanceScore} animated={animated} />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: scoreColor(metrics.performanceScore), textAlign: "center" }}>
            {metrics.performanceScore < 50 ? "FAILING" : metrics.performanceScore < 80 ? "AVERAGE" : "GOOD"}
          </p>
        </motion.div>

        {/* Revenue impact */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="card-accent" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} className="animate-pulse" />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Revenue Haemorrhage Detected</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
            {[
              { val: adLossPercent, suf: "%", label: "Ad Revenue Lost", color: "var(--accent)" },
              { val: bounceRateIncrease, suf: "%", label: "Bounce Rate Spike", color: "var(--warn)" },
              { val: Math.round(annualRevenueLoss / 1000), suf: "k+", label: "Annual $ Leakage", color: "var(--text)" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 42, color: s.color, textShadow: s.color === "var(--accent)" ? "0 0 20px rgba(232,52,26,0.5)" : "none", lineHeight: 1, letterSpacing: "0.02em" }}>
                  {animated ? <AnimatedNumber value={s.val} suffix={s.suf} /> : `0${s.suf}`}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", paddingTop: 16, borderTop: "1px solid rgba(232,52,26,0.15)", lineHeight: 1.7 }}>
            Google research: every +100ms load time = ~1% conversion drop. Every bounce = a lost lead. Figures based on avg SMB ad spend.
          </p>
        </motion.div>
      </div>

      {/* ── Core Web Vitals ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="card" style={{ padding: "24px", marginBottom: 16 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Core Web Vitals — Mobile</p>
        <MetricRow label="Largest Contentful Paint (LCP)" value={metrics.lcp} formatted={fmtMs(metrics.lcp)} thresholds={[2500, 4000]} />
        <MetricRow label="First Contentful Paint (FCP)" value={metrics.fcp} formatted={fmtMs(metrics.fcp)} thresholds={[1800, 3000]} />
        <MetricRow label="Total Blocking Time (TBT)" value={metrics.tbt} formatted={fmtMs(metrics.tbt)} thresholds={[200, 600]} />
        <MetricRow label="Cumulative Layout Shift (CLS)" value={metrics.cls} formatted={metrics.cls.toFixed(3)} thresholds={[0.1, 0.25]} />
        <MetricRow label="Speed Index" value={metrics.speedIndex} formatted={fmtMs(metrics.speedIndex)} thresholds={[3400, 5800]} />
      </motion.div>

      {/* ── 4-Tier Upsell Ladder ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.2em", whiteSpace: "nowrap" }}>THE NEXUS FIX PLAN</p>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 24 }}>
          <UpsellTier num="01" icon="⚡" tag="Tier 1 · Immediate" tagColor="#e8341a" delay={0.5}
            title="LANDING PAGE REBUILD"
            subtitle="Performance-optimized infrastructure"
            pitch="Your current stack is too heavy. We rebuild your pages on our performance infrastructure — target load time under 1.5 seconds. Bounce rate drops immediately." />
          <UpsellTier num="02" icon="🎯" tag="Tier 2 · Revenue" tagColor="#f59e0b" delay={0.55}
            title="STRATEGIC AD PLACEMENT"
            subtitle="CRO & conversion architecture"
            pitch="Fast pages that don't convert are wasted. We redesign layouts and position every CTA, form, and ad unit for maximum ROAS. Avg 34% conversion uplift." />
          <UpsellTier num="03" icon="🤖" tag="Tier 3 · Automation" tagColor="#10b981" delay={0.6}
            title="AI RESPONSE AGENT"
            subtitle="24/7 lead capture & qualification"
            pitch="Even perfect sites lose leads to hesitation. Our AI agent engages visitors instantly, qualifies them, and books calls — even at 2am. Zero lead bleed." />
          <UpsellTier num="04" icon="📞" tag="Tier 4 · Scale" tagColor="#a78bfa" delay={0.65}
            title="WHITE-LABEL CALL CENTER"
            subtitle="Worked leads piped directly to you"
            pitch="We fixed the bucket. Now we turn the faucet on. High-intent leads fed into your CRM, worked by our team. We don't just deliver leads — we deliver closed deals." />
        </div>
      </motion.div>

      {/* ── Main CTA ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        style={{ padding: "48px 40px", textAlign: "center", borderRadius: 16, background: "linear-gradient(135deg, rgba(232,52,26,0.08) 0%, rgba(232,52,26,0.03) 100%)", border: "1px solid rgba(232,52,26,0.25)", position: "relative", overflow: "hidden", marginBottom: 24 }}>
        {/* Background glow */}
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,52,26,0.12) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <svg width={24} height={24} viewBox="0 0 28 28" fill="none">
              <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
              <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", letterSpacing: "0.08em" }}>NEXUS</span>
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>Ready to stop the bleed?</p>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,5vw,52px)", color: "var(--text)", letterSpacing: "0.05em", lineHeight: 1, marginBottom: 8 }}>
            WE FIX THIS IN <span style={{ color: "var(--accent)", textShadow: "0 0 30px rgba(232,52,26,0.5)" }}>30 DAYS.</span>
          </h3>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3vw,30px)", color: "var(--text2)", letterSpacing: "0.05em", marginBottom: 24 }}>GUARANTEED.</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Book a free 15-minute strategy call. We'll walk through your exact numbers, show you which of the 4 tiers applies first, and give you a fixed-price proposal — no retainers, no surprises.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <a href="#" className="btn-primary" style={{ display: "inline-block", padding: "18px 48px", borderRadius: 10, fontSize: 14, textDecoration: "none", letterSpacing: "0.15em" }}>
              BOOK FREE STRATEGY CALL →
            </a>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted2)" }}>No pitch · No obligation · Response within 2 hours</p>
          </div>
          {/* Social proof */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 32, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
            {[["500+", "Sites audited"], ["34%", "Avg conversion uplift"], ["30d", "Fix guarantee"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--accent)", letterSpacing: "0.05em" }}>{v}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div style={{ textAlign: "center", paddingBottom: 32 }}>
        <button onClick={() => window.location.reload()}
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", background: "none", border: "none", textDecoration: "underline", textUnderlineOffset: 4, cursor: "none" }}>
          ↩ Audit another website
        </button>
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
            <div className="blur-veil"><ResultsPanel result={result} /></div>
            <EmailGate onSubmit={submitEmail} loading={emailLoading} />
          </motion.section>
        )}

        {/* ── RESULTS ── */}
        {state === "results" && result && (
          <motion.section key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ width: "100%" }}>
            <ResultsPanel result={result} />
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