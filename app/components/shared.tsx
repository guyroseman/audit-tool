"use client";
// SHARED — single source of truth. Both app/page.tsx and app/funnel/page.tsx import from here.
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { fmtMs, scoreColor, metricStatus } from "../lib/audit";
import type { AuditResult, AuditFinding } from "../lib/audit";

// ─── Animated Counter ─────────────────────────────────────────────────────────
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

// ─── Terminal Loader ──────────────────────────────────────────────────────────
const SCAN_LINES = [
  "> Resolving DNS & HTTPS certificate...",
  "> Connecting to Google Lighthouse API...",
  "> Parsing render-blocking resources...",
  "> Measuring Largest Contentful Paint...",
  "> Cross-referencing Google ad quality signals...",
  "> Auditing meta-data & crawlability...",
  "> Scanning for ADA/WCAG compliance violations...",
  "> Detecting vulnerable JavaScript libraries...",
  "> Checking AI search visibility (ChatGPT / Perplexity)...",
  "> Running 5-pillar revenue impact model...",
  "> Compiling executive recovery report...",
];
export function TerminalLoader({ url }: { url: string }) {
  const [lines, setLines] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { if (i < SCAN_LINES.length) { setLines(p => [...p, SCAN_LINES[i]]); i++; } else clearInterval(t); }, 280);
    const clock = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => { clearInterval(t); clearInterval(clock); };
  }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 6 }}>NEXUS DIAGNOSTIC ENGINE v5.0 — 5-PILLAR SCAN</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,5vw,42px)", color: "var(--text)", letterSpacing: "0.05em" }}>
          SCANNING <span style={{ color: "var(--accent)" }} className="flicker">{url.replace(/https?:\/\//, "").replace(/\/$/, "")}</span>
        </h2>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px", minHeight: 220, fontFamily: "var(--font-mono)", fontSize: 12 }}>
        <div style={{ display: "flex", gap: 7, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
          {["#e8341a", "#f59e0b", "#10b981"].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, display: "inline-block" }} />)}
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
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
            style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em" }}>
            Connecting to Google&apos;s servers — this typically takes <strong style={{ color: "var(--text2)" }}>30–60 seconds</strong>. Don&apos;t close this tab.
          </span>
        </motion.div>
        {/* Elapsed clock */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--border2)", flexShrink: 0 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            style={{ width: 8, height: 8, border: "1.5px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)", letterSpacing: "0.08em" }}>
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Score Gauge ──────────────────────────────────────────────────────────────
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
    <div style={{ position: "relative", width: "min(180px, 48vw)", height: "min(180px, 48vw)" }}>
      <svg width="100%" height="100%" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 180 180">
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

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: 6 }}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(p => !p)}
        aria-label="What does this mean?"
        style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          padding: "2px 7px", borderRadius: 4,
          background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)",
          color: "#a78bfa", fontFamily: "var(--font-mono)", fontSize: 9,
          cursor: "pointer", lineHeight: 1, flexShrink: 0, verticalAlign: "middle",
          letterSpacing: "0.05em", transition: "all 0.15s",
        }}>
        ℹ <span style={{ opacity: 0.7 }}>INFO</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "absolute", bottom: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)",
              zIndex: 600, width: 240, padding: "12px 14px", borderRadius: 10,
              background: "#0d1829", border: "1px solid rgba(167,139,250,0.35)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.1)",
              fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.6,
              pointerEvents: "none",
            }}>
            {/* Arrow */}
            <span style={{
              position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)",
              width: 10, height: 10, background: "#0d1829", border: "1px solid rgba(167,139,250,0.35)",
              borderTop: "none", borderLeft: "none",
            }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#a78bfa", letterSpacing: "0.12em", display: "block", marginBottom: 5 }}>WHAT THIS MEANS</span>
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ─── Metric Row ───────────────────────────────────────────────────────────────
export function MetricRow({ label, value, formatted, thresholds, ragequit, tooltip }: {
  label: string; value: number; formatted: string; thresholds: [number, number]; ragequit?: string; tooltip?: string;
}) {
  const s = metricStatus(value, thresholds);
  const c = { ok: "#10b981", warn: "#f59e0b", bad: "#e8341a" }[s];
  const l = { ok: "PASS", warn: "SLOW", bad: "FAIL" }[s];
  const pct = s === "ok" ? 100 : s === "warn" ? 60 : 25;
  return (
    <div style={{ padding: "13px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginBottom: 6, display: "flex", alignItems: "center" }}>
            {label}{tooltip && <Tooltip text={tooltip} />}
          </div>
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

// ─── Email Gate ───────────────────────────────────────────────────────────────
export function EmailGate({ onSubmit, loading }: { onSubmit: (email: string) => Promise<void>; loading: boolean }) {
  const [email, setEmail] = useState(""); const [err, setErr] = useState(""); const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  async function submit() { setErr(""); const t = email.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) { setErr("Enter a valid email."); return; } await onSubmit(t); }
  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
      style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(20px)", background: "rgba(3,7,15,0.92)" }}>
      <div className="emailgate-inner" style={{ width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid rgba(232,52,26,0.35)", borderRadius: 16, padding: "40px 32px", boxShadow: "0 0 80px rgba(232,52,26,0.2)", textAlign: "center" }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", background: "rgba(232,52,26,0.12)", border: "1px solid rgba(232,52,26,0.3)", marginBottom: 16, fontSize: 26, position: "relative" }}
          className="pulse-ring">🔍</motion.div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 10 }}>5-PILLAR DIAGNOSTIC COMPLETE</p>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--text)", letterSpacing: "0.05em", marginBottom: 12 }}>YOUR REPORT IS READY</h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.65, marginBottom: 24 }}>
          Unlock your full 5-pillar breakdown — performance, SEO, accessibility, security, and AI visibility.
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

// ─── Nexus Pulse Pitch — aggressive open-by-default upsell ───────────────────
export function NexusPulsePitch({ result }: { result: AuditResult }) {
  const score = result.metrics.performanceScore;
  const leak = result.totalMonthlyCost;
  const annual = Math.round(leak * 12);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      style={{ marginBottom: 14, borderRadius: 14, overflow: "hidden",
        background: "linear-gradient(135deg,rgba(167,139,250,0.10),rgba(167,139,250,0.04))",
        border: "1.5px solid rgba(167,139,250,0.35)",
        boxShadow: "0 0 60px rgba(167,139,250,0.12)" }}>

      {/* Always-visible header */}
      <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(167,139,250,0.18)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 11, background: "rgba(167,139,250,0.14)", border: "1px solid rgba(167,139,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>📊</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--text)", letterSpacing: "0.05em" }}>NEXUS PULSE</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa", background: "rgba(167,139,250,0.14)", border: "1px solid rgba(167,139,250,0.3)", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.1em" }}>$49/MO</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.1em" }}>7-DAY FREE TRIAL</span>
            </div>
            {/* Revenue warning — the hook */}
            <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(232,52,26,0.07)", border: "1px solid rgba(232,52,26,0.2)", marginBottom: 12 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#e8341a", lineHeight: 1.6, margin: 0 }}>
                ⚠ Your site is leaking <strong>${leak.toLocaleString()}/mo</strong> right now.
                {score < 50
                  ? ` At ${score}/100, every competitor above 75 is actively stealing your Google traffic and paying less per ad click.`
                  : ` A competitor at 90+ already gets preferential ranking treatment — and you won't know until your traffic drops.`}
              </p>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>
              Pulse monitors your 5 pillars weekly, tracks competitors, and alerts you the moment anything changes — before the damage compounds to <strong style={{ color: "var(--text)" }}>${annual.toLocaleString()}/yr</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(167,139,250,0.12)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
          {[
            ["📡", "Weekly 5-pillar re-audit", "Never miss a regression"],
            ["🤖", "AI visibility monitoring", "Know when ChatGPT stops citing you"],
            ["🔍", "Track 3 competitor URLs", "See exactly where they beat you"],
            ["⚖️", "ADA compliance monitoring", "Catch violations before demand letters"],
            ["🔔", "Slack alerts when scores drop", "Zero-delay notification"],
          ].map(([icon, label, sub]) => (
            <div key={label} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.12)" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text)", fontWeight: 500, marginBottom: 2 }}>{label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.05em" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div style={{ padding: "12px 22px", borderBottom: "1px solid rgba(167,139,250,0.12)", background: "rgba(167,139,250,0.03)" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)", fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>
          &ldquo;Found out my competitor dropped from 81 to 47 overnight. Called 3 of their prospects that week. Pulse paid for itself in 20 minutes.&rdquo;
          <span style={{ color: "var(--muted)", fontStyle: "normal" }}> — James H., SaaS Founder</span>
        </p>
      </div>

      {/* CTA */}
      <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <a href="/subscribe" style={{
          flex: 1, minWidth: 200, display: "block", padding: "15px", borderRadius: 9, textAlign: "center",
          textDecoration: "none", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em",
          background: "#a78bfa", color: "#fff", boxShadow: "0 0 28px rgba(167,139,250,0.4)",
          fontWeight: 600, transition: "all 0.15s",
        }}>
          START FREE 7-DAY TRIAL →
        </a>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "#a78bfa", lineHeight: 1 }}>$49/mo</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", marginTop: 2 }}>after trial · cancel anytime</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Finding Banner (expandable plain-English alert card) ─────────────────────
