import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  // Auto-format the URL if the user forgot 'https://'
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;

  try {
    const res = await fetch(apiUrl, { cache: 'no-store' });
    
    if (!res.ok) {
        // If Google rejects it, we capture the exact reason (e.g., 429 Rate Limit, or 400 Bad Request)
        if (res.status === 429) throw new Error("Google API rate limit hit. Try again in 60 seconds.");
        if (res.status === 400) throw new Error("Google cannot reach this URL. Ensure it is a valid, live website.");
        throw new Error(`PageSpeed error: ${res.status}`);
    }

    const data = await res.json();
    const cats = data.lighthouseResult?.categories;
    const audits = data.lighthouseResult?.audits;

    const score = (cats?.performance?.score as number) ?? 0;
    const fcp = ((audits?.["first-contentful-paint"]?.numericValue as number) ?? 0) / 1000;
    const lcp = ((audits?.["largest-contentful-paint"]?.numericValue as number) ?? 0) / 1000;
    const tbt = Math.round((audits?.["total-blocking-time"]?.numericValue as number) ?? 0);
    const cls = (audits?.["cumulative-layout-shift"]?.numericValue as number) ?? 0;

    return NextResponse.json({ score, fcp, lcp, tbt, cls });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error connecting to Google.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}