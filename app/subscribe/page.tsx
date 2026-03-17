"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { NavBar } from "../components/nav";
import { useAuth } from "../lib/auth-context";

const FAQ = [
  { q: "What's in the free audit?", a: "Every free scan runs the full 4-pillar engine — Performance, SEO, Accessibility, and Security — powered by the Google PageSpeed Insights API. You get the complete report with findings, dollar impact, and exact fixes. No credit card required." },
  { q: "What does Pulse add on top of free?", a: "Pulse automates everything. Weekly re-scans of your site plus up to 3 competitors, with SMS or Slack alerts the moment a score drops. You also get the AI Developer Blueprint — a prioritised 4-pillar task list your dev can execute immediately." },
  { q: "How is Pulse different from GTmetrix or Pingdom?", a: "GTmetrix and Pingdom are built for engineers. They output dry charts. Nexus translates the exact same Google data into dollar figures and plain-English business impact. You see 'LCP 4.2s = you're paying 34% more per Google Ad click' — not a raw millisecond number." },
  { q: "How does ADA compliance monitoring work?", a: "Every weekly scan re-checks your accessibility score against WCAG 2.1 AA. If it drops — say a new image is missing alt text — you get an alert before it becomes a legal issue. ADA website lawsuits increased 300% between 2017 and 2023." },
  { q: "Are the scores from real Google data?", a: "Yes. We call the official Google PageSpeed Insights API — the same data source Chrome DevTools and Google Search Console use. Scores are real, not simulated." },
  { q: "Can I cancel anytime?", a: "Yes. Manage or cancel via the Lemon Squeezy customer portal. No lock-in, no cancellation fees, no questions asked." },
  { q: "Does Scale include white-label reports for clients?", a: "Yes. Scale includes weekly white-label PDF reports you can send directly to clients under your own brand. It's a ready-made recurring deliverable that justifies your retainer." },
];

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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const { user, plan: currentPlan, loading: authLoading } = useAuth();

  function handleCheckout(p: { id: string; href: string }) {
    if (p.id === "free") { window.location.href = p.href; return; }

    const lsUrl = p.href;
    const hasCheckoutUrl = lsUrl && lsUrl !== "/login";

    if (!hasCheckoutUrl) {
      // LemonSqueezy not configured yet — payment coming soon
      alert("Payment processing is being finalised. Please contact us directly to subscribe.");
      return;
    }

    if (!user) {
      // Not logged in — send to login, return here after
      window.location.href = `/login?redirect=/subscribe`;
      return;
    }

    // Logged in + checkout URL exists → go pay, pre-fill email + success redirect
    try {
      const url = new URL(lsUrl);
      if (user.email) url.searchParams.set("checkout[email]", user.email);
      url.searchParams.set("checkout[success_url]", `${window.location.origin}/dashboard?refresh=plan`);
      window.location.href = url.toString();
    } catch {
      window.location.href = lsUrl;
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-body)", position: "relative" }}>

      {/* Shared nav — shows SIGN IN / DASHBOARD / plan badge automatically */}
      <NavBar page="subscribe" maxWidth={1280} />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px 80px" }}>

        {/* Redirected from dashboard without paid plan */}
        {reason === "upgrade" && <UpgradeBanner />}

        {/* Already on a paid plan — show account status, no reason to scroll through pricing */}
        {!authLoading && user && (currentPlan === "pulse" || currentPlan === "scale") && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ margin: "20px 0 28px", padding: "18px 22px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#10b981", letterSpacing: "0.12em", marginBottom: 3 }}>ACTIVE SUBSCRIPTION</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)" }}>
                  You&rsquo;re on <strong style={{ color: currentPlan === "scale" ? "#10b981" : "#a78bfa" }}>NEXUS {currentPlan.toUpperCase()}</strong>. Your dashboard is live.
                </div>
              </div>
            </div>
            <a href="/dashboard" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#fff", background: "#10b981", padding: "9px 20px", borderRadius: 8, textDecoration: "none", letterSpacing: "0.1em", boxShadow: "0 0 20px rgba(16,185,129,0.3)", whiteSpace: "nowrap" }}>
              GO TO DASHBOARD →
            </a>
          </motion.div>
        )}

        {/* Not logged in — gentle nudge to sign in */}
        {!authLoading && !user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ textAlign: "center", padding: "10px 0 4px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.06em" }}>
              Already have an account?{" "}
              <a href="/login?redirect=/subscribe" style={{ color: "#a78bfa", textDecoration: "none" }}>Sign in to manage your plan →</a>
            </p>
          </motion.div>
        )}

        {/* Compact header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", padding: "clamp(28px,5vw,48px) 0 28px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,5vw,52px)", lineHeight: 1, letterSpacing: "0.04em", marginBottom: 10 }}>
            CHOOSE YOUR <span style={{ color: "#a78bfa" }}>PLAN</span>
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", maxWidth: 420, margin: "0 auto" }}>
            Every plan includes the full 4-pillar audit engine. Paid plans add automation, alerts, and competitor intelligence.
          </p>
        </motion.div>

        {/* Plan cards — compact 3-col */}
        <div className="plan-cards" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32, alignItems: "stretch", isolation: "isolate" }}>
          {[
            {
              id: "free", name: "SCOUT", price: "FREE", tagline: "Diagnose the bleeding. Once a day.",
              badge: "FREE FOREVER", badgeColor: "#4a6080", accentColor: "rgba(74,96,128,",
              popular: false, ctaBg: "var(--surface2)", ctaColor: "var(--text2)", cta: "RUN FREE AUDIT",
              href: "/funnel", guarantee: "No credit card. Forever free.",
              features: ["1 manual 4-pillar audit per day", "Full Performance, SEO, A11y & Security report", "Dollar impact per finding", "Fix instructions included"],
              locked: ["Auto scans", "Competitor tracking", "Alerts", "AI Blueprint"],
            },
            {
              id: "pulse", name: "PULSE", price: "$49", tagline: "Set it. Watch it. Fix it automatically.",
              badge: "★ MOST POPULAR", badgeColor: "#a78bfa", accentColor: "rgba(167,139,250,",
              popular: true, ctaBg: "#a78bfa", ctaColor: "#fff", cta: "START 7-DAY FREE TRIAL",
              href: process.env.NEXT_PUBLIC_LS_PULSE_URL ?? "/login", guarantee: "7-day money-back. Cancel anytime.",
              features: ["Everything in Scout", "Weekly automated 4-pillar scans", "Track 3 competitor URLs", "Slack + SMS score alerts", "ADA compliance monitoring", "AI Developer Blueprint by ROI", "Webhooks for Make.com / Zapier"],
              locked: [],
            },
            {
              id: "scale", name: "SCALE", price: "$149", tagline: "Your clients pay you for this report.",
              badge: "FOR AGENCIES", badgeColor: "#e8341a", accentColor: "rgba(232,52,26,",
              popular: false, ctaBg: "#e8341a", ctaColor: "#fff", cta: "ACTIVATE SCALE",
              href: process.env.NEXT_PUBLIC_LS_SCALE_URL ?? "/login", guarantee: "Cancel anytime. White-label day 1.",
              features: ["Everything in Pulse", "Daily scans (vs weekly)", "Track 10 competitor URLs", "White-label PDF reports for clients", "3 team seats included", "WCAG compliance certificates", "Agency resell licence"],
              locked: [],
            },
          ].map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              style={{ borderRadius: 14, border: plan.popular ? `1.5px solid ${plan.accentColor}0.5)` : `1px solid ${plan.accentColor}0.2)`, background: plan.popular ? `linear-gradient(135deg,${plan.accentColor}0.1),${plan.accentColor}0.04))` : "var(--surface)", padding: "20px 18px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: plan.popular ? `0 0 60px ${plan.accentColor}0.18), 0 16px 48px rgba(0,0,0,0.35)` : "none" }}>

              {plan.popular && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${plan.accentColor}1), transparent)` }} />}

              <div style={{ display: "inline-flex", alignSelf: "flex-start", marginBottom: 10, padding: "2px 8px", borderRadius: 4, background: `${plan.accentColor}0.12)`, border: `1px solid ${plan.accentColor}0.3)` }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: plan.badgeColor, letterSpacing: "0.1em" }}>{plan.badge}</span>
              </div>

              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", letterSpacing: "0.06em", marginBottom: 2 }}>{plan.name}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)", marginBottom: 10, lineHeight: 1.4 }}>{plan.tagline}</div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 12 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 40, color: plan.badgeColor, lineHeight: 1 }}>{plan.price}</span>
                {plan.price !== "FREE" && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginBottom: 7 }}>/mo</span>}
              </div>

              {plan.id === "pulse" && (
                <div style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 10 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#10b981", letterSpacing: "0.08em" }}>Avg user recovers $2,100/mo. Pays back in 19 hours.</span>
                </div>
              )}

              <div style={{ height: 1, background: `${plan.accentColor}0.15)`, marginBottom: 12 }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, marginBottom: 14 }}>
                {plan.features.map(text => (
                  <div key={text} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 0" }}>
                    <span style={{ color: "#10b981", fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: text === "Everything in Scout" || text === "Everything in Pulse" ? "var(--muted)" : "var(--text2)", lineHeight: 1.4 }}>{text}</span>
                  </div>
                ))}
                {plan.locked.map(text => (
                  <div key={text} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "4px 0", opacity: 0.3 }}>
                    <span style={{ fontSize: 10, flexShrink: 0, marginTop: 2 }}>—</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--muted)", lineHeight: 1.4, textDecoration: "line-through" }}>{text}</span>
                  </div>
                ))}
              </div>

              <motion.button onClick={() => handleCheckout(plan)} whileTap={{ scale: 0.98 }}
                style={{ width: "100%", padding: "13px", borderRadius: 9, background: plan.ctaBg, color: plan.ctaColor, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", border: "none", cursor: "pointer", boxShadow: plan.popular ? "0 0 24px rgba(167,139,250,0.4)" : "none", marginBottom: 8, position: "relative", zIndex: 1 }}>
                {plan.cta} →
              </motion.button>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted2)", textAlign: "center" }}>{plan.guarantee}</p>
            </motion.div>
          ))}
        </div>

        {/* FAQ — collapsed by default */}
        <div style={{ maxWidth: 680, margin: "0 auto 32px" }}>
          <button onClick={() => setShowTable(p => !p)}
            style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 auto 0", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em", padding: "8px 0" }}>
            <motion.span animate={{ rotate: showTable ? 180 : 0 }} style={{ display: "inline-block" }}>▼</motion.span>
            {showTable ? "HIDE" : "SHOW"} FREQUENTLY ASKED QUESTIONS
          </button>
          <AnimatePresence>
            {showTable && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden", marginTop: 12 }}>
                {FAQ.map((f, i) => (
                  <div key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      style={{ width: "100%", padding: "13px 0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left", minHeight: 50 }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text)", fontWeight: 500, paddingRight: 14, lineHeight: 1.4 }}>{f.q}</span>
                      <motion.span animate={{ rotate: openFaq === i ? 180 : 0 }} style={{ color: "var(--muted)", fontSize: 11, flexShrink: 0 }}>▼</motion.span>
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.7, paddingBottom: 14 }}>{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer legal links */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, paddingBottom: 32, flexWrap: "wrap" }}>
          {[["Privacy Policy", "/legal/privacy"], ["Terms of Service", "/legal/terms"], ["Refund Policy", "/legal/refund"]].map(([l, h]) => (
            <a key={l} href={h} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textDecoration: "underline" }}>{l}</a>
          ))}
        </div>

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