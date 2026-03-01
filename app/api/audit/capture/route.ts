// src/app/api/capture/route.ts

import { NextRequest, NextResponse } from "next/server";

const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/kwm73poyuxkmn5auu6c1twugqnewcn3k";

export async function POST(req: NextRequest) {
  try {
    const { email, url, score } = await req.json();

    if (!email || !url || score === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        url,
        email,
        score,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Capture error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}