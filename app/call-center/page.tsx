"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallCenterContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "your site";

  return (
    <main style={{ minHeight: "100vh", background: "#060d1a", color: "#c9d8e8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", fontFamily: "var(--font-mono, monospace)" }}>
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 14px", borderRadius: 20, background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.2)", marginBottom: 24 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22d3ee", display: "inline-block", boxShadow: "0 0 6px #22d3ee" }}/>
            <span style={{ fontSize: 9, color: "#22d3ee", letterSpacing: "0.14em" }}>NEXUS INFRASTRUCTURE & SALES</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: "clamp(30px,6vw,48px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 16, letterSpacing: "0.02em" }}>
            Let&apos;s plug the leak on{" "}
            <span style={{ color: "#e8341a" }}>{url}</span>
          </h1>
          <p style={{ fontSize: 14, color: "#9ab8d8", lineHeight: 1.7, marginBottom: 36 }}>
            We don&apos;t just speed up code. We rebuild your landing page, optimise your ad placements, and plug our White-Label Call Center directly into your traffic stream to close your leads for you.
          </p>
        </motion.div>

        {/* Coming soon card */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
          style={{ background: "#0a1628", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 18, padding: "36px 32px", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📅</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: 16 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", display: "inline-block", animation: "dotPulse 2s ease infinite" }} />
            <span style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.14em" }}>BOOKING — LAUNCHING SOON</span>
          </div>
          <p style={{ fontSize: 13, color: "#6888a8", lineHeight: 1.7, marginBottom: 6 }}>
            One-to-one strategy sessions will be available here shortly.
          </p>
          <p style={{ fontSize: 13, color: "#6888a8", lineHeight: 1.7, marginBottom: 0 }}>
            Until then, email{" "}
            <a href="mailto:hello@usenexus.io" style={{ color: "#22d3ee", textDecoration: "none" }}>hello@usenexus.io</a>
            {" "}to book a call.
          </p>
        </motion.div>

        {/* Subscribe bridge CTA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.1) 0%, rgba(167,139,250,0.04) 100%)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 18, padding: "28px 32px" }}>
          <div style={{ fontSize: 9, color: "#a78bfa", letterSpacing: "0.16em", marginBottom: 10 }}>WHILE YOU WAIT</div>
          <h3 style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: "clamp(18px,4vw,26px)", color: "#c9d8e8", letterSpacing: "0.04em", lineHeight: 1.15, marginBottom: 10 }}>
            Get your Blueprint automatically
          </h3>
          <p style={{ fontSize: 13, color: "#9ab8d8", lineHeight: 1.65, marginBottom: 22 }}>
            <strong style={{ color: "#a78bfa" }}>Nexus Pulse</strong> gives you everything you&apos;d discuss on a strategy call — weekly re-scans, competitor tracking, priority recovery tasks, and instant alerts the moment your score drops.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Weekly automated site re-scans",
              "4-pillar recovery blueprint, updated live",
              "Competitor score tracking",
              "Critical drop alerts",
            ].map(f => (
              <div key={f} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "#a78bfa", fontSize: 10, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 12, color: "#9ab8d8" }}>{f}</span>
              </div>
            ))}
          </div>
          <a href="/subscribe" style={{ display: "block", marginTop: 22, padding: "16px", borderRadius: 10, textAlign: "center", textDecoration: "none", fontSize: 11, letterSpacing: "0.14em", background: "#a78bfa", color: "#fff", boxShadow: "0 0 40px rgba(167,139,250,0.35)", fontFamily: "var(--font-mono, monospace)" }}>
            START FREE TRIAL — 7 DAYS FREE →
          </a>
          <p style={{ fontSize: 9, color: "#6888a8", marginTop: 10, letterSpacing: "0.06em" }}>$49/mo after · cancel anytime · no card required for trial</p>
        </motion.div>

        <div style={{ marginTop: 24 }}>
          <a href="/funnel" style={{ fontSize: 10, color: "#6888a8", textDecoration: "none" }}>← Run your free site audit</a>
        </div>
      </div>
      <style>{`@keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }`}</style>
    </main>
  );
}

export default function CallCenterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#060d1a" }} />}>
      <CallCenterContent />
    </Suspense>
  );
}
