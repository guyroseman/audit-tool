"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { NavBar } from "../components/nav";
import { useAuth } from "../lib/auth-context";
import { PLAN_CONFIG } from "../lib/supabase";


function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) throw new Error("Server error");
      // Sign out locally — auth user is already gone on the server
      const { createClient } = await import("../lib/supabase");
      await createClient().auth.signOut();
      window.location.href = "/";
    } catch {
      setDeleting(false);
      setConfirming(false);
      alert("Error deleting account. Please email billing@nexus-diagnostics.com to request deletion.");
    }
  };

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} type="button"
        style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", cursor: "pointer", textAlign: "center" as const }}>
        DELETE ACCOUNT
      </button>
    );
  }

  return (
    <div style={{ padding: "16px", borderRadius: 10, border: "1px solid rgba(232,52,26,0.3)", background: "rgba(232,52,26,0.04)" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)", marginBottom: 12, textAlign: "center" as const }}>
        This will permanently delete your account and all data within 30 days. This cannot be undone.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleDelete} disabled={deleting}
          style={{ flex: 1, padding: "11px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontFamily: "var(--font-mono)", fontSize: 11, cursor: "pointer", letterSpacing: "0.08em" }}>
          {deleting ? "DELETING..." : "CONFIRM DELETE →"}
        </button>
        <button onClick={() => setConfirming(false)}
          style={{ flex: 1, padding: "11px", borderRadius: 8, background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: 11, cursor: "pointer" }}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

export default function Account() {
  const { user, profile, plan, loading, signOut } = useAuth();

  // Not logged in → redirect to login
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
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
      <NavBar page="account" />

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

          {/* Free user upsell card */}
          {!isPaid && (
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1.5px solid rgba(167,139,250,0.35)", background: "linear-gradient(135deg,rgba(167,139,250,0.07),rgba(167,139,250,0.02))", marginBottom: 6 }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(167,139,250,0.18)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa", letterSpacing: "0.18em" }}>LOCKED — SCOUT PLAN</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", padding: "2px 7px", borderRadius: 3, letterSpacing: "0.1em" }}>7-DAY FREE TRIAL</span>
                </div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", letterSpacing: "0.05em", marginBottom: 4 }}>YOU&apos;RE MISSING CRITICAL INTEL</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>
                  Your free audit gave you a snapshot. Pulse watches your site — and your competitors — every single week.
                </p>
              </div>
              <div style={{ padding: "14px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["🔒", "Weekly re-audit", "Catch regressions before they cost you"],
                  ["🔒", "Competitor tracking (3 URLs)", "See when they overtake you in Google"],
                  ["🔒", "Slack & email alerts", "Notified the moment scores drop"],
                  ["🔒", "ADA compliance watch", "Avoid legal exposure automatically"],
                ].map(([icon, label, sub]) => (
                  <div key={label} style={{ display: "flex", gap: 10, alignItems: "center", opacity: 0.7 }}>
                    <span style={{ fontSize: 14, flexShrink: 0, filter: "grayscale(1)" }}>{icon}</span>
                    <div>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>{label}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", display: "block", letterSpacing: "0.05em", marginTop: 1 }}>{sub}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "14px 22px" }}>
                <a href="/subscribe" style={{ display: "block", padding: "14px 20px", borderRadius: 10, background: "#a78bfa", fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff", textDecoration: "none", letterSpacing: "0.1em", textAlign: "center" as const, boxShadow: "0 0 28px rgba(167,139,250,0.4)" }}>
                  UNLOCK PULSE — START FREE TRIAL →
                </a>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textAlign: "center" as const, marginTop: 8 }}>$49/mo after trial · cancel anytime</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {isPaid && (
              <a href={`https://nexus-diagnostics.lemonsqueezy.com/billing?prefilled_email=${encodeURIComponent(profile?.email ?? user.email ?? "")}`} target="_blank" rel="noopener"
                style={{ display: "block", padding: "14px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text2)", textDecoration: "none", letterSpacing: "0.08em", textAlign: "center" }}>
                MANAGE BILLING (LEMON SQUEEZY) ↗
              </a>
            )}
            <button onClick={signOut}
              style={{ padding: "14px 20px", borderRadius: 10, border: "1px solid rgba(232,52,26,0.25)", background: "transparent", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)", letterSpacing: "0.08em", cursor: "pointer", textAlign: "center" }}>
              SIGN OUT →
            </button>
            <DeleteAccount />
          </div>
        </motion.div>
      </div>
    </main>
  );
}
