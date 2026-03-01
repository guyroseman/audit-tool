// app/api/audit/route.ts  (Next.js 13+ App Router)
// Place this file at:  src/app/api/audit/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  // Google PageSpeed Insights API — no billing required for basic usage
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;

  try {
    const res = await fetch(apiUrl, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`PageSpeed error: ${res.status}`);

    const data = await res.json();
    const cats = data.lighthouseResult?.categories;
    const audits = data.lighthouseResult?.audits;

    // Pull key metrics (values are in seconds or ms depending on the audit)
    const score = (cats?.performance?.score as number) ?? 0;
    const fcp = ((audits?.["first-contentful-paint"]?.numericValue as number) ?? 0) / 1000;
    const lcp = ((audits?.["largest-contentful-paint"]?.numericValue as number) ?? 0) / 1000;
    const tbt = Math.round((audits?.["total-blocking-time"]?.numericValue as number) ?? 0);
    const cls = (audits?.["cumulative-layout-shift"]?.numericValue as number) ?? 0;

    return NextResponse.json({ score, fcp, lcp, tbt, cls });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}