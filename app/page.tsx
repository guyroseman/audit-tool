"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "./lib/auth-context";
import { NavBar } from "./components/nav";

// ─── Live scan ticker ─────────────────────────────────────────────────────────
const TICKER = [
  { url: "shopify-store.com", finding: "LCP 4.2s → $1,840/mo leaking", color: "#e8341a" },
  { url: "dental-clinic.co.uk", finding: "ADA Risk HIGH → $50k lawsuit exposure", color: "#f59e0b" },
  { url: "ecom-brand.io", finding: "Google Ad Tax 34% → $920 wasted/mo", color: "#e8341a" },
  { url: "local-law-firm.com", finding: "3 vulnerable JS libs → trust risk HIGH", color: "#f59e0b" },
  { url: "saas-startup.app", finding: "SEO Score 29 → 61% organic reach lost", color: "#e8341a" },
  { url: "hotel-booking.co", finding: "Security headers missing → checkout FAIL", color: "#f59e0b" },
];

function LiveTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setI(x => (x + 1) % TICKER.length), 3000);
    return () => clearInterval(iv);
  }, []);
  const item = TICKER[i];
  return (
    <AnimatePresence mode="wait">
      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 10, overflow: "hidden" }}>
        <span style={{ color: item.color, flexShrink: 0 }}>●</span>
        <span style={{ color: "var(--muted2)", flexShrink: 0 }}>{item.url}</span>
        <span style={{ color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>→ {item.finding}</span>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Live visitor counter ─────────────────────────────────────────────────────
function LiveCount() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block",
        animation: "livePulse 2s ease infinite" }} />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#10b981", letterSpacing: "0.08em" }}>
        Live audit engine active
      </span>
    </span>
  );
}

// ─── Social proof popup ───────────────────────────────────────────────────────

// ─── URL Input (URL only — email is captured AFTER the scan) ─────────────────
function UrlInput({ onScan, size = "lg" }: { onScan: (url: string) => void; size?: "lg" | "sm" }) {
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [focused, setFocused] = useState(false);
  const go = useCallback(() => {
    const t = url.trim();
    if (!t) { setErr("Enter a website URL to scan."); return; }
    setErr(""); onScan(t);
  }, [url, onScan]);
  const isLg = size === "lg";
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{
        display: "flex", borderRadius: isLg ? 12 : 8, overflow: "hidden",
        border: `1px solid ${err ? "rgba(232,52,26,0.6)" : focused ? "rgba(232,52,26,0.5)" : "var(--border2)"}`,
        background: "var(--surface)",
        boxShadow: focused ? "0 0 0 3px rgba(232,52,26,0.1), 0 8px 32px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.2)",
        transition: "all 0.25s",
      }}>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: isLg ? 18 : 12, flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: isLg ? 12 : 10, color: "var(--muted)", letterSpacing: "0.04em" }}>https://</span>
        </div>
        <input type="text" value={url}
          onChange={e => { setUrl(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && go()}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="yourwebsite.com"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none",
            padding: isLg ? "18px 12px 18px 4px" : "13px 8px 13px 4px",
            color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: isLg ? 16 : 13, minWidth: 0 }}
        />
        <button onClick={go} className="btn-primary"
          style={{ borderRadius: 0, padding: isLg ? "18px 26px" : "13px 18px",
            fontSize: isLg ? 13 : 11, letterSpacing: "0.14em", flexShrink: 0,
            borderLeft: "1px solid rgba(232,52,26,0.25)" }}>
          REVEAL MY LEAK →
        </button>
      </div>
      {err && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", marginTop: 2, letterSpacing: "0.08em" }}>⚠ {err}</motion.p>}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted2)", textAlign: "center" }}>No credit card · No signup required · Full report in 60 seconds</p>
    </div>
  );
}

