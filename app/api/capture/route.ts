import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CapturePayload {
  email: string;
  url: string;
  score: number;
  adLossPercent?: number;
  bounceRateIncrease?: number;
  annualRevenueLoss?: number;
  totalMonthlyCost?: number;
  severity?: string;
  timestamp?: number;
  // Funnel context
  painPoint?: string;
  revenuePotential?: string;
  lastAudit?: string;
  source?: string;
  // Extended funnel answers
  phone?: string;
  q1?: string;
  q2?: string;
  q3?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Derive tier from funnel answers / score
function deriveTier(payload: CapturePayload): string {
  const rev = payload.revenuePotential ?? "";
  if (rev.includes("500k") || rev.includes("1m") || rev.includes("million")) return "scale";
  if (rev.includes("100k") || rev.includes("250k")) return "pulse";
  if ((payload.score ?? 100) < 50) return "pulse";
  return "free";
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: CapturePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    email, url, score,
    adLossPercent, bounceRateIncrease, annualRevenueLoss, totalMonthlyCost,
    severity, timestamp,
    painPoint, revenuePotential, lastAudit, source,
    phone, q1, q2, q3,
  } = body;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }
  if (typeof score !== "number" || score < 0 || score > 100) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  const submittedAt = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
  const resolvedSource = source ?? req.headers.get("referer") ?? "direct";

  // ── 1. Google Sheets webhook ───────────────────────────────────────────────
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const sheetPayload = {
        email, url, score,
        adLossPercent: adLossPercent ?? null,
        bounceRateIncrease: bounceRateIncrease ?? null,
        annualRevenueLoss: annualRevenueLoss ?? null,
        severity: severity ?? null,
        timestamp: submittedAt,
        painPoint: painPoint ?? null,
        revenuePotential: revenuePotential ?? null,
        lastAudit: lastAudit ?? null,
        source: resolvedSource,
        submittedAt,
      };
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sheetPayload),
        signal: AbortSignal.timeout(10000),
      });
      if (!webhookRes.ok) console.error(`Google Sheets webhook failed: ${webhookRes.status}`);
      else console.log("Lead captured to Google Sheets:", email, url, score);
    } catch (err) {
      console.error("Failed to push to Google Sheets:", err);
    }
  } else {
    console.warn("GOOGLE_SHEETS_WEBHOOK_URL not set - Google Sheets lead NOT saved");
  }

  // ── 2. Supabase leads table ────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Fall back to anon key so captures work even without a service role key.
  // The leads table RLS should allow INSERT for anon role (see supabase/leads_table.sql).
  const supabaseKey = serviceRoleKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const admin = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      const tier = deriveTier(body);

      const { error } = await admin.from("leads").insert({
        email,
        url,
        score,
        severity: severity ?? null,
        ad_loss_percent: adLossPercent ?? null,
        bounce_rate_increase: bounceRateIncrease ?? null,
        annual_revenue_loss: annualRevenueLoss ?? null,
        total_monthly_cost: totalMonthlyCost ?? null,
        pain_point: painPoint ?? null,
        revenue_potential: revenuePotential ?? null,
        last_audit: lastAudit ?? null,
        source: resolvedSource,
        phone: phone ?? null,
        q1: q1 ?? null,
        q2: q2 ?? null,
        q3: q3 ?? null,
        tier,
        status: "new",
        created_at: submittedAt,
      });

      if (error) {
        // Table may not exist yet — log but don't fail the request
        console.error("Supabase leads insert error:", error.message);
      } else {
        console.log("Lead captured to Supabase:", email, url, tier);
      }
    } catch (err) {
      console.error("Failed to push to Supabase leads:", err);
    }
  } else {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not set - Supabase lead NOT saved");
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
