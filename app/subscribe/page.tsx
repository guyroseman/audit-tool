"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ─── Plan config ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    name: "SCOUT",
    tagline: "Diagnose the bleeding. Once a day.",
    price: 0,
    badge: "FREE FOREVER",
    badgeColor: "#4a6080",
    accentColor: "rgba(74,96,128,",
    features: [
      { icon: "⚡", text: "1 manual 4-pillar audit per day" },
      { icon: "📊", text: "Full Performance · SEO · A11y · Security report" },
      { icon: "💸", text: "Revenue leakage estimate in dollars" },
      { icon: "🔍", text: "Itemised findings with fix instructions" },
    ],
    locked: [
      "Automated weekly scans",
      "Competitor tracking (0 URLs)",
      "SMS & Slack alerts",
      "AI Developer Blueprint",
      "Historical score trends",
    ],
    cta: "RUN FREE AUDIT",
    ctaBg: "var(--surface2)",
    ctaColor: "var(--text2)",
    href: "/funnel",
    popular: false,
    guarantee: "No credit card · Forever free",
  },
  {
    id: "pulse",
    name: "PULSE",
    tagline: "Stop leaking. Start watching. Automatically.",
    price: 49,
    badge: "★ BEST VALUE — MOST POPULAR",
    badgeColor: "#a78bfa",
    accentColor: "rgba(167,139,250,",
    features: [
      { icon: "📡", text: "Weekly automated 4-pillar scans — set and forget" },
      { icon: "🔍", text: "Track up to 3 competitor URLs side-by-side" },
      { icon: "📱", text: "SMS + Slack alerts the moment any score drops" },
      { icon: "⚖️", text: "ADA compliance change monitoring — lawsuit prevention" },
      { icon: "🔒", text: "Vulnerable JS library security alerts" },
      { icon: "🤖", text: "AI Developer Blueprint — prioritised fix list by ROI" },
      { icon: "📊", text: "Historical score trend charts" },
      { icon: "🔔", text: "Make.com & Zapier webhooks" },
    ],
    locked: [],
    cta: "ACTIVATE PULSE",
    ctaBg: "#a78bfa",
    ctaColor: "#fff",
    href: process.env.NEXT_PUBLIC_LS_PULSE_URL ?? "/login",
    popular: true,
    guarantee: "7-day free trial · Cancel anytime",
  },
  {
    id: "scale",
    name: "SCALE",
    tagline: "Your clients pay you for this report.",
    price: 149,
    badge: "FOR AGENCIES",
    badgeColor: "#e8341a",
    accentColor: "rgba(232,52,26,",
    features: [
      { icon: "📡", text: "Daily automated 4-pillar scans" },
      { icon: "🔍", text: "Track up to 10 competitor URLs" },
      { icon: "📄", text: "Weekly white-label PDF reports" },
      { icon: "👥", text: "3 team seats included" },
      { icon: "⚖️", text: "Full WCAG audit trail & compliance certs" },
      { icon: "🔒", text: "Priority security vulnerability alerts" },
      { icon: "🎯", text: "Dedicated technical support" },
      { icon: "🏷️", text: "Agency resell licence" },
    ],
    locked: [],
    cta: "ACTIVATE SCALE",
    ctaBg: "#e8341a",
    ctaColor: "#fff",
    href: process.env.NEXT_PUBLIC_LS_SCALE_URL ?? "/login",
    popular: false,
    guarantee: "Cancel anytime · White-label from day 1",
  },
];

// ─── Feature comparison table ─────────────────────────────────────────────────
const COMPARISON = [
  { label: "Manual audits / day", free: "1", pulse: "Unlimited", scale: "Unlimited" },
  { label: "Automated weekly scans", free: false, pulse: true, scale: "Daily" },
  { label: "Competitor URLs tracked", free: "0", pulse: "3", scale: "10" },
  { label: "SMS + Slack alerts", free: false, pulse: true, scale: true },
  { label: "AI Developer Blueprint", free: false, pulse: true, scale: true },
  { label: "Historical score trends", free: false, pulse: true, scale: true },
  { label: "Make.com / Zapier webhooks", free: false, pulse: true, scale: true },
  { label: "White-label PDF reports", free: false, pulse: false, scale: true },
  { label: "Team seats", free: "1", pulse: "1", scale: "3" },
  { label: "WCAG compliance cert", free: false, pulse: false, scale: true },
  { label: "Dedicated support", free: false, pulse: false, scale: true },
  { label: "Agency resell licence", free: false, pulse: false, scale: true },
];

const TESTIMONIALS = [
  { name: "James H.", role: "SaaS Founder · Manchester", stat: "£2,400/mo recovered", quote: "Found out my competitor dropped from 81 to 47 overnight. Called 3 of their prospects that week. Pulse paid for itself in 20 minutes." },
  { name: "Asha P.", role: "E-commerce Director · Sydney", stat: "$12k recovered", quote: "Weekly scan caught a third-party script that added 3.2s to every load. Fixed in a day." },
  { name: "Marcus T.", role: "Law Firm Partner · Chicago", stat: "$50k lawsuit avoided", quote: "Nexus flagged HIGH ADA risk before a law firm letter did. Fixed in a week, compliance cert on file." },
  { name: "Tom W.", role: "Agency Owner · London", stat: "12 clients on Scale", quote: "White-label PDF goes straight to clients. It's a recurring revenue stream that runs itself." },
];

const FAQ = [
  { q: "What's in the free audit?", a: "Every free scan runs the full 4-pillar engine — Performance, SEO, Accessibility, and Security — powered by the Google PageSpeed Insights API. You get the complete report with findings, dollar impact, and exact fixes. No credit card required." },
  { q: "What does Pulse add on top of free?", a: "Pulse automates everything. Weekly re-scans of your site plus up to 3 competitors, with SMS or Slack alerts the moment a score drops. You also get the AI Developer Blueprint — a prioritised 4-pillar task list your dev can execute immediately." },
  { q: "How is Pulse different from GTmetrix or Pingdom?", a: "GTmetrix and Pingdom are built for engineers. They output dry charts. Nexus translates the exact same Google data into dollar figures and plain-English business impact. You see 'LCP 4.2s = you're paying 34% more per Google Ad click' — not a raw millisecond number." },
  { q: "How does ADA compliance monitoring work?", a: "Every weekly scan re-checks your accessibility score against WCAG 2.1 AA. If it drops — say a new image is missing alt text — you get an alert before it becomes a legal issue. ADA website lawsuits increased 300% between 2017 and 2023." },
  { q: "Are the scores from real Google data?", a: "Yes. We call the official Google PageSpeed Insights API — the same data source Chrome DevTools and Google Search Console use. Scores are real, not simulated." },
  { q: "Can I cancel anytime?", a: "Yes. Manage or cancel via the Lemon Squeezy customer portal. No lock-in, no cancellation fees, no questions asked." },
  { q: "Does Scale include white-label reports for clients?", a: "Yes. Scale includes weekly white-label PDF reports you can send directly to clients under your own brand. It's a ready-made recurring deliverable that justifies your retainer." },
];

function CellCheck({ value }: { value: string | boolean }) {
  if (value === true) return <span style={{ color: "#10b981", fontSize: 14 }}>✓</span>;
  if (value === false) return <span style={{ color: "var(--muted2)", fontSize: 12 }}>—</span>;
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)" }}>{value}</span>;
}

// ─── Upgrade banner (shown when redirected from dashboard) ───────────────────
function UpgradeBanner() {
  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 1000, margin: "0 auto 28px", padding: "14px 20px", borderRadius: 10, background: "linear-gradient(135deg,rgba(167,139,250,0.12),rgba(167,139,250,0.05))", border: "1px solid rgba(167,139,250,0.35)", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>🔒</span>
      <div>
        <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 2 }}>Dashboard access requires a paid plan</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)" }}>
          Upgrade to <strong style={{ color: "#a78bfa" }}>Nexus Pulse</strong> to unlock automated monitoring, competitor tracking, SMS alerts and your full dashboard.
        </div>
      </div>
    </motion.div>
  );
}

function SubscribeInner() {
  const searchParams = useSearchParams();
  const reason = searchParams?.get("reason");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const discount = billing === "annual" ? 0.17 : 0;

  function handleCheckout(plan: typeof PLANS[0]) {
    if (plan.id === "free") { window.location.href = plan.href; return; }
    const url = plan.href;
    if (!url || url === "/login") { window.location.href = "/login"; return; }
    window.location.href = url;
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-body)", position: "relative" }}>

      {/* Nav */}
      <nav style={{ maxWidth: 1000, margin: "0 auto", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <svg width={19} height={19} viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)", letterSpacing: "0.1em" }}>NEXUS</span>
        </a>
        <a href="/funnel" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "none", letterSpacing: "0.08em" }}>← Free audit</a>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px 80px" }}>

        {/* Upgrade banner */}
        {reason === "upgrade" && <UpgradeBanner />}

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa", letterSpacing: "0.14em", marginBottom: 18 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} className="animate-pulse" />
            PERFORMANCE · SEO · ACCESSIBILITY · SECURITY
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px,7vw,70px)", lineHeight: 0.94, letterSpacing: "0.02em", marginBottom: 16 }}>
            KNOW BEFORE<br />
            <span style={{ color: "#a78bfa", textShadow: "0 0 40px rgba(167,139,250,0.4)" }}>YOUR COMPETITORS</span><br />
            DO.
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(14px,2.5vw,16px)", color: "var(--text2)", maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.75 }}>
            Nexus monitors your full digital health automatically. You get alerted the moment anything changes — before your competitor capitalises on it.
          </p>
          {/* Billing toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 4, gap: 2 }}>
            {(["monthly", "annual"] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                style={{ padding: "7px 18px", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", cursor: "pointer", border: "none", background: billing === b ? "#a78bfa" : "transparent", color: billing === b ? "#fff" : "var(--muted)", transition: "all 0.2s", position: "relative" }}>
                {b.toUpperCase()}
                {b === "annual" && billing !== "annual" && (
                  <span style={{ position: "absolute", top: -8, right: -8, fontFamily: "var(--font-mono)", fontSize: 8, color: "#10b981", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", padding: "1px 5px", borderRadius: 4 }}>-17%</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ROI proof bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 8, marginBottom: 28, padding: "16px 20px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
          {[
            { n: "$2,100", label: "avg monthly leak recovered", color: "#e8341a" },
            { n: "19 hrs", label: "to break even on Pulse plan", color: "#10b981" },
            { n: "300%", label: "ADA lawsuits up since 2020", color: "#a78bfa" },
            { n: "43%", label: "SEO reach lost to tech gaps", color: "#f59e0b" },
          ].map(({ n, label, color }) => (
            <div key={label} style={{ textAlign: "center", padding: "10px 8px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 32, color, letterSpacing: "0.04em", lineHeight: 1, marginBottom: 5 }}>{n}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em", lineHeight: 1.5 }}>{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px,1fr))", gap: 14, marginBottom: 52, alignItems: "stretch" }}>
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ borderRadius: 16, border: plan.popular ? `1.5px solid ${plan.accentColor}0.5)` : `1px solid ${plan.accentColor}0.2)`, background: plan.popular ? `linear-gradient(135deg,${plan.accentColor}0.1),${plan.accentColor}0.04))` : "var(--surface)", padding: plan.popular ? "28px 24px" : "22px 20px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", transform: plan.popular ? "scale(1.03)" : "none", boxShadow: plan.popular ? `0 0 80px ${plan.accentColor}0.2), 0 24px 60px rgba(0,0,0,0.4)` : "none" }}>

              {/* Popular glow line */}
              {plan.popular && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${plan.accentColor}1), transparent)` }} />
              )}

              <div style={{ display: "inline-flex", alignSelf: "flex-start", marginBottom: 14, padding: "3px 10px", borderRadius: 4, background: `${plan.accentColor}0.14)`, border: `1px solid ${plan.accentColor}0.32)` }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: plan.badgeColor, letterSpacing: "0.1em" }}>{plan.badge}</span>
              </div>

              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--text)", letterSpacing: "0.08em", marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", marginBottom: 14, lineHeight: 1.5 }}>{plan.tagline}</div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 5, marginBottom: plan.id === "pulse" ? 8 : 16 }}>
                {plan.price === 0
                  ? <span style={{ fontFamily: "var(--font-display)", fontSize: 46, color: plan.badgeColor, lineHeight: 1 }}>FREE</span>
                  : <>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 46, color: plan.badgeColor, lineHeight: 1 }}>
                        ${billing === "annual" ? Math.round(plan.price * (1 - discount)) : plan.price}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>/mo</span>
                      {billing === "annual" && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textDecoration: "line-through", marginBottom: 8 }}>${plan.price}</span>
                      )}
                    </>
                }
              </div>
              {billing === "annual" && plan.price > 0 && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#10b981", marginBottom: 8 }}>Save ${Math.round(plan.price * discount * 12)}/year</div>
              )}

              {/* ROI framing for PULSE */}
              {plan.id === "pulse" && (
                <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 14 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#10b981", letterSpacing: "0.1em" }}>
                    💡 AVG USER RECOVERS $2,100/MO — PAYS FOR ITSELF IN 19 HOURS
                  </span>
                </div>
              )}

              <div style={{ height: 1, background: `${plan.accentColor}0.15)`, marginBottom: 16 }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1, marginBottom: 18 }}>
                {plan.features.map(({ icon, text }) => (
                  <div key={text} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.45 }}>{text}</span>
                  </div>
                ))}
                {plan.locked.map(text => (
                  <div key={text} style={{ display: "flex", gap: 9, alignItems: "flex-start", opacity: 0.35 }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>🔒</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted)", lineHeight: 1.45, textDecoration: "line-through" }}>{text}</span>
                  </div>
                ))}
              </div>

              <motion.button onClick={() => handleCheckout(plan)} whileTap={{ scale: 0.98 }}
                style={{ width: "100%", padding: "14px", borderRadius: 10, background: plan.ctaBg, color: plan.ctaColor, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", border: "none", cursor: "pointer", boxShadow: plan.popular ? `0 0 28px ${plan.accentColor}0.4)` : "none", marginBottom: 10 }}>
                {plan.cta} →
              </motion.button>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textAlign: "center" }}>{plan.guarantee}</p>
            </motion.div>
          ))}
        </div>

        {/* Feature comparison toggle */}
        <div style={{ marginBottom: 52 }}>
          <button onClick={() => setShowTable(p => !p)}
            style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 auto 20px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)", letterSpacing: "0.1em" }}>
            <motion.span animate={{ rotate: showTable ? 180 : 0 }} style={{ display: "inline-block" }}>▼</motion.span>
            {showTable ? "HIDE" : "SHOW"} FULL FEATURE COMPARISON
          </button>
          <AnimatePresence>
            {showTable && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden" }}>
                <div style={{ borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px", background: "var(--surface2)", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>FEATURE</span>
                    {["SCOUT", "PULSE", "SCALE"].map((n, i) => (
                      <span key={n} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: ["var(--muted)", "#a78bfa", "#e8341a"][i], letterSpacing: "0.1em", textAlign: "center" }}>{n}</span>
                    ))}
                  </div>
                  {COMPARISON.map((row, i) => (
                    <div key={row.label} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px", padding: "11px 16px", borderBottom: i < COMPARISON.length - 1 ? "1px solid var(--border)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(14,30,53,0.3)" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)" }}>{row.label}</span>
                      <div style={{ textAlign: "center" }}><CellCheck value={row.free} /></div>
                      <div style={{ textAlign: "center" }}><CellCheck value={row.pulse} /></div>
                      <div style={{ textAlign: "center" }}><CellCheck value={row.scale} /></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* What we audit — 4 pillars */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 52 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", textAlign: "center", marginBottom: 10 }}>WHAT WE AUDIT</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", textAlign: "center", maxWidth: 440, margin: "0 auto 26px", lineHeight: 1.65 }}>
            Every scan checks all 4 pillars and converts raw data into plain-English dollar impact.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
            {[
              { icon: "⚡", name: "Performance", color: "#e8341a", checks: "LCP, TBT, CLS, FCP, Speed Index", impact: "Google Ads quality score penalty & bounce-rate spike" },
              { icon: "🔍", name: "SEO", color: "#f59e0b", checks: "Crawlability, meta tags, viewport, mobile, structured data", impact: "Organic reach loss % and CTR drop from missing signals" },
              { icon: "♿", name: "Accessibility", color: "#a78bfa", checks: "WCAG 2.1 AA — alt text, contrast, ARIA labels, form labels", impact: "ADA lawsuit risk level (High/Med/Low) and market lockout %" },
              { icon: "🔒", name: "Security", color: "#22d3ee", checks: "Vulnerable JS libraries, HTTPS config, security headers", impact: "Browser trust warnings → checkout abandonment" },
            ].map(p => (
              <div key={p.name} style={{ padding: "18px", borderRadius: 12, background: "var(--surface)", border: `1px solid ${p.color}20`, borderTop: `2px solid ${p.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--text)", letterSpacing: "0.06em" }}>{p.name}</span>
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em", marginBottom: 4 }}>CHECKS</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.55, marginBottom: 10 }}>{p.checks}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: p.color, letterSpacing: "0.08em", marginBottom: 4 }}>BUSINESS IMPACT</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.55 }}>{p.impact}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 52 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", textAlign: "center", marginBottom: 24 }}>WHAT CUSTOMERS SAY</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ padding: "18px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 4, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", marginBottom: 12 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa" }}>{t.stat}</span>
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.65, marginBottom: 10, fontStyle: "italic" }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{t.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{t.role}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ maxWidth: 660, margin: "0 auto 52px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", textAlign: "center", marginBottom: 24 }}>FREQUENTLY ASKED</p>
          {FAQ.map((f, i) => (
            <div key={i} style={{ borderBottom: "1px solid var(--border)" }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: "100%", padding: "15px 0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left", minHeight: 54 }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)", fontWeight: 500, paddingRight: 14, lineHeight: 1.4 }}>{f.q}</span>
                <motion.span animate={{ rotate: openFaq === i ? 180 : 0 }} style={{ color: "var(--muted)", fontSize: 12, flexShrink: 0 }}>▼</motion.span>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.7, paddingBottom: 16 }}>{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ padding: "40px 28px", textAlign: "center", borderRadius: 16, background: "linear-gradient(135deg,rgba(167,139,250,0.08),rgba(167,139,250,0.03))", border: "1.5px solid rgba(167,139,250,0.28)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,5.5vw,52px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 12, lineHeight: 1 }}>
            START <span style={{ color: "#a78bfa", textShadow: "0 0 30px rgba(167,139,250,0.4)" }}>TODAY.</span>
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", marginBottom: 24, maxWidth: 360, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Your competitors are scanning you right now. Unlock your 4-pillar advantage in 60 seconds.
          </p>
          <button onClick={() => handleCheckout(PLANS[1])}
            style={{ padding: "15px 44px", borderRadius: 10, background: "#a78bfa", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: "0.14em", border: "none", cursor: "pointer", boxShadow: "0 0 30px rgba(167,139,250,0.4)" }}>
            GET INSTANT ACCESS →
          </button>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", marginTop: 12 }}>$49/mo · 7-day free trial · Cancel anytime</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 18, flexWrap: "wrap" }}>
            <a href="/legal/privacy" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textDecoration: "underline" }}>Privacy Policy</a>
            <a href="/legal/terms" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textDecoration: "underline" }}>Terms of Service</a>
            <a href="/legal/refund" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textDecoration: "underline" }}>Refund Policy</a>
          </div>
        </motion.div>

      </div>
    </main>
  );
}

export default function Subscribe() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", letterSpacing: "0.1em" }}>LOADING...</span>
      </main>
    }>
      <SubscribeInner />
    </Suspense>
  );
}