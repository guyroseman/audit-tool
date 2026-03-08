"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PLANS = [
  {
    id: "free",
    name: "FREE",
    price: 0,
    badge: "START HERE",
    badgeColor: "#6b7280",
    accent: "rgba(107,114,128,",
    features: [
      ["⚡", "1 manual 4-pillar audit per day"],
      ["📊", "Full Performance · SEO · A11y · Security report"],
      ["💡", "Business-impact dollar estimates"],
      ["🔍", "Itemised findings with fix instructions"],
    ],
    locked: [
      "Weekly automated re-scans",
      "Competitor tracking",
      "SMS & Slack alerts",
    ],
    cta: "RUN FREE AUDIT",
    ctaBg: "#374151",
    ctaShadow: "rgba(0,0,0,0)",
    guarantee: "No credit card · No time limit",
    href: "/funnel",
  },
  {
    id: "pulse",
    name: "NEXUS PULSE",
    price: 49,
    badge: "MOST POPULAR",
    badgeColor: "#a78bfa",
    accent: "rgba(167,139,250,",
    features: [
      ["📡", "Weekly automated 4-pillar scans"],
      ["🔍", "Track up to 3 competitor URLs"],
      ["📱", "SMS + Slack alerts on score drops"],
      ["⚖️", "ADA compliance change monitoring"],
      ["🔒", "Vulnerable library security alerts"],
      ["🤖", "AI Developer Blueprint (4 pillars)"],
      ["🔔", "Make.com & Zapier webhooks"],
      ["📊", "Historical score tracking"],
    ],
    locked: [],
    cta: "ACTIVATE PULSE",
    ctaBg: "#a78bfa",
    ctaShadow: "rgba(167,139,250,0.4)",
    guarantee: "Cancel anytime · Secure checkout",
    href: process.env.NEXT_PUBLIC_LS_PULSE_URL ?? "/login",
  },
  {
    id: "scale",
    name: "NEXUS SCALE",
    price: 149,
    badge: "FOR AGENCIES",
    badgeColor: "#e8341a",
    accent: "rgba(232,52,26,",
    features: [
      ["📡", "Daily automated 4-pillar scans"],
      ["🔍", "Track up to 10 competitor URLs"],
      ["📄", "Weekly white-label PDF reports"],
      ["👥", "3 team seats included"],
      ["⚖️", "Full WCAG audit trail & compliance certs"],
      ["🔒", "Priority security vulnerability alerts"],
      ["🎯", "Dedicated technical support"],
      ["🏷️", "Resell reports to clients (agency licence)"],
    ],
    locked: [],
    cta: "ACTIVATE SCALE",
    ctaBg: "#e8341a",
    ctaShadow: "rgba(232,52,26,0.4)",
    guarantee: "Cancel anytime · White-label from day 1",
    href: process.env.NEXT_PUBLIC_LS_SCALE_URL ?? "/login",
  },
];

const PILLARS = [
  { icon: "⚡", name: "Performance", checks: "LCP, TBT, CLS, FCP, Speed Index", impact: "Google Ads quality score penalty & bounce-rate spike" },
  { icon: "🔍", name: "SEO", checks: "Crawlability, meta tags, viewport, mobile-friendliness, structured data", impact: "Organic reach loss % and CTR drop from missing signals" },
  { icon: "♿", name: "Accessibility", checks: "WCAG 2.1 AA — alt text, contrast ratios, ARIA labels, form labels, lang attr", impact: "ADA lawsuit risk level (High/Med/Low) and market lockout %" },
  { icon: "🔒", name: "Security", checks: "Vulnerable JS libraries, HTTPS config, security response headers", impact: "Browser trust warnings → checkout abandonment" },
];

const FAQ = [
  { q: "What's in the free audit?", a: "Every free scan runs the full 4-pillar engine — Performance, SEO, Accessibility, and Security — powered by the Google PageSpeed Insights API. You get the complete report: findings, business impact in dollars, and exact fixes. No credit card." },
  { q: "What does Pulse add on top of free?", a: "Pulse automates the whole process. Weekly re-scans of your site plus up to 3 competitors, with SMS or Slack alerts the moment a score drops. You also get the AI Developer Blueprint — a prioritised 4-pillar task list your dev can execute immediately." },
  { q: "How does ADA compliance monitoring work?", a: "Every weekly scan re-checks your accessibility score against WCAG 2.1 AA. If it drops — say a new image is missing alt text or a contrast ratio fails — you get an alert before it becomes a legal issue. ADA website lawsuits increased 300% between 2017 and 2023." },
  { q: "Are the scores from real Google data?", a: "Yes. We call the official Google PageSpeed Insights API — the same data source that Chrome DevTools and Google Search Console use. Scores are real, not simulated." },
  { q: "Can I cancel anytime?", a: "Yes. Manage or cancel via the Lemon Squeezy customer portal. No lock-in, no cancellation fees, no questions asked." },
  { q: "Does Scale include white-label reports for clients?", a: "Yes. Scale includes weekly white-label PDF reports you can send directly to clients under your brand. It's a ready-made recurring deliverable." },
];

const TESTIMONIALS = [
  { name: "James H.", role: "SaaS Founder", body: "Found out my main competitor dropped from 81 to 47 overnight. Called 3 of their prospects that week. Pulse paid for itself in 20 minutes.", stat: "↑ 58pts in 30 days" },
  { name: "Asha P.", role: "E-commerce Director", body: "We were bleeding on mobile and didn't know. The weekly scan caught a third-party script that added 3.2s to every load. Fixed in a day.", stat: "$12k recovered" },
  { name: "Marcus T.", role: "Law Firm Partner", body: "Nexus flagged our site as HIGH ADA risk. Found out before a lawsuit did. Fixed in a week, compliance cert on file.", stat: "$50k lawsuit avoided" },
  { name: "Tom W.", role: "Agency Owner", body: "I resell Scale as part of our retainer. White-label PDF goes straight to clients. It's a recurring revenue stream that runs itself.", stat: "12 clients on Scale" },
];

export default function Subscribe() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const discount = billing === "annual" ? 0.17 : 0;

  function handleCheckout(plan: typeof PLANS[0]) {
    if (plan.id === "free") { window.location.href = plan.href; return; }
    const url = plan.href;
    if (!url || url === "/login") { window.location.href = "/login"; return; }
    window.location.href = url;
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-body)", position: "relative", zIndex: 10 }}>

      <nav style={{ width: "100%", maxWidth: 1000, margin: "0 auto", padding: "18px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <svg width={20} height={20} viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)", letterSpacing: "0.1em" }}>NEXUS</span>
        </a>
        <a href="/funnel" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "none", letterSpacing: "0.08em" }}>← Free audit</a>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 16px 80px" }}>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa", letterSpacing: "0.14em", marginBottom: 18 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} className="animate-pulse" />
            PERFORMANCE · SEO · ACCESSIBILITY · SECURITY
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px,7vw,72px)", lineHeight: 0.94, letterSpacing: "0.02em", marginBottom: 16 }}>
            KNOW BEFORE<br /><span style={{ color: "#a78bfa", textShadow: "0 0 40px rgba(167,139,250,0.4)" }}>YOUR COMPETITORS</span><br />DO.
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(14px,2.5vw,16px)", color: "var(--text2)", maxWidth: 500, margin: "0 auto 24px", lineHeight: 1.75 }}>
            Nexus monitors your full digital health across all 4 pillars automatically. You get alerted the moment anything changes. No dashboards to babysit.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 4 }}>
            {(["monthly", "annual"] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                style={{ padding: "7px 16px", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", cursor: "pointer", border: "none", background: billing === b ? "#a78bfa" : "transparent", color: billing === b ? "#fff" : "var(--muted)", transition: "all 0.2s", position: "relative" }}>
                {b.toUpperCase()}
                {b === "annual" && billing !== "annual" && (
                  <span style={{ position: "absolute", top: -8, right: -8, fontFamily: "var(--font-mono)", fontSize: 8, color: "#10b981", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", padding: "1px 5px", borderRadius: 4 }}>-17%</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 52 }}>
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ borderRadius: 16, border: `1px solid ${plan.accent}0.3)`, background: `linear-gradient(135deg,${plan.accent}0.07),${plan.accent}0.02))`, padding: "22px 20px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "inline-flex", marginBottom: 12, padding: "3px 10px", borderRadius: 4, background: `${plan.accent}0.12)`, border: `1px solid ${plan.accent}0.25)` }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: plan.badgeColor, letterSpacing: "0.1em" }}>{plan.badge}</span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--text)", letterSpacing: "0.08em", marginBottom: 10 }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 5, marginBottom: 4 }}>
                {plan.price === 0
                  ? <span style={{ fontFamily: "var(--font-display)", fontSize: 44, color: plan.badgeColor, lineHeight: 1 }}>FREE</span>
                  : <>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 44, color: plan.badgeColor, lineHeight: 1 }}>
                        ${billing === "annual" ? Math.round(plan.price * (1 - discount)) : plan.price}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginBottom: 7 }}>/mo</span>
                      {billing === "annual" && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textDecoration: "line-through", marginBottom: 7 }}>${plan.price}</span>}
                    </>
                }
              </div>
              {billing === "annual" && plan.price > 0 && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#10b981", marginBottom: 4 }}>Save ${Math.round(plan.price * discount * 12)}/year</div>
              )}
              <div style={{ height: 1, background: `${plan.accent}0.15)`, margin: "14px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1, marginBottom: 16 }}>
                {plan.features.map(([icon, text]) => (
                  <div key={text} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.45 }}>{text}</span>
                  </div>
                ))}
                {plan.locked.length > 0 && plan.locked.map(text => (
                  <div key={text} style={{ display: "flex", gap: 9, alignItems: "flex-start", opacity: 0.35 }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>🔒</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>{text}</span>
                  </div>
                ))}
              </div>
              <motion.button onClick={() => handleCheckout(plan)} whileTap={{ scale: 0.98 }}
                style={{ width: "100%", padding: "14px", borderRadius: 10, background: plan.ctaBg, color: "#fff", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", border: "none", cursor: "pointer", boxShadow: `0 0 20px ${plan.ctaShadow}` }}>
                {plan.cta} →
              </motion.button>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textAlign: "center", marginTop: 10 }}>{plan.guarantee}</p>
            </motion.div>
          ))}
        </div>

        {/* What we audit */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 52 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", textAlign: "center", marginBottom: 10 }}>WHAT WE AUDIT</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", textAlign: "center", maxWidth: 440, margin: "0 auto 26px", lineHeight: 1.65 }}>
            Every scan checks all 4 pillars and converts raw data into plain-English dollar impact.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
            {PILLARS.map(p => (
              <div key={p.name} style={{ padding: "16px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--text)", letterSpacing: "0.06em" }}>{p.name}</span>
                </div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em", marginBottom: 4 }}>CHECKS</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.55, marginBottom: 10 }}>{p.checks}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.08em", marginBottom: 4 }}>BUSINESS IMPACT</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.55 }}>{p.impact}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ marginBottom: 52 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", textAlign: "center", marginBottom: 26 }}>HOW IT WORKS</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
            {[
              { n: "01", title: "Run your free audit", body: "Paste your URL. Full 4-pillar scan in 30–60 seconds." },
              { n: "02", title: "Get your dollar report", body: "Every finding translated into business impact and monthly cost." },
              { n: "03", title: "Activate monitoring", body: "Pulse watches your site + competitors weekly. SMS alert on any change." },
              { n: "04", title: "Execute the blueprint", body: "AI-generated dev tasks ordered by ROI across all 4 pillars." },
            ].map(s => (
              <div key={s.n} style={{ padding: "16px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "rgba(167,139,250,0.22)", letterSpacing: "-2px", marginBottom: 10 }}>{s.n}</div>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 5 }}>{s.title}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: 52 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", textAlign: "center", marginBottom: 24 }}>WHAT CUSTOMERS SAY</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ padding: "16px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 4, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", marginBottom: 12 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a78bfa" }}>{t.stat}</span>
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.65, marginBottom: 10, fontStyle: "italic" }}>&ldquo;{t.body}&rdquo;</p>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{t.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>{t.role}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ maxWidth: 660, margin: "0 auto 52px" }}>
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ padding: "36px 24px", textAlign: "center", borderRadius: 16, background: "linear-gradient(135deg,rgba(167,139,250,0.08),rgba(167,139,250,0.03))", border: "1px solid rgba(167,139,250,0.22)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px,5vw,46px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 10 }}>
            START <span style={{ color: "#a78bfa", textShadow: "0 0 30px rgba(167,139,250,0.4)" }}>TODAY.</span>
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", marginBottom: 22, maxWidth: 360, margin: "0 auto 22px", lineHeight: 1.7 }}>
            Unlock your 4-pillar competitive advantage in 60 seconds.
          </p>
          <button onClick={() => handleCheckout(PLANS[1])}
            style={{ padding: "15px 44px", borderRadius: 10, background: "#a78bfa", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: "0.14em", border: "none", cursor: "pointer", boxShadow: "0 0 30px rgba(167,139,250,0.35)" }}>
            GET INSTANT ACCESS →
          </button>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", marginTop: 10 }}>$49/mo · Cancel anytime · Secure checkout</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            <a href="/legal/privacy" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textDecoration: "underline" }}>Privacy Policy</a>
            <a href="/legal/terms" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textDecoration: "underline" }}>Terms of Service</a>
            <a href="/legal/refund" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textDecoration: "underline" }}>Refund Policy</a>
          </div>
        </motion.div>

      </div>
    </main>
  );
}