"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PLANS = [
  {
    id: "pulse",
    name: "NEXUS PULSE",
    price: 49,
    period: "mo",
    badge: "MOST POPULAR",
    badgeColor: "#a78bfa",
    accent: "rgba(167,139,250,",
    features: [
      ["📡", "Weekly automated audit of your site"],
      ["🔍", "Track 3 competitor URLs side-by-side"],
      ["📱", "SMS alert when a competitor overtakes your score"],
      ["📈", "Monthly PDF performance report"],
      ["📊", "Core Web Vitals trend charts"],
      ["🔔", "Email alerts for score drops > 10 points"],
    ],
    cta: "ACTIVATE PRO DASHBOARD",
    ctaBg: "#a78bfa",
    ctaShadow: "rgba(167,139,250,0.4)",
    guarantee: "Cancel anytime · Secure checkout via Lemon Squeezy",
    // YOUR LIVE LEMON SQUEEZY LINK:
    checkoutUrl: "https://nexus-diagnostics.lemonsqueezy.com/checkout/buy/a537b230-59dc-4950-8b58-58af49e3301a"
  },
  {
    id: "pulse-pro",
    name: "NEXUS PULSE PRO",
    price: 149,
    period: "mo",
    badge: "BEST FOR AGENCIES",
    badgeColor: "#e8341a",
    accent: "rgba(232,52,26,",
    features: [
      ["📡", "Daily automated audit of your site"],
      ["🔍", "Track 10 competitor URLs side-by-side"],
      ["📱", "Instant SMS + WhatsApp alerts"],
      ["📈", "Weekly PDF white-label report (your branding)"],
      ["📊", "Full Core Web Vitals + Lighthouse history"],
      ["🔔", "Slack & webhook integrations"],
      ["👥", "3 team seats included"],
      ["🎯", "Priority email support"],
    ],
    cta: "ACTIVATE AGENCY DASHBOARD",
    ctaBg: "#e8341a",
    ctaShadow: "rgba(232,52,26,0.4)",
    guarantee: "Cancel anytime · White-label ready from day 1",
    // FOR NOW, redirecting to the same link. Create a $149 product in Lemon Squeezy later and put that link here!
    checkoutUrl: "https://nexus-diagnostics.lemonsqueezy.com/checkout/buy/a537b230-59dc-4950-8b58-58af49e3301a"
  },
];

const FAQ = [
  { q: "What happens after I subscribe?", a: "You will be instantly redirected to your Pro Dashboard, where you can configure your competitor URLs and set up your webhooks." },
  { q: "Do I need to install anything?", a: "No. Just enter your URL and your competitors' URLs. We do everything else — auditing, monitoring, alerting, reporting." },
  { q: "How accurate are the competitor scores?", a: "We use the same Google PageSpeed API that powers Chrome's Lighthouse tool. Same data Google uses to rank your site." },
  { q: "Can I cancel later?", a: "Yes. You can manage your subscription or cancel at any time via the Customer Portal." },
  { q: "What if my score is already good?", a: "Then you use Pulse to make sure it stays that way — and to find out the moment a competitor closes the gap." },
];

const TESTIMONIALS = [
  { name: "James H.", role: "SaaS Founder", body: "Found out my main competitor dropped from 81 to 47 overnight. I called 3 of their prospects that week. Pulse paid for itself in 20 minutes.", score: "↑ 58pts in 30 days" },
  { name: "Asha P.", role: "E-commerce Director", body: "We were bleeding on mobile and didn't know. The weekly audit caught a third-party script that added 3.2s to every page load. Fixed in a day.", score: "$12k recovered" },
  { name: "Tom W.", role: "Agency Owner", body: "I resell Pulse Pro as part of our SEO retainer. Clients love the white-label PDF. It's basically a recurring revenue stream that runs itself.", score: "12 clients on Pulse" },
];

