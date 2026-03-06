"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAudit, fmtMs, scoreColor, metricStatus } from "../lib/audit";
import type { AuditResult } from "../lib/audit";

// ─── Types ────────────────────────────────────────────────────────────────────

type FunnelStep = 1 | 2 | 3 | 4 | 5 | "loading" | "email-gate" | "results";

interface FunnelData {
  painPoint?: string;
  revenuePotential?: string;
  lastAudit?: string;
  url?: string;
  email?: string;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const totalSteps = 4;
  const progress = Math.min((step / totalSteps) * 100, 100);

  return (
    <div className="w-full max-w-lg mx-auto mb-10">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[#3a5070] text-xs font-mono uppercase tracking-widest">
          Step {Math.min(step, totalSteps)} of {totalSteps}
        </span>
        <span className="text-[#3a5070] text-xs font-mono">{Math.round(progress)}%</span>
      </div>
      <div className="h-0.5 w-full bg-[#0e1e35] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: "#e8341a", boxShadow: "0 0 8px rgba(232,52,26,0.6)" }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Choice Card ──────────────────────────────────────────────────────────────

function ChoiceCard({
  label,
  sublabel,
  icon,
  selected,
  onClick,
}: {
  label: string;
  sublabel?: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left rounded-lg border p-4 transition-all duration-200"
      style={{
        borderColor: selected ? "#e8341a" : "#0e1e35",
        backgroundColor: selected ? "#e8341a12" : "#080f1c",
        boxShadow: selected ? "0 0 20px rgba(232,52,26,0.15)" : "none",
      }}
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl">{icon}</span>
        <div>
          <div
            className="font-mono text-sm font-medium"
            style={{ color: selected ? "#e8341a" : "#c8d8f0" }}
          >
            {label}
          </div>
          {sublabel && (
            <div className="text-[#4a6080] text-xs font-mono mt-0.5">{sublabel}</div>
          )}
        </div>
        <div className="ml-auto">
          <div
            className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: selected ? "#e8341a" : "#1e3050" }}
          >
            {selected && (
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#e8341a" }} />
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Step 1: Pain Point ───────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: (value: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const choices = [
    { value: "competitors", label: "Losing customers to competitors", sublabel: "They have faster, better-looking sites", icon: "⚔️" },
    { value: "conversions", label: "Traffic but no conversions", sublabel: "Visitors leave without taking action", icon: "📉" },
    { value: "speed", label: "Site feels slow or broken on mobile", sublabel: "Especially on 4G / older phones", icon: "🐌" },
    { value: "all", label: "Honestly, all of the above", sublabel: "It's a mess and I know it", icon: "🔥" },
  ];

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="w-full max-w-lg mx-auto space-y-5"
    >
      <div className="space-y-2 mb-8">
        <div className="text-[#e8341a] text-xs font-mono uppercase tracking-widest">
          Quick question
        </div>
        <h2 className="font-display text-3xl italic text-[#c8d8f0] leading-snug">
          What's your biggest website headache right now?
        </h2>
        <p className="text-[#4a6080] text-sm font-mono">
          Be honest — this shapes how we interpret your results.
        </p>
      </div>

      <div className="space-y-3">
        {choices.map((c) => (
          <ChoiceCard
            key={c.value}
            label={c.label}
            sublabel={c.sublabel}
            icon={c.icon}
            selected={selected === c.value}
            onClick={() => setSelected(c.value)}
          />
        ))}
      </div>

      <button
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        className="w-full mt-4 rounded-lg py-4 font-mono text-sm font-medium uppercase tracking-wider transition-all duration-200 disabled:opacity-30"
        style={{
          backgroundColor: "#e8341a",
          color: "#fff",
          boxShadow: selected ? "0 0 25px rgba(232,52,26,0.4)" : "none",
        }}
      >
        Continue →
      </button>
    </motion.div>
  );
}

// ─── Step 2: Revenue Stakes ───────────────────────────────────────────────────

function Step2({ onNext }: { onNext: (value: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const choices = [
    { value: "sub10k", label: "Under £10,000", sublabel: "I'm in the early growth stage", icon: "🌱" },
    { value: "10k-50k", label: "£10,000 – £50,000", sublabel: "Meaningful revenue, growing fast", icon: "📈" },
    { value: "50k-100k", label: "£50,000 – £100,000", sublabel: "This is our main revenue channel", icon: "💼" },
    { value: "100k+", label: "£100,000+", sublabel: "Every percentage point matters", icon: "🏆" },
  ];

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="w-full max-w-lg mx-auto space-y-5"
    >
      <div className="space-y-2 mb-8">
        <div className="text-[#e8341a] text-xs font-mono uppercase tracking-widest">
          Let's size the opportunity
        </div>
        <h2 className="font-display text-3xl italic text-[#c8d8f0] leading-snug">
          How much annual revenue flows through your website?
        </h2>
        <p className="text-[#4a6080] text-sm font-mono">
          We use this to calculate your real revenue at risk — not just a vanity score.
        </p>
      </div>

      <div className="space-y-3">
        {choices.map((c) => (
          <ChoiceCard
            key={c.value}
            label={c.label}
            sublabel={c.sublabel}
            icon={c.icon}
            selected={selected === c.value}
            onClick={() => setSelected(c.value)}
          />
        ))}
      </div>

      <button
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        className="w-full mt-4 rounded-lg py-4 font-mono text-sm font-medium uppercase tracking-wider transition-all duration-200 disabled:opacity-30"
        style={{
          backgroundColor: "#e8341a",
          color: "#fff",
          boxShadow: selected ? "0 0 25px rgba(232,52,26,0.4)" : "none",
        }}
      >
        Continue →
      </button>
    </motion.div>
  );
}

// ─── Step 3: Last Audit ───────────────────────────────────────────────────────

function Step3({ onNext }: { onNext: (value: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const choices = [
    { value: "never", label: "Never", sublabel: "I've been flying blind", icon: "🙈" },
    { value: "year+", label: "Over a year ago", sublabel: "Things have changed since then", icon: "📅" },
    { value: "6months", label: "6 months ago", sublabel: "But nothing was fixed", icon: "🔧" },
    { value: "recent", label: "Recently", sublabel: "I just want a second opinion", icon: "✅" },
  ];

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="w-full max-w-lg mx-auto space-y-5"
    >
      <div className="space-y-2 mb-8">
        <div className="text-[#e8341a] text-xs font-mono uppercase tracking-widest">
          One more thing
        </div>
        <h2 className="font-display text-3xl italic text-[#c8d8f0] leading-snug">
          When did you last run a proper performance audit?
        </h2>
        <p className="text-[#4a6080] text-sm font-mono">
          Most sites degrade every 90 days as new code and plugins pile up.
        </p>
      </div>

      <div className="space-y-3">
        {choices.map((c) => (
          <ChoiceCard
            key={c.value}
            label={c.label}
            sublabel={c.sublabel}
            icon={c.icon}
            selected={selected === c.value}
            onClick={() => setSelected(c.value)}
          />
        ))}
      </div>

      <button
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        className="w-full mt-4 rounded-lg py-4 font-mono text-sm font-medium uppercase tracking-wider transition-all duration-200 disabled:opacity-30"
        style={{
          backgroundColor: "#e8341a",
          color: "#fff",
          boxShadow: selected ? "0 0 25px rgba(232,52,26,0.4)" : "none",
        }}
      >
        Run My Free Audit →
      </button>
    </motion.div>
  );
}

// ─── Step 4: URL Input ────────────────────────────────────────────────────────

function Step4({
  funnelData,
  onAudit,
}: {
  funnelData: FunnelData;
  onAudit: (url: string) => void;
}) {
  const [url, setUrl] = useState("");

  const painMessages: Record<string, string> = {
    competitors: "We'll show you exactly where they're beating you.",
    conversions: "We'll pinpoint every bottleneck costing you conversions.",
    speed: "We'll measure every millisecond of friction.",
    all: "We'll give you the full picture — nothing held back.",
  };

  const message = funnelData.painPoint
    ? painMessages[funnelData.painPoint] ?? "Let's see what's really going on."
    : "Let's see what's really going on.";

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="w-full max-w-lg mx-auto space-y-6"
    >
      <div className="space-y-2 mb-8">
        <div className="text-[#e8341a] text-xs font-mono uppercase tracking-widest">
          Almost there
        </div>
        <h2 className="font-display text-3xl italic text-[#c8d8f0] leading-snug">
          Drop your URL. <br />
          <span style={{ color: "#e8341a" }}>See the truth in 60 seconds.</span>
        </h2>
        <p className="text-[#4a6080] text-sm font-mono">{message}</p>
      </div>

      {/* Trust signals */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: "60s", label: "To complete" },
          { value: "Free", label: "No credit card" },
          { value: "Real", label: "Google data" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded border border-[#0e1e35] bg-[#080f1c] p-3 text-center"
          >
            <div className="font-display text-lg italic text-[#e8341a]">{s.value}</div>
            <div className="text-[#3a5070] text-xs font-mono">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && url.trim() && onAudit(url)}
          placeholder="https://yourwebsite.com"
          autoFocus
          className="w-full bg-[#04090f] border border-[#0e1e35] rounded-lg px-4 py-4 text-[#c8d8f0] font-mono text-sm placeholder:text-[#2a3f58] focus:border-[#e8341a60] transition-colors"
        />

        <button
          onClick={() => url.trim() && onAudit(url)}
          disabled={!url.trim()}
          className="w-full rounded-lg py-4 font-mono text-sm font-medium uppercase tracking-wider transition-all duration-200 disabled:opacity-30 hover:scale-[1.02]"
          style={{
            backgroundColor: "#e8341a",
            color: "#fff",
            boxShadow: url.trim() ? "0 0 30px rgba(232,52,26,0.5)" : "none",
          }}
        >
          Scan My Site Now →
        </button>
      </div>

      <p className="text-[#2a3f58] text-xs font-mono text-center">
        Powered by Google PageSpeed Insights · No account needed
      </p>
    </motion.div>
  );
}

// ─── Terminal Loader ──────────────────────────────────────────────────────────

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
    return () => { clearInterval(interval); clearInterval(cursorInterval); };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-[#3a5070] text-xs font-mono uppercase tracking-widest mb-2">Diagnostic in progress</div>
        <h2 className="font-display text-2xl italic text-[#c8d8f0]">
          Scanning <span style={{ color: "#e8341a" }}>{url}</span>
        </h2>
      </div>
      <div className="rounded border border-[#0e1e35] bg-[#04090f] p-5 font-mono text-sm" style={{ minHeight: 240 }}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#0e1e35]">
          <span className="w-3 h-3 rounded-full bg-[#e8341a] opacity-80" />
          <span className="w-3 h-3 rounded-full bg-[#f59e0b] opacity-80" />
          <span className="w-3 h-3 rounded-full bg-[#10b981] opacity-80" />
          <span className="ml-2 text-[#3a5070] text-xs">audit-engine v2.0 — {url}</span>
        </div>
        <div className="space-y-1">
          {visibleLines.map((line, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}
              className={idx === visibleLines.length - 1 ? "text-[#c8d8f0]" : "text-[#3a5070]"}>
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

// ─── Email Gate ───────────────────────────────────────────────────────────────

function EmailGate({ funnelData, onSubmit, loading }: {
  funnelData: FunnelData;
  onSubmit: (email: string) => Promise<void>;
  loading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const revenueMessages: Record<string, string> = {
    "sub10k": "even small leaks hurt at your stage.",
    "10k-50k": "at your revenue level, this adds up fast.",
    "50k-100k": "with your revenue on the line, every second counts.",
    "100k+": "at your scale, this could be costing you thousands monthly.",
  };

  const revenueMsg = funnelData.revenuePotential
    ? revenueMessages[funnelData.revenuePotential] ?? "this is costing you real money."
    : "this is costing you real money.";

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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 z-20 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(3,7,15,0.88)" }}
    >
      <div className="w-full max-w-md rounded-lg border border-[#e8341a40] bg-[#080f1c] p-8"
        style={{ boxShadow: "0 0 60px rgba(232,52,26,0.18)" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#e8341a18", border: "1px solid #e8341a40" }}>
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <path d="M10 2L18.66 17H1.34L10 2Z" stroke="#e8341a" strokeWidth={1.5} fill="none" />
              <line x1={10} y1={8} x2={10} y2={12} stroke="#e8341a" strokeWidth={1.5} />
              <circle cx={10} cy={14.5} r={0.75} fill="#e8341a" />
            </svg>
          </div>
          <div>
            <div className="text-[#e8341a] text-xs font-mono font-medium tracking-widest uppercase">
              Your Report Is Ready
            </div>
            <div className="text-[#c8d8f0] text-lg font-display italic">
              One step to reveal everything
            </div>
          </div>
        </div>

        <p className="text-[#4a6080] text-sm font-mono mb-6 leading-relaxed">
          Your Nexus diagnostic is complete. Based on what you told us, {revenueMsg} Enter your
          business email to unlock the full breakdown — including your estimated annual revenue leak.
        </p>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="you@company.com"
            autoFocus
            className="w-full bg-[#04090f] border border-[#0e1e35] rounded px-4 py-3 text-[#c8d8f0] font-mono text-sm placeholder:text-[#2a3f58] focus:border-[#e8341a60] transition-colors"
          />
          {error && <p className="text-[#e8341a] text-xs font-mono">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded py-3 font-mono text-sm font-medium tracking-wider uppercase transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: "#e8341a", color: "#fff", boxShadow: "0 0 20px rgba(232,52,26,0.4)" }}
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

// ─── Results Panel ────────────────────────────────────────────────────────────

function CircularGauge({ score, animated }: { score: number; animated: boolean }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const color = scoreColor(score);
  const progress = animated ? (score / 100) * circumference : circumference;
  const offset = circumference - progress;
  const [display, setDisplay] = useState(animated ? 0 : score);

  useEffect(() => {
    if (!animated) { setDisplay(score); return; }
    let start = 0;
    const duration = 1800;
    const startTime = performance.now();
    function step(now: number) {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      start = Math.round(eased * score);
      setDisplay(start);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [score, animated]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      <svg width={200} height={200} className="-rotate-90" viewBox="0 0 200 200">
        <circle cx={100} cy={100} r={radius} fill="none" stroke="#0e1e35" strokeWidth={10} />
        <circle cx={100} cy={100} r={radius} fill="none" stroke={color} strokeWidth={10}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-display font-bold tabular-nums"
          style={{ color, textShadow: `0 0 20px ${color}` }}>{display}</span>
        <span className="text-[#3a5070] text-xs font-mono mt-1">SCORE</span>
      </div>
    </div>
  );
}

function MetricRow({ label, value, formatted, thresholds }: {
  label: string; value: number; formatted: string; thresholds: [number, number];
}) {
  const status = metricStatus(value, thresholds);
  const statusColors = { ok: "#10b981", warn: "#f59e0b", bad: "#e8341a" };
  const statusLabels = { ok: "GOOD", warn: "NEEDS WORK", bad: "FAILING" };
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#0e1e35] last:border-0">
      <span className="text-[#4a6080] text-sm font-mono">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono font-medium text-[#c8d8f0]">{formatted}</span>
        <span className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ color: statusColors[status], backgroundColor: `${statusColors[status]}18`, border: `1px solid ${statusColors[status]}30` }}>
          {statusLabels[status]}
        </span>
      </div>
    </div>
  );
}

function ResultsPanel({ result }: { result: AuditResult }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);
  const { metrics, adLossPercent, bounceRateIncrease, annualRevenueLoss, severity } = result;
  const sev = { critical: { label: "CRITICAL", color: "#e8341a", bg: "#e8341a10" }, warning: { label: "WARNING", color: "#f59e0b", bg: "#f59e0b10" }, ok: { label: "HEALTHY", color: "#10b981", bg: "#10b98110" } }[severity];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-block text-xs font-mono font-medium tracking-widest uppercase px-2 py-1 rounded mb-2"
            style={{ color: sev.color, backgroundColor: sev.bg, border: `1px solid ${sev.color}30` }}>
            Status: {sev.label}
          </div>
          <h2 className="text-[#c8d8f0] font-display text-2xl italic">{result.url}</h2>
        </div>
        <div className="text-right text-xs font-mono text-[#3a5070]">
          Mobile Audit<br />{new Date(result.timestamp).toLocaleTimeString()}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-[#0e1e35] bg-[#080f1c] p-6 flex flex-col items-center gap-2">
          <CircularGauge score={metrics.performanceScore} animated={animated} />
          <span className="text-[#3a5070] text-xs font-mono">Performance Score</span>
        </div>
        <div className="md:col-span-2 rounded-lg border p-6 flex flex-col justify-between"
          style={{ borderColor: "#e8341a30", backgroundColor: "#e8341a08" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#e8341a" }} />
            <span className="text-[#e8341a] text-xs font-mono font-medium tracking-widest uppercase">Critical Revenue Bleed Detected</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-display font-bold" style={{ color: "#e8341a", textShadow: "0 0 15px rgba(232,52,26,0.5)" }}>{adLossPercent}%</div>
              <div className="text-[#4a6080] text-xs font-mono mt-1">Est. Ad Revenue Lost</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold" style={{ color: "#f59e0b" }}>+{bounceRateIncrease}%</div>
              <div className="text-[#4a6080] text-xs font-mono mt-1">Bounce Rate Increase</div>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-[#c8d8f0]">${(annualRevenueLoss / 1000).toFixed(0)}k+</div>
              <div className="text-[#4a6080] text-xs font-mono mt-1">Est. Annual Leakage</div>
            </div>
          </div>
          <p className="text-[#3a5070] text-xs font-mono mt-4 pt-4 border-t border-[#e8341a20]">
            Based on Google&apos;s research: every 100ms increase in load time reduces conversions by ~1%.
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-[#0e1e35] bg-[#080f1c] p-6">
        <h3 className="text-[#3a5070] text-xs font-mono font-medium tracking-widest uppercase mb-4">Core Web Vitals</h3>
        <MetricRow label="Largest Contentful Paint (LCP)" value={metrics.lcp} formatted={fmtMs(metrics.lcp)} thresholds={[2500, 4000]} />
        <MetricRow label="First Contentful Paint (FCP)" value={metrics.fcp} formatted={fmtMs(metrics.fcp)} thresholds={[1800, 3000]} />
        <MetricRow label="Total Blocking Time (TBT)" value={metrics.tbt} formatted={fmtMs(metrics.tbt)} thresholds={[200, 600]} />
        <MetricRow label="Cumulative Layout Shift (CLS)" value={metrics.cls} formatted={metrics.cls.toFixed(3)} thresholds={[0.1, 0.25]} />
        <MetricRow label="Speed Index" value={metrics.speedIndex} formatted={fmtMs(metrics.speedIndex)} thresholds={[3400, 5800]} />
      </div>
      <div className="rounded-lg border p-8 text-center" style={{ borderColor: "#e8341a30", backgroundColor: "#e8341a05" }}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.08)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.6" />
          </svg>
          <span className="font-display text-lg italic text-[#c8d8f0]">Nexus</span>
        </div>
        <div className="text-[#4a6080] text-xs font-mono uppercase tracking-widest mb-2">Ready to stop the bleed?</div>
        <h3 className="text-[#c8d8f0] font-display text-3xl italic mb-3">
          Nexus fixes this in 30 days.{" "}<span style={{ color: "#e8341a" }}>Guaranteed.</span>
        </h3>
        <p className="text-[#4a6080] text-sm font-mono mb-6 max-w-lg mx-auto">
          Book a free 15-minute call and we&apos;ll show you exactly what we&apos;d fix first — and what it&apos;s worth.
        </p>
        <a href="#" className="inline-block rounded px-8 py-4 font-mono text-sm font-medium tracking-wider uppercase transition-all duration-200 hover:scale-105"
          style={{ backgroundColor: "#e8341a", color: "#fff", boxShadow: "0 0 30px rgba(232,52,26,0.4)" }}>
          Book a Free Call with Nexus →
        </a>
        <div className="text-[#2a3f58] text-xs font-mono mt-4">No sales pitch. No obligation. Just a real answer.</div>
      </div>
      <div className="text-center pb-8">
        <button onClick={() => window.location.reload()}
          className="text-[#3a5070] text-xs font-mono hover:text-[#c8d8f0] transition-colors underline underline-offset-4">
          ↩ Audit another website
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Funnel Page ─────────────────────────────────────────────────────────

export default function FunnelPage() {
  const [step, setStep] = useState<FunnelStep>(1);
  const [funnelData, setFunnelData] = useState<FunnelData>({});
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const currentStepNum = typeof step === "number" ? step : step === "loading" ? 4.5 : 5;

  const handleAudit = useCallback(async (url: string) => {
    setFunnelData((prev) => ({ ...prev, url }));
    setStep("loading");
    try {
      const auditResult = await fetchAudit(url);
      setResult(auditResult);
      setStep("email-gate");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the PageSpeed API.");
      setStep(4);
    }
  }, []);

  const handleEmailSubmit = useCallback(async (email: string) => {
    if (!result) return;
    setEmailLoading(true);
    setFunnelData((prev) => ({ ...prev, email }));
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
          // Funnel context
          painPoint: funnelData.painPoint,
          revenuePotential: funnelData.revenuePotential,
          lastAudit: funnelData.lastAudit,
          source: "funnel",
        }),
      });
    } catch {
      // Swallow — don't block user
    } finally {
      setEmailLoading(false);
      setStep("results");
    }
  }, [result, funnelData]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start z-10 px-4 py-16">
      {/* Nav */}
      <div className="w-full max-w-3xl mx-auto flex items-center justify-between mb-12">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.08)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.6" />
          </svg>
          <span className="font-display text-xl italic tracking-wide" style={{ color: "#c8d8f0" }}>Nexus</span>
        </div>
        <div className="text-[#2a3f58] text-xs font-mono hidden sm:block">Free Revenue Diagnostic</div>
      </div>

      {/* Progress */}
      {typeof step === "number" && step <= 4 && <ProgressBar step={step} />}

      {/* Steps */}
      <div className="w-full flex flex-col items-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Step1 key="s1" onNext={(v) => { setFunnelData((p) => ({ ...p, painPoint: v })); setStep(2); }} />
          )}
          {step === 2 && (
            <Step2 key="s2" onNext={(v) => { setFunnelData((p) => ({ ...p, revenuePotential: v })); setStep(3); }} />
          )}
          {step === 3 && (
            <Step3 key="s3" onNext={(v) => { setFunnelData((p) => ({ ...p, lastAudit: v })); setStep(4); }} />
          )}
          {step === 4 && (
            <Step4 key="s4" funnelData={funnelData} onAudit={handleAudit} />
          )}
          {step === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center gap-6">
              <TerminalLoader url={funnelData.url ?? ""} />
            </motion.div>
          )}
          {step === "email-gate" && result && (
            <motion.section key="email-gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="relative w-full max-w-3xl mx-auto">
              <div className="blur-veil"><ResultsPanel result={result} /></div>
              <EmailGate funnelData={funnelData} onSubmit={handleEmailSubmit} loading={emailLoading} />
            </motion.section>
          )}
          {step === "results" && result && (
            <motion.section key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full max-w-3xl mx-auto">
              <ResultsPanel result={result} />
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      {error && step === 4 && (
        <div className="w-full max-w-lg mx-auto mt-4 rounded border border-[#e8341a30] bg-[#e8341a08] px-4 py-3">
          <span className="text-[#e8341a] text-xs font-mono">⚠ {error}</span>
        </div>
      )}

      {/* Footer */}
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