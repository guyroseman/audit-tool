"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard";
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative" }}>
      
      <nav style={{ position: "absolute", top: 0, left: 0, padding: "24px", width: "100%" }}>
         <a href="/" style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", textDecoration:"none" }}>← RETURN HOME</a>
      </nav>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
        style={{ width: "100%", maxWidth: 400, padding: "40px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <svg width={24} height={24} viewBox="0 0 28 28" fill="none">
              <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
              <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--text)", letterSpacing: "0.1em" }}>NEXUS</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--text)", letterSpacing: "0.05em" }}>
            {isSignUp ? "CREATE ACCOUNT" : "WELCOME BACK"}
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", marginTop: 8 }}>
            {isSignUp ? "Enter your details to initialize your dashboard." : "Log in to access your performance intelligence."}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginBottom: 6, letterSpacing: "0.1em" }}>WORK EMAIL</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
              placeholder="founder@company.com"
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "12px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginBottom: 6, letterSpacing: "0.1em" }}>PASSWORD</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
              placeholder="••••••••"
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "12px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 13 }}
            />
          </div>

          {error && (
            <div style={{ padding: "10px", borderRadius: 6, background: "rgba(232,52,26,0.1)", border: "1px solid rgba(232,52,26,0.2)" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", textAlign: "center" }}>⚠ {error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", marginTop: 8, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "AUTHENTICATING..." : (isSignUp ? "SECURE MY ACCOUNT →" : "ACCESS DASHBOARD →")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button onClick={() => setIsSignUp(!isSignUp)} type="button"
            style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            {isSignUp ? "Already have an account? Log in." : "Need an account? Sign up."}
          </button>
        </div>

      </motion.div>
    </main>
  );
}
