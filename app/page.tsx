"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAudit } from "./lib/audit";
import type { AuditResult } from "./lib/audit";
import { TerminalLoader, EmailGate, ResultsPanel } from "./components/shared";

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
      setError(e instanceof Error ? e.message : "Could not reach PageSpeed API.");
      setState("error");
    }
  }, []);

  const submitEmail = useCallback(async (email: string) => {
    if (!result) return;
    setEmailLoading(true);
    try {
      await fetch("/api/capture", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, url: result.url, score: result.metrics.performanceScore, adLossPercent: result.adLossPercent, bounceRateIncrease: result.bounceRateIncrease, annualRevenueLoss: result.annualRevenueLoss, severity: result.severity, timestamp: result.timestamp, source: "homepage" }),
      });
    } catch { /* swallow */ }
    finally { setEmailLoading(false); setState("results"); }
  }, [result]);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "72px 16px 32px", position: "relative", zIndex: 10 }}>

      {/* Nav */}
      <nav style={{ width: "100%", maxWidth: 860, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", letterSpacing: "0.1em" }}>NEXUS</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/subscribe" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#a78bfa", letterSpacing: "0.12em", textDecoration: "none", border: "1px solid rgba(167,139,250,0.3)", padding: "6px 14px", borderRadius: 6 }}>NEXUS PULSE £49/MO</a>
          <a href="/funnel" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.12em", textDecoration: "none", border: "1px solid rgba(232,52,26,0.3)", padding: "6px 14px", borderRadius: 6 }}>FREE AUDIT →</a>
        </div>
      </nav>

      <AnimatePresence mode="wait">

        {/* IDLE / ERROR */}
        {(state === "idle" || state === "error") && (
          <motion.section key="hero" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 24 }}>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.25)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.15em" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", boxShadow: "0 0 8px var(--accent)" }} className="animate-pulse" />
              FREE REVENUE DIAGNOSTIC · POWERED BY GOOGLE
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.92, letterSpacing: "0.02em", color: "var(--text)" }} className="flicker">
              YOUR WEBSITE<br />
              <span style={{ color: "var(--accent)", textShadow: "0 0 60px rgba(232,52,26,0.4)" }}>IS COSTING</span><br />
              YOU MONEY
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--text2)", maxWidth: 500, lineHeight: 1.7 }}>
              Enter your URL. In 60 seconds we calculate the exact pound value your slow website is leaking — and show you the fix.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ width: "100%", maxWidth: 600, display: "flex", gap: 10 }}>
              <input type="text" value={url} onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runAudit(url)} placeholder="https://yourwebsite.com" autoFocus
                style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "18px 20px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14 }} />
              <button onClick={() => runAudit(url)} className="btn-primary" style={{ padding: "18px 28px", borderRadius: 10, whiteSpace: "nowrap" }}>
                RUN AUDIT →
              </button>
            </motion.div>
            {state === "error" && (
              <div style={{ width: "100%", maxWidth: 600, padding: "12px 16px", borderRadius: 8, background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.25)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)" }}>⚠ {error}</span>
              </div>
            )}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              style={{ display: "flex", gap: 40, marginTop: 8 }}>
              {[["4.2s","Avg LCP we fix"],["61%","Avg ad loss recovered"],["£49/mo","Pulse monitoring"]].map(([v,l]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text)", letterSpacing: "0.05em" }}>{v}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em" }}>
              USES GOOGLE PAGESPEED INSIGHTS · NO SIGN-UP · FREE FOREVER
            </motion.p>
          </motion.section>
        )}

        {state === "loading" && (
          <motion.section key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: "100%" }}>
            <TerminalLoader url={url} />
          </motion.section>
        )}

        {state === "email-gate" && result && (
          <motion.section key="gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "relative", width: "100%", maxWidth: 860 }}>
            <div className="blur-veil"><ResultsPanel result={result} /></div>
            <EmailGate onSubmit={submitEmail} loading={emailLoading} />
          </motion.section>
        )}

        {state === "results" && result && (
          <motion.section key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%" }}>
            {/* Homepage: no onDiscover prop → shows "Speak to an agent" CTA */}
            <ResultsPanel result={result} />
          </motion.section>
        )}

      </AnimatePresence>

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