function FindingBanner({ finding, index }: { finding: AuditFinding; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isCritical = finding.severity === "critical";
  const isOk = finding.severity === "ok";
  const borderColor = isCritical ? "rgba(232,52,26,0.35)" : isOk ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.3)";
  const bgColor = isCritical ? "rgba(232,52,26,0.04)" : isOk ? "rgba(16,185,129,0.03)" : "rgba(245,158,11,0.03)";
  const labelColor = isCritical ? "#e8341a" : isOk ? "#10b981" : "#f59e0b";
  const label = isCritical ? "⚠ CRITICAL" : isOk ? "✓ PASSING" : "⚡ WARNING";
  const catIcon: Record<string, string> = { performance: "⚡", seo: "🔍", tech: "⚙️", accessibility: "♿", security: "🔒", geo: "🤖" };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * index }}
      style={{ borderRadius: 10, background: bgColor, border: `1px solid ${borderColor}`, marginBottom: 8, overflow: "hidden" }}>
      <button onClick={() => setExpanded(p => !p)}
        style={{ width: "100%", padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>{catIcon[finding.category] ?? "📌"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: labelColor, letterSpacing: "0.13em", padding: "2px 6px", borderRadius: 3, background: `${labelColor}18`, border: `1px solid ${labelColor}35`, whiteSpace: "nowrap" }}>{label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{finding.category}</span>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text)", fontWeight: 500, lineHeight: 1.4, margin: 0 }}>{finding.headline}</p>
        </div>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} style={{ color: "var(--muted)", fontSize: 11, flexShrink: 0 }}>▼</motion.span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ height: 1, background: borderColor, marginBottom: 2 }} />
              <div style={{ padding: "9px 12px", borderRadius: 7, background: "rgba(232,52,26,0.05)", border: "1px solid rgba(232,52,26,0.12)" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.12em", marginBottom: 4 }}>BUSINESS IMPACT</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>{finding.businessImpact}</p>
              </div>
              <div style={{ padding: "9px 12px", borderRadius: 7, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 4 }}>TECHNICAL DETAIL</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>{finding.technicalDetail}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 180, padding: "9px 12px", borderRadius: 7, background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.14)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#10b981", letterSpacing: "0.12em", marginBottom: 4 }}>THE FIX</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.55, margin: 0 }}>{finding.fix}</p>
                </div>
                {finding.estimatedRecovery && (
                  <div style={{ padding: "9px 12px", borderRadius: 7, background: "var(--surface)", border: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 4 }}>RECOVERY</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--text)", margin: 0 }}>{finding.estimatedRecovery}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Pillar Card (2×2 grid) ───────────────────────────────────────────────────
function PillarCard({ icon, title, score, stats, delay = 0 }: {
  icon: string; title: string; score: number;
  stats: { label: string; value: string; alarm?: boolean; tooltip?: string }[];
  delay?: number;
}) {
  const color = scoreColor(score);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ background: "var(--surface)", border: `1px solid ${color}20`, borderRadius: 12, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.14em" }}>{title}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 30, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted2)", display: "block" }}>/100</span>
        </div>
      </div>
      <div style={{ height: 2, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay }}
          style={{ height: "100%", background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
      {stats.map(s => (
        <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.07em", display: "flex", alignItems: "center" }}>
            {s.label}{s.tooltip && <Tooltip text={s.tooltip} />}
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: s.alarm ? "#e8341a" : color }}>{s.value}</span>
        </div>
      ))}
    </motion.div>
  );
}

// ─── THE RESULTS PANEL ────────────────────────────────────────────────────────
export function ResultsPanel({ result, onDiscover }: {
  result: AuditResult;
  onDiscover?: () => void;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const fixPlanRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);
  const [activeTab, setActiveTab] = useState<"findings" | "vitals" | "all">("findings");
  const [scrollHintDismissed, setScrollHintDismissed] = useState(false);
  const [pulseVisible, setPulseVisible] = useState(false);
  const [discoverVisible, setDiscoverVisible] = useState(false);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const t = setTimeout(() => setAnimated(true), 150);
    const hintT = setTimeout(() => {}, 2000);
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setDiscoverVisible(true);
    }, { threshold: 0.3 });
    if (fixPlanRef.current) obs.observe(fixPlanRef.current);
    return () => { clearTimeout(t); clearTimeout(hintT); obs.disconnect(); };
  }, []);

  const { metrics, adLossPercent, bounceRateIncrease, annualRevenueLoss, totalMonthlyCost, severity, accessibility, security, seo, explanations } = result;
  const sev = { critical: { label: "CRITICAL FAILURE", color: "#e8341a" }, warning: { label: "NEEDS ATTENTION", color: "#f59e0b" }, ok: { label: "HEALTHY", color: "#10b981" } }[severity];
  const criticalFindings = explanations.filter(e => e.severity !== "ok");
  const annualLoss = Math.round(totalMonthlyCost * 12);
  const issueCount = criticalFindings.length;

  // Scroll to the fix plan section — reveal it first, let user click
  const scrollToFixPlan = () => {
    fixPlanRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const [stickyVisible, setStickyVisible] = useState(false);
  const [cookieBannerUp, setCookieBannerUp] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStickyVisible(true), 1800);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const consent = typeof window !== "undefined" ? localStorage.getItem("nexus_cookie_consent") : "accepted";
    if (!consent) setCookieBannerUp(true);
    const handler = () => setCookieBannerUp(false);
    window.addEventListener("nexusCookieConsent", handler);
    return () => window.removeEventListener("nexusCookieConsent", handler);
  }, []);

  return (
    <motion.div ref={topRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      style={{ width: "100%", maxWidth: 880, margin: "0 auto" }}>

      {/* ── Sticky floating CTA bar ── */}
      {onDiscover && (
        <AnimatePresence>
          {stickyVisible && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{
                position: "fixed", bottom: cookieBannerUp ? 68 : 0, left: 0, right: 0, zIndex: 9000,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "14px 20px",
                background: "rgba(3,7,15,0.92)", backdropFilter: "blur(16px)",
                borderTop: "1px solid rgba(232,52,26,0.3)",
                boxShadow: "0 -8px 40px rgba(232,52,26,0.18)",
              }}>
              <div style={{ maxWidth: 700, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.18em", display: "block", marginBottom: 2 }}>⚠ REVENUE LEAK DETECTED</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", letterSpacing: "0.04em" }}>
                    ${totalMonthlyCost.toLocaleString()}<span style={{ fontSize: 13, color: "var(--muted)" }}>/mo leaking</span>
                  </span>
                </div>
                <button onClick={scrollToFixPlan}
                  style={{ padding: "12px 24px", borderRadius: 10, background: "var(--accent)", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff", letterSpacing: "0.1em", boxShadow: "0 0 28px rgba(232,52,26,0.5)", whiteSpace: "nowrap", flexShrink: 0 }}>
                  SEE HOW TO FIX THIS →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── Status Banner ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "11px 18px", borderRadius: 8, background: `${sev.color}10`, border: `1px solid ${sev.color}25`, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: sev.color, display: "inline-block", boxShadow: `0 0 10px ${sev.color}` }} className={severity === "critical" ? "animate-pulse" : ""} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: sev.color, letterSpacing: "0.15em" }}>STATUS: {sev.label}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>·</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>{criticalFindings.filter(e => e.severity === "critical").length} critical · {criticalFindings.filter(e => e.severity === "warning").length} warnings</span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>
          {result.url.replace(/https?:\/\//, "").substring(0, 28)} · {new Date(result.timestamp).toLocaleTimeString()}
        </span>
      </motion.div>

      {/* ── Executive Summary: Total $ Leakage ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ marginBottom: 14, padding: "22px 24px", borderRadius: 14, background: "linear-gradient(135deg,rgba(232,52,26,0.08),rgba(232,52,26,0.03))", border: "1px solid rgba(232,52,26,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} className="animate-pulse" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.2em" }}>EXECUTIVE SUMMARY — COMBINED REVENUE LEAKAGE ACROSS ALL 5 PILLARS</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px,7vw,70px)", color: "var(--accent)", lineHeight: 1, letterSpacing: "0.01em", textShadow: "0 0 50px rgba(232,52,26,0.35)" }}>
              {animated ? <>$<AnimatedNumber value={totalMonthlyCost} />/mo</> : "$0/mo"}
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", marginTop: 6, lineHeight: 1.6, maxWidth: 480 }}>
              Cumulative cost across performance penalties, lost organic traffic, security-driven cart abandonment, and inaccessible market segments. <strong style={{ color: "var(--text)" }}>That's ${annualLoss.toLocaleString()} this year alone.</strong>
            </p>
            {/* Scroll CTA — urgent */}
            {onDiscover && (
              <motion.button onClick={scrollToFixPlan} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, background: "var(--accent)", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "#fff", letterSpacing: "0.1em", boxShadow: "0 0 24px rgba(232,52,26,0.4)" }}>
                <motion.span animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>↓</motion.span>
                SEE HOW TO FIX THIS →
              </motion.button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "Google Ad Tax", value: `${adLossPercent}%`, alarm: adLossPercent > 20 },
              { label: "Bounce Spike", value: `+${bounceRateIncrease}%`, alarm: bounceRateIncrease > 15 },
              { label: "SEO Reach Lost", value: `${seo?.seoReachLossPercent ?? 0}%`, alarm: (seo?.seoReachLossPercent ?? 0) > 20 },
              { label: "Vuln. Libraries", value: (security?.vulnerableLibraryCount ?? 0) > 0 ? `${security!.vulnerableLibraryCount} found` : "Clean", alarm: (security?.vulnerableLibraryCount ?? 0) > 0 },
              { label: "ADA Risk", value: (accessibility?.adaRiskLevel ?? "low").toUpperCase(), alarm: accessibility?.adaRiskLevel === "high" },
              ...(result.geo ? [{ label: "AI Pipeline Leak", value: `$${result.geo.estimatedAiPipelineLeak.toLocaleString()}/mo`, alarm: result.geo.estimatedAiPipelineLeak > 300 }] : []),
            ].map(({ label, value, alarm }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 18, padding: "4px 0", borderBottom: "1px solid rgba(232,52,26,0.1)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{label}</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 13, color: alarm ? "#e8341a" : "#10b981" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Scroll invitation after summary ── */}
      {onDiscover && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
          style={{ textAlign: "center", marginBottom: 20, padding: "12px", borderRadius: 10, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#f59e0b", letterSpacing: "0.08em" }}>
            ↓ Scroll to see all {issueCount} issues found — then we&apos;ll build your personalised fix plan
          </p>
        </motion.div>
      )}

      {/* ── 4-Pillar Grid ── */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 10 }}>5-PILLAR DIGITAL HEALTH OVERVIEW</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: 10 }}>
          <PillarCard icon="⚡" title="PERFORMANCE" score={metrics.performanceScore} delay={0.15}
            stats={[
              { label: "Google Ad Tax", value: `${adLossPercent}%`, alarm: adLossPercent > 20, tooltip: "Slow sites cost more per ad click. Google charges higher CPCs (cost per click) to advertisers whose landing pages are slow, directly reducing your ad ROI." },
              { label: "Bounce Spike", value: `+${bounceRateIncrease}%`, alarm: bounceRateIncrease > 15, tooltip: "Extra visitors who leave without engaging, caused by slow load times. Even a 1-second delay raises bounce rate by ~20%, meaning fewer conversions from the same ad spend." },
            ]} />
          <PillarCard icon="🔍" title="SEO" score={seo?.estimatedSeoScore ?? 0} delay={0.2}
            stats={[
              { label: "Organic Reach Lost", value: `${seo?.seoReachLossPercent ?? 0}%`, alarm: (seo?.seoReachLossPercent ?? 0) > 20, tooltip: "Estimated share of free Google search traffic you're not receiving due to technical SEO issues — missing meta tags, broken links, slow Core Web Vitals, and crawlability problems." },
              { label: "CTR Loss", value: `${seo?.ctrLoss ?? 0}%`, alarm: (seo?.ctrLoss ?? 0) > 10, tooltip: "Click-through rate loss from Google Search results. Poor titles, missing descriptions, or low relevance signals make users skip your result and click competitors instead." },
            ]} />
          <PillarCard icon="♿" title="ACCESSIBILITY" score={accessibility?.estimatedA11yScore ?? 0} delay={0.25}
            stats={[
              { label: "Market Lockout", value: `${accessibility?.estimatedMarketLockout ?? 0}%`, alarm: (accessibility?.estimatedMarketLockout ?? 0) > 10, tooltip: "Estimated share of potential customers who cannot use your site due to accessibility barriers — screen reader incompatibility, poor contrast, missing alt text, keyboard navigation failures." },
              { label: "ADA Risk", value: (accessibility?.adaRiskLevel ?? "low").toUpperCase(), alarm: accessibility?.adaRiskLevel === "high", tooltip: "Legal exposure under the Americans with Disabilities Act. Inaccessible websites can face demand letters and lawsuits — US courts have ruled websites must meet WCAG accessibility standards." },
            ]} />
          <PillarCard icon="🔒" title="SECURITY" score={security?.estimatedBestPracticesScore ?? 0} delay={0.3}
            stats={[
              { label: "Vuln. Scripts", value: (security?.vulnerableLibraryCount ?? 0) > 0 ? `${security!.vulnerableLibraryCount} detected` : "Clean", alarm: (security?.vulnerableLibraryCount ?? 0) > 0, tooltip: "Outdated JavaScript libraries with known security holes. Attackers can exploit these to steal customer data, hijack sessions, or redirect users — harming both your visitors and your SEO trust score." },
              { label: "Trust Risk", value: (security?.trustRiskLevel ?? "low").toUpperCase(), alarm: security?.trustRiskLevel === "high", tooltip: "Overall visitor trust signal based on HTTPS validity, security headers, and vulnerability exposure. Browsers show warnings for untrusted sites, immediately killing conversions." },
            ]} />
          {result.geo && (
            <PillarCard icon="🤖" title="AI VISIBILITY" score={result.geo.geoScore} delay={0.35}
              stats={[
                { label: "AI Pipeline Leak", value: `$${result.geo.estimatedAiPipelineLeak.toLocaleString()}/mo`, alarm: result.geo.estimatedAiPipelineLeak > 300, tooltip: "Estimated monthly revenue at risk as AI-powered search (ChatGPT, Perplexity, Gemini) replaces traditional Google queries. Sites not optimised for AI citation lose referral traffic to competitors who are." },
                { label: "Schema Markup", value: result.geo.hasSchemaMarkup ? (result.geo.schemaTypes.length > 0 ? result.geo.schemaTypes[0] : "Present") : "Missing", alarm: !result.geo.hasSchemaMarkup, tooltip: "JSON-LD structured data tells AI crawlers exactly what your business does. Without it, AI engines cannot confidently categorise or recommend you." },
              ]} />
          )}
        </div>
      </div>

      {/* ── HOW DO I FIX THIS — main CTA (high up, right after pillar cards) ── */}
      {onDiscover && (
        <motion.div ref={fixPlanRef} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ marginBottom: 14 }}>
          <motion.button onClick={onDiscover} whileHover={{ scale: 1.01, boxShadow: "0 0 60px rgba(232,52,26,0.25)" }} whileTap={{ scale: 0.98 }}
            style={{ width: "100%", padding: "28px 22px", borderRadius: 13, background: "linear-gradient(135deg,rgba(232,52,26,0.14),rgba(232,52,26,0.06))", border: "1.5px solid rgba(232,52,26,0.4)", cursor: "pointer", textAlign: "center", boxShadow: "0 0 40px rgba(232,52,26,0.1)", transition: "box-shadow 0.2s" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 10 }}>YOUR PERSONALISED FIX PLAN — 30 SECONDS</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,4vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 8 }}>
              How do I recover ${totalMonthlyCost.toLocaleString()}/mo?
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.6, maxWidth: 500, margin: "0 auto 16px" }}>
              Tell us about your business — we&apos;ll order fixes by ROI and tell you exactly what each one recovers.
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 8, background: "var(--accent)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", boxShadow: "0 4px 20px rgba(232,52,26,0.4)" }}>
              <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
              BUILD MY FIX PLAN
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* ── Tab Bar ── */}
      <div style={{ display: "flex", gap: 2, marginBottom: 12, background: "var(--surface)", borderRadius: 8, padding: 3, border: "1px solid var(--border)" }}>
        {[
          { id: "findings" as const, label: `CRITICAL FINDINGS (${criticalFindings.length})` },
          { id: "vitals" as const, label: "CORE VITALS" },
          { id: "all" as const, label: `ALL ISSUES (${explanations.length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, padding: "9px 6px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.08em", transition: "all 0.15s", whiteSpace: "nowrap",
              background: activeTab === tab.id ? "var(--accent)" : "none",
              color: activeTab === tab.id ? "#fff" : "var(--muted)" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === "findings" && (
          <motion.div key="findings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginBottom: 14 }}>
            {criticalFindings.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", background: "var(--surface)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.2)" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#10b981" }}>✓ NO CRITICAL ISSUES</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", marginTop: 8 }}>Your site passes all major checks across all 5 pillars.</p>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                {/* First finding — always fully visible */}
                <FindingBanner key={criticalFindings[0].id} finding={criticalFindings[0]} index={0} />

                {/* Remaining findings — blurred with lock overlay */}
                {criticalFindings.length > 1 && (
                  <div style={{ position: "relative" }}>
                    <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}>
                      {criticalFindings.slice(1, 4).map((f, i) => (
                        <FindingBanner key={f.id} finding={f} index={i + 1} />
                      ))}
                    </div>
                    {/* Lock overlay */}
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      background: "linear-gradient(to bottom, rgba(3,7,15,0.2), rgba(3,7,15,0.88))",
                      borderRadius: 10, padding: "24px 20px", textAlign: "center",
                    }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 10 }}>
                        🔒 {criticalFindings.length - 1} MORE ISSUE{criticalFindings.length > 2 ? "S" : ""} FOUND
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)", maxWidth: 360, marginBottom: 18, lineHeight: 1.6 }}>
                        You&apos;re losing <strong style={{ color: "var(--accent)" }}>${totalMonthlyCost.toLocaleString()}/mo</strong> across {criticalFindings.length} issues. See how to fix each one — ordered by revenue impact.
                      </p>
                      {onDiscover ? (
                        <button onClick={scrollToFixPlan}
                          style={{ padding: "13px 28px", borderRadius: 10, background: "var(--accent)", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff", letterSpacing: "0.1em", boxShadow: "0 0 30px rgba(232,52,26,0.45)" }}>
                          GET MY FULL FIX PLAN →
                        </button>
                      ) : (
                        <a href="/subscribe"
                          style={{ display: "inline-block", padding: "13px 28px", borderRadius: 10, background: "var(--accent)", textDecoration: "none", fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff", letterSpacing: "0.1em", boxShadow: "0 0 30px rgba(232,52,26,0.45)" }}>
                          UNLOCK ALL FINDINGS →
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
        {activeTab === "vitals" && (
          <motion.div key="vitals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em" }}>CORE WEB VITALS — MOBILE</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)" }}>💭 = what your visitor feels</p>
            </div>
            <MetricRow label="Largest Contentful Paint (LCP)" value={metrics.lcp} formatted={fmtMs(metrics.lcp)} thresholds={[2500, 4000]}
              tooltip="How long before the biggest visible element (hero image, headline) fully loads. This is what users perceive as 'when the page was ready.' Google wants under 2.5s."
              ragequit={metrics.lcp > 4000 ? `Your users wait ${(metrics.lcp / 1000).toFixed(1)}s to see anything. They assume the site is broken and leave.` : metrics.lcp > 2500 ? `${(metrics.lcp / 1000).toFixed(1)}s to load. Users are already reaching for the back button.` : undefined} />
            <MetricRow label="First Contentful Paint (FCP)" value={metrics.fcp} formatted={fmtMs(metrics.fcp)} thresholds={[1800, 3000]}
              tooltip="The moment any content (text, image, logo) first appears on a blank screen. A slow FCP makes visitors think the page crashed before it even starts loading."
              ragequit={metrics.fcp > 3000 ? `A blank screen for ${(metrics.fcp / 1000).toFixed(1)}s. Mobile users think the page crashed.` : undefined} />
            <MetricRow label="Total Blocking Time (TBT)" value={metrics.tbt} formatted={fmtMs(metrics.tbt)} thresholds={[200, 600]}
              tooltip="Total time the page looks loaded but ignores clicks and taps — buttons appear clickable but do nothing. Caused by heavy JavaScript running in the background. Under 200ms is good."
              ragequit={metrics.tbt > 600 ? `${metrics.tbt}ms of completely frozen UI. Buttons do nothing. Users assume it's broken.` : metrics.tbt > 200 ? `${metrics.tbt}ms where the page looks ready but ignores taps.` : undefined} />
            <MetricRow label="Cumulative Layout Shift (CLS)" value={metrics.cls} formatted={metrics.cls.toFixed(3)} thresholds={[0.1, 0.25]}
              tooltip="Measures how much the page 'jumps around' as it loads — ads appearing and pushing content down, images loading late, buttons shifting position. A high score means users accidentally click the wrong thing."
              ragequit={metrics.cls > 0.25 ? `Layout jumps ${metrics.cls.toFixed(2)} units mid-load. Buttons shift — users hit the wrong thing.` : undefined} />
            <MetricRow label="Speed Index" value={metrics.speedIndex} formatted={fmtMs(metrics.speedIndex)} thresholds={[3400, 5800]}
              tooltip="How quickly the visible part of the page fills in. Unlike LCP, this measures the whole above-the-fold experience progressively — a low score means users see content appearing fast, not all at once at the end." />
          </motion.div>
        )}
        {activeTab === "all" && (
          <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginBottom: 14, position: "relative" }}>
            <FindingBanner key={explanations[0].id} finding={explanations[0]} index={0} />
            {explanations.length > 1 && (
              <div style={{ position: "relative" }}>
                <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}>
                  {explanations.slice(1, 5).map((f, i) => (
                    <FindingBanner key={f.id} finding={f} index={i + 1} />
                  ))}
                </div>
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(to bottom, rgba(3,7,15,0.2), rgba(3,7,15,0.88))",
                  borderRadius: 10, padding: "24px 20px", textAlign: "center",
                }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em", marginBottom: 10 }}>
                    🔒 {explanations.length - 1} MORE FINDINGS LOCKED
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)", maxWidth: 360, marginBottom: 18, lineHeight: 1.6 }}>
                    Your full fix plan — every issue ordered by revenue impact with exact recovery times.
                  </p>
                  {onDiscover ? (
                    <button onClick={scrollToFixPlan}
                      style={{ padding: "13px 28px", borderRadius: 10, background: "var(--accent)", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff", letterSpacing: "0.1em", boxShadow: "0 0 30px rgba(232,52,26,0.45)" }}>
                      GET MY FULL FIX PLAN →
                    </button>
                  ) : (
                    <a href="/subscribe"
                      style={{ display: "inline-block", padding: "13px 28px", borderRadius: 10, background: "var(--accent)", textDecoration: "none", fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff", letterSpacing: "0.1em", boxShadow: "0 0 30px rgba(232,52,26,0.45)" }}>
                      UNLOCK ALL FINDINGS →
                    </a>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nexus Pulse Upsell ── */}
      <NexusPulsePitch result={result} />

      {/* ── Bottom CTA (only when no onDiscover — standalone report) ── */}
      {!onDiscover && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div style={{ padding: "36px 28px", textAlign: "center", borderRadius: 16, background: "linear-gradient(135deg,rgba(232,52,26,0.08),rgba(232,52,26,0.03))", border: "1px solid rgba(232,52,26,0.22)", marginBottom: 14 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 14 }}>PREFER A HUMAN TO HANDLE THIS?</p>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px,5vw,44px)", color: "var(--text)", letterSpacing: "0.05em", lineHeight: 1, marginBottom: 8 }}>
              WE FIX THIS IN <span style={{ color: "var(--accent)", textShadow: "0 0 30px rgba(232,52,26,0.5)" }}>30 DAYS.</span>
            </h3>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(16px,3vw,22px)", color: "var(--text2)", letterSpacing: "0.05em", marginBottom: 20 }}>GUARANTEED.</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.7 }}>
              15-minute call. Fixed-price proposal. We'll tell you honestly what's worth doing and what isn't.
            </p>
            <a href="/funnel" className="btn-primary" style={{ display: "inline-block", padding: "16px 44px", borderRadius: 10, fontSize: 13, textDecoration: "none", letterSpacing: "0.15em" }}>
              SPEAK TO AN AGENT →
            </a>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", marginTop: 12 }}>No pitch · No obligation · 2hr callback</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 22, paddingTop: 20, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
              {[["500+", "Sites fixed"], ["34%", "Avg conversion uplift"], ["30d", "Guarantee"]].map(([v, l]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--accent)", letterSpacing: "0.05em" }}>{v}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div style={{ textAlign: "center", paddingBottom: 30 }}>
        <button onClick={() => window.location.reload()}
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", background: "none", border: "none", textDecoration: "underline", textUnderlineOffset: 4, cursor: "pointer" }}>
          ↩ Audit another website
        </button>
      </div>
    </motion.div>
  );
}