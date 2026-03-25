"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const MOBILE_LINK: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-mono)", fontSize: 14,
  letterSpacing: "0.12em", textDecoration: "none", padding: "16px 0",
  color: "var(--text2)", borderBottom: "1px solid var(--border)",
  transition: "color 0.15s",
};

const MOBILE_LINK_PRIMARY: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-mono)", fontSize: 14,
  letterSpacing: "0.12em", textDecoration: "none", padding: "16px 20px",
  color: "#fff", background: "var(--accent)", borderRadius: 8,
  textAlign: "center" as const, boxShadow: "0 0 24px rgba(232,52,26,0.3)",
  marginTop: 8,
};

const MOBILE_LINK_SMALL: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-mono)", fontSize: 10,
  letterSpacing: "0.1em", textDecoration: "none", padding: "10px 0",
  color: "var(--muted)", borderBottom: "1px solid var(--border)",
};

export function NavBar({ maxWidth = 1280, page }: NavBarProps) {
  const { user, plan, loading, signOut } = useAuth();
  const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenu = () => setMobileOpen(false);

  return (
    <>
      <nav style={{
        width: "100%",
        borderBottom: "1px solid var(--border)",
        background: "rgba(3,7,15,0.97)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none" }} onClick={closeMenu}><NexusLogo size={20} /></a>

          {/* Centre links — hidden on mobile */}
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

            {/* Hamburger button — mobile only */}
            <button
              className="nav-hamburger"
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              style={{
                background: "none", border: "1px solid var(--border2)", borderRadius: 6,
                padding: 0, cursor: "pointer", minHeight: 40, width: 40,
                display: "flex", flexDirection: "column", gap: 5,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <motion.span
                animate={mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "block", width: 18, height: 2, background: "var(--text)", borderRadius: 1 }}
              />
              <motion.span
                animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.15 }}
                style={{ display: "block", width: 18, height: 2, background: "var(--text)", borderRadius: 1 }}
              />
              <motion.span
                animate={mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "block", width: 18, height: 2, background: "var(--text)", borderRadius: 1 }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="nav-mobile-overlay"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: 58, left: 0, right: 0, bottom: 0,
              background: "rgba(3,7,15,0.98)",
              backdropFilter: "blur(16px)",
              zIndex: 99,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              padding: "8px 28px 40px",
            }}
          >
            {/* Main pages */}
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", letterSpacing: "0.14em", padding: "16px 0 6px" }}>PAGES</p>
              <a href="/blog" onClick={closeMenu} style={{ ...MOBILE_LINK, color: page === "blog" ? "var(--accent)" : "var(--text2)" }}>BLOG</a>
              <a href="/subscribe" onClick={closeMenu} style={{ ...MOBILE_LINK, color: page === "subscribe" ? "#a78bfa" : "var(--text2)" }}>PRICING</a>
              <a href="/about" onClick={closeMenu} style={{ ...MOBILE_LINK, color: page === "about" ? "var(--text)" : "var(--text2)" }}>ABOUT</a>
            </div>

            {/* Auth section */}
            <div style={{ marginBottom: 8 }}>
              {!loading && user ? (
                <>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", letterSpacing: "0.14em", padding: "16px 0 6px" }}>ACCOUNT</p>
                  <a href="/account" onClick={closeMenu} style={{ ...MOBILE_LINK, color: page === "account" ? "var(--text)" : "var(--text2)" }}>ACCOUNT SETTINGS</a>
                  {plan && (
                    <div style={{ ...MOBILE_LINK, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>PLAN</span>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", padding: "3px 9px", borderRadius: 4,
                        color: plan === "scale" ? "#10b981" : plan === "pulse" ? "#a78bfa" : "var(--muted2)",
                        background: plan === "scale" ? "rgba(16,185,129,0.08)" : plan === "pulse" ? "rgba(167,139,250,0.08)" : "rgba(42,63,88,0.3)",
                        border: `1px solid ${plan === "scale" ? "rgba(16,185,129,0.2)" : plan === "pulse" ? "rgba(167,139,250,0.2)" : "var(--border)"}`,
                      }}>{planConfig?.label?.toUpperCase() ?? "SCOUT"}</span>
                    </div>
                  )}
                  <a href="/dashboard" onClick={closeMenu} style={MOBILE_LINK_PRIMARY}>DASHBOARD →</a>
                  <button
                    onClick={() => { signOut(); closeMenu(); }}
                    style={{ ...MOBILE_LINK, background: "none", border: "none", borderBottom: "1px solid var(--border)", width: "100%", textAlign: "left", cursor: "pointer", marginTop: 8, color: "var(--muted)" }}
                  >SIGN OUT</button>
                </>
              ) : !loading && (
                <>
                  <a href="/funnel" onClick={closeMenu} style={MOBILE_LINK_PRIMARY}>FREE AUDIT — 60 SECONDS →</a>
                  <a href="/login" onClick={closeMenu} style={{ ...MOBILE_LINK, marginTop: 8, textAlign: "center" as const, display: "block" }}>SIGN IN</a>
                </>
              )}
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Legal */}
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", letterSpacing: "0.14em", padding: "16px 0 6px" }}>LEGAL</p>
              <a href="/legal/privacy" onClick={closeMenu} style={MOBILE_LINK_SMALL}>PRIVACY POLICY</a>
              <a href="/legal/terms" onClick={closeMenu} style={{ ...MOBILE_LINK_SMALL, borderBottom: "none" }}>TERMS OF SERVICE</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { NexusLogo };
