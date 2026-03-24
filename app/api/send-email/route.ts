import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing API key" }, { status: 500 });

  const { to, toName, subject, body, htmlContent } = await req.json();
  if (!to || !subject || (!body && !htmlContent))
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const payload: Record<string, unknown> = {
    sender: { name: "Alex at Nexus", email: "alex@nexusdiag.com" },
    to: [{ email: to, name: toName || to }],
    subject,
  };
  if (htmlContent) payload.htmlContent = htmlContent;
  else payload.textContent = body;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
