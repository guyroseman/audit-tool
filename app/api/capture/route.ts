import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CapturePayload {
  email: string;
  url: string;
  score: number;
  adLossPercent?: number;
  bounceRateIncrease?: number;
  annualRevenueLoss?: number;
  severity?: string;
  timestamp?: number;
  // Funnel context
  painPoint?: string;
  revenuePotential?: string;
  lastAudit?: string;
  source?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    adLossPercent, bounceRateIncrease, annualRevenueLoss,
    severity, timestamp,
    painPoint, revenuePotential, lastAudit, source,
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

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      const sheetPayload = {
        email,
        url,
        score,
        adLossPercent: adLossPercent ?? null,
        bounceRateIncrease: bounceRateIncrease ?? null,
        annualRevenueLoss: annualRevenueLoss ?? null,
        severity: severity ?? null,
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        painPoint: painPoint ?? null,
        revenuePotential: revenuePotential ?? null,
        lastAudit: lastAudit ?? null,
        source: source ?? req.headers.get("referer") ?? "direct",
        submittedAt: new Date().toISOString(),
      };

      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sheetPayload),
        signal: AbortSignal.timeout(10000),
      });

      if (!webhookRes.ok) {
        console.error(`Google Sheets webhook failed: ${webhookRes.status}`);
      } else {
        console.log("Lead captured to Google Sheets:", email, url, score);
      }
    } catch (err) {
      console.error("Failed to push to Google Sheets:", err);
    }
  } else {
    console.warn("GOOGLE_SHEETS_WEBHOOK_URL not set - lead NOT saved");
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}