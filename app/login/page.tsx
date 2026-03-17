"use client";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

function LoginInner() {
  const searchParams = useSearchParams();
  // After auth, go back to wherever the user came from (default: /dashboard)
  const redirectTo = searchParams?.get("redirect") ?? "/dashboard";

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [notice, setNotice]     = useState("");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?type=recovery`,
      });
      if (error) throw error;
      setNotice("Password reset email sent — check your inbox.");
      setIsForgot(false);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  // Detect password reset token OR error from Supabase redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    // Handle error in query string (expired link etc)
    const errorCode = params.get("error_code");
    const errorDesc = params.get("error_description");
    if (errorCode) {
      if (errorCode === "otp_expired") {
        setError("Your reset link has expired. Please request a new one below.");
        setIsForgot(true);
      } else {
        setError(decodeURIComponent(errorDesc ?? "Something went wrong. Please try again."));
      }
      window.history.replaceState({}, "", "/login");
      return;
    }

    // isRecovery: true when arriving via a password reset email link.
    // Works for both PKCE (type=recovery query param) and legacy implicit flow (hash).
    const isRecovery =
      params.get("type") === "recovery" ||
      hash.includes("type=recovery") ||
      hash.includes("access_token");

    // Listen for Supabase auth events — catches PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsReset(true);
        window.history.replaceState({}, "", "/login");
      } else if (event === "SIGNED_IN" && session && !isRecovery) {
        window.location.href = redirectTo;
      }
    });

    // Also check session directly for recovery token (handles fast client init)
    if (isRecovery) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setIsReset(true);
      });
      return () => subscription.unsubscribe();
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isReset) window.location.href = redirectTo;
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNotice("Password updated successfully. Signing you in...");
      setIsReset(false);
      setTimeout(() => { window.location.href = redirectTo; }, 1500);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Auto sign in after signup - no email verification required
        if (data.session) {
          window.location.href = redirectTo;
        } else {
          // Fallback: sign them in directly
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          window.location.href = redirectTo;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = redirectTo;
      }
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>

      {/* Minimal nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: "1px solid var(--border)", background: "rgba(3,7,15,0.97)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <svg width={20} height={20} viewBox="0 0 28 28" fill="none">
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
            <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)", letterSpacing: "0.1em" }}>NEXUS</span>
        </a>
        <a href="/subscribe" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textDecoration: "none", letterSpacing: "0.08em" }}>PRICING →</a>
      </nav>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: "100%", maxWidth: 400, padding: "40px 36px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", marginTop: 56 }}>

        {isReset ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--text)", letterSpacing: "0.06em", lineHeight: 1, marginBottom: 8 }}>SET NEW PASSWORD</h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)" }}>Choose a strong password for your account.</p>
            </div>
            <form onSubmit={handleNewPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", marginBottom: 6, letterSpacing: "0.12em" }}>NEW PASSWORD</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
                  placeholder="Min. 8 characters" autoFocus
                  style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "13px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14, boxSizing: "border-box" as const }} />
              </div>
              {error && <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.25)" }}><p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", margin: 0 }}>⚠ {error}</p></div>}
              {notice && <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}><p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#10b981", margin: 0 }}>✓ {notice}</p></div>}
              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "15px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", cursor: "pointer", boxShadow: "0 0 20px rgba(232,52,26,0.3)" }}>
                {loading ? "UPDATING..." : "SET PASSWORD →"}
              </button>
            </form>
          </>
        ) : (
        <>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--text)", letterSpacing: "0.06em", lineHeight: 1, marginBottom: 8 }}>
            {isSignUp ? "CREATE ACCOUNT" : "WELCOME BACK"}
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
            {isSignUp
              ? "Free account — skip the email gate on every scan and track your fixes over time."
              : "Sign in to access your full audit history and performance dashboard."}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", marginBottom: 6, letterSpacing: "0.12em" }}>EMAIL</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="founder@company.com" autoFocus
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "13px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", marginBottom: 6, letterSpacing: "0.12em" }}>PASSWORD</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "13px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.25)" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)", margin: 0 }}>⚠ {error}</p>
            </div>
          )}
          {notice && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#10b981", margin: 0 }}>✓ {notice}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "15px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", marginTop: 4, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 0 20px rgba(232,52,26,0.3)" }}>
            {loading ? "..." : (isSignUp ? "CREATE ACCOUNT →" : "SIGN IN →")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => { setIsSignUp(v => !v); setIsForgot(false); setError(""); setNotice(""); }} type="button"
            style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
            {isSignUp ? "Already have an account? Sign in →" : "No account yet? Sign up free →"}
          </button>
          {!isSignUp && !isForgot && (
            <button onClick={() => { setIsForgot(true); setError(""); setNotice(""); }} type="button"
              style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Forgot password?
            </button>
          )}
        </div>

        {isForgot && (
          <form onSubmit={handleForgotPassword} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textAlign: "center" }}>Enter your email to receive a reset link</p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "12px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 13, boxSizing: "border-box" as const }} />
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "13px", borderRadius: 8, background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border2)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", cursor: "pointer" }}>
              {loading ? "SENDING..." : "SEND RESET LINK →"}
            </button>
            <button type="button" onClick={() => setIsForgot(false)}
              style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Back to sign in
            </button>
          </form>
        )}

        {!isSignUp && !isForgot && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textAlign: "center", marginTop: 10 }}>
            Don&rsquo;t have a paid plan?{" "}
            <a href="/subscribe" style={{ color: "#a78bfa", textDecoration: "none" }}>See pricing →</a>
          </p>
        )}
        </>
        )}
      </motion.div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>LOADING...</span>
      </main>
    }>
      <LoginInner />
    </Suspense>
  );
}