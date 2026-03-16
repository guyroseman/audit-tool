import { createBrowserClient } from "@supabase/ssr";

export type SubscriptionPlan = "free" | "pulse" | "scale";

export interface UserProfile {
  id: string;
  email: string;
  tier: SubscriptionPlan;  // DB column is 'tier' not 'plan'
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

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Legacy named export — lazy singleton to avoid build-time instantiation
let _supabase: ReturnType<typeof createBrowserClient> | null = null;
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    if (!_supabase) {
      _supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    return (_supabase as any)[prop];
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getProfile(supabase: any): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data ?? null;
}