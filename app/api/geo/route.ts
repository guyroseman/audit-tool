import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const defaultResult = {
    geoScore: 0,
    hasStatisticalData: false,
    hasQuestionHeadings: false,
    hasSchemaMarkup: false,
    schemaTypes: [] as string[],
    hasContentStructure: false,
    estimatedAiPipelineLeak: 0,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NexusBot/1.0)" },
    });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json(defaultResult);
    const html = await res.text();

    // ── Check 1: Statistical / Data Density ────────────────────────────────
    // Strip scripts and styles, then count $, £, €, %, or number+% patterns
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ");
    const dataMatches = bodyText.match(/[\$£€][\d,]+|\d+\.?\d*\s?%/g) ?? [];
    const hasStatisticalData = dataMatches.length >= 5;

    // ── Check 2: Question-Based Headings ───────────────────────────────────
    const headings = html.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi) ?? [];
    const questionRe = /\b(what|how|why|when|where|who|which|is|are|can|does|do)\b/i;
    const hasQuestionHeadings = headings.some((h) => questionRe.test(h));

    // ── Check 3: JSON-LD Schema Markup ─────────────────────────────────────
    const schemaBlocks =
      html.match(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      ) ?? [];
    const hasSchemaMarkup = schemaBlocks.length > 0;
    const schemaTypes: string[] = [];
    for (const block of schemaBlocks) {
      const found = block.match(/"@type"\s*:\s*"([^"]+)"/g) ?? [];
      for (const t of found) {
        const name = t.replace(/"@type"\s*:\s*"/, "").replace(/"$/, "");
        if (!schemaTypes.includes(name)) schemaTypes.push(name);
      }
    }

    // ── Check 4: Content Structure (lists + headings) ──────────────────────
    const listCount = (html.match(/<(ul|ol)\b/gi) ?? []).length;
    const h2Count = (html.match(/<h2\b/gi) ?? []).length;
    const hasContentStructure = listCount >= 2 && h2Count >= 1;

    // ── Score: 25 pts per check ────────────────────────────────────────────
    const score =
      (hasStatisticalData ? 25 : 0) +
      (hasQuestionHeadings ? 25 : 0) +
      (hasSchemaMarkup ? 25 : 0) +
      (hasContentStructure ? 25 : 0);

    return NextResponse.json({
      geoScore: score,
      hasStatisticalData,
      hasQuestionHeadings,
      hasSchemaMarkup,
      schemaTypes,
      hasContentStructure,
      estimatedAiPipelineLeak: 0, // computed in fetchAudit using SEO data
    });
  } catch {
    return NextResponse.json(defaultResult);
  }
}