// ─── Animated number for stats ────────────────────────────────────────────────
function CountUp({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let frame: number;
        const t0 = Date.now(), dur = 1800;
        const tick = () => {
          const p = Math.min((Date.now() - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.floor(eased * to));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ─── Pillar preview card ──────────────────────────────────────────────────────
function PillarBlock({ icon, name, metric, hook, color, i }: {
  icon: string; name: string; metric: string; hook: string; color: string; i: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay: i * 0.07 }}
      style={{ padding: "22px 20px", borderRadius: 14, background: "var(--surface)",
        border: `1px solid ${color}22`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color, letterSpacing: "0.14em", marginBottom: 8 }}>{name}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color, letterSpacing: "0.04em", marginBottom: 10, lineHeight: 1 }}>{metric}</div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.65 }}>{hook}</div>
    </motion.div>
  );
}

// ─── Testimonial ──────────────────────────────────────────────────────────────
function Testimonial({ quote, name, role, stat, i }: { quote: string; name: string; role: string; stat: string; i: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay: i * 0.08 }}
      style={{ padding: "24px 22px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 4, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.22)", marginBottom: 14, alignSelf: "flex-start" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa", letterSpacing: "0.1em" }}>{stat}</span>
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.72, fontStyle: "italic", flex: 1, marginBottom: 16 }}>&ldquo;{quote}&rdquo;</p>
      <div>
        <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{name}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", marginTop: 3, letterSpacing: "0.06em" }}>{role}</div>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { loading: authLoading, isAuthed } = useAuth();
  const handleScan = useCallback((url: string) => {
    const params = new URLSearchParams({ url });
    router.push(`/funnel?${params.toString()}`);
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", position: "relative", zIndex: 10 }}>
      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }
        @keyframes heroGlow { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes tickerScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>

      {/* ── STICKY NAV ── */}
      <NavBar page="home" maxWidth={1020} />

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1020, margin: "0 auto", padding: "clamp(60px,10vw,100px) 20px clamp(50px,7vw,80px)" }}>

        {/* Top bar — ticker + counter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px", borderRadius: 8, background: "rgba(14,30,53,0.7)", border: "1px solid var(--border)", flex: 1, minWidth: 0, maxWidth: 420, overflow: "hidden" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em", flexShrink: 0 }}>LIVE:</span>
            <LiveTicker />
          </div>
          <LiveCount />
        </motion.div>

        {/* Headline */}
        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center" }}>
          <div>
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.22)", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.12em", marginBottom: 22 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)" }} className="animate-pulse" />
              FREE REVENUE LEAK AUDIT — 60 SECONDS
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px,8vw,94px)", lineHeight: 0.9, letterSpacing: "0.02em", marginBottom: 24 }} className="flicker">
              YOUR WEBSITE<br />
              IS <span style={{ color: "var(--accent)", textShadow: "0 0 80px rgba(232,52,26,0.5)" }}>BLEEDING</span><br />
              MONEY.
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              style={{ fontFamily: "var(--font-body)", fontSize: "clamp(14px,2vw,17px)", color: "var(--text2)", maxWidth: 480, lineHeight: 1.75, marginBottom: 32 }}>
              Most founders never find out — until they scan. Nexus runs a 60-second deep audit and returns <strong style={{ color: "var(--text)" }}>your exact monthly revenue leak in dollars</strong>, plus a step-by-step fix plan ordered by ROI.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} style={{ maxWidth: 580, marginBottom: 16 }}>
              <UrlInput onScan={handleScan} />
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
              style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {["🔒 Zero signup", "⚡ Real Google data", "📋 ROI-ordered fix plan", "💸 Dollar impact per finding"].map(t => (
                <span key={t} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.05em" }}>{t}</span>
              ))}
            </motion.div>
          </div>

          {/* Hero visual — live audit preview */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            style={{ minWidth: 200, maxWidth: 240 }}
            className="hero-stats-panel">
            {/* Score card */}
            <div style={{ padding: "16px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border2)", marginBottom: 8, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #e8341a, #f59e0b)" }} />
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.14em", marginBottom: 10 }}>SITE HEALTH SCORE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                {[
                  { label: "PERF", val: 23, color: "#e8341a" },
                  { label: "SEO", val: 41, color: "#f59e0b" },
                  { label: "A11Y", val: 35, color: "#a78bfa" },
                  { label: "SEC", val: 62, color: "#22d3ee" },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ textAlign: "center", padding: "8px 6px", background: "var(--bg)", borderRadius: 8, border: `1px solid ${color}25`, borderTop: `2px solid ${color}` }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color, lineHeight: 1 }}>{val}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: "var(--muted)", marginTop: 3, letterSpacing: "0.1em" }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 7, background: "rgba(232,52,26,0.06)", border: "1px solid rgba(232,52,26,0.2)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.1em" }}>⚠ TOP FINDING</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text2)", marginTop: 4, lineHeight: 1.5 }}>LCP 4.2s → $1,840/mo in lost ad spend</div>
              </div>
            </div>
            {/* Revenue leak card */}
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "linear-gradient(135deg,rgba(232,52,26,0.08),rgba(232,52,26,0.03))", border: "1px solid rgba(232,52,26,0.25)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 6 }}>ESTIMATED MONTHLY LEAK</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "var(--accent)", letterSpacing: "0.04em", lineHeight: 1 }}>$3,240</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.08em", marginTop: 4 }}>$38,880 / YEAR</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── URGENCY STRIP ── */}
      <div style={{ background: "rgba(232,52,26,0.04)", borderTop: "1px solid rgba(232,52,26,0.12)", borderBottom: "1px solid rgba(232,52,26,0.12)", padding: "14px 20px" }}>
        <div style={{ maxWidth: 1020, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.12em", background: "rgba(232,52,26,0.1)", border: "1px solid rgba(232,52,26,0.25)", padding: "3px 8px", borderRadius: 4, flexShrink: 0 }}>⚠ THE HIDDEN DRAIN</span>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>
            Most founders spend $2k–$10k/mo on ads and never fix the slow page that&rsquo;s eating every conversion. The damage is invisible until you measure it.
          </p>
        </div>
      </div>

      {/* ── 4 PILLARS ── */}
      <section style={{ maxWidth: 1020, margin: "0 auto", padding: "clamp(60px,8vw,96px) 20px" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 44 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 12 }}>WHAT WE SCAN</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,5.5vw,58px)", color: "var(--text)", letterSpacing: "0.03em", lineHeight: 1 }}>
            4 PILLARS. ONE <span style={{ color: "var(--accent)" }}>LEAK NUMBER.</span>
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", maxWidth: 460, margin: "14px auto 0", lineHeight: 1.7 }}>
            Every finding is translated into plain English and a dollar amount. No charts. No jargon. Just your monthly leak.
          </p>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <PillarBlock i={0} icon="⚡" name="PERFORMANCE" color="#e8341a" metric="Up to -60%" hook="Slow LCP kills your Google Ads quality score. You pay up to 60% more per click than faster competitors. That&rsquo;s pure tax." />
          <PillarBlock i={1} icon="🔍" name="SEO" color="#f59e0b" metric="43% reach lost" hook="Missing meta tags, no viewport, blocked crawlers — Google is actively hiding you from your own potential customers every day." />
          <PillarBlock i={2} icon="♿" name="ACCESSIBILITY" color="#a78bfa" metric="$50k exposure" hook="WCAG violations lock out disabled users and expose you to ADA lawsuits. US settlements average $25k–$90k per case." />
          <PillarBlock i={3} icon="🔒" name="SECURITY" color="#22d3ee" metric="17% cart abandon" hook="Outdated JS libraries trigger browser security warnings at checkout. One red banner and you&rsquo;ve lost the sale permanently." />
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: "center", marginTop: 44 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 18 }}>GET YOUR LEAK NUMBER — FREE, 60 SECONDS</p>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <UrlInput onScan={handleScan} />
          </div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "clamp(56px,8vw,96px) 20px" }}>
        <div style={{ maxWidth: 1020, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 12 }}>HOW IT WORKS</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4.5vw,50px)", color: "var(--text)", letterSpacing: "0.04em", lineHeight: 1 }}>
              URL TO DOLLAR FIGURE IN <span style={{ color: "#10b981" }}>60 SECONDS.</span>
            </h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            {[
              { n: "01", icon: "🔗", title: "Paste your URL", body: "No account. No credit card. Just your domain. Nexus calls Google Lighthouse in real time.", color: "var(--accent)" },
              { n: "02", icon: "⚡", title: "Watch the 4-pillar scan", body: "A terminal-style audit checks all 4 pillars live. You see what we&rsquo;re testing as we test it.", color: "#f59e0b" },
              { n: "03", icon: "💸", title: "Get your leak number", body: "Every finding is translated into $ per month. One terrifying number. No guesswork.", color: "#a78bfa" },
              { n: "04", icon: "📋", title: "Get the fix blueprint", body: "A prioritised developer task list ordered by dollar ROI. Forward it to your dev today.", color: "#10b981" },
            ].map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ padding: "24px 20px", borderRadius: 14, background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 44, color: `${s.color}18`, letterSpacing: "-2px", lineHeight: 1, marginBottom: 14 }}>{s.n}</div>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 7 }}>{s.title}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: s.body }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section style={{ maxWidth: 1020, margin: "0 auto", padding: "clamp(60px,8vw,96px) 20px" }}>
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          {[
            { n: 2100, prefix: "$", suffix: "/mo", label: "avg ad overspend from slow sites", color: "var(--accent)" },
            { n: 43, prefix: "", suffix: "%", label: "of SEO reach lost to technical gaps", color: "#f59e0b" },
            { n: 50000, prefix: "$", suffix: "", label: "average ADA lawsuit settlement", color: "#a78bfa" },
            { n: 500, prefix: "", suffix: "+", label: "sites improved with Nexus audits", color: "#10b981" },
          ].map(({ n, prefix, suffix, label, color }) => (
            <motion.div key={label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              style={{ padding: "32px 24px", background: "var(--surface)", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,5vw,52px)", color, letterSpacing: "0.03em", marginBottom: 10 }}>
                <CountUp to={n} prefix={prefix} suffix={suffix} />
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", lineHeight: 1.6 }}>{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "clamp(56px,8vw,96px) 20px" }}>
        <div style={{ maxWidth: 1020, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 12 }}>WHAT HAPPENS AFTER THE SCAN</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4.5vw,50px)", color: "var(--text)", letterSpacing: "0.04em", lineHeight: 1 }}>
              REAL RESULTS. <span style={{ color: "#a78bfa" }}>REAL COMPANIES.</span>
            </h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <Testimonial i={0} stat="$2,400/mo recovered"
              quote="Found out our hero image was 8MB. One fix. Google Ads CPC dropped 28% the next week. Nexus paid for 4 years of subscription in that one afternoon."
              name="James H." role="SaaS Founder · Manchester" />
            <Testimonial i={1} stat="$50k lawsuit avoided"
              quote="We were HIGH ADA risk — three failing WCAG checks. Nexus caught it before a law firm letter did. Fixed in a week. Compliance cert is on file."
              name="Marcus T." role="Law Firm Partner · Chicago" />
            <Testimonial i={2} stat="$12k ad spend recovered"
              quote="A third-party script added 3.2s to every page load and I had no idea. Nexus showed me the exact filename. Dev fixed it that afternoon."
              name="Asha P." role="E-commerce Director · Sydney" />
            <Testimonial i={3} stat="12 retainer clients closed"
              quote="I show prospects their own NEXUS leak number before I even pitch. They see the bleeding dollar figure and they're already sold."
              name="Tom W." role="Agency Owner · London" />
          </div>
        </div>
      </section>

      {/* ── VS COMPARISON ── */}
      <section style={{ maxWidth: 1020, margin: "0 auto", padding: "clamp(60px,8vw,96px) 20px" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 12 }}>THE NEXUS EDGE</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4.5vw,50px)", color: "var(--text)", letterSpacing: "0.04em", lineHeight: 1.1 }}>
            THOUSANDS OF FREE TOOLS EXIST.<br />
            <span style={{ color: "var(--accent)" }}>NONE SPEAK ENGLISH.</span>
          </h2>
        </motion.div>
        <div className="vs-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 760, margin: "0 auto" }}>
          {[
            { label: "GTmetrix / Pingdom", type: "other" as const, points: ["Engineers read it", "No dollar translation", "Charts. Just dry charts.", "No SEO or accessibility pillar", "No fix blueprint"] },
            { label: "NEXUS", type: "us" as const, points: ["Founders read it instantly", "$ per month, per finding", "Plain-English business impact", "Full 4-pillar engine", "Prioritised fix plan + webhooks"] },
          ].map(card => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ padding: "24px 20px", borderRadius: 14, background: card.type === "us" ? "linear-gradient(135deg,rgba(232,52,26,0.07),rgba(232,52,26,0.03))" : "var(--surface)", border: `1.5px solid ${card.type === "us" ? "rgba(232,52,26,0.35)" : "var(--border)"}` }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: card.type === "us" ? "var(--accent)" : "var(--muted)", letterSpacing: "0.12em", marginBottom: 18 }}>{card.label}</div>
              {card.points.map(p => (
                <div key={p} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 11 }}>
                  <span style={{ color: card.type === "us" ? "#10b981" : "rgba(232,52,26,0.5)", fontSize: 14, flexShrink: 0, marginTop: 0 }}>{card.type === "us" ? "✓" : "✗"}</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: card.type === "us" ? "var(--text2)" : "var(--muted)", lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "clamp(70px,10vw,120px) 20px" }}>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 18 }}>YOUR NUMBER IS WAITING</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px,7vw,78px)", color: "var(--text)", letterSpacing: "0.02em", lineHeight: 0.95, marginBottom: 20 }}>
            WHAT IF YOUR SITE IS<br />
            <span style={{ color: "var(--accent)", textShadow: "0 0 60px rgba(232,52,26,0.4)" }}>COSTING YOU $3,000</span><br />
            THIS MONTH?
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.72, marginBottom: 36 }}>
            Enter your URL and find out in 60 seconds. No credit card, no signup — just your real leak number and a fix plan that pays for itself.
          </p>
          <div style={{ maxWidth: 580, margin: "0 auto" }}>
            <UrlInput onScan={handleScan} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
            {["🔒 SSL Encrypted", "⚡ Real Google Data", "✓ No Signup", "📋 ROI Fix Plan"].map(t => (
              <span key={t} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.06em" }}>{t}</span>
            ))}
          </div>
          {!authLoading && !isAuthed && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", marginTop: 18 }}>
              Already have an account?{" "}
              <a href="/login" style={{ color: "#a78bfa", textDecoration: "none" }}>Sign in to skip the email gate →</a>
            </p>
          )}
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "22px 20px" }}>
        <div style={{ maxWidth: 1020, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--muted)", letterSpacing: "0.1em" }}>NEXUS</span>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[["PRICING", "/subscribe"], ["DASHBOARD", "/dashboard"], ["FREE AUDIT", "/funnel"], ["PRIVACY", "/legal/privacy"], ["TERMS", "/legal/terms"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textDecoration: "none", letterSpacing: "0.08em" }}>{l}</a>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)" }}>© {new Date().getFullYear()} Nexus Diagnostics</p>
        </div>
      </footer>

    </main>
  );
}