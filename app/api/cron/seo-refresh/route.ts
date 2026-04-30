// ─── Nexus Cron: SEO refresh + IndexNow ──────────────────────────────────────
// Runs weekly. Pings IndexNow with all programmatic-SEO URLs so Bing, Yandex,
// and other IndexNow-compatible engines re-crawl. Google reads sitemap.xml on
// its own cadence; we don't ping Google directly.
//
// Required env vars:
//   CRON_SECRET            — same as scan-sites cron
//   INDEXNOW_KEY           — random 32+ char hex string. Must be hosted at
//                            https://nexusdiag.com/<key>.txt (file in /public).
// Optional:
//   NEXT_PUBLIC_SITE_URL   — defaults to https://nexusdiag.com

import { NextRequest, NextResponse } from "next/server";
import { articleList } from "@/app/lib/articles";
import { cities, verticals, competitors } from "@/app/lib/seo-pages";

export const maxDuration = 60;

const HOST = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nexusdiag.com").replace(/\/$/, "");
const HOSTNAME = new URL(HOST).hostname;

function buildUrlList(): string[] {
  return [
    `${HOST}/`,
    `${HOST}/funnel`,
    `${HOST}/blog`,
    `${HOST}/about`,
    `${HOST}/subscribe`,
    ...articleList.map(a => `${HOST}/blog/${a.slug}`),
    ...cities.map(c => `${HOST}/${c.slug}-website-audit`),
    ...verticals.map(v => `${HOST}/${v.slug}-website-audit`),
    ...competitors.map(c => `${HOST}/nexus-vs-${c.slug}`),
  ];
}

async function pingIndexNow(urlList: string[], key: string) {
  // IndexNow batch endpoint accepts up to 10,000 URLs per request.
  // https://www.indexnow.org/documentation
  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOSTNAME,
      key,
      keyLocation: `${HOST}/${key}.txt`,
      urlList,
    }),
  });
  return { status: res.status, ok: res.ok };
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, skipped: "INDEXNOW_KEY not set" }, { status: 200 });
  }

  const urlList = buildUrlList();
  const result = await pingIndexNow(urlList, key);

  return NextResponse.json({
    ok: result.ok,
    indexnow: result,
    submitted: urlList.length,
  });
}
