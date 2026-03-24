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
  page?: "home" | "funnel" | "subscribe" | "dashboard" | "login" | "account" | "about" | "blog";
}

const NAV_LINK: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em",
  textDecoration: "none", padding: "7px 14px", borderRadius: 6,
  border: "1px solid var(--border2)", background: "var(--surface)",
  color: "var(--text2)", transition: "all 0.15s", whiteSpace: "nowrap" as const,
};

const NAV_PRIMARY: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em",
  textDecoration: "none", padding: "7px 18px", borderRadius: 6,
  background: "var(--accent)", color: "#fff",
  boxShadow: "0 0 18px rgba(232,52,26,0.35)", transition: "all 0.15s",
  border: "none", whiteSpace: "nowrap" as const,
};

export function NavBar({ maxWidth = 1280, page }: NavBarProps) {
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
      <div style={{ maxWidth, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none" }}><NexusLogo size={20} /></a>

        {/* Centre links */}
        <div className="nav-centre-links" style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <a href="/blog" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: page === "blog" ? "var(--text)" : "var(--muted)", letterSpacing: "0.1em", textDecoration: "none", padding: "6px 12px", borderRadius: 5, transition: "color 0.15s" }}>
            BLOG
          </a>
          <a href="/subscribe" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: page === "subscribe" ? "#a78bfa" : "var(--muted)", letterSpacing: "0.1em", textDecoration: "none", padding: "6px 12px", borderRadius: 5, transition: "color 0.15s" }}>
            PRICING
          </a>
          <a href="/about" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: page === "about" ? "var(--text)" : "var(--muted)", letterSpacing: "0.1em", textDecoration: "none", padding: "6px 12px", borderRadius: 5, transition: "color 0.15s" }}>
            ABOUT
          </a>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {loading && (
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ width: 90, height: 34, background: "var(--border)", borderRadius: 6 }} />
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

              {/* Account link */}
              <a href="/account" className="nav-account-link" style={{ ...NAV_LINK, color: page === "account" ? "var(--text)" : "var(--muted)" }}>
                ACCOUNT
              </a>

              {/* Dashboard — primary action */}
              <a href="/dashboard" className="nav-action-link" style={{
                ...NAV_PRIMARY,
                background: page === "dashboard" ? "var(--accent)" : "var(--surface)",
                color: page === "dashboard" ? "#fff" : "var(--text)",
                border: `1px solid ${page === "dashboard" ? "rgba(232,52,26,0.5)" : "var(--border2)"}`,
                boxShadow: page === "dashboard" ? "0 0 18px rgba(232,52,26,0.35)" : "none",
              }}>DASHBOARD</a>
            </div>
          ) : !loading && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <a href="/login" className="nav-action-link" style={NAV_LINK}>SIGN IN</a>
              <a href="/funnel" className="nav-action-link" style={NAV_PRIMARY}>FREE AUDIT →</a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export { NexusLogo };