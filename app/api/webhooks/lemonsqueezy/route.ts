import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function verifySignature(payload: string, sig: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(sig));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig     = req.headers.get("x-signature") ?? "";
  const secret  = process.env.LS_WEBHOOK_SECRET ?? "";

  if (!secret) {
    console.error("LS_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  if (!verifySignature(rawBody, sig, secret)) {
    console.warn("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Log full payload so we can debug field locations
  console.log("LS WEBHOOK PAYLOAD:", JSON.stringify(event, null, 2));

  const type  = (event.meta as Record<string,string>)?.event_name;
  const attrs = (event.data as Record<string,unknown>)?.attributes as Record<string,unknown>;

  // LemonSqueezy puts email in multiple places depending on event type — try all
  const email =
    (attrs?.user_email as string) ||
    (attrs?.email as string) ||
    ((attrs?.customer as Record<string,string>)?.email) ||
    ((event.meta as Record<string,unknown>)?.custom_data as Record<string,string>)?.email ||
    "";

  const lsCustomerId     = String(attrs?.customer_id ?? "");
  const lsSubscriptionId = String((event.data as Record<string,unknown>)?.id ?? "");
  const variantId        = String(attrs?.variant_id ?? "");

  const PULSE_VARIANT_ID = process.env.LS_PULSE_VARIANT_ID ?? "";
  const SCALE_VARIANT_ID = process.env.LS_SCALE_VARIANT_ID ?? "";

  function getPlan(vid: string): "pulse" | "scale" | null {
    if (vid === PULSE_VARIANT_ID) return "pulse";
    if (vid === SCALE_VARIANT_ID) return "scale";
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log(`LS event: ${type} | email: "${email}" | variant: ${variantId}`);

  if (type === "subscription_created" || type === "subscription_updated") {
    const status = String(attrs?.status ?? "");
    // Accept active AND on_trial as valid paid states
    const isActive = ["active", "on_trial", "paid"].includes(status);
    const plan = getPlan(variantId);
    console.log(`Status: ${status} | isActive: ${isActive}`);
    console.log(`Resolved plan: ${plan} | pulse variant: ${PULSE_VARIANT_ID} | scale variant: ${SCALE_VARIANT_ID}`);

    if (plan && email && isActive) {
      // First try update by email
      const { data, error } = await supabase
        .from("profiles")
        .update({
          tier: plan,
          ls_customer_id: lsCustomerId,
          ls_subscription_id: lsSubscriptionId,
          ls_variant_id: variantId,
          subscription_status: "active",
          email: email, // ensure email is always saved
        })
        .eq("email", email)
        .select();

      if (error) {
        console.error("Supabase update error:", error);
      } else if (!data || data.length === 0) {
        // No row matched by email — try matching via auth.users by email (single lookup, no pagination)
        console.warn(`No profile found for email ${email} — trying auth lookup`);
        const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (listErr) console.error("Auth listUsers error:", listErr);
        const user = users?.find(u => u.email === email);
        if (user) {
          const { error: err2 } = await supabase
            .from("profiles")
            .update({
              tier: plan,
              ls_customer_id: lsCustomerId,
              ls_subscription_id: lsSubscriptionId,
              ls_variant_id: variantId,
              subscription_status: "active",
              email: email,
            })
            .eq("id", user.id);
          if (err2) console.error("Fallback update error:", err2);
          else console.log(`Plan updated via auth lookup for ${email}`);
        } else {
          console.error(`User not found in auth for email: ${email}`);
        }
      } else {
        console.log(`Plan updated to '${plan}' for ${email}`);
      }
    } else {
      console.warn(`Missing plan (${plan}) or email (${email}) — cannot update`);
    }
  }

  if (type === "subscription_cancelled") {
    if (email) {
      await supabase.from("profiles")
        .update({ tier: "free", subscription_status: "cancelled" })
        .eq("email", email);
    }
  }

  if (type === "subscription_expired") {
    if (email) {
      await supabase.from("profiles")
        .update({ tier: "free", subscription_status: "expired" })
        .eq("email", email);
    }
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}