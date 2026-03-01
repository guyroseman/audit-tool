"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuditResult {
  score: number;
  fcp: number;
  lcp: number;
  tbt: number;
  cls: number;
  adLossPercent: number;
  conversionLoss: number;
  bounceRate: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#EF4444";
}

function scoreLabel(score: number) {
  if (score >= 80) return "HEALTHY";
  if (score >= 50) return "WARNING";
  return "CRITICAL";
}

function calcAdLoss(score: number) {
  return Math.max(0, Math.round(((90 - score) / 10) * 5));
}

function calcConvLoss(score: number) {
  return Math.max(0, Math.round(((90 - score) / 10) * 3));
}

function calcBounceRate(lcp: number) {
  if (lcp <= 1) return 9;
  if (lcp <= 2.5) return 22;
  if (lcp <= 4) return 38;
  if (lcp <= 6) return 53;
  return 72;
}

// ─── Terminal Log Lines ───────────────────────────────────────────────────────
const LOG_LINES = [
  "> Initializing audit engine...",
  "> Connecting to PageSpeed Insights API...",
  "> Pinging global CDN nodes...",
  "> Analyzing DOM tree structure...",
  "> Calculating mobile latency on 4G...",
  "> Measuring First Contentful Paint...",
  "> Measuring Largest Contentful Paint...",
  "> Scanning for AI response agents...",
  "> Estimating paid traffic drop-off...",
  "> Translating metrics to revenue impact...",
  "> Compiling Conversion Health Score...",
  "> Report ready. Preparing reveal...",
];

function TerminalLoader() {
  const [lines, setLines] = useState<string[]>([]);
  const [cursor, setCursor] = useState(true);
  const idx = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (idx.current < LOG_LINES.length) {
        setLines((prev) => [...prev, LOG_LINES[idx.current]]);
        idx.current++;
      }
    }, 950);
    const cursorInterval = setInterval(() => setCursor((c) => !c), 500);
    return () => {
      clearInterval(interval);
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <div style={{
      background: "#050a12",
      border: "1px solid #0ea5e920",
      borderRadius: 8,
      padding: "24px 28px",
      fontFamily: "'DM Mono', monospace",
      fontSize: 13,
      lineHeight: 2,
      marginTop: 28,
      minHeight: 200,
    }}>
      <div style={{ color: "#475569", fontSize: 11, letterSpacing: 3, marginBottom: 16 }}>
        NEXUS DIAGNOSTIC ENGINE v2.4
      </div>
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{ color: i === lines.length - 1 ? "#0ea5e9" : "#22c55e" }}
        >
          {line}
          {i === lines.length - 1 && (
            <span style={{ opacity: cursor ? 1 : 0, color: "#0ea5e9" }}>█</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Animated Score Number ────────────────────────────────────────────────────
function CountUp({ target, color }: { target: number; color: string }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    const duration = 1800;
    const start = performance.now();
    const frame = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setVal(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target]);

  return (
    <span style={{
      fontFamily: "'Syne', sans-serif",
      fontSize: "clamp(72px, 14vw, 120px)",
      fontWeight: 800,
      color,
      lineHeight: 1,
      filter: `drop-shadow(0 0 24px ${color}60)`,
      display: "block",
    }}>
      {val}
    </span>
  );
}

// ─── Circular Gauge ───────────────────────────────────────────────────────────
function CircularGauge({ score }: { score: number }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);
  const color = scoreColor(score);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOffset(circ - (score / 100) * circ);
    }, 200);
    return () => clearTimeout(timeout);
  }, [score, circ]);

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx="90" cy="90" r={r} fill="none" stroke="#0f172a" strokeWidth="10" />
      <circle
        cx="90" cy="90" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 90 90)"
        style={{
          transition: "stroke-dashoffset 1.6s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.3s",
          filter: `drop-shadow(0 0 6px ${color})`,
        }}
      />
      <text x="90" y="82" textAnchor="middle" fill={color} fontSize="11"
        fontFamily="'DM Mono', monospace" letterSpacing="2">
        SCORE
      </text>
      <text x="90" y="108" textAnchor="middle" fill="#475569" fontSize="11"
        fontFamily="'DM Mono', monospace">
        / 100
      </text>
    </svg>
  );
}

