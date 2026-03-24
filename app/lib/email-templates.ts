// ─── Nexus Email Templates ────────────────────────────────────────────────────
// Dark-themed HTML emails matching Nexus brand.
// All styles are inline for maximum email client compatibility.

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexusdiag.com";

const HEADER = (tag: string, tagColor: string) => `
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:22px 32px;background:#030f1e;border-bottom:1px solid rgba(255,255,255,0.06);">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><span style="font-family:'Courier New',monospace;font-size:16px;font-weight:bold;color:#e8341a;letter-spacing:0.12em;">&#x2B23; NEXUS</span></td>
        <td align="right"><span style="font-family:'Courier New',monospace;font-size:8px;color:${tagColor};background:${tagColor}18;border:1px solid ${tagColor}40;padding:3px 10px;border-radius:4px;letter-spacing:0.12em;">${tag}</span></td>
      </tr></table>
    </td>
  </tr>
</table>`;

const FOOTER = (dashUrl: string) => `
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:20px 32px;background:#020b18;border-top:1px solid rgba(255,255,255,0.05);">
      <p style="font-family:'Courier New',monospace;font-size:9px;color:#334155;margin:0;line-height:1.9;">
        Nexus &mdash; nexusdiag.com &nbsp;|&nbsp; Automated site monitoring<br>
        <a href="${dashUrl}" style="color:#475569;text-decoration:underline;">Open Dashboard</a>
        &nbsp;&nbsp;&bull;&nbsp;&nbsp;
        <a href="${dashUrl}" style="color:#475569;text-decoration:underline;">Manage Alerts</a>
      </p>
    </td>
  </tr>
</table>`;

