"use client";
import React from "react";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "./lib/auth-context";

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const { isAuthed, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = useCallback((targetUrl: string) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) { setError("Enter your website URL to get started."); return; }
    setError("");
    router.push(`/funnel?url=${encodeURIComponent(trimmed)}`);
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 10 }}>

      {/* Nav */}
      <div style={{ width: "100%", maxWidth: 960, padding: "0 16px" }}>
        <nav style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <svg width={20} height={20} viewBox="0 0 28 28" fill="none">
              <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
              <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--text)", letterSpacing: "0.1em" }}>NEXUS</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <a href="/subscribe" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a78bfa", letterSpacing: "0.1em", textDecoration: "none", border: "1px solid rgba(167,139,250,0.25)", padding: "6px 10px", borderRadius: 5, minHeight: 36, display: "flex", alignItems: "center" }}>PRICING</a>
            {!authLoading && (
              isAuthed ? (
                <a href="/dashboard" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em", textDecoration: "none", background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.3)", padding: "6px 12px", borderRadius: 5, minHeight: 36, display: "flex", alignItems: "center" }}>DASHBOARD →</a>
              ) : (
                <>
                  <a href="/login" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text2)", letterSpacing: "0.1em", textDecoration: "none", border: "1px solid var(--border)", padding: "6px 10px", borderRadius: 5, minHeight: 36, display: "flex", alignItems: "center" }}>SIGN IN</a>
                  <a href="/funnel" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#fff", letterSpacing: "0.1em", textDecoration: "none", background: "var(--accent)", padding: "6px 12px", borderRadius: 5, boxShadow: "0 0 14px rgba(232,52,26,0.25)", minHeight: 36, display: "flex", alignItems: "center" }}>AUDIT →</a>
                </>
              )
            )}
          </div>
        </nav>
      </div>

      <div style={{ width: "100%", maxWidth: 960, padding: "36px 16px 40px", display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>

        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: "100%", maxWidth: 780, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>

          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 100, background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.22)", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.12em" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} className="animate-pulse" />
            FREE 4-PILLAR DIAGNOSTIC · POWERED BY GOOGLE
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px,8.5vw,88px)", lineHeight: 0.92, letterSpacing: "0.02em" }} className="flicker">
            STOP PAYING<br />
            <span style={{ color: "var(--accent)", textShadow: "0 0 60px rgba(232,52,26,0.4)" }}>THE SLOW</span><br />
            SITE TAX
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ fontFamily: "var(--font-body)", fontSize: "clamp(14px,2.5vw,17px)", color: "var(--text2)", maxWidth: 500, lineHeight: 1.75 }}>
            Every slow second costs you more in Google Ads and buries you in search. We scan Performance, SEO, Accessibility, and Security — and tell you exactly how much you&apos;re losing.
          </motion.p>

          {/* URL Input — stacks on mobile */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
            style={{ width: "100%", maxWidth: 600 }}>
            <div className="url-input-row" style={{ display: "flex", gap: 8 }}>
              <input
                type="url"
                inputMode="url"
                autoComplete="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit(url)}
                placeholder="https://yourwebsite.com"
                style={{ flex: 1, background: "var(--surface)", border: `1px solid ${error ? "rgba(232,52,26,0.6)" : "var(--border2)"}`, borderRadius: 10, padding: "15px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 16, outline: "none", minWidth: 0 }}
              />
              <button onClick={() => handleSubmit(url)} className="btn-primary"
                style={{ padding: "15px 20px", borderRadius: 10, whiteSpace: "nowrap", fontSize: 13, flexShrink: 0 }}>
                SCAN →
              </button>
            </div>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", marginTop: 8 }}>
                ⚠ {error}
              </motion.p>
            )}
          </motion.div>

          {/* Hero Stats — updated to $ */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.34 }}
            className="hero-stats"
            style={{ display: "flex", gap: 32, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              ["43%", "avg SEO reach lost"],
              ["$2,100", "avg monthly ad overspend"],
              ["300%", "rise in ADA lawsuits since 2020"],
            ].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,4vw,30px)", color: "var(--text)", letterSpacing: "0.04em" }}>{v}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", marginTop: 3, letterSpacing: "0.08em" }}>{l}</div>
              </div>
            ))}
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em" }}>
            GOOGLE PAGESPEED INSIGHTS API · NO SIGN-UP REQUIRED · FREE
          </motion.p>
        </motion.section>

        {/* WHAT WE SCAN — 4 pillars */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, width: "100%", maxWidth: 760, marginTop: 36 }}>
          {[
            { icon: "⚡", title: "Performance", desc: "LCP, TBT, CLS — your Google Ads quality score penalty and bounce rate loss." },
            { icon: "🔍", title: "SEO", desc: "Crawlability, meta gaps, mobile indexing — every reason Google is hiding you." },
            { icon: "♿", title: "Accessibility", desc: "WCAG 2.1 AA — ADA lawsuit risk, market lockout %, alt text and contrast gaps." },
            { icon: "🔒", title: "Security", desc: "Vulnerable JS libraries, HTTPS, headers — trust signals that kill checkout conversion." },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ padding: "14px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", textAlign: "left" }}>
              <div style={{ fontSize: 18, marginBottom: 7 }}>{icon}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text2)", letterSpacing: "0.08em", marginBottom: 5 }}>{title}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </motion.div>

        {/* URGENCY STRIP */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.52 }}
          style={{ width: "100%", maxWidth: 760, marginTop: 16, padding: "14px 16px", borderRadius: 10, background: "rgba(232,52,26,0.04)", border: "1px solid rgba(232,52,26,0.12)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>⚠ LIVE SCAN</span>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)", lineHeight: 1.5, flex: 1 }}>
            Most sites we scan are invisibly leaking <strong style={{ color: "var(--text)" }}>$1,000–$4,000/month</strong> across ads, SEO, and compliance risk. Scan takes 60 seconds.
          </p>
          <button onClick={() => (document.querySelector("input") as HTMLInputElement)?.focus()} className="btn-primary"
            style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "8px 14px", borderRadius: 6, whiteSpace: "nowrap", minHeight: 36 }}>
            SCAN MY SITE →
          </button>
        </motion.div>

        {/* SIGN IN NUDGE */}
        {!authLoading && !isAuthed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ width: "100%", maxWidth: 760, marginTop: 10, padding: "12px 16px", borderRadius: 10, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text2)" }}>
              Already have an account? Skip the email gate.
            </p>
            <a href="/login" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a78bfa", textDecoration: "none", border: "1px solid rgba(167,139,250,0.3)", padding: "6px 12px", borderRadius: 5, whiteSpace: "nowrap", minHeight: 36, display: "flex", alignItems: "center" }}>
              SIGN IN →
            </a>
          </motion.div>
        )}

      </div>

      {/* Footer */}
      <footer style={{ width: "100%", maxWidth: 960, margin: "0 auto", padding: "16px 16px 24px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--muted)", letterSpacing: "0.08em" }}>NEXUS</span>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[["Pricing", "/subscribe"], ["Dashboard", isAuthed ? "/dashboard" : "/login"], ["Free Audit", "/funnel"], ["Privacy", "/legal/privacy"], ["Terms", "/legal/terms"]].map(([l, h]) => (
            <a key={l} href={h} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textDecoration: "none", letterSpacing: "0.08em" }}>{l}</a>
          ))}
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)" }}>© {new Date().getFullYear()} Nexus Diagnostics</p>
      </footer>

    </main>
  );
}