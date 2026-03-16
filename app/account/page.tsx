"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { NavBar } from "../components/nav";
import { useAuth } from "../lib/auth-context";
import { PLAN_CONFIG } from "../lib/supabase";

export default function Account() {
  const { user, profile, plan, loading, signOut } = useAuth();

  // Not logged in → redirect to login
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login?redirect=/account";
    }
  }, [loading, user]);

  if (loading || !user) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", letterSpacing: "0.1em" }}>LOADING...</span>
        </motion.div>
      </main>
    );
  }

  const planConfig = PLAN_CONFIG[plan];
  const isPaid = plan === "pulse" || plan === "scale";
  const planColor = plan === "scale" ? "#10b981" : plan === "pulse" ? "#a78bfa" : "var(--muted)";

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <NavBar page="dashboard" />

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 20px" }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 8 }}>YOUR ACCOUNT</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "var(--text)", letterSpacing: "0.04em", marginBottom: 32, lineHeight: 1 }}>PROFILE</h1>

          {/* Account card */}
          <div style={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)", overflow: "hidden", marginBottom: 16 }}>

            {/* Plan header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", background: `linear-gradient(135deg, ${planColor}10, transparent)`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.14em", marginBottom: 4 }}>CURRENT PLAN</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: planColor, letterSpacing: "0.08em", lineHeight: 1 }}>
                  {planConfig.label.toUpperCase()}
                </div>
              </div>
              {isPaid ? (
                <a href="/dashboard" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#fff", background: "var(--accent)", padding: "9px 18px", borderRadius: 8, textDecoration: "none", letterSpacing: "0.1em", boxShadow: "0 0 18px rgba(232,52,26,0.3)" }}>
                  OPEN DASHBOARD →
                </a>
              ) : (
                <a href="/subscribe" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", padding: "9px 18px", borderRadius: 8, textDecoration: "none", letterSpacing: "0.1em" }}>
                  UPGRADE PLAN →
                </a>
              )}
            </div>

            {/* Details */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 4 }}>EMAIL</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text2)" }}>{profile?.email ?? user.email}</div>
              </div>
              {profile?.created_at && (
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 4 }}>MEMBER SINCE</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text2)" }}>
                    {new Date(profile.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
              )}
              {isPaid && profile?.subscription_status && (
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 4 }}>SUBSCRIPTION STATUS</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#10b981", textTransform: "uppercase" }}>{profile.subscription_status}</div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {isPaid && (
              <a href="https://nexus-diagnostics.lemonsqueezy.com/billing" target="_blank" rel="noopener"
                style={{ display: "block", padding: "14px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text2)", textDecoration: "none", letterSpacing: "0.08em", textAlign: "center" }}>
                MANAGE BILLING (LEMON SQUEEZY) ↗
              </a>
            )}
            {!isPaid && (
              <a href="/subscribe"
                style={{ display: "block", padding: "14px 20px", borderRadius: 10, background: "#a78bfa", fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff", textDecoration: "none", letterSpacing: "0.1em", textAlign: "center", boxShadow: "0 0 24px rgba(167,139,250,0.35)" }}>
                UPGRADE TO PULSE — £49/MO →
              </a>
            )}
            <button onClick={signOut}
              style={{ padding: "14px 20px", borderRadius: 10, border: "1px solid rgba(232,52,26,0.25)", background: "transparent", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)", letterSpacing: "0.08em", cursor: "pointer", textAlign: "center" }}>
              SIGN OUT →
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}