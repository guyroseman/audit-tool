import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CapturePayload {
  email: string;
  url: string;
  score: number;
  adLossPercent: number;
  bounceRateIncrease: number;
  annualRevenueLoss: number;
  severity: string;
  timestamp: number;
}

// ─── Input Validation ─────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidScore(score: number): boolean {
  return typeof score === "number" && score >= 0 && score <= 100;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: CapturePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 2. Validate required fields
  const { email, url, score, adLossPercent, bounceRateIncrease, annualRevenueLoss, severity, timestamp } = body;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  if (!isValidScore(score)) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  // 3. Forward to Google Sheets webhook
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      const sheetPayload = {
        email,
        url,
        score,
        adLossPercent,
        bounceRateIncrease,
        annualRevenueLoss,
        severity,
        timestamp: new Date(timestamp).toISOString(),
        // Extra metadata for CRM context
        submittedAt: new Date().toISOString(),
        source: req.headers.get("referer") ?? "direct",
      };

      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sheetPayload),
      });

      if (!webhookRes.ok) {
        // Log but don't fail — don't block the user if CRM is down
        console.error(`Google Sheets webhook failed: ${webhookRes.status}`);
      }
    } catch (err) {
      // Same — log and continue
      console.error("Failed to push to Google Sheets:", err);
    }
  } else {
    // No webhook configured — just log in dev
    if (process.env.NODE_ENV === "development") {
      console.log("📋 Lead captured (no webhook configured):", { email, url, score });
    }
  }

  // 4. Respond success
  return NextResponse.json({ success: true }, { status: 200 });
}

// Block all other methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