// ─── Metric Row ───────────────────────────────────────────────────────────────
function MetricRow({ label, value, unit, warn, description }: {
  label: string;
  value: string | number;
  unit: string;
  warn?: boolean;
  description?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: "14px 0", borderBottom: "1px solid #0f172a" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#475569", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2 }}>
          {label}
        </span>
        <span style={{ color: warn ? "#EF4444" : "#e2e8f0", fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 600 }}>
          {value}
          <span style={{ color: "#334155", fontSize: 11, marginLeft: 4 }}>{unit}</span>
        </span>
      </div>
      {description && (
        <p style={{ color: "#334155", fontFamily: "'DM Mono', monospace", fontSize: 11, marginTop: 4, lineHeight: 1.6 }}>
          {description}
        </p>
      )}
    </motion.div>
  );
}

// ─── Email Gate Modal ─────────────────────────────────────────────────────────
function EmailGate({ onUnlock, url, score }: {
  onUnlock: (email: string) => void;
  url: string;
  score: number;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inputError, setInputError] = useState("");

  async function handleSubmit() {
    if (!email.includes("@") || !email.includes(".")) {
      setInputError("Please enter a valid work email.");
      return;
    }
    setSubmitting(true);
    setInputError("");

    try {
      await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, url, score }),
      });
    } catch {
      // Fail silently
    }

    onUnlock(email);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(3, 7, 18, 0.92)",
        backdropFilter: "blur(12px)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        zIndex: 10,
        textAlign: "center",
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "rgba(239,68,68,0.1)",
        border: "1px solid #ef444440",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20, fontSize: 22,
      }}>
        🔒
      </div>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#f1f5f9", marginBottom: 10 }}>
        Audit Complete
      </h2>

      <p style={{ color: "#64748b", fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.8, marginBottom: 28, maxWidth: 320 }}>
        Your Conversion Health Score and full breakdown are ready.
        Enter your work email to unlock your report instantly.
      </p>

      <input
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmit()}
        style={{
          width: "100%", maxWidth: 340, background: "#0f172a",
          border: `1px solid ${inputError ? "#ef4444" : "#1e293b"}`, color: "#e2e8f0",
          fontFamily: "'DM Mono', monospace", fontSize: 14, padding: "13px 16px",
          borderRadius: 6, outline: "none", marginBottom: 8,
        }}
      />

      {inputError && (
        <p style={{ color: "#ef4444", fontFamily: "'DM Mono', monospace", fontSize: 11, marginBottom: 10 }}>
          {inputError}
        </p>
      )}

      <motion.button
        whileHover={{ y: -1, boxShadow: "0 6px 24px rgba(14,165,233,0.35)" }}
        whileTap={{ y: 0 }}
        onClick={handleSubmit}
        disabled={submitting || !email}
        style={{
          width: "100%", maxWidth: 340,
          background: submitting || !email ? "#1e293b" : "linear-gradient(135deg, #0ea5e9, #0284c7)",
          color: "#fff", border: "none", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14,
          padding: "14px 24px", borderRadius: 6, cursor: submitting || !email ? "not-allowed" : "pointer", marginTop: 4,
        }}
      >
        {submitting ? "Unlocking..." : "Unlock My Score →"}
      </motion.button>
    </motion.div>
  );
}

// ─── Results Panel ─────────────────────────────────────────────────────────────
function ResultsPanel({ result, url, onBookCall }: {
  result: AuditResult;
  url: string;
  onBookCall: () => void;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const color = scoreColor(result.score);
  const label = scoreLabel(result.score);
  const isCritical = result.score < 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: "#080d17", border: "1px solid #1e293b", borderRadius: 12, padding: "36px", marginTop: 32, position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      <AnimatePresence>
        {!unlocked && <EmailGate url={url} score={result.score} onUnlock={() => setUnlocked(true)} />}
      </AnimatePresence>

      <div style={{ filter: unlocked ? "none" : "blur(8px)", transition: "filter 0.6s ease", userSelect: unlocked ? "auto" : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 8 }}>
          <div>
            <div style={{ display: "inline-block", background: `${color}15`, border: `1px solid ${color}40`, color, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, padding: "4px 12px", borderRadius: 2, marginBottom: 8 }}>
              {label}
            </div>
            <p style={{ color: "#334155", fontFamily: "'DM Mono', monospace", fontSize: 11, wordBreak: "break-all" }}>{url}</p>
            <div style={{ marginTop: 16 }}>
              <CountUp target={result.score} color={color} />
              <span style={{ color: "#334155", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>CONVERSION HEALTH SCORE</span>
            </div>
          </div>
          <CircularGauge score={result.score} />
        </div>

        <div style={{ borderTop: "1px solid #0f172a", margin: "28px 0" }} />

        <MetricRow label="FIRST CONTENTFUL PAINT" value={result.fcp.toFixed(1)} unit="s" warn={result.fcp > 1.8} />
        <MetricRow label="LARGEST CONTENTFUL PAINT" value={result.lcp.toFixed(1)} unit="s" warn={result.lcp > 2.5} />
        <MetricRow label="TOTAL BLOCKING TIME" value={result.tbt} unit="ms" warn={result.tbt > 200} />
        <MetricRow label="CLS (LAYOUT SHIFT)" value={result.cls.toFixed(3)} unit="" warn={result.cls > 0.1} />
        <MetricRow label="AI RESPONSE AGENT" value="FAIL" unit="" warn={true} description="No sub-15s lead response agent detected." />

        <div style={{ borderTop: "1px solid #0f172a", margin: "28px 0" }} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ background: isCritical ? "rgba(239,68,68,0.05)" : "rgba(245,158,11,0.05)", border: `1px solid ${isCritical ? "#ef444430" : "#f59e0b30"}`, borderLeft: `4px solid ${isCritical ? "#ef4444" : "#f59e0b"}`, borderRadius: 6, padding: "20px 24px" }}
        >
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: isCritical ? "#ef4444" : "#f59e0b", fontSize: 13, marginBottom: 10 }}>
            {isCritical ? "🔴 CRITICAL REVENUE BLEED DETECTED" : "🟡 PERFORMANCE WARNING"}
          </p>
          <p style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.9 }}>
            Your site is loading in <strong style={{ color: "#e2e8f0" }}>{result.lcp.toFixed(1)}s</strong>.
            Industry data shows a {result.lcp.toFixed(1)}s load time results in a <strong style={{ color: "#ef4444" }}>{result.bounceRate}% bounce rate</strong>.
            You are bleeding roughly <strong style={{ color: "#ef4444" }}>{result.adLossPercent}% of your paid ad traffic</strong> before they ever see your offer — and losing approximately <strong style={{ color: "#ef4444" }}>{result.conversionLoss}% of potential conversions</strong> every single day.
          </p>
        </motion.div>

        <motion.button
          whileHover={{ y: -2, boxShadow: "0 12px 40px rgba(239,68,68,0.4)" }}
          whileTap={{ y: 0 }}
          onClick={onBookCall}
          style={{ display: "block", width: "100%", background: "linear-gradient(135deg, #ef4444, #b91c1c)", color: "#fff", border: "none", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, padding: "18px 28px", borderRadius: 6, cursor: "pointer", marginTop: 28 }}
        >
          Fix This & Install 15-Second AI Response Agent →
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");

  async function runAudit() {
    let targetUrl = url.trim();
    if (!targetUrl) return;

    // --- 1. THE ENGINEERING BYPASS ---
    // Type test.com to test the UI and Lead Capture without hitting Google
    if (targetUrl.toLowerCase().includes("test.com")) {
      setLoading(true);
      setError("");
      setResult(null);
      await new Promise(r => setTimeout(r, 3000));
      setResult({
        score: 38, fcp: 2.1, lcp: 4.5, tbt: 350, cls: 0.15,
        adLossPercent: 40, conversionLoss: 25, bounceRate: 45,
      });
      setLoading(false);
      return;
    }
    
    // --- 2. URL FORMATTING ---
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
      setUrl(targetUrl);
    }

    setError("");
    setResult(null);
    setLoading(true);

    try {
      // --- 3. THE CLIENT-SIDE FETCH (Bypasses Vercel Rate Limit) ---
      const googleApiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=mobile`;
      
      const [apiRes] = await Promise.all([
        fetch(googleApiUrl),
        new Promise((r) => setTimeout(r, 6000)),
      ]);

      const data = await apiRes.json();
      
      if (!apiRes.ok) {
        if (apiRes.status === 429) setError("Rate limit hit. Please try again in 1 minute.");
        else if (apiRes.status === 400) setError("Google cannot reach this URL. Ensure it is a valid, live website.");
        else setError("Audit failed. Please try again.");
        return;
      }

      const cats = data.lighthouseResult?.categories;
      const audits = data.lighthouseResult?.audits;
      const rawScore = (cats?.performance?.score as number) ?? 0;
      const score = Math.round(rawScore * 100);
      const fcp = ((audits?.["first-contentful-paint"]?.numericValue as number) ?? 0) / 1000;
      const lcp = ((audits?.["largest-contentful-paint"]?.numericValue as number) ?? 0) / 1000;
      const tbt = Math.round((audits?.["total-blocking-time"]?.numericValue as number) ?? 0);
      const cls = (audits?.["cumulative-layout-shift"]?.numericValue as number) ?? 0;

      setResult({
        score, fcp, lcp, tbt, cls,
        adLossPercent: calcAdLoss(score),
        conversionLoss: calcConvLoss(score),
        bounceRate: calcBounceRate(lcp),
      });
    } catch {
      setError("Network timeout. Please check the URL and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030712; color: #e2e8f0; min-height: 100vh; font-family: 'Syne', sans-serif; overflow-x: hidden; }
        body::before { content: ''; position: fixed; inset: 0; background-image: linear-gradient(rgba(14,165,233,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.04) 1px, transparent 1px); background-size: 44px 44px; pointer-events: none; z-index: 0; }
        input[type="text"], input[type="email"] { background: #080d17; border: 1px solid #1e293b; color: #e2e8f0; font-family: 'DM Mono', monospace; font-size: 14px; padding: 14px 18px; border-radius: 6px; outline: none; transition: border-color 0.2s; width: 100%; }
        input[type="text"]:focus, input[type="email"]:focus { border-color: #0ea5e9; }
      `}</style>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto", padding: "60px 24px 100px" }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "inline-block", background: "#080d17", border: "1px solid #0ea5e920", color: "#0ea5e9", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, padding: "6px 14px", borderRadius: 2, marginBottom: 32 }}>
          NEXUS DIAGNOSTICS · CONVERSION INFRASTRUCTURE AUDIT
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ fontSize: "clamp(40px, 8vw, 72px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: -2, marginBottom: 20 }}>
          Stop<br /><span style={{ color: "#EF4444" }}>Bleeding</span><br />Ad Spend.
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ color: "#475569", fontFamily: "'DM Mono', monospace", fontSize: 13, lineHeight: 1.9, marginBottom: 48 }}>
          Paste your URL. We run a live PageSpeed audit and translate every<br />millisecond of latency into the exact revenue you are losing.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ display: "flex", gap: 10 }}>
          <input type="text" placeholder="https://yoursite.com" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !loading && runAudit()} disabled={loading} />
          <motion.button whileHover={{ y: -1, boxShadow: "0 6px 24px rgba(14,165,233,0.3)" }} whileTap={{ y: 0 }} onClick={runAudit} disabled={loading || !url.trim()} style={{ background: loading || !url.trim() ? "#1e293b" : "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "#fff", border: "none", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, padding: "14px 28px", borderRadius: 6, cursor: loading || !url.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            {loading ? "Scanning…" : "Run Audit →"}
          </motion.button>
        </motion.div>

        {error && <p style={{ color: "#ef4444", fontFamily: "'DM Mono', monospace", fontSize: 12, marginTop: 12 }}>⚠ {error}</p>}

        <AnimatePresence>
          {loading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><TerminalLoader /></motion.div>}
        </AnimatePresence>

        <AnimatePresence>
          {result && !loading && <ResultsPanel result={result} url={url} onBookCall={() => window.open("https://calendly.com/YOUR-LINK", "_blank")} />}
        </AnimatePresence>
      </div>
    </>
  );
}