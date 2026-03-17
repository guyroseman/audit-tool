"use client";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth-context";
import { PLAN_CONFIG } from "../lib/supabase";

const NexusLogo = ({ size = 22 }: { size?: number }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
      <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
    </svg>
    <span style={{ fontFamily: "var(--font-display)", fontSize: size + 2, color: "var(--text)", letterSpacing: "0.1em" }}>NEXUS</span>
  </div>
);

interface NavBarProps {
  maxWidth?: number;
  page?: "home" | "funnel" | "subscribe" | "dashboard" | "login" | "account";
}

export function NavBar({ maxWidth = 860, page }: NavBarProps) {
  const { user, profile, plan, loading, signOut } = useAuth();
  const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];

  return (
    <nav style={{
      width: "100%",
      borderBottom: "1px solid var(--border)",
      background: "rgba(3,7,15,0.97)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0, zIndex: 100,
    }}>
      <div style={{ maxWidth, margin: "0 auto", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none" }}><NexusLogo size={20} /></a>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/subscribe" className="nav-pricing-link"
            style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: page === "subscribe" ? "#a78bfa" : "var(--muted)", letterSpacing: "0.1em", textDecoration: "none", padding: "6px 11px", borderRadius: 5 }}>
            PRICING
          </a>

          {loading && (
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ width: 90, height: 32, background: "var(--border)", borderRadius: 5 }} />
          )}

          {!loading && user ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Plan badge */}
              <span className="nav-plan-badge" style={{
                fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", padding: "4px 9px", borderRadius: 4,
                color: plan === "scale" ? "#10b981" : plan === "pulse" ? "#a78bfa" : "var(--muted2)",
                background: plan === "scale" ? "rgba(16,185,129,0.08)" : plan === "pulse" ? "rgba(167,139,250,0.08)" : "rgba(42,63,88,0.3)",
                border: `1px solid ${plan === "scale" ? "rgba(16,185,129,0.2)" : plan === "pulse" ? "rgba(167,139,250,0.2)" : "var(--border)"}`,
              }}>{planConfig?.label?.toUpperCase() ?? "SCOUT"}</span>

              {/* Dashboard button */}
              <a href="/dashboard" className="nav-action-link" style={{
                fontFamily: "var(--font-mono)", fontSize: 11, color: page === "dashboard" ? "#fff" : "var(--text)",
                textDecoration: "none",
                background: page === "dashboard" ? "var(--accent)" : "var(--surface)",
                border: `1px solid ${page === "dashboard" ? "rgba(232,52,26,0.5)" : "var(--border2)"}`,
                padding: "6px 14px", borderRadius: 6, letterSpacing: "0.1em",
                boxShadow: page === "dashboard" ? "0 0 14px rgba(232,52,26,0.25)" : "none",
                transition: "all 0.15s",
              }}>DASHBOARD</a>

              {/* Account link — shows email prefix, links to /account */}
              <a href="/account" className="nav-account-link" style={{
                fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", background: "none",
                border: "1px solid var(--border)", padding: "6px 11px", borderRadius: 6,
                letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 5,
                textDecoration: "none", transition: "all 0.15s",
              }}>
                <span style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {(profile?.email ?? user.email ?? "").split("@")[0].substring(0, 12)}
                </span>
                <span style={{ color: "var(--accent)", fontSize: 11 }}>↗</span>
              </a>
            </div>
          ) : !loading && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <a href="/login" className="nav-action-link" style={{
                fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)",
                textDecoration: "none", border: "1px solid var(--border2)",
                padding: "7px 14px", borderRadius: 6, letterSpacing: "0.1em",
                background: "var(--surface)", transition: "all 0.15s",
              }}>SIGN IN</a>
              <a href="/funnel" className="nav-action-link" style={{
                fontFamily: "var(--font-mono)", fontSize: 11, color: "#fff",
                textDecoration: "none", background: "var(--accent)",
                padding: "7px 16px", borderRadius: 6, letterSpacing: "0.1em",
                boxShadow: "0 0 16px rgba(232,52,26,0.3)", transition: "all 0.15s",
              }}>FREE AUDIT →</a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export { NexusLogo };