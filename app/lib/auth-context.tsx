"use client";
import React from "react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, getProfile, PLAN_CONFIG } from "./supabase";
import type { UserProfile, SubscriptionPlan } from "./supabase";

interface AuthContextValue {
  user: User | null; profile: UserProfile | null; plan: SubscriptionPlan;
  isAuthed: boolean; loading: boolean;
  signOut: () => Promise<void>; refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, profile: null, plan: "free", isAuthed: false, loading: true,
  signOut: async () => {}, refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children?: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) { setProfile(null); setLoading(false); return; }
    const p = await getProfile(supabase);
    setProfile(p); setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then((res) => {
      const session = res.data?.session ?? null;
      setUser(session?.user ?? null);
      loadProfile(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      loadProfile(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("refresh") === "plan" && user) {
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => loadProfile(user), 1500);
    }
  }, [user, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
    window.location.href = "/";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user);
  }, [user, loadProfile]);

  const plan: SubscriptionPlan = profile?.plan ?? "free";

  return (
    <AuthContext.Provider value={{ user, profile, plan, isAuthed: !!user, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
export { PLAN_CONFIG };