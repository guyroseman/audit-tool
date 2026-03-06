"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { fetchAudit, fmtMs, scoreColor, metricStatus } from "../lib/audit";
import type { AuditResult } from "../lib/audit";

// ─── Shared Helpers ───────────────────────────────────────────────────────────
function scoreLabel(score: number) {
  if (score >= 80) return "HEALTHY";
  if (score >= 50) return "WARNING";
  return "CRITICAL";
}

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

// ─── Unified SaaS Result Panel (Self-Contained) ───────────────────────────────
function ScoreGauge({ score, animated }: { score: number; animated: boolean }) {
  const r = 72, circ = 2 * Math.PI * r;
  const color = scoreColor(score);
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    if (!animated) { setDisp(score); return; }
    let raf: number; const start = performance.now(); const dur = 2000;
    function tick(now: number) { const t = Math.min((now - start) / dur, 1); setDisp(Math.round((1 - Math.pow(1 - t, 3)) * score)); if (t < 1) raf = requestAnimationFrame(tick); }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [score, animated]);
  return (
    <div style={{ position: "relative", width: 180, height: 180 }}>
      <svg width={180} height={180} style={{ transform: "rotate(-90deg)" }} viewBox="0 0 180 180">
        <circle cx={90} cy={90} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
        <circle cx={90} cy={90} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={animated ? circ - (score / 100) * circ : circ} style={{ filter: `drop-shadow(0 0 10px ${color})`, transition: "stroke-dashoffset 0.1s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 52, color, textShadow: `0 0 25px ${color}`, lineHeight: 1 }}>{disp}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em", marginTop: 2 }}>SCORE</span>
      </div>
    </div>
  );
}

function MetricRow({ label, value, formatted, thresholds }: { label: string; value: number; formatted: string; thresholds: [number, number]; }) {
  const s = metricStatus(value, thresholds); const c = { ok: "#10b981", warn: "#f59e0b", bad: "#e8341a" }[s]; const l = { ok: "PASS", warn: "SLOW", bad: "FAIL" }[s];
  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
        <div style={{ height: 2, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}><motion.div initial={{ width: 0 }} animate={{ width: s === "ok" ? "100%" : s === "warn" ? "60%" : "25%" }} transition={{ duration: 1 }} style={{ height: "100%", background: c, boxShadow: `0 0 8px ${c}` }} /></div>
      </div>
      <div style={{ textAlign: "right", minWidth: 100 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{formatted}</span>
        <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 9, color: c, letterSpacing: "0.15em", marginTop: 2 }}>{l}</span>
      </div>
    </div>
  );
}

function StrategicAd() {
  return (
    <div style={{ padding: "16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", gap: 16, marginTop: 24, cursor: "pointer", transition: "border-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border2)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
       <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl", transform: "rotate(180deg)", opacity: 0.6 }}>Sponsored</div>
       <div style={{ flex: 1 }}>
         <h4 style={{ color: "var(--text)", fontSize: 14, fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}>Need a faster infrastructure?</h4>
         <p style={{ color: "var(--text2)", fontSize: 12, marginTop: 4, fontFamily: "var(--font-body)", lineHeight: 1.5 }}>Migrate to premium Next.js hosting. Drop your LCP by an average of 1.2s instantly and recover lost ad spend.</p>
       </div>
       <button style={{ padding: "10px 18px", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 8, color: "var(--text)", fontSize: 11, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>View Offer</button>
    </div>
  );
}

function UnifiedResultsPanel({ result, url, isBlurred = false }: { result: AuditResult; url: string; isBlurred?: boolean }) {
  const score = result.metrics.performanceScore;
  const color = scoreColor(score);
  
  const getEmotionalTranslation = () => {
    if (score < 50) return "Your users are rage-quitting. A load time this slow means mobile users are staring at a blank screen, assuming your site is broken, and immediately leaving for your competitors. You are actively bleeding ad spend.";
    if (score < 80) return "Your site feels sluggish. Users expect instant gratification. While they might wait for it to load, the micro-delays are causing friction, resulting in abandoned carts and lost leads.";
    return "Your infrastructure is solid. Your site loads fast enough that speed is no longer your primary bottleneck for conversions. Now it's about optimizing the funnel.";
  };
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto space-y-6 relative text-left">
      <div style={{ filter: isBlurred ? "blur(12px)" : "none", transition: "all 0.8s ease", pointerEvents: isBlurred ? "none" : "auto" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 32, marginBottom: 24 }}>
          <div>
            <div style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: 11, color, background: `${color}15`, border: `1px solid ${color}40`, padding: "4px 12px", borderRadius: 4, letterSpacing: "0.15em", marginBottom: 16 }}>STATUS: {scoreLabel(score)}</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--text)", letterSpacing: "0.05em", marginBottom: 24 }}>{url}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "rgba(232,52,26,0.05)", border: "1px solid rgba(232,52,26,0.2)", borderRadius: 8, padding: 16 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--accent)" }}>{isBlurred ? "0%" : <AnimatedNumber value={result.adLossPercent} suffix="%" />}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 4 }}>EST. AD TRAFFIC LOST</div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--warn)" }}>{isBlurred ? "0%" : <AnimatedNumber value={result.bounceRateIncrease} suffix="%" />}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginTop: 4 }}>BOUNCE RATE INCREASE</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ScoreGauge score={score} animated={!isBlurred} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 16 }}>CORE WEB VITALS</p>
              <MetricRow label="Largest Contentful Paint (LCP)" value={result.metrics.lcp} formatted={fmtMs(result.metrics.lcp)} thresholds={[2500, 4000]} />
              <MetricRow label="Total Blocking Time (TBT)" value={result.metrics.tbt} formatted={fmtMs(result.metrics.tbt)} thresholds={[200, 600]} />
              <MetricRow label="Cumulative Layout Shift (CLS)" value={result.metrics.cls} formatted={result.metrics.cls.toFixed(3)} thresholds={[0.1, 0.25]} />
            </div>

            <div style={{ marginTop: 24, padding: "16px", background: score < 50 ? "rgba(232,52,26,0.05)" : "var(--bg)", borderLeft: `3px solid ${color}`, borderRadius: "0 8px 8px 0" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>The Human Impact</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{getEmotionalTranslation()}</p>
            </div>

            <StrategicAd />
          </div>

          <div style={{ background: "linear-gradient(180deg, rgba(232,52,26,0.05) 0%, rgba(3,7,15,0) 100%)", border: "1px solid rgba(232,52,26,0.3)", borderRadius: 16, padding: 32, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, background: "var(--accent)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 10, padding: "4px 24px", transform: "rotate(45deg) translate(20px, -15px)", letterSpacing: "0.1em", fontWeight: "bold" }}>PRO</div>
            
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text)", letterSpacing: "0.05em", marginBottom: 8 }}>NEXUS PULSE™</h3>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)", marginBottom: 24 }}>Automated Revenue Protection</p>
            
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.6, marginBottom: 24 }}>
              Your site is currently bleeding an estimated <strong style={{color:"var(--text)"}}>${Math.round(result.annualRevenueLoss/1000)}k/year</strong>. Put your monitoring on autopilot and never lose to competitors again.
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", gap: 12, display: "flex", flexDirection: "column" }}>
              {["24/7 Live Core Web Vitals Monitoring", "Track 3 Competitors (SMS alerts if they get faster)", "Weekly AI-Generated Dev Action Plans", "Zero human interaction required"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
                  <span style={{ color: "var(--accent)" }}>✓</span> {f}
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--text)" }}>$49<span style={{ fontSize: 16, color: "var(--muted)" }}>/mo</span></span>
            </div>

            <button onClick={() => window.open(`https://buy.stripe.com/YOUR_STRIPE_LINK_HERE?prefilled_email=`, '_blank')} className="btn-primary" style={{ width: "100%", padding: "16px", borderRadius: 8, fontSize: 13, letterSpacing: "0.15em" }}>
              START 7-DAY FREE TRIAL →
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

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

  // 🐛 FIXED: Now properly sends the survey answers (q1, q2, q3) directly into your Google Sheet!
  const submitEmail = useCallback(async (email: string) => {
    if (!result) return; setEmailLoading(true);
    try { await fetch("/api/capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, url: result.url, score: result.metrics.performanceScore, source: "funnel", q1: data.q1, q2: data.q2, q3: data.q3 }) }); } 
    catch {} finally { setEmailLoading(false); setStep("results"); }
  }, [result, data]);

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
            <div className="blur-veil" style={{ pointerEvents: "none" }}><UnifiedResultsPanel result={result} url={data.url || ""} isBlurred={true} /></div>
            <FunnelEmailGate onSubmit={submitEmail} loading={emailLoading} />
          </motion.div>
        )}

        {step === "results" && result && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%" }}>
            <UnifiedResultsPanel result={result} url={data.url || ""} isBlurred={false} />
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}