"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAudit } from "../lib/audit";
import type { AuditResult } from "../lib/audit";
import { UnifiedResultsPanel } from "../page"; 

// ─── Survey Types & Helpers ───────────────────────────────────────────────────
type Step = "q1" | "q2" | "q3" | "url" | "loading" | "email" | "results";
interface FunnelData { q1?: string; q2?: string; q3?: string; url?: string; email?: string; }
const SURVEY_STEPS = ["q1", "q2", "q3", "url"];

function ProgressDots({ step }: { step: Step }) {
  const idx = SURVEY_STEPS.indexOf(step); if (idx === -1) return null;
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 32 }}>
      {SURVEY_STEPS.map((_, i) => (<motion.div key={i} animate={{ width: i === idx ? 24 : 6, background: i <= idx ? "#e8341a" : "#0e1e35" }} style={{ height: 6, borderRadius: 3 }} transition={{ duration: 0.3 }} />))}
    </div>
  );
}

function Choice({ label, sub, icon, onClick }: { label: string; sub?: string; icon: string; onClick: () => void }) {
  const [flash, setFlash] = useState(false);
  return (
    <motion.button onClick={() => { setFlash(true); setTimeout(onClick, 220); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ width: "100%", textAlign: "left", padding: "16px 20px", marginBottom: 10, borderRadius: 12, background: flash ? "rgba(232,52,26,0.12)" : "var(--surface)", border: `1px solid ${flash ? "#e8341a" : "var(--border)"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 15, color: flash ? "#e8341a" : "var(--text)" }}>{label}</div>
        {sub && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
      </div>
    </motion.button>
  );
}

function Question({ question, sub, children }: { question: string; sub?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,6vw,44px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1.05, marginBottom: 10 }}>{question}</h2>
        {sub && <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.5 }}>{sub}</p>}
      </div>
      {children}
    </motion.div>
  );
}

// ─── Email Gate for Funnel ────────────────────────────────────────────────────
function FunnelEmailGate({ onSubmit, loading }: { onSubmit: (e: string) => Promise<void>; loading: boolean }) {
  const [email, setEmail] = useState(""); const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(16px)", background: "rgba(3,7,15,0.9)" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid rgba(232,52,26,0.35)", borderRadius: 16, padding: "40px 32px", textAlign: "center" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--text)", letterSpacing: "0.05em", lineHeight: 1.1 }}>REPORT READY</h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", margin: "10px 0 24px" }}>Enter your email to unlock your full diagnostic and automated fix plan.</p>
        <input ref={ref} type="email" value={email} placeholder="you@company.com" onChange={e => setEmail(e.target.value)} onKeyDown={e => { if(e.key === "Enter") { setErr(""); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr("Enter a valid email."); return; } onSubmit(email.trim()); } }} style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "14px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14, marginBottom: err ? 8 : 12 }} />
        {err && <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", marginBottom: 10 }}>{err}</p>}
        <button onClick={() => { setErr(""); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr("Enter a valid email."); return; } onSubmit(email.trim()); }} disabled={loading} className="btn-primary" style={{ width: "100%", padding: "16px", borderRadius: 8, fontSize: 13, letterSpacing: "0.15em" }}>{loading ? "UNLOCKING..." : "UNLOCK MY REPORT →"}</button>
      </div>
    </motion.div>
  );
}

// ─── Main Funnel Logic ────────────────────────────────────────────────────────
export default function Funnel() {
  const [step, setStep] = useState<Step>("q1");
  const [data, setData] = useState<FunnelData>({});
  const [result, setResult] = useState<AuditResult | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState("");

  const go = (update: Partial<FunnelData>, next: Step) => { setData(p => ({ ...p, ...update })); setStep(next); };

  const runAudit = useCallback(async (url: string) => {
    setData(p => ({ ...p, url })); setStep("loading"); setError("");
    try { const r = await fetchAudit(url); setResult(r); setStep("email"); } 
    catch (e) { setError("Failed to audit URL."); setStep("url"); }
  }, []);

  const submitEmail = useCallback(async (email: string) => {
    if (!result) return; setEmailLoading(true);
    try { await fetch("/api/capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, url: result.url, score: result.metrics.performanceScore, source: "funnel" }) }); } 
    catch {} finally { setEmailLoading(false); setStep("results"); }
  }, [result]);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <nav style={{ position: "absolute", top: 0, width: "100%", maxWidth: 860, display: "flex", justifyContent: "space-between", padding: "40px 16px" }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", letterSpacing: "0.1em" }}>NEXUS</span></a>
      </nav>

      <AnimatePresence mode="wait">
        
        {step === "q1" && (
          <motion.div key="q1" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ width: "100%" }}>
            <ProgressDots step="q1" />
            <Question question="What happens when a new lead lands on your site today?" sub="Be honest. Most sites are leaking traffic before a human ever gets to interact.">
              <Choice icon="📉" label="They look around, but bounce before converting." onClick={() => go({ q1: "bounce" }, "q2")} />
              <Choice icon="😤" label="They rage-quit because things feel broken or slow." onClick={() => go({ q1: "slow" }, "q2")} />
              <Choice icon="💸" label="They leave and buy from my competitor instead." onClick={() => go({ q1: "competitor" }, "q2")} />
            </Question>
          </motion.div>
        )}

        {step === "q2" && (
          <motion.div key="q2" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ width: "100%" }}>
            <ProgressDots step="q2" />
            <Question question="If we fixed that today, how much is that worth to you annually?" sub="Quantify the pain. How much money is walking out the back door?">
              <Choice icon="🌱" label="Under £10,000" onClick={() => go({ q2: "sub10k" }, "q3")} />
              <Choice icon="📈" label="£10k – £100k" onClick={() => go({ q2: "mid" }, "q3")} />
              <Choice icon="🏆" label="£100k+ (It's a massive leak)" onClick={() => go({ q2: "high" }, "q3")} />
            </Question>
          </motion.div>
        )}

        {step === "q3" && (
          <motion.div key="q3" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ width: "100%" }}>
            <ProgressDots step="q3" />
            <Question question="How confident are you in your site's mobile performance right now?" sub="Google penalizes sites with poor Core Web Vitals.">
              <Choice icon="😎" label="Very confident. It's perfectly optimized." onClick={() => go({ q3: "confident" }, "url")} />
              <Choice icon="🤷" label="I know it's bad, but I don't know how to fix it." onClick={() => go({ q3: "stuck" }, "url")} />
              <Choice icon="🙈" label="I have no idea. I am flying completely blind." onClick={() => go({ q3: "blind" }, "url")} />
            </Question>
          </motion.div>
        )}

        {step === "url" && (
          <motion.div key="url" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ width: "100%" }}>
            <ProgressDots step="url" />
            <Question question="Drop your URL. See the truth in 60 seconds." sub="We'll measure every millisecond of friction causing your users to bounce.">
              <input type="text" placeholder="https://yourwebsite.com" onKeyDown={e => e.key === "Enter" && runAudit(e.currentTarget.value)} style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14 }} />
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", marginTop: 8 }}>{error}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textAlign: "center", marginTop: 12 }}>Press Enter to scan</p>
            </Question>
          </motion.div>
        )}

        {step === "loading" && <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}>SCANNING ENGINE ACTIVE...</motion.div>}

        {step === "email" && result && (
          <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: "relative", width: "100%", maxWidth: 900 }}>
             {/* SaaS PITCH RENDERED BEHIND BLUR */}
            <div className="blur-veil" style={{ pointerEvents: "none" }}><UnifiedResultsPanel result={result} url={data.url || ""} isBlurred={true} /></div>
            <FunnelEmailGate onSubmit={submitEmail} loading={emailLoading} />
          </motion.div>
        )}

        {step === "results" && result && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%" }}>
             {/* SaaS PITCH REVEALED */}
            <UnifiedResultsPanel result={result} url={data.url || ""} isBlurred={false} />
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}