export default function Subscribe() {
  const [billing, setBilling] = useState<"monthly"|"annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number|null>(null);

  function handleCheckout(url: string) {
    window.location.href = url;
  }

  const discount = billing === "annual" ? 0.17 : 0;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-body)", position: "relative", zIndex: 10 }}>

      {/* Nav */}
      <nav style={{ width: "100%", maxWidth: 900, margin: "0 auto", padding: "28px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width={24} height={24} viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--text)", letterSpacing: "0.1em" }}>NEXUS</span>
        </a>
        <a href="/funnel" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textDecoration: "none" }}>← Back to free audit</a>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 80px" }}>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 52 }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", fontFamily: "var(--font-mono)", fontSize: 10, color: "#a78bfa", letterSpacing: "0.15em", marginBottom: 20 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} className="animate-pulse" />
            AUTOMATED · ZERO HUMAN EFFORT · SCALES TO INFINITY
          </motion.div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px,8vw,80px)", lineHeight: 0.92, letterSpacing: "0.02em", marginBottom: 18 }}>
            KNOW BEFORE<br /><span style={{ color: "#a78bfa", textShadow: "0 0 40px rgba(167,139,250,0.4)" }}>YOUR COMPETITORS</span><br />DO.
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "var(--text2)", maxWidth: 540, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Nexus Pulse monitors your site and your competitors automatically. The moment their score drops or yours falls — you get an SMS. No dashboards. No manual checks. Just intelligence, delivered.
          </p>

          {/* Billing toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 4, marginBottom: 40 }}>
            {(["monthly","annual"] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                style={{ padding: "8px 20px", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", border: "none", background: billing === b ? "#a78bfa" : "transparent", color: billing === b ? "#fff" : "var(--muted)", transition: "all 0.2s", position: "relative" }}>
                {b.toUpperCase()}
                {b === "annual" && billing !== "annual" && (
                  <span style={{ position: "absolute", top: -8, right: -8, fontFamily: "var(--font-mono)", fontSize: 8, color: "#10b981", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", padding: "1px 5px", borderRadius: 4, letterSpacing: "0.08em" }}>-17%</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16, marginBottom: 60 }}>
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ borderRadius: 16, border: `1px solid ${plan.accent}0.3)`, background: `linear-gradient(135deg,${plan.accent}0.06),${plan.accent}0.02))`, padding: "28px 24px", position: "relative", overflow: "hidden" }}>

              {/* Badge */}
              <div style={{ display: "inline-flex", marginBottom: 16, padding: "3px 10px", borderRadius: 4, background: `${plan.accent}0.12)`, border: `1px solid ${plan.accent}0.25)` }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: plan.badgeColor, letterSpacing: "0.12em" }}>{plan.badge}</span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", letterSpacing: "0.08em", marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 52, color: plan.badgeColor, lineHeight: 1, letterSpacing: "0.02em" }}>
                    ${billing === "annual" ? Math.round(plan.price * (1 - discount)) : plan.price}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>/{plan.period}</span>
                  {billing === "annual" && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textDecoration: "line-through", marginBottom: 8 }}>${plan.price}</span>
                  )}
                </div>
                {billing === "annual" && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#10b981" }}>
                    You save ${Math.round(plan.price * discount * 12)}/year
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: `${plan.accent}0.15)`, marginBottom: 20 }} />

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {plan.features.map(([icon, text]) => (
                  <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>

              <motion.button onClick={() => handleCheckout(plan.checkoutUrl)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ width: "100%", padding: "15px", borderRadius: 10, background: plan.ctaBg, color: "#fff", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", border: "none", cursor: "pointer", boxShadow: `0 0 24px ${plan.ctaShadow}` }}>
                {plan.cta} →
              </motion.button>

              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", textAlign: "center", marginTop: 10 }}>{plan.guarantee}</p>
            </motion.div>
          ))}
        </div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ marginBottom: 60 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.2em", textAlign: "center", marginBottom: 32 }}>HOW IT WORKS</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            {[
              { n:"01", title:"Enter your URLs", body:"Your site + up to 3 (or 10) competitors. Takes 30 seconds." },
              { n:"02", title:"We start scanning", body:"Automated weekly (or daily) audits begin immediately. No setup needed." },
              { n:"03", title:"You get alerted", body:"Score drops or competitor gains — you get an SMS within minutes." },
              { n:"04", title:"Monthly report", body:"A full PDF lands in your inbox each month. White-label on Pro." },
            ].map(step => (
              <div key={step.n} style={{ padding: "20px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "rgba(167,139,250,0.3)", letterSpacing: "-2px", marginBottom: 10 }}>{step.n}</div>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{step.body}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ marginBottom: 60 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.2em", textAlign: "center", marginBottom: 28 }}>WHAT CUSTOMERS SAY</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ padding: "20px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 4, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", marginBottom: 12 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a78bfa" }}>{t.score}</span>
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.65, marginBottom: 14, fontStyle: "italic" }}>&ldquo;{t.body}&rdquo;</p>
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{t.name}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ marginBottom: 60, maxWidth: 680, margin: "0 auto 60px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.2em", textAlign: "center", marginBottom: 28 }}>FREQUENTLY ASKED</p>
          {FAQ.map((f, i) => (
            <div key={i} style={{ borderBottom: "1px solid var(--border)" }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: "100%", padding: "18px 0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text)", fontWeight: 500 }}>{f.q}</span>
                <motion.span animate={{ rotate: openFaq === i ? 180 : 0 }} style={{ color: "var(--muted)", fontSize: 12, flexShrink: 0, marginLeft: 12 }}>▼</motion.span>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.7, paddingBottom: 18 }}>{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        {/* Bottom CTA strip */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ padding: "40px 32px", textAlign: "center", borderRadius: 16, background: "linear-gradient(135deg,rgba(167,139,250,0.08),rgba(167,139,250,0.03))", border: "1px solid rgba(167,139,250,0.22)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,5vw,48px)", color: "var(--text)", letterSpacing: "0.04em", marginBottom: 12 }}>
            START <span style={{ color: "#a78bfa", textShadow: "0 0 30px rgba(167,139,250,0.4)" }}>TODAY.</span>
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Unlock your competitive advantage in the next 60 seconds.
          </p>
          <button onClick={() => handleCheckout(PLANS[0].checkoutUrl)}
            style={{ display: "inline-block", padding: "16px 48px", borderRadius: 10, background: "#a78bfa", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: "0.15em", border: "none", cursor: "pointer", boxShadow: "0 0 30px rgba(167,139,250,0.35)" }}>
            GET INSTANT ACCESS →
          </button>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", marginTop: 12 }}>
            $49/mo · Cancel anytime · Secure checkout via Lemon Squeezy
          </p>
        </motion.div>

      </div>
    </main>
  );
}