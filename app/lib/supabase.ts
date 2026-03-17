import { createBrowserClient } from "@supabase/ssr";

export type SubscriptionPlan = "free" | "pulse" | "scale";

export interface UserProfile {
  id: string;
  email: string;
  tier: SubscriptionPlan;
  ls_subscription_id?: string;
  ls_customer_id?: string;
  ls_variant_id?: string;
  subscription_status?: string;
  trial_ends_at?: string;
  created_at: string;
  app_data?: Record<string, unknown>;
}

export const PLAN_CONFIG: Record<SubscriptionPlan, {
  label: string; maxSites: number; maxCompetitors: number; monthlyPriceGBP: number;
}> = {
  free:  { label: "Free",        maxSites: 1,  maxCompetitors: 0,  monthlyPriceGBP: 0   },
  pulse: { label: "Nexus Pulse", maxSites: 4,  maxCompetitors: 3,  monthlyPriceGBP: 49  },
  scale: { label: "Nexus Scale", maxSites: 11, maxCompetitors: 10, monthlyPriceGBP: 149 },
};

// Lazy singleton — only instantiated when first used at runtime, not at build time.
// All callers (auth-context, login page, etc.) share the same instance so auth
// state change listeners are consistent.
let _client: ReturnType<typeof createBrowserClient> | null = null;
function getClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    if (!url || !key) {
      // During build/prerender without env vars — return a stub so the build
      // doesn't crash. Real auth is always client-side.
      return { auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }), signOut: async () => {}, getUser: async () => ({ data: { user: null } }) }, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) } ) } as unknown as ReturnType<typeof createBrowserClient>;
    }
    _client = createBrowserClient(url, key);
  }
  return _client;
}

// createClient() returns the singleton — safe to call multiple times.
export function createClient() {
  return getClient();
}

// Legacy named export — thin proxy over the singleton.
export const supabase = {
  get auth() { return getClient().auth; },
  from: (...args: Parameters<ReturnType<typeof createBrowserClient>["from"]>) =>
    getClient().from(...args),
} as ReturnType<typeof createBrowserClient>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getProfile(supabaseClient: any): Promise<UserProfile | null> {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return null;
  const { data } = await supabaseClient.from("profiles").select("*").eq("id", user.id).single();
  return data ?? null;
}