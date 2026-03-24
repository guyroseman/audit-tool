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
    fetchFailed: true,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let res: Response;
    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
        },
        redirect: "follow",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) return NextResponse.json({ ...defaultResult, httpStatus: res.status });
    const html = await res.text();

    // ── Strip noise ────────────────────────────────────────────────────────────
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");

    // ── Check 1: Statistical / Data Density ────────────────────────────────────
    // Collect distinct quantified claims — AI engines prefer data-rich sources
    const dataPatterns: RegExp[] = [
      /[\$£€¥]\s*[\d,]+(?:\.\d+)?(?:\s*[kmb]|\s*(?:k|m|bn|million|billion|thousand))?/gi,
      /\d+(?:\.\d+)?\s*%(?:\s+(?:of|increase|decrease|reduction|growth|improvement))?/gi,
      /\d+[\s,]*(?:million|billion|trillion|thousand)\b/gi,
      /\d+(?:\.\d+)?[xX]\s*(?:faster|more|better|higher|lower|less|improvement)/gi,
      /(?:increased?|decreased?|reduced?|grew?|grown?|improved?)\s+(?:by\s+)?[\d.]+\s*%/gi,
      /\d+\s+(?:out\s+of\s+\d+|users|customers|clients|companies|businesses|people|employees|countries|languages)/gi,
      /(?:over|more\s+than|nearly|approximately|about)\s+[\d,]+\s+(?:users|customers|companies|people)/gi,
    ];
    const dataHits = new Set<string>();
    for (const pat of dataPatterns) {
      const matches = bodyText.match(pat) ?? [];
      for (const m of matches) dataHits.add(m.trim().toLowerCase().slice(0, 60));
    }
    const hasStatisticalData = dataHits.size >= 3;

    // ── Check 2: Question-Based Headings (H1-H6) ───────────────────────────────
    // AI engines match question queries to pages with question-format headings
    const allHeadings = html.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi) ?? [];
    const questionRe = /\b(what|how|why|when|where|who|which|is|are|can|does|do|will|should|could|would|have|has)\b/i;
    const hasFaqSection = /\b(faq|frequently\s+asked\s+questions?|common\s+questions?|q\s*&\s*a)\b/i.test(bodyText);
    const hasQuestionHeadings = allHeadings.some((h) => questionRe.test(h)) || hasFaqSection;

    // ── Check 3: Schema Markup (JSON-LD + microdata + RDFa) ────────────────────
    // The primary entity signal AI systems use to identify and cite sources
    const schemaBlocks = html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ) ?? [];
    const hasMicrodata = /\bitemtype\s*=\s*["']https?:\/\/schema\.org/i.test(html);
    const hasRDFa = /\bvocab\s*=\s*["']https?:\/\/schema\.org/i.test(html);
    const hasSchemaMarkup = schemaBlocks.length > 0 || hasMicrodata || hasRDFa;

    const schemaTypes: string[] = [];
    for (const block of schemaBlocks) {
      const found = block.match(/"@type"\s*:\s*"([^"]+)"/g) ?? [];
      for (const t of found) {
        const name = t.replace(/"@type"\s*:\s*"/, "").replace(/"$/, "").trim();
        if (name && !schemaTypes.includes(name)) schemaTypes.push(name);
      }
    }
    if (hasMicrodata && !schemaTypes.length) schemaTypes.push("Microdata");
    if (hasRDFa && !schemaTypes.length) schemaTypes.push("RDFa");

    // ── Check 4: Content Structure ─────────────────────────────────────────────
    // Well-structured content is 3x more likely to be extracted by LLMs
    const listCount = (html.match(/<(ul|ol)\b/gi) ?? []).length;
    const tableCount = (html.match(/<table\b/gi) ?? []).length;
    const h2PlusCount = (html.match(/<h[2-4]\b/gi) ?? []).length;
    const hasDefinitionList = (html.match(/<dl\b/gi) ?? []).length > 0;
    // Pass if: has at least one structured list/table AND at least one subheading
    const hasContentStructure = (listCount >= 1 || tableCount >= 1 || hasDefinitionList) && h2PlusCount >= 1;

    // ── Score (25 pts per check) ───────────────────────────────────────────────
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
      estimatedAiPipelineLeak: 0,
      fetchFailed: false,
      // Debug helpers (stripped by JSON serialisation if undefined)
      _debug: {
        dataHitCount: dataHits.size,
        headingCount: allHeadings.length,
        listCount,
        tableCount,
        h2PlusCount,
        hasMicrodata,
        hasFaqSection,
      },
    });
  } catch {
    return NextResponse.json(defaultResult);
  }
}
