// ─── Audit Data Types ────────────────────────────────────────────────────────

export interface AuditMetrics {
  lcp: number;       // Largest Contentful Paint (ms)
  fcp: number;       // First Contentful Paint (ms)
  tbt: number;       // Total Blocking Time (ms)
  cls: number;       // Cumulative Layout Shift (unitless)
  speedIndex: number; // Speed Index (ms)
  performanceScore: number; // 0–100
}

export interface AuditResult {
  url: string;
  metrics: AuditMetrics;
  adLossPercent: number;   // Estimated % of ad revenue lost
  bounceRateIncrease: number; // % bounce rate increase vs baseline
  annualRevenueLoss: number; // Dollar estimate (placeholder — shown as a range)
  severity: "critical" | "warning" | "ok";
  timestamp: number;
}

// ─── PageSpeed API Response Shape (relevant subset) ──────────────────────────

interface PSIAuditItem {
  numericValue?: number;
  displayValue?: string;
}

interface PSICategory {
  score: number;
}

interface PSIResponse {
  lighthouseResult?: {
    audits?: {
      "largest-contentful-paint"?: PSIAuditItem;
      "first-contentful-paint"?: PSIAuditItem;
      "total-blocking-time"?: PSIAuditItem;
      "cumulative-layout-shift"?: PSIAuditItem;
      "speed-index"?: PSIAuditItem;
    };
    categories?: {
      performance?: PSICategory;
    };
  };
}

// ─── Fake Data for test.com bypass ────────────────────────────────────────────

export const FAKE_AUDIT_RESULT: AuditResult = {
  url: "test.com",
  metrics: {
    lcp: 6800,
    fcp: 3200,
    tbt: 820,
    cls: 0.31,
    speedIndex: 5400,
    performanceScore: 23,
  },
  adLossPercent: 61,
  bounceRateIncrease: 48,
  annualRevenueLoss: 87400,
  severity: "critical",
  timestamp: Date.now(),
};

// ─── Calculation Engine ───────────────────────────────────────────────────────

/**
 * Google research: every 100ms increase in load time → ~1% drop in conversions.
 * LCP baseline for good = 2500ms. We penalize anything above that.
 *
 * Ad revenue loss model (simplified):
 *   - LCP > 2.5s: lose ~7% per additional second
 *   - TBT > 200ms: lose ~4% per additional 200ms
 *   - CLS > 0.1: lose ~5% per 0.1 unit
 *   - Capped at 90%
 */
function calcAdLoss(m: AuditMetrics): number {
  let loss = 0;

  // LCP penalty (ms above 2500ms)
  const lcpOverage = Math.max(0, m.lcp - 2500);
  loss += (lcpOverage / 1000) * 7;

  // TBT penalty (ms above 200ms)
  const tbtOverage = Math.max(0, m.tbt - 200);
  loss += (tbtOverage / 200) * 4;

  // CLS penalty
  const clsOverage = Math.max(0, m.cls - 0.1);
  loss += (clsOverage / 0.1) * 5;

  // Performance score adjustment — low score amplifies losses
  const scorePenalty = Math.max(0, (50 - m.performanceScore) / 50) * 15;
  loss += scorePenalty;

  return Math.min(90, Math.round(loss));
}

/**
 * Bounce rate model:
 *   - Google data: 53% of mobile users abandon if load > 3s
 *   - We estimate increase over a "good" baseline of 35% bounce rate
 */
function calcBounceRateIncrease(m: AuditMetrics): number {
  const lcpFactor = Math.max(0, (m.lcp - 2500) / 500) * 5;
  const fcpFactor = Math.max(0, (m.fcp - 1800) / 400) * 3;
  return Math.min(80, Math.round(lcpFactor + fcpFactor));
}

/**
 * Annual revenue loss — we show a range estimate based on typical SMB ad spend.
 * Assumes avg monthly ad spend of $5k–$20k, loss% applied.
 */
function calcAnnualRevenueLoss(adLossPercent: number): number {
  const avgMonthlyAdSpend = 8000; // mid-range SMB assumption
  return Math.round((adLossPercent / 100) * avgMonthlyAdSpend * 12);
}

function calcSeverity(score: number): AuditResult["severity"] {
  if (score < 50) return "critical";
  if (score < 80) return "warning";
  return "ok";
}

// ─── PSI API Call ─────────────────────────────────────────────────────────────

export async function fetchAudit(rawUrl: string): Promise<AuditResult> {
  // Normalize URL
  let url = rawUrl.trim().toLowerCase();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  // Test bypass
  if (url.includes("test.com")) {
    await new Promise((r) => setTimeout(r, 3500)); // simulate delay
    return FAKE_AUDIT_RESULT;
  }

  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url
  )}&strategy=mobile&category=performance`;

  const res = await fetch(apiUrl, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`PageSpeed API returned ${res.status}: ${res.statusText}`);
  }

  const data: PSIResponse = await res.json();
  const audits = data.lighthouseResult?.audits;
  const categories = data.lighthouseResult?.categories;

  if (!audits || !categories) {
    throw new Error("Invalid response from PageSpeed API. Is the URL reachable?");
  }

  const metrics: AuditMetrics = {
    lcp: audits["largest-contentful-paint"]?.numericValue ?? 0,
    fcp: audits["first-contentful-paint"]?.numericValue ?? 0,
    tbt: audits["total-blocking-time"]?.numericValue ?? 0,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? 0,
    speedIndex: audits["speed-index"]?.numericValue ?? 0,
    performanceScore: Math.round((categories.performance?.score ?? 0) * 100),
  };

  const adLossPercent = calcAdLoss(metrics);
  const bounceRateIncrease = calcBounceRateIncrease(metrics);
  const annualRevenueLoss = calcAnnualRevenueLoss(adLossPercent);
  const severity = calcSeverity(metrics.performanceScore);

  return {
    url: rawUrl.trim(),
    metrics,
    adLossPercent,
    bounceRateIncrease,
    annualRevenueLoss,
    severity,
    timestamp: Date.now(),
  };
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

export function fmtMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

export function fmtScore(score: number): string {
  return score.toString().padStart(2, "0");
}

export function scoreColor(score: number): string {
  if (score < 50) return "#e8341a";
  if (score < 80) return "#f59e0b";
  return "#10b981";
}

export function metricStatus(value: number, thresholds: [number, number]): "ok" | "warn" | "bad" {
  if (value <= thresholds[0]) return "ok";
  if (value <= thresholds[1]) return "warn";
  return "bad";
}
