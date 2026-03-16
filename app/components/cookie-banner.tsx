"use client";
import { useState, useEffect } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("nexus_cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("nexus_cookie_consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("nexus_cookie_consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "rgba(8,15,28,0.98)", borderTop: "1px solid var(--border)",
      padding: "16px 24px", display: "flex", alignItems: "center",
      justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      backdropFilter: "blur(12px)"
    }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", maxWidth: 600, margin: 0, lineHeight: 1.5 }}>
        We use cookies for authentication and analytics.{" "}
        <a href="/legal/privacy" style={{ color: "var(--accent)", textDecoration: "none" }}>Privacy Policy</a>
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={decline}
          style={{ padding: "8px 18px", borderRadius: 7, border: "1px solid var(--border2)", background: "transparent", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", cursor: "pointer", letterSpacing: "0.08em" }}>
          DECLINE
        </button>
        <button onClick={accept}
          style={{ padding: "8px 18px", borderRadius: 7, background: "var(--accent)", border: "none", fontFamily: "var(--font-mono)", fontSize: 10, color: "#fff", cursor: "pointer", letterSpacing: "0.08em", boxShadow: "0 0 14px rgba(232,52,26,0.3)" }}>
          ACCEPT
        </button>
      </div>
    </div>
  );
}