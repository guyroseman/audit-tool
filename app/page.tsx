"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAudit, fmtMs, scoreColor, metricStatus } from "./lib/audit";
import type { AuditResult } from "./lib/audit";

// ─── Constants ────────────────────────────────────────────────────────────────

const TERMINAL_LINES = [
  "> Resolving DNS records...",
  "> Connecting to target host...",
  "> Downloading HTML payload...",
  "> Parsing render-blocking resources...",
  "> Measuring Largest Contentful Paint...",
  "> Calculating Total Blocking Time...",
  "> Analysing Cumulative Layout Shift...",
  "> Cross-referencing Google ad quality signals...",
  "> Running revenue impact model...",
  "> Compiling diagnostic report...",
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

/** Animated terminal-style loading text */
function TerminalLoader({ url }: { url: string }) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < TERMINAL_LINES.length) {
        setVisibleLines((prev) => [...prev, TERMINAL_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    const cursorInterval = setInterval(() => setCursor((c) => !c), 500);

    return () => {
      clearInterval(interval);
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        className="rounded border border-[#0e1e35] bg-[#04090f] p-5 font-mono text-sm"
        style={{ minHeight: 240 }}
      >
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#0e1e35]">
          <span className="w-3 h-3 rounded-full bg-[#e8341a] opacity-80" />
          <span className="w-3 h-3 rounded-full bg-[#f59e0b] opacity-80" />
          <span className="w-3 h-3 rounded-full bg-[#10b981] opacity-80" />
          <span className="ml-2 text-[#3a5070] text-xs">audit-engine v2.0 — {url}</span>
        </div>

        <div className="space-y-1">
          {visibleLines.map((line, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={idx === visibleLines.length - 1 ? "text-[#c8d8f0]" : "text-[#3a5070]"}
            >
              {line}
            </motion.div>
          ))}
          {visibleLines.length < TERMINAL_LINES.length && (
            <span className="text-[#e8341a]">{cursor ? "█" : " "}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** SVG circular gauge */
function CircularGauge({ score, animated }: { score: number; animated: boolean }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const color = scoreColor(score);
  const progress = animated ? (score / 100) * circumference : circumference;
  const offset = circumference - progress;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      <svg width={200} height={200} className="-rotate-90" viewBox="0 0 200 200">
        {/* Track */}
        <circle
          cx={100}
          cy={100}
          r={radius}
          fill="none"
          stroke="#0e1e35"
          strokeWidth={10}
        />
        {/* Progress */}
        <circle
          cx={100}
          cy={100}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gauge-progress"
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <CountUp value={score} animated={animated} />
        <span className="text-[#3a5070] text-xs font-mono mt-1">SCORE</span>
      </div>
    </div>
  );
}

/** Animated number count-up */
function CountUp({ value, animated }: { value: number; animated: boolean }) {
  const [display, setDisplay] = useState(animated ? 0 : value);

  useEffect(() => {
    if (!animated) {
      setDisplay(value);
      return;
    }
    let start = 0;
    const duration = 1800;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * value);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [value, animated]);

  const color = scoreColor(value);

  return (
    <span
      className="text-5xl font-display font-bold tabular-nums"
      style={{ color, textShadow: `0 0 20px ${color}` }}
    >
      {display}
    </span>
  );
}

/** Metric row with colored status */
function MetricRow({
  label,
  value,
  formatted,
  thresholds,
}: {
  label: string;
  value: number;
  formatted: string;
  thresholds: [number, number];
}) {
  const status = metricStatus(value, thresholds);
  const statusColors = { ok: "#10b981", warn: "#f59e0b", bad: "#e8341a" };
  const statusLabels = { ok: "GOOD", warn: "NEEDS WORK", bad: "FAILING" };

  return (
    <div className="flex items-center justify-between py-3 border-b border-[#0e1e35] last:border-0">
      <span className="text-[#4a6080] text-sm font-mono">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono font-medium text-[#c8d8f0]">{formatted}</span>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{
            color: statusColors[status],
            backgroundColor: `${statusColors[status]}18`,
            border: `1px solid ${statusColors[status]}30`,
          }}
        >
          {statusLabels[status]}
        </span>
      </div>
    </div>
  );
}

/** Email gate modal */
function EmailGate({
  onSubmit,
  loading,
}: {
  onSubmit: (email: string) => Promise<void>;
  loading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit() {
    setError("");
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid business email to unlock your report.");
      return;
    }
    await onSubmit(trimmed);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 z-20 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(3,7,15,0.85)" }}
    >
      <div
        className="w-full max-w-md rounded-lg border border-[#e8341a40] bg-[#080f1c] p-8"
        style={{ boxShadow: "0 0 60px rgba(232,52,26,0.15)" }}
      >
        {/* Warning icon */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#e8341a18", border: "1px solid #e8341a40" }}
          >
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2L18.66 17H1.34L10 2Z"
                stroke="#e8341a"
                strokeWidth={1.5}
                fill="none"
              />
              <line x1={10} y1={8} x2={10} y2={12} stroke="#e8341a" strokeWidth={1.5} />
              <circle cx={10} cy={14.5} r={0.75} fill="#e8341a" />
            </svg>
          </div>
          <div>
            <div className="text-[#e8341a] text-xs font-mono font-medium tracking-widest uppercase">
              Report Ready
            </div>
            <div className="text-[#c8d8f0] text-lg font-display italic">
              One step to unlock your results
            </div>
          </div>
        </div>

        <p className="text-[#4a6080] text-sm font-mono mb-6 leading-relaxed">
          Your Nexus diagnostic is complete. Enter your business email to reveal the
          full breakdown — including your estimated annual revenue leak.
        </p>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="you@company.com"
            className="w-full bg-[#04090f] border border-[#0e1e35] rounded px-4 py-3 text-[#c8d8f0] font-mono text-sm placeholder:text-[#2a3f58] focus:border-[#e8341a60] transition-colors"
          />

          {error && (
            <p className="text-[#e8341a] text-xs font-mono">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded py-3 font-mono text-sm font-medium tracking-wider uppercase transition-all duration-200 disabled:opacity-50"
            style={{
              backgroundColor: "#e8341a",
              color: "#fff",
              boxShadow: "0 0 20px rgba(232,52,26,0.4)",
            }}
          >
            {loading ? "Sending..." : "Unlock My Report →"}
          </button>
        </div>

        <p className="text-[#2a3f58] text-xs font-mono mt-4 text-center">
          No spam. We&apos;ll only send your report.
        </p>
      </div>
    </motion.div>
  );
}

/** Results panel — shown after email capture */
function ResultsPanel({ result }: { result: AuditResult }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const { metrics, adLossPercent, bounceRateIncrease, annualRevenueLoss, severity } = result;

  const severityConfig = {
    critical: { label: "CRITICAL", color: "#e8341a", bg: "#e8341a10" },
    warning: { label: "WARNING", color: "#f59e0b", bg: "#f59e0b10" },
    ok: { label: "HEALTHY", color: "#10b981", bg: "#10b98110" },
  };
  const sev = severityConfig[severity];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div
            className="inline-block text-xs font-mono font-medium tracking-widest uppercase px-2 py-1 rounded mb-2"
            style={{ color: sev.color, backgroundColor: sev.bg, border: `1px solid ${sev.color}30` }}
          >
            Status: {sev.label}
          </div>
          <h2 className="text-[#c8d8f0] font-display text-2xl italic">
            {result.url}
          </h2>
        </div>
        <div className="text-right text-xs font-mono text-[#3a5070]">
          Mobile Audit<br />
          {new Date(result.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score gauge */}
        <div
          className="rounded-lg border border-[#0e1e35] bg-[#080f1c] p-6 flex flex-col items-center gap-2"
        >
          <CircularGauge score={metrics.performanceScore} animated={animated} />
          <span className="text-[#3a5070] text-xs font-mono">Performance Score</span>
        </div>

        {/* Revenue impact */}
        <div
          className="md:col-span-2 rounded-lg border p-6 flex flex-col justify-between"
          style={{ borderColor: "#e8341a30", backgroundColor: "#e8341a08" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "#e8341a" }}
            />
            <span className="text-[#e8341a] text-xs font-mono font-medium tracking-widest uppercase">
              Critical Revenue Bleed Detected
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div
                className="text-3xl font-display font-bold"
                style={{ color: "#e8341a", textShadow: "0 0 15px rgba(232,52,26,0.5)" }}
              >
                {adLossPercent}%
              </div>
              <div className="text-[#4a6080] text-xs font-mono mt-1">Est. Ad Revenue Lost</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold" style={{ color: "#f59e0b" }}>
                +{bounceRateIncrease}%
              </div>
              <div className="text-[#4a6080] text-xs font-mono mt-1">Bounce Rate Increase</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-[#c8d8f0]">
                ${(annualRevenueLoss / 1000).toFixed(0)}k+
              </div>
              <div className="text-[#4a6080] text-xs font-mono mt-1">Est. Annual Leakage</div>
            </div>
          </div>

          <p className="text-[#3a5070] text-xs font-mono mt-4 pt-4 border-t border-[#e8341a20]">
            Based on Google&apos;s research: every 100ms increase in load time reduces conversions by ~1%.
            Figures assume average SMB ad spend. Your actual loss may be higher.
          </p>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="rounded-lg border border-[#0e1e35] bg-[#080f1c] p-6">
        <h3 className="text-[#3a5070] text-xs font-mono font-medium tracking-widest uppercase mb-4">
          Core Web Vitals
        </h3>
        <div>
          <MetricRow
            label="Largest Contentful Paint (LCP)"
            value={metrics.lcp}
            formatted={fmtMs(metrics.lcp)}
            thresholds={[2500, 4000]}
          />
          <MetricRow
            label="First Contentful Paint (FCP)"
            value={metrics.fcp}
            formatted={fmtMs(metrics.fcp)}
            thresholds={[1800, 3000]}
          />
          <MetricRow
            label="Total Blocking Time (TBT)"
            value={metrics.tbt}
            formatted={fmtMs(metrics.tbt)}
            thresholds={[200, 600]}
          />
          <MetricRow
            label="Cumulative Layout Shift (CLS)"
            value={metrics.cls}
            formatted={metrics.cls.toFixed(3)}
            thresholds={[0.1, 0.25]}
          />
          <MetricRow
            label="Speed Index"
            value={metrics.speedIndex}
            formatted={fmtMs(metrics.speedIndex)}
            thresholds={[3400, 5800]}
          />
        </div>
      </div>

      {/* CTA */}
      <div
        className="rounded-lg border p-8 text-center"
        style={{ borderColor: "#e8341a30", backgroundColor: "#e8341a05" }}
      >
        {/* Nexus logo in CTA */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.08)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.6" />
          </svg>
          <span className="font-display text-lg italic text-[#c8d8f0]">Nexus</span>
        </div>
        <div className="text-[#4a6080] text-xs font-mono uppercase tracking-widest mb-2">
          Ready to stop the bleed?
        </div>
        <h3 className="text-[#c8d8f0] font-display text-3xl italic mb-3">
          Nexus fixes this in 30 days.{" "}
          <span style={{ color: "#e8341a" }}>Guaranteed.</span>
        </h3>
        <p className="text-[#4a6080] text-sm font-mono mb-6 max-w-lg mx-auto">
          The Nexus team specialises in turning failing performance scores into
          revenue-generating machines. Book a free 15-minute call and we&apos;ll show
          you exactly what we&apos;d fix first.
        </p>
        <a
          href="#"
          className="inline-block rounded px-8 py-4 font-mono text-sm font-medium tracking-wider uppercase transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: "#e8341a",
            color: "#fff",
            boxShadow: "0 0 30px rgba(232,52,26,0.4)",
          }}
        >
          Book a Free Call with Nexus →
        </a>
        <div className="text-[#2a3f58] text-xs font-mono mt-4">
          No sales pitch. No obligation. Just a real answer.
        </div>
      </div>

      {/* Audit another */}
      <div className="text-center pb-8">
        <button
          onClick={() => window.location.reload()}
          className="text-[#3a5070] text-xs font-mono hover:text-[#c8d8f0] transition-colors underline underline-offset-4"
        >
          ↩ Audit another website
        </button>
      </div>
    </motion.div>
  );
}

// ─── App States ───────────────────────────────────────────────────────────────

type AppState = "idle" | "loading" | "email-gate" | "results" | "error";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const handleAudit = useCallback(async () => {
    if (!url.trim()) return;
    setError("");
    setState("loading");

    try {
      const auditResult = await fetchAudit(url);
      setResult(auditResult);
      setState("email-gate");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the PageSpeed API. Check the URL and try again."
      );
      setState("error");
    }
  }, [url]);

  const handleEmailSubmit = useCallback(
    async (email: string) => {
      if (!result) return;
      setEmailLoading(true);

      try {
        await fetch("/api/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            url: result.url,
            score: result.metrics.performanceScore,
            adLossPercent: result.adLossPercent,
            bounceRateIncrease: result.bounceRateIncrease,
            annualRevenueLoss: result.annualRevenueLoss,
            severity: result.severity,
            timestamp: result.timestamp,
          }),
        });
      } catch {
        // Swallow — don't block user if CRM is down
      } finally {
        setEmailLoading(false);
        setState("results");
      }
    },
    [result]
  );

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start z-10 px-4 py-16">
      {/* ── Nexus Nav Bar ── */}
      <div className="w-full max-w-3xl mx-auto flex items-center justify-between mb-16">
        <div className="flex items-center gap-2">
          {/* Hexagon logo mark */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z"
              stroke="#e8341a"
              strokeWidth="1.5"
              fill="rgba(232,52,26,0.08)"
            />
            <path
              d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z"
              fill="#e8341a"
              opacity="0.6"
            />
          </svg>
          <span
            className="font-display text-xl italic tracking-wide"
            style={{ color: "#c8d8f0" }}
          >
            Nexus
          </span>
        </div>
        <div className="text-[#2a3f58] text-xs font-mono hidden sm:block">
          Web Performance Agency
        </div>
      </div>
      {/* ── Hero / Input ── */}
      <AnimatePresence mode="wait">
        {(state === "idle" || state === "error") && (
          <motion.section
            key="hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl flex flex-col items-center text-center gap-6"
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-full"
              style={{ border: "1px solid #e8341a30", color: "#e8341a", backgroundColor: "#e8341a10" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#e8341a] animate-pulse" />
              Free Revenue Diagnostic
            </div>

            {/* Headline */}
            <h1 className="font-display text-5xl md:text-6xl leading-tight" style={{ color: "#c8d8f0" }}>
              Is your website
              <br />
              <em className="italic" style={{ color: "#e8341a", textShadow: "0 0 30px rgba(232,52,26,0.4)" }}>
                costing you money?
              </em>
            </h1>

            <p className="text-[#4a6080] font-mono text-sm leading-relaxed max-w-md">
              Paste your URL below. In 60 seconds, we&apos;ll calculate exactly how much
              revenue your slow website is bleeding — and what it&apos;s costing you in lost ad dollars.
            </p>

            {/* Input */}
            <div className="w-full flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAudit()}
                placeholder="https://yourwebsite.com"
                className="flex-1 bg-[#080f1c] border border-[#0e1e35] rounded-lg px-4 py-4 text-[#c8d8f0] font-mono text-sm placeholder:text-[#2a3f58] focus:border-[#e8341a60] transition-colors"
              />
              <button
                onClick={handleAudit}
                className="rounded-lg px-6 py-4 font-mono text-sm font-medium uppercase tracking-wider whitespace-nowrap transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: "#e8341a",
                  color: "#fff",
                  boxShadow: "0 0 25px rgba(232,52,26,0.35)",
                }}
              >
                Run Audit →
              </button>
            </div>

            {/* Error */}
            {state === "error" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full rounded border border-[#e8341a30] bg-[#e8341a08] px-4 py-3 text-left"
              >
                <span className="text-[#e8341a] text-xs font-mono">⚠ {error}</span>
              </motion.div>
            )}

            {/* Disclaimer */}
            <p className="text-[#2a3f58] text-xs font-mono">
              Uses Google PageSpeed Insights API. No sign-up required.
            </p>

            {/* Social proof row */}
            <div className="flex items-center gap-6 mt-2">
              {[
                { value: "4.2s", label: "Avg LCP we fix" },
                { value: "61%", label: "Avg ad loss we recover" },
                { value: "30d", label: "Average turnaround" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-[#c8d8f0] font-display text-xl italic">{stat.value}</div>
                  <div className="text-[#2a3f58] text-xs font-mono">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Loading ── */}
        {state === "loading" && (
          <motion.section
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center gap-6"
          >
            <div className="text-center">
              <div className="text-[#3a5070] text-xs font-mono uppercase tracking-widest mb-2">
                Diagnostic in progress
              </div>
              <h2 className="font-display text-3xl italic text-[#c8d8f0]">
                Scanning <span style={{ color: "#e8341a" }}>{url}</span>
              </h2>
            </div>
            <TerminalLoader url={url} />
          </motion.section>
        )}

        {/* ── Email Gate + Blurred Results ── */}
        {state === "email-gate" && result && (
          <motion.section
            key="email-gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full max-w-3xl mx-auto"
          >
            {/* Blurred results underneath */}
            <div className="blur-veil">
              <ResultsPanel result={result} />
            </div>

            {/* Email gate overlay */}
            <EmailGate onSubmit={handleEmailSubmit} loading={emailLoading} />
          </motion.section>
        )}

        {/* ── Full Results ── */}
        {state === "results" && result && (
          <motion.section
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-3xl mx-auto"
          >
            <ResultsPanel result={result} />
          </motion.section>
        )}
      </AnimatePresence>
      {/* ── Footer ── */}
      <footer className="w-full max-w-3xl mx-auto mt-20 pt-8 border-t border-[#0e1e35] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.08)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.6" />
          </svg>
          <span className="font-display italic text-[#3a5070] text-sm">Nexus</span>
        </div>
        <p className="text-[#2a3f58] text-xs font-mono text-center">
          © {new Date().getFullYear()} Nexus · Web Performance Agency · Powered by Google PageSpeed Insights
        </p>
      </footer>
    </main>
  );
}
