import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer service role key (bypasses RLS). Fall back to anon key if not set.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── GET — fetch all leads ─────────────────────────────────────────────────────

export async function GET() {
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase service role key not configured" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: data ?? [] });
}

// ─── PATCH — update lead status ────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase service role key not configured" }, { status: 503 });
  }

  let body: { id: string; status: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validStatuses = ["new", "contacted", "converted", "spam"];
  if (!body.id || !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
  }

  const { error } = await admin
    .from("leads")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
