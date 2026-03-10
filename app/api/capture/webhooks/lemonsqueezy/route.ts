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

  const type  = (event.meta as Record<string,string>)?.event_name;
  const attrs = (event.data as Record<string,unknown>)?.attributes as Record<string,unknown>;
  const email            = attrs?.user_email as string;
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

  // Use service role key — this runs server-side only, never exposed to browser
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log(`LemonSqueezy webhook: ${type} | ${email} | variant: ${variantId}`);

  if (type === "subscription_created" || type === "subscription_updated") {
    const plan = getPlan(variantId);
    if (plan && email) {
      const { error } = await supabase.from("profiles").update({
        tier: plan,
        ls_customer_id: lsCustomerId,
        ls_subscription_id: lsSubscriptionId,
        ls_variant_id: variantId,
        subscription_status: "active",
      }).eq("email", email);

      if (error) console.error("Supabase update error:", error);
      else console.log(`Plan updated to '${plan}' for ${email}`);
    } else {
      console.warn(`Unknown variant ${variantId} or missing email`);
    }
  }

  if (type === "subscription_cancelled") {
    if (email) {
      await supabase.from("profiles").update({
        tier: "free",
        subscription_status: "cancelled",
      }).eq("email", email);
    }
  }

  if (type === "subscription_expired") {
    if (email) {
      await supabase.from("profiles").update({
        tier: "free",
        subscription_status: "expired",
      }).eq("email", email);
    }
  }

  return NextResponse.json({ received: true });
}

// Reject non-POST requests
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}