// ─── Critical Drop Alert ──────────────────────────────────────────────────────
export function criticalDropEmail(opts: {
  url: string;
  drops: { label: string; prev: number; now: number }[];
  revenueLeak: number;
  dashboardUrl?: string;
}): string {
  const dash = opts.dashboardUrl ?? `${BASE}/dashboard`;
  const domain = opts.url.replace(/https?:\/\/(www\.)?/, "");

  const rows = opts.drops.map(d => `
    <tr>
      <td style="font-family:Arial,sans-serif;font-size:13px;color:#e2e8f0;padding:14px 32px;border-bottom:1px solid rgba(255,255,255,0.04);">${d.label}</td>
      <td style="font-family:'Courier New',monospace;font-size:15px;color:#94a3b8;font-weight:bold;padding:14px 20px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.04);">${d.prev}</td>
      <td style="font-family:'Courier New',monospace;font-size:15px;color:#e8341a;font-weight:bold;padding:14px 20px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.04);">${d.now}</td>
      <td style="font-family:'Courier New',monospace;font-size:13px;color:#e8341a;font-weight:bold;padding:14px 32px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.04);">&minus;${d.prev - d.now} pts</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Critical Score Drop &mdash; Nexus</title></head>
<body style="margin:0;padding:0;background:#030f1e;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#030f1e;padding:40px 20px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border:1px solid rgba(232,52,26,0.25);border-radius:14px;overflow:hidden;">

    ${HEADER("&#x1F6A8; CRITICAL ALERT", "#e8341a")}

    <!-- Hero -->
    <tr><td style="background:linear-gradient(135deg,rgba(232,52,26,0.1) 0%,rgba(3,15,30,0.98) 100%);padding:32px 32px 24px;">
      <p style="font-family:'Courier New',monospace;font-size:9px;color:#e8341a;letter-spacing:0.18em;margin:0 0 14px;">SCORE DROP DETECTED &mdash; ${domain}</p>
      <h1 style="font-family:Georgia,serif;font-size:24px;color:#f1f5f9;margin:0 0 12px;font-weight:bold;line-height:1.3;">A pillar just dropped more than 10 points.</h1>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#94a3b8;margin:0;line-height:1.65;">Your Nexus monitor detected a significant change. Here&rsquo;s exactly what happened:</p>
    </td></tr>

    <!-- Drop table -->
    <tr><td style="background:#060f1e;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr style="background:rgba(255,255,255,0.03);">
          <td style="font-family:'Courier New',monospace;font-size:8px;color:#475569;letter-spacing:0.14em;padding:10px 32px;">PILLAR</td>
          <td style="font-family:'Courier New',monospace;font-size:8px;color:#475569;letter-spacing:0.14em;padding:10px 20px;text-align:center;">BEFORE</td>
          <td style="font-family:'Courier New',monospace;font-size:8px;color:#475569;letter-spacing:0.14em;padding:10px 20px;text-align:center;">NOW</td>
          <td style="font-family:'Courier New',monospace;font-size:8px;color:#475569;letter-spacing:0.14em;padding:10px 32px;text-align:right;">DROP</td>
        </tr>
        ${rows}
      </table>
    </td></tr>

    <!-- Revenue + CTA -->
    <tr><td style="background:rgba(232,52,26,0.06);border-top:1px solid rgba(232,52,26,0.2);border-bottom:1px solid rgba(232,52,26,0.2);padding:22px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td valign="middle">
          <p style="font-family:'Courier New',monospace;font-size:8px;color:#e8341a;letter-spacing:0.14em;margin:0 0 5px;">ESTIMATED REVENUE LEAK</p>
          <p style="font-family:Georgia,serif;font-size:30px;color:#e8341a;margin:0;font-weight:bold;line-height:1;">$${opts.revenueLeak.toLocaleString()}<span style="font-size:14px;font-family:'Courier New',monospace;color:#94a3b8;">/mo</span></p>
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#64748b;margin:5px 0 0;">$${Math.round(opts.revenueLeak * 12).toLocaleString()}/year annualised</p>
        </td>
        <td align="right" valign="middle" style="padding-left:20px;">
          <a href="${dash}" style="display:inline-block;background:#e8341a;color:#fff;font-family:'Courier New',monospace;font-size:11px;font-weight:bold;letter-spacing:0.1em;text-decoration:none;padding:14px 22px;border-radius:8px;white-space:nowrap;">VIEW BLUEPRINT &#x2192;</a>
        </td>
      </tr></table>
    </td></tr>

    <!-- What to do -->
    <tr><td style="background:#030f1e;padding:24px 32px;">
      <p style="font-family:'Courier New',monospace;font-size:9px;color:#334155;letter-spacing:0.14em;margin:0 0 10px;">WHAT TO DO NOW</p>
      <p style="font-family:Arial,sans-serif;font-size:13px;color:#64748b;margin:0;line-height:1.75;">Open your Blueprint tab &mdash; it shows the exact fix for each issue, sorted by revenue impact. Most high-impact fixes take under 2 hours for a developer to execute.</p>
    </td></tr>

    ${FOOTER(dash)}
  </table>
  </td></tr>
</table>
</body></html>`;
}

// ─── Weekly Score Digest ──────────────────────────────────────────────────────
export function weeklyDigestEmail(opts: {
  url: string;
  scores: { perf: number; seo: number; a11y: number; sec: number; geo: number };
  prevScores?: { perf: number; seo: number; a11y: number; sec: number; geo: number };
  revenueLeak: number;
  topTasks: { title: string; impact: string; pillar: string }[];
  weekOf: string;
  dashboardUrl?: string;
}): string {
  const dash = opts.dashboardUrl ?? `${BASE}/dashboard`;
  const domain = opts.url.replace(/https?:\/\/(www\.)?/, "");
  const composite = Math.round(
    opts.scores.perf * 0.30 + opts.scores.seo * 0.25 +
    opts.scores.a11y * 0.20 + opts.scores.sec * 0.15 + opts.scores.geo * 0.10
  );
  const prevComposite = opts.prevScores ? Math.round(
    opts.prevScores.perf * 0.30 + opts.prevScores.seo * 0.25 +
    opts.prevScores.a11y * 0.20 + opts.prevScores.sec * 0.15 + opts.prevScores.geo * 0.10
  ) : null;
  const compDelta = prevComposite !== null ? composite - prevComposite : null;
  const compColor = composite >= 75 ? "#10b981" : composite >= 50 ? "#f59e0b" : "#e8341a";

  function scoreCell(label: string, score: number, prev?: number, color = "#e8341a") {
    const delta = prev !== undefined ? score - prev : null;
    const sc = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#e8341a";
    return `
    <td style="padding:14px 8px;text-align:center;border-right:1px solid rgba(255,255,255,0.05);">
      <div style="font-family:Georgia,serif;font-size:28px;color:${sc};font-weight:bold;line-height:1;">${score}</div>
      ${delta !== null ? `<div style="font-family:'Courier New',monospace;font-size:9px;color:${delta >= 0 ? "#10b981" : "#e8341a"};margin:3px 0;">${delta >= 0 ? "+" : ""}${delta}</div>` : `<div style="font-size:9px;color:transparent;">-</div>`}
      <div style="font-family:'Courier New',monospace;font-size:8px;color:#475569;letter-spacing:0.1em;margin-top:2px;">${label}</div>
    </td>`;
  }

  const pillarColors: Record<string, string> = { performance:"#e8341a", seo:"#f59e0b", accessibility:"#a78bfa", security:"#3b82f6", geo:"#10b981" };
  const taskRows = opts.topTasks.slice(0, 3).map((t, i) => `
    <tr>
      <td style="padding:12px 32px;border-bottom:1px solid rgba(255,255,255,0.04);">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td valign="middle" style="padding-right:12px;">
            <span style="font-family:'Courier New',monospace;font-size:9px;color:${pillarColors[t.pillar] ?? "#94a3b8"};background:${pillarColors[t.pillar] ?? "#94a3b8"}15;border:1px solid ${pillarColors[t.pillar] ?? "#94a3b8"}30;padding:2px 7px;border-radius:4px;letter-spacing:0.08em;">${t.pillar.toUpperCase()}</span>
          </td>
          <td>
            <div style="font-family:Arial,sans-serif;font-size:13px;color:#e2e8f0;">${t.title}</div>
          </td>
          <td align="right" valign="middle">
            <span style="font-family:'Courier New',monospace;font-size:8px;color:${t.impact === "High" ? "#e8341a" : t.impact === "Medium" ? "#f59e0b" : "#94a3b8"};background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);padding:2px 8px;border-radius:4px;">${t.impact.toUpperCase()}</span>
          </td>
        </tr></table>
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your Weekly Nexus Report</title></head>
<body style="margin:0;padding:0;background:#030f1e;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#030f1e;padding:40px 20px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border:1px solid rgba(16,185,129,0.2);border-radius:14px;overflow:hidden;">

    ${HEADER("WEEKLY DIGEST", "#10b981")}

    <!-- Intro -->
    <tr><td style="background:linear-gradient(135deg,rgba(16,185,129,0.07) 0%,rgba(3,15,30,0.98) 100%);padding:28px 32px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <p style="font-family:'Courier New',monospace;font-size:9px;color:#10b981;letter-spacing:0.18em;margin:0 0 10px;">WEEK OF ${opts.weekOf.toUpperCase()} &mdash; ${domain}</p>
          <h1 style="font-family:Georgia,serif;font-size:22px;color:#f1f5f9;margin:0;font-weight:bold;line-height:1.3;">Your site&rsquo;s health report is ready.</h1>
        </td>
        <td align="right" valign="top" style="padding-left:24px;white-space:nowrap;">
          <div style="font-family:Georgia,serif;font-size:52px;color:${compColor};line-height:1;font-weight:bold;">${composite}</div>
          <div style="font-family:'Courier New',monospace;font-size:8px;color:#475569;text-align:center;letter-spacing:0.1em;">COMPOSITE</div>
          ${compDelta !== null ? `<div style="font-family:'Courier New',monospace;font-size:10px;color:${compDelta >= 0 ? "#10b981" : "#e8341a"};text-align:center;margin-top:3px;">${compDelta >= 0 ? "+" : ""}${compDelta} this week</div>` : ""}
        </td>
      </tr></table>
    </td></tr>

    <!-- 5 Pillar Scores -->
    <tr><td style="background:#060f1e;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr style="background:rgba(255,255,255,0.02);">
          <td colspan="5" style="font-family:'Courier New',monospace;font-size:8px;color:#334155;letter-spacing:0.14em;padding:10px 32px;">5-PILLAR BREAKDOWN</td>
        </tr>
        <tr>
          ${scoreCell("PERF", opts.scores.perf, opts.prevScores?.perf, "#e8341a")}
          ${scoreCell("SEO", opts.scores.seo, opts.prevScores?.seo, "#f59e0b")}
          ${scoreCell("A11Y", opts.scores.a11y, opts.prevScores?.a11y, "#a78bfa")}
          ${scoreCell("SEC", opts.scores.sec, opts.prevScores?.sec, "#3b82f6")}
          ${scoreCell("AI VIS", opts.scores.geo, opts.prevScores?.geo, "#10b981")}
        </tr>
      </table>
    </td></tr>

    <!-- Revenue leak -->
    <tr><td style="background:#030f1e;padding:18px 32px;border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05);">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <p style="font-family:'Courier New',monospace;font-size:8px;color:#475569;letter-spacing:0.14em;margin:0 0 4px;">CURRENT REVENUE LEAK</p>
          <p style="font-family:Georgia,serif;font-size:22px;color:#e8341a;margin:0;font-weight:bold;">$${opts.revenueLeak.toLocaleString()}<span style="font-size:12px;font-family:'Courier New',monospace;color:#64748b;">/mo</span></p>
        </td>
        <td align="right" valign="middle">
          <a href="${dash}" style="display:inline-block;background:#10b981;color:#fff;font-family:'Courier New',monospace;font-size:10px;font-weight:bold;letter-spacing:0.1em;text-decoration:none;padding:12px 20px;border-radius:8px;white-space:nowrap;">OPEN DASHBOARD &#x2192;</a>
        </td>
      </tr></table>
    </td></tr>

    ${opts.topTasks.length > 0 ? `
    <!-- Top tasks -->
    <tr><td style="background:#040d1a;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr style="background:rgba(255,255,255,0.02);">
          <td style="font-family:'Courier New',monospace;font-size:8px;color:#334155;letter-spacing:0.14em;padding:10px 32px;">TOP PENDING TASKS</td>
        </tr>
        ${taskRows}
      </table>
    </td></tr>
    <tr><td style="background:#030f1e;padding:16px 32px;">
      <a href="${dash}" style="font-family:'Courier New',monospace;font-size:10px;color:#a78bfa;text-decoration:none;letter-spacing:0.08em;">VIEW ALL TASKS IN BLUEPRINT &#x2192;</a>
    </td></tr>
    ` : ""}

    ${FOOTER(dash)}
  </table>
  </td></tr>
</table>
</body></html>`;
}
