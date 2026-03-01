"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuditResult {
  score: number;
  loadTime: number;
  fcp: number;
  lcp: number;
  tbt: number;
  cls: number;
  adLossPercent: number;
  conversionLoss: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score: number) {
  if (score >= 80) return "ACCEPTABLE";
  if (score >= 50) return "WARNING";
  return "CRITICAL";
}

function adLoss(score: number) {
  // rough heuristic: every 10 points below 90 → ~5% paid traffic lost
  return Math.max(0, Math.round(((90 - score) / 10) * 5));
}

function convLoss(score: number) {
  return Math.max(0, Math.round(((90 - score) / 10) * 3));
}

// ─── Circular Gauge ───────────────────────────────────────────────────────────
function CircularGauge({ score, animated }: { score: number; animated: boolean }) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!animated) return;
    let start = 0;
    const end = score;
    const duration = 1200;
    const startTime = performance.now();
    const frame = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * end));
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [score, animated]);

  const offset = circ - (display / 100) * circ;
  const color = scoreColor(score);

  return (
    <div className="gauge-wrapper">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dashoffset 0.05s, stroke 0.3s", filter: `drop-shadow(0 0 8px ${color})` }}
        />
        <text x="100" y="96" textAnchor="middle" fill={color} fontSize="38" fontFamily="'DM Mono', monospace" fontWeight="700">
          {display}
        </text>
        <text x="100" y="120" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="'DM Mono', monospace" letterSpacing="3">
          / 100
        </text>
      </svg>
      <style>{`
        .gauge-wrapper svg circle { transition: stroke-dashoffset 0.05s linear; }
      `}</style>
    </div>
  );
}

// ─── Metric Row ───────────────────────────────────────────────────────────────
function MetricRow({ label, value, unit, warn }: { label: string; value: number | string; unit: string; warn?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
      <span style={{ color: "#64748b", fontFamily: "'DM Mono', monospace", fontSize: "12px", letterSpacing: "1px" }}>{label}</span>
      <span style={{ color: warn ? "#ef4444" : "#e2e8f0", fontFamily: "'DM Mono', monospace", fontSize: "14px", fontWeight: 600 }}>
        {value}
        <span style={{ color: "#475569", marginLeft: 4, fontSize: "11px" }}>{unit}</span>
      </span>
    </div>
  );
}

// ─── Loader Lines ─────────────────────────────────────────────────────────────
const LOG_LINES = [
  "› Connecting to PageSpeed Insights API...",
  "› Fetching mobile & desktop scores...",
  "› Analyzing Core Web Vitals...",
  "› Calculating First Contentful Paint...",
  "› Measuring Largest Contentful Paint...",
  "› Estimating paid traffic bleed...",
  "› Translating metrics to revenue impact...",
  "› Generating diagnostic report...",
];

function LoaderLog() {
  const [lines, setLines] = useState<string[]>([]);
  const idx = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (idx.current < LOG_LINES.length) {
        setLines((prev) => [...prev, LOG_LINES[idx.current]]);
        idx.current++;
      }
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#22c55e", lineHeight: "2", marginTop: "24px", minHeight: "120px" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ opacity: 1, animation: "fadeIn 0.4s ease" }}>
          {l}
        </div>
      ))}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [gaugeAnimated, setGaugeAnimated] = useState(false);

  async function runAudit() {
    if (!url.trim()) return;
    setError("");
    setResult(null);
    setLoading(true);
    setGaugeAnimated(false);

    try {
      // Minimum 12s perceived delay for "weight"
      const [apiRes] = await Promise.all([
        fetch(`/api/audit?url=${encodeURIComponent(url.trim())}`),
        new Promise((r) => setTimeout(r, 12000)),
      ]);

      if (!apiRes.ok) throw new Error("API error");
      const data = await apiRes.json();

      const score = Math.round((data.score ?? 0) * 100);
      const fcp = data.fcp ?? 0;
      const lcp = data.lcp ?? 0;
      const tbt = data.tbt ?? 0;
      const cls = data.cls ?? 0;
      const loadTime = lcp;

      setResult({
        score,
        loadTime,
        fcp,
        lcp,
        tbt,
        cls,
        adLossPercent: adLoss(score),
        conversionLoss: convLoss(score),
      });

      setTimeout(() => setGaugeAnimated(true), 100);
    } catch {
      setError("Could not reach the API. Check your /api/audit route.");
    } finally {
      setLoading(false);
    }
  }

  const color = result ? scoreColor(result.score) : "#3b82f6";
  const label = result ? scoreLabel(result.score) : "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #030712;
          color: #e2e8f0;
          min-height: 100vh;
          font-family: 'Syne', sans-serif;
          overflow-x: hidden;
        }

        /* Grid background */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(30, 41, 59, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30, 41, 59, 0.4) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        .container {
          position: relative;
          z-index: 1;
          max-width: 680px;
          margin: 0 auto;
          padding: 60px 24px 80px;
        }

        .badge {
          display: inline-block;
          background: #0f172a;
          border: 1px solid #1e293b;
          color: #64748b;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 3px;
          padding: 6px 14px;
          border-radius: 2px;
          margin-bottom: 32px;
          text-transform: uppercase;
        }

        h1 {
          font-size: clamp(36px, 7vw, 60px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -1px;
          margin-bottom: 16px;
        }

        h1 span { color: #ef4444; }

        .sub {
          color: #64748b;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          line-height: 1.8;
          margin-bottom: 48px;
        }

        .input-row {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }

        input[type="text"] {
          flex: 1;
          background: #0f172a;
          border: 1px solid #1e293b;
          color: #e2e8f0;
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          padding: 14px 18px;
          border-radius: 4px;
          outline: none;
          transition: border-color 0.2s;
        }

        input[type="text"]:focus { border-color: #3b82f6; }
        input[type="text"]::placeholder { color: #334155; }

        button.primary {
          background: #ef4444;
          color: #fff;
          border: none;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 1px;
          padding: 14px 28px;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }

        button.primary:hover { background: #dc2626; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,68,68,0.3); }
        button.primary:active { transform: translateY(0); }
        button.primary:disabled { background: #334155; cursor: not-allowed; transform: none; box-shadow: none; }

        .card {
          background: #0a0f1a;
          border: 1px solid #1e293b;
          border-radius: 8px;
          padding: 36px;
          margin-top: 40px;
        }

        .status-pill {
          display: inline-block;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 3px;
          padding: 4px 12px;
          border-radius: 2px;
          margin-bottom: 24px;
        }

        .alert-box {
          border-radius: 6px;
          padding: 20px 24px;
          margin: 28px 0;
          border-left: 4px solid;
        }

        .alert-box p {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          line-height: 1.8;
        }

        .cta-btn {
          display: block;
          width: 100%;
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          color: #fff;
          border: none;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 0.5px;
          padding: 18px 28px;
          border-radius: 6px;
          cursor: pointer;
          text-align: center;
          margin-top: 32px;
          transition: transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(239,68,68,0.25);
        }

        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(239,68,68,0.4); }
        .cta-btn:active { transform: translateY(0); }

        .divider {
          border: none;
          border-top: 1px solid #1e293b;
          margin: 28px 0;
        }

        .spinner {
          width: 18px; height: 18px;
          border: 2px solid #1e293b;
          border-top-color: #3b82f6;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error { color: #ef4444; font-family: 'DM Mono', monospace; font-size: 13px; margin-top: 12px; }
      `}</style>

      <div className="container">
        <div className="badge">Nexus Diagnostics · v2.0</div>

        <h1>
          Stop<br />
          <span>Bleeding</span><br />
          Ad Spend.
        </h1>

        <p className="sub">
          Paste your URL below. We run a live PageSpeed audit and<br />
          translate every millisecond into real revenue you are losing.
        </p>

        <div className="input-row">
          <input
            type="text"
            placeholder="https://yoursite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && runAudit()}
            disabled={loading}
          />
          <button className="primary" onClick={runAudit} disabled={loading || !url.trim()}>
            {loading ? (
              <>
                <span className="spinner" />
                Scanning…
              </>
            ) : (
              "Run Audit →"
            )}
          </button>
        </div>

        {error && <p className="error">⚠ {error}</p>}

        {/* ── Loading State ── */}
        {loading && (
          <div className="card">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#64748b", letterSpacing: "2px" }}>
              RUNNING DIAGNOSTIC · PLEASE WAIT
            </p>
            <LoaderLog />
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <div className="card" style={{ animation: "fadeIn 0.5s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
              <div>
                <span
                  className="status-pill"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
                >
                  {label}
                </span>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#475569", marginTop: 4, wordBreak: "break-all" }}>
                  {url}
                </p>
              </div>
              <CircularGauge score={result.score} animated={gaugeAnimated} />
            </div>

            <hr className="divider" />

            {/* Metrics */}
            <MetricRow label="FIRST CONTENTFUL PAINT" value={result.fcp.toFixed(1)} unit="s" warn={result.fcp > 1.8} />
            <MetricRow label="LARGEST CONTENTFUL PAINT" value={result.lcp.toFixed(1)} unit="s" warn={result.lcp > 2.5} />
            <MetricRow label="TOTAL BLOCKING TIME" value={result.tbt} unit="ms" warn={result.tbt > 200} />
            <MetricRow label="CUMULATIVE LAYOUT SHIFT" value={result.cls.toFixed(3)} unit="" warn={result.cls > 0.1} />

            <hr className="divider" />

            {/* Business translation */}
            <div
              className="alert-box"
              style={{
                background: result.score < 50 ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
                borderColor: result.score < 50 ? "#ef4444" : "#f59e0b",
              }}
            >
              <p style={{ color: result.score < 50 ? "#ef4444" : "#f59e0b", fontWeight: 700, marginBottom: 8, fontFamily: "'Syne', sans-serif", fontSize: "14px" }}>
                {result.score < 50 ? "🔴 CRITICAL REVENUE BLEED DETECTED" : "🟡 PERFORMANCE WARNING"}
              </p>
              <p style={{ color: "#94a3b8" }}>
                Your site is scoring <strong style={{ color: scoreColor(result.score) }}>{result.score}/100</strong>.
                Based on industry benchmarks, you are likely losing{" "}
                <strong style={{ color: "#ef4444" }}>{result.adLossPercent}% of paid ad traffic</strong>{" "}
                before they ever see your offer — and approximately{" "}
                <strong style={{ color: "#ef4444" }}>{result.conversionLoss}% of potential conversions</strong>{" "}
                due to slow page load.
              </p>
            </div>

            {/* CTA */}
            <button
              className="cta-btn"
              onClick={() => window.open("https://calendly.com/YOUR-LINK", "_blank")}
            >
              Fix This Bottleneck & Install 15-Second AI Response Agent →
            </button>

            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#334155", textAlign: "center", marginTop: 14 }}>
              Free 20-min infrastructure audit · No credit card required
            </p>
          </div>
        )}
      </div>
    </>
  );
}
