// ─── Nexus Cron: Scan All Customer Sites ─────────────────────────────────────
// Runs daily at 06:00 UTC via Vercel Cron.
// • Re-scans each paid user's site based on plan cadence (Pulse=7d, Scale=1d)
// • Sends Critical Drop Alert email if any pillar drops >10 pts
// • Sends Weekly Score Digest every Monday to users with weeklyDigest=true
//
// Required env vars (set in Vercel dashboard):
//   SUPABASE_SERVICE_ROLE_KEY   — service role key (bypasses RLS)
//   CRON_SECRET                 — random secret set in Vercel project settings
//   NEXT_PUBLIC_SUPABASE_URL    — already set
//   NEXT_PUBLIC_PAGESPEED_API_KEY — already set
//   BREVO_API_KEY               — already set

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchAudit } from "@/app/lib/audit";
import { criticalDropEmail, weeklyDigestEmail } from "@/app/lib/email-templates";

export const maxDuration = 300; // 5 min — requires Vercel Pro

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexusdiag.com";
const PULSE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days
const SCALE_INTERVAL_MS = 1 * 24 * 60 * 60 * 1000;   // 1 day
const BATCH_SIZE = 5; // max concurrent scans

async function sendEmail(opts: { to: string; subject: string; htmlContent: string }) {
  const res = await fetch(`${SITE_URL}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: opts.to, toName: "", subject: opts.subject, htmlContent: opts.htmlContent }),
  });
  return res.ok;
}

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all paid users
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, tier, app_data")
    .in("tier", ["pulse", "scale"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profiles?.length) return NextResponse.json({ ok: true, scanned: 0 });

  const isMonday = new Date().getDay() === 1;
  const now = Date.now();
  const results: { userId: string; url: string; status: string }[] = [];

  // Process in batches to avoid timeouts
  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map(async (profile) => {
      try {
        const appData = profile.app_data as {
          sites?: { id: string; url: string; isOwn: boolean; result: Record<string, unknown> | null; history: Record<string, unknown>[]; tasks: Record<string, unknown>[] }[];
          settings?: { webhookUrl: string; weeklyDigest: boolean; criticalAlerts: boolean; emailTo: string };
        } | null;

        const ownSite = appData?.sites?.find(s => s.isOwn);
        const settings = appData?.settings;
        if (!ownSite?.url) return;

        const interval = profile.tier === "scale" ? SCALE_INTERVAL_MS : PULSE_INTERVAL_MS;
        const lastTs = (ownSite.result as { timestamp?: number } | null)?.timestamp ?? 0;
        const isDue = (now - lastTs) >= interval;
        if (!isDue) return;

        // Run the scan
        const newResult = await fetchAudit(ownSite.url);

        const toEmail = settings?.emailTo || profile.email;

        // ── Critical Drop Alert ───────────────────────────────────────────────
        if (settings?.criticalAlerts && ownSite.result && toEmail) {
          const prev = ownSite.result as { metrics?: { performanceScore?: number }; seo?: { estimatedSeoScore?: number }; accessibility?: { estimatedA11yScore?: number }; security?: { estimatedBestPracticesScore?: number }; geo?: { geoScore?: number }; totalMonthlyCost?: number };
          const drops = [
            { label: "Performance",   prev: prev.metrics?.performanceScore ?? 0,          now: newResult.metrics.performanceScore },
            { label: "SEO",           prev: prev.seo?.estimatedSeoScore ?? 0,               now: newResult.seo?.estimatedSeoScore ?? 0 },
            { label: "Accessibility", prev: prev.accessibility?.estimatedA11yScore ?? 0,   now: newResult.accessibility?.estimatedA11yScore ?? 0 },
            { label: "Security",      prev: prev.security?.estimatedBestPracticesScore ?? 0, now: newResult.security?.estimatedBestPracticesScore ?? 0 },
            { label: "AI Visibility", prev: prev.geo?.geoScore ?? 0,                        now: newResult.geo?.geoScore ?? 0 },
          ].filter(d => d.prev - d.now >= 10);

          if (drops.length > 0) {
            const html = criticalDropEmail({
              url: ownSite.url,
              drops,
              revenueLeak: newResult.totalMonthlyCost,
            });
            await sendEmail({
              to: toEmail,
              subject: `⚠️ Score drop on ${ownSite.url.replace(/https?:\/\/(www\.)?/, "")} — Nexus Alert`,
              htmlContent: html,
            });
            if (settings.webhookUrl) {
              const text = `🚨 NEXUS CRITICAL DROP — ${ownSite.url}\n\n${drops.map(d => `${d.label}: ${d.prev} → ${d.now} (−${d.prev - d.now} pts)`).join("\n")}\n\nRevenue leak: $${newResult.totalMonthlyCost.toLocaleString()}/mo`;
              fetch(settings.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }).catch(() => {});
            }
          }
        }

        // ── Weekly Score Digest (Mondays only) ──────────────────────────────
        if (isMonday && settings?.weeklyDigest && toEmail) {
          const prev = ownSite.result as { metrics?: { performanceScore?: number }; seo?: { estimatedSeoScore?: number }; accessibility?: { estimatedA11yScore?: number }; security?: { estimatedBestPracticesScore?: number }; geo?: { geoScore?: number } } | null;
          const topTasks = (ownSite.tasks ?? [])
            .filter((t: Record<string, unknown>) => t.status === "pending")
            .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
              const order = { High: 0, Medium: 1, Low: 2 };
              return (order[a.impact as keyof typeof order] ?? 2) - (order[b.impact as keyof typeof order] ?? 2);
            })
            .slice(0, 3)
            .map((t: Record<string, unknown>) => ({ title: String(t.title), impact: String(t.impact), pillar: String(t.pillar) }));

          const html = weeklyDigestEmail({
            url: ownSite.url,
            scores: {
              perf: newResult.metrics.performanceScore,
              seo: newResult.seo?.estimatedSeoScore ?? 0,
              a11y: newResult.accessibility?.estimatedA11yScore ?? 0,
              sec: newResult.security?.estimatedBestPracticesScore ?? 0,
              geo: newResult.geo?.geoScore ?? 0,
            },
            prevScores: prev ? {
              perf: prev.metrics?.performanceScore ?? 0,
              seo: prev.seo?.estimatedSeoScore ?? 0,
              a11y: prev.accessibility?.estimatedA11yScore ?? 0,
              sec: prev.security?.estimatedBestPracticesScore ?? 0,
              geo: prev.geo?.geoScore ?? 0,
            } : undefined,
            revenueLeak: newResult.totalMonthlyCost,
            topTasks,
            weekOf: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
          });

          await sendEmail({
            to: toEmail,
            subject: `Your Nexus weekly report — ${ownSite.url.replace(/https?:\/\/(www\.)?/, "")}`,
            htmlContent: html,
          });
        }

        // ── Persist new scan result to Supabase ──────────────────────────────
        const updatedSites = (appData?.sites ?? []).map(s => {
          if (!s.isOwn) return s;
          const historyPoint = {
            ts: newResult.timestamp,
            perf: newResult.metrics.performanceScore,
            seo: newResult.seo?.estimatedSeoScore ?? 0,
            a11y: newResult.accessibility?.estimatedA11yScore ?? 0,
            sec: newResult.security?.estimatedBestPracticesScore ?? 0,
            geo: newResult.geo?.geoScore ?? 0,
            leak: newResult.totalMonthlyCost,
          };
          return {
            ...s,
            result: newResult,
            history: [...(s.history ?? []).slice(-11), historyPoint],
          };
        });

        await supabase
          .from("profiles")
          .update({ app_data: { ...appData, sites: updatedSites } })
          .eq("id", profile.id);

        results.push({ userId: profile.id, url: ownSite.url, status: "scanned" });
      } catch (err) {
        results.push({ userId: profile.id, url: "unknown", status: `error: ${err}` });
      }
    }));
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
