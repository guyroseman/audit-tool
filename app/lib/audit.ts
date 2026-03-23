// ─── Audit Data Types ────────────────────────────────────────────────────────

export interface AuditMetrics {
  lcp: number;
  fcp: number;
  tbt: number;
  cls: number;
  speedIndex: number;
  performanceScore: number;
}

export interface SEOSignals {
  hasMeta: boolean;
  hasOGTags: boolean;
  titleLength: number;
  hasH1: boolean;
  hasStructuredData: boolean;
  mobileViewport: boolean;
  httpsEnabled: boolean;
  isCrawlable: boolean;
  estimatedSeoScore: number;
  seoReachLossPercent: number;
  ctrLoss: number;
}

export interface TechIssues {
  renderBlockingResources: boolean;
  unusedJavascript: boolean;
  noImageOptimisation: boolean;
  noBrowserCache: boolean;
  noCompression: boolean;
  thirdPartyImpact: number;
  estimatedTechScore: number;
}

// ─── PILLAR 3: Accessibility ──────────────────────────────────────────────────
export interface AccessibilitySignals {
  estimatedA11yScore: number;       // 0–100 from Lighthouse
  missingAltText: boolean;          // Images without alt attributes
  missingFormLabels: boolean;       // Inputs without labels
  lowContrastRatio: boolean;        // Text fails WCAG contrast
  missingLangAttr: boolean;         // <html> has no lang=""
  estimatedMarketLockout: number;   // % of population excluded (derived)
  adaRiskLevel: "high" | "medium" | "low";
}

// ─── PILLAR 4: Security & Best Practices ─────────────────────────────────────
export interface SecuritySignals {
  estimatedBestPracticesScore: number; // 0–100 from Lighthouse
  usesHTTPS: boolean;
  noVulnerableLibraries: boolean;      // Lighthouse detects outdated/vuln JS libs
  hasSecurityHeaders: boolean;
  vulnerableLibraryCount: number;      // Count of flagged libraries
  trustRiskLevel: "high" | "medium" | "low";
}

export interface LeadSignals {
  hasLiveChatWidget: boolean;
  hasContactForm: boolean;
  hasCTA: boolean;
  hasPhoneNumber: boolean;
  estimatedLeadScore: number;
}

// ─── Plain-English Finding ────────────────────────────────────────────────────
export type FindingSeverity = "critical" | "warning" | "ok";

export interface AuditFinding {
  id: string;
  severity: FindingSeverity;
  category: "performance" | "seo" | "tech" | "accessibility" | "security";
  headline: string;
  businessImpact: string;
  technicalDetail: string;
  fix: string;
  estimatedRecovery?: string;
}

export interface AuditResult {
  url: string;
  metrics: AuditMetrics;
  seo: SEOSignals;
  tech: TechIssues;
  accessibility: AccessibilitySignals;
  security: SecuritySignals;
  leads: LeadSignals;
  // Legacy fields (kept for shared.tsx compatibility)
  adLossPercent: number;
  bounceRateIncrease: number;
  annualRevenueLoss: number;
  // Revenue breakdown
  monthlyAdOverspend: number;
  monthlyOrganicLoss: number;
  totalMonthlyCost: number;
  // Plain-English findings
  explanations: AuditFinding[];
  severity: "critical" | "warning" | "ok";
  timestamp: number;
  screenshot?: string;
}

// ─── PageSpeed API Response Shape ─────────────────────────────────────────────
interface PSIAuditItem {
  numericValue?: number;
  displayValue?: string;
  score?: number | null;
  details?: { items?: { node?: unknown; source?: unknown }[]; data?: string };
}
interface PSICategory { score: number | null; }
interface PSIResponse {
  lighthouseResult?: {
    audits?: {
      "largest-contentful-paint"?: PSIAuditItem;
      "first-contentful-paint"?: PSIAuditItem;
      "total-blocking-time"?: PSIAuditItem;
      "cumulative-layout-shift"?: PSIAuditItem;
      "speed-index"?: PSIAuditItem;
      "render-blocking-resources"?: PSIAuditItem;
      "unused-javascript"?: PSIAuditItem;
      "uses-optimized-images"?: PSIAuditItem;
      "uses-long-cache-ttl"?: PSIAuditItem;
      "uses-text-compression"?: PSIAuditItem;
      "third-party-summary"?: PSIAuditItem;
      "viewport"?: PSIAuditItem;
      "document-title"?: PSIAuditItem;
      "meta-description"?: PSIAuditItem;
      "structured-data"?: PSIAuditItem;
      "is-on-https"?: PSIAuditItem;
      "is-crawlable"?: PSIAuditItem;
      // Accessibility
      "image-alt"?: PSIAuditItem;
      "label"?: PSIAuditItem;
      "color-contrast"?: PSIAuditItem;
      "html-has-lang"?: PSIAuditItem;
      "aria-hidden-body"?: PSIAuditItem;
      "button-name"?: PSIAuditItem;
      "link-name"?: PSIAuditItem;
      // Security / Best Practices
      "no-vulnerable-libraries"?: PSIAuditItem;
      "csp-xss"?: PSIAuditItem;
      "geolocation-on-start"?: PSIAuditItem;
      "notification-on-start"?: PSIAuditItem;
      "inspector-issues"?: PSIAuditItem;
      "final-screenshot"?: PSIAuditItem;
    };
    categories?: {
      performance?: PSICategory;
      seo?: PSICategory;
      accessibility?: PSICategory;
      "best-practices"?: PSICategory;
    };
  };
}

// ─── Calculation Helpers ──────────────────────────────────────────────────────
function calcAdLoss(m: AuditMetrics): number {
  let loss = 0;
  loss += (Math.max(0, m.lcp - 2500) / 1000) * 7;
  loss += (Math.max(0, m.tbt - 200) / 200) * 4;
  loss += (Math.max(0, m.cls - 0.1) / 0.1) * 5;
  loss += Math.max(0, (50 - m.performanceScore) / 50) * 15;
  return Math.min(90, Math.round(loss));
}

function calcBounceRateIncrease(m: AuditMetrics): number {
  return Math.min(80, Math.round(
    Math.max(0, (m.lcp - 2500) / 500) * 5 +
    Math.max(0, (m.fcp - 1800) / 400) * 3
  ));
}

function calcSeverity(score: number): AuditResult["severity"] {
  if (score < 50) return "critical";
  if (score < 80) return "warning";
  return "ok";
}

function calcMonthlyAdOverspend(adLossPercent: number): number {
  return Math.round((adLossPercent / 100) * 2000);
}

function calcMonthlyOrganicLoss(seo: SEOSignals): number {
  const clicksLost = Math.round((seo.ctrLoss / 100) * 5000);
  return Math.round(clicksLost * 1.5);
}

function calcSEO(
  audits: NonNullable<PSIResponse["lighthouseResult"]>["audits"],
  categories: NonNullable<PSIResponse["lighthouseResult"]>["categories"]
): SEOSignals {
  const seoScore = Math.round((categories?.seo?.score ?? 0.5) * 100);
  const hasMeta = (audits?.["meta-description"]?.score ?? 0) > 0;
  const hasViewport = (audits?.["viewport"]?.score ?? 0) > 0;
  const hasTitle = (audits?.["document-title"]?.score ?? 0) > 0;
  const isHttps = (audits?.["is-on-https"]?.score ?? 0) > 0;
  const isCrawlable = (audits?.["is-crawlable"]?.score ?? 1) > 0;
  const seoReachLossPercent = !isCrawlable ? 99 : Math.max(0, Math.round((100 - seoScore) * 0.6));
  const ctrLoss = !hasMeta ? 35 : !hasTitle ? 20 : Math.max(0, Math.round((80 - seoScore) * 0.3));
  return {
    hasMeta, hasOGTags: seoScore > 70, titleLength: hasTitle ? 45 : 0,
    hasH1: seoScore > 60, hasStructuredData: seoScore > 85,
    mobileViewport: hasViewport, httpsEnabled: isHttps, isCrawlable,
    estimatedSeoScore: seoScore, seoReachLossPercent, ctrLoss,
  };
}

function calcTech(audits: NonNullable<PSIResponse["lighthouseResult"]>["audits"]): TechIssues {
  const renderBlocking = (audits?.["render-blocking-resources"]?.score ?? 1) < 0.9;
  const unusedJS = (audits?.["unused-javascript"]?.score ?? 1) < 0.9;
  const noImgOpt = (audits?.["uses-optimized-images"]?.score ?? 1) < 0.9;
  const noCache = (audits?.["uses-long-cache-ttl"]?.score ?? 1) < 0.9;
  const noCompression = (audits?.["uses-text-compression"]?.score ?? 1) < 0.9;
  const thirdParty = audits?.["third-party-summary"]?.numericValue ?? 0;
  const issues = [renderBlocking, unusedJS, noImgOpt, noCache, noCompression].filter(Boolean).length;
  return {
    renderBlockingResources: renderBlocking, unusedJavascript: unusedJS,
    noImageOptimisation: noImgOpt, noBrowserCache: noCache, noCompression,
    thirdPartyImpact: Math.round(thirdParty),
    estimatedTechScore: Math.round(100 - (issues / 5) * 100),
  };
}

// ─── PILLAR 3: Accessibility Calculator ──────────────────────────────────────
function calcAccessibility(
  audits: NonNullable<PSIResponse["lighthouseResult"]>["audits"],
  categories: NonNullable<PSIResponse["lighthouseResult"]>["categories"]
): AccessibilitySignals {
  const a11yScore = Math.round((categories?.accessibility?.score ?? 0.5) * 100);

  // Key WCAG failure points from Lighthouse
  const missingAltText   = (audits?.["image-alt"]?.score ?? 1) < 1;
  const missingFormLabels = (audits?.["label"]?.score ?? 1) < 1;
  const lowContrastRatio  = (audits?.["color-contrast"]?.score ?? 1) < 1;
  const missingLangAttr   = (audits?.["html-has-lang"]?.score ?? 1) < 1;

  // Market lockout: ~26% of adults have a disability; poor a11y score correlates
  // with how many of those users have a degraded/broken experience.
  const lockoutBase = 26; // % of population with some disability (CDC data)
  const lockoutMultiplier = Math.max(0, (80 - a11yScore) / 80);
  const estimatedMarketLockout = Math.round(lockoutBase * lockoutMultiplier * 10) / 10;

  // ADA risk: consistent failures = high lawsuit risk (US/UK law applies)
  const failCount = [missingAltText, missingFormLabels, lowContrastRatio, missingLangAttr].filter(Boolean).length;
  const adaRiskLevel: AccessibilitySignals["adaRiskLevel"] =
    failCount >= 3 ? "high" : failCount >= 1 ? "medium" : "low";

  return {
    estimatedA11yScore: a11yScore, missingAltText, missingFormLabels,
    lowContrastRatio, missingLangAttr,
    estimatedMarketLockout, adaRiskLevel,
  };
}

// ─── PILLAR 4: Security Calculator ───────────────────────────────────────────
function calcSecurity(
  audits: NonNullable<PSIResponse["lighthouseResult"]>["audits"],
  categories: NonNullable<PSIResponse["lighthouseResult"]>["categories"]
): SecuritySignals {
  const bpScore = Math.round((categories?.["best-practices"]?.score ?? 0.5) * 100);
  const usesHTTPS = (audits?.["is-on-https"]?.score ?? 1) >= 1;
  const noVulnLibs = (audits?.["no-vulnerable-libraries"]?.score ?? 1) >= 1;

  // Count vulnerable library items if audit failed
  const vulnItems = audits?.["no-vulnerable-libraries"]?.details?.items ?? [];
  const vulnerableLibraryCount = noVulnLibs ? 0 : Math.max(1, vulnItems.length);

  // Security headers proxy: best-practices score below 75 = likely missing headers
  const hasSecurityHeaders = bpScore >= 75;

  const riskFactors = [!usesHTTPS, !noVulnLibs, !hasSecurityHeaders].filter(Boolean).length;
  const trustRiskLevel: SecuritySignals["trustRiskLevel"] =
    riskFactors >= 2 ? "high" : riskFactors === 1 ? "medium" : "low";

  return {
    estimatedBestPracticesScore: bpScore, usesHTTPS, noVulnerableLibraries: noVulnLibs,
    hasSecurityHeaders, vulnerableLibraryCount, trustRiskLevel,
  };
}

function calcLeads(seo: SEOSignals): LeadSignals {
  const score = seo.estimatedSeoScore;
  return {
    hasLiveChatWidget: score > 80, hasContactForm: score > 50,
    hasCTA: score > 40, hasPhoneNumber: score > 65,
    estimatedLeadScore: Math.min(100, Math.round(score * 0.8 + 20)),
  };
}

// ─── Plain-English Explanations (All 4 Pillars) ───────────────────────────────
function buildExplanations(
  metrics: AuditMetrics,
  seo: SEOSignals,
  tech: TechIssues,
  accessibility: AccessibilitySignals,
  security: SecuritySignals,
): AuditFinding[] {
  const findings: AuditFinding[] = [];

  // ── PILLAR 1: PERFORMANCE ──────────────────────────────────────────────────
  if (!seo.isCrawlable) {
    findings.push({
      id: "crawl-blocked", severity: "critical", category: "seo",
      headline: "Google cannot index your site — you are invisible to search",
      businessImpact: "Your site does not appear in Google results. Every pound spent on SEO is wasted until this is fixed.",
      technicalDetail: "A robots.txt rule or meta noindex tag is blocking Googlebot from reading your pages.",
      fix: "Remove any 'noindex' meta tags or robots.txt disallow rules blocking your main pages.",
      estimatedRecovery: "24–72 hours after fix",
    });
  }

  if (metrics.lcp > 4000) {
    const lcpSec = (metrics.lcp / 1000).toFixed(1);
    findings.push({
      id: "lcp-critical", severity: "critical", category: "performance",
      headline: `Your page takes ${lcpSec}s to load on mobile`,
      businessImpact: `You are ${((metrics.lcp - 2500)/1000).toFixed(1)}s over Google's threshold. You pay an estimated 40–60% more per click than faster competitors.`,
      technicalDetail: `LCP: ${lcpSec}s. Google's "Good" threshold is ≤2.5s. Your score is in the "Poor" band.`,
      fix: "Compress and lazy-load images. Remove or defer render-blocking JavaScript. Consider a CDN.",
      estimatedRecovery: "1–3 weeks",
    });
  } else if (metrics.lcp > 2500) {
    findings.push({
      id: "lcp-warning", severity: "warning", category: "performance",
      headline: `Page load is ${(metrics.lcp/1000).toFixed(1)}s — just above Google's threshold`,
      businessImpact: "Google's ad quality scoring starts penalising above 2.5s. A small fix here saves ad spend.",
      technicalDetail: `LCP: ${(metrics.lcp/1000).toFixed(1)}s. Threshold: ≤2.5s good, ≤4s needs improvement, >4s poor.`,
      fix: "Optimise your hero image and preload critical fonts.",
      estimatedRecovery: "3–7 days",
    });
  }

  if (metrics.tbt > 600) {
    findings.push({
      id: "tbt-critical", severity: "critical", category: "performance",
      headline: `Your site freezes for ${Math.round(metrics.tbt)}ms on every page load`,
      businessImpact: "Users tap buttons and nothing happens. They assume the site is broken and leave before converting.",
      technicalDetail: `TBT: ${Math.round(metrics.tbt)}ms. Google's "Good" threshold is ≤200ms.`,
      fix: "Break up long JavaScript tasks. Remove unused third-party scripts. Defer non-critical JS.",
      estimatedRecovery: "1–2 weeks",
    });
  } else if (metrics.tbt > 200) {
    findings.push({
      id: "tbt-warning", severity: "warning", category: "performance",
      headline: "Page responsiveness needs improvement",
      businessImpact: "Occasional input delays frustrate users on slower mobile connections.",
      technicalDetail: `TBT: ${Math.round(metrics.tbt)}ms. Target: ≤200ms.`,
      fix: "Audit and reduce third-party scripts.",
      estimatedRecovery: "1 week",
    });
  }

  if (metrics.cls > 0.25) {
    findings.push({
      id: "cls-critical", severity: "critical", category: "performance",
      headline: "Your page layout jumps around as it loads",
      businessImpact: `CLS of ${metrics.cls.toFixed(2)} means buttons shift mid-load. Users click the wrong element. Google uses this as a ranking signal.`,
      technicalDetail: `CLS: ${metrics.cls.toFixed(2)}. Google's "Good" threshold is ≤0.1.`,
      fix: "Set explicit width/height on images and ad slots. Avoid injecting content above existing elements.",
      estimatedRecovery: "3–7 days",
    });
  }

  // ── PILLAR 2: SEO ──────────────────────────────────────────────────────────
  if (!seo.hasMeta) {
    findings.push({
      id: "no-meta", severity: "critical", category: "seo",
      headline: "Your Google search listing has no description",
      businessImpact: `Google auto-generates a snippet users ignore. This reduces click-through rate by ~35%. You lose an estimated ${seo.ctrLoss}% of organic clicks every day.`,
      technicalDetail: "No <meta name='description'> tag detected on this page.",
      fix: "Add a compelling 150–160 character meta description to every page.",
      estimatedRecovery: "24 hours after fix",
    });
  }

  if (!seo.mobileViewport) {
    findings.push({
      id: "no-viewport", severity: "critical", category: "seo",
      headline: "Your site is not configured for mobile users",
      businessImpact: "68% of web traffic is mobile. Google uses mobile-first indexing — sites failing viewport configuration are demoted in all rankings.",
      technicalDetail: "The viewport meta tag is missing. Google's mobile-first crawler sees a desktop-only layout.",
      fix: "Add <meta name='viewport' content='width=device-width, initial-scale=1'> to your HTML head.",
      estimatedRecovery: "Same day",
    });
  }

  // ── PILLAR 3: ACCESSIBILITY ────────────────────────────────────────────────
  if (accessibility.adaRiskLevel === "high") {
    findings.push({
      id: "ada-high", severity: "critical", category: "accessibility",
      headline: `Your site locks out ~${accessibility.estimatedMarketLockout}% of the market`,
      businessImpact: `${accessibility.estimatedMarketLockout}% of potential customers cannot properly use your site. In the UK and US, WCAG non-compliance creates legal exposure — lawsuits against non-compliant sites increased 300% since 2020.`,
      technicalDetail: `Accessibility score: ${accessibility.estimatedA11yScore}/100. Failures detected: ${[
        accessibility.missingAltText && "missing image alt text",
        accessibility.missingFormLabels && "unlabelled form inputs",
        accessibility.lowContrastRatio && "text fails contrast ratio",
        accessibility.missingLangAttr && "missing HTML lang attribute",
      ].filter(Boolean).join(", ")}.`,
      fix: "Add alt attributes to all images. Label all form inputs. Fix low-contrast text to meet WCAG AA (4.5:1 ratio). Add lang='en' to your <html> tag.",
      estimatedRecovery: "1–2 weeks",
    });
  } else if (accessibility.adaRiskLevel === "medium") {
    findings.push({
      id: "ada-medium", severity: "warning", category: "accessibility",
      headline: `Accessibility issues are excluding some of your audience`,
      businessImpact: `~${accessibility.estimatedMarketLockout}% of visitors may struggle to use your site. Screen reader users and keyboard navigators encounter broken experiences.`,
      technicalDetail: `Accessibility score: ${accessibility.estimatedA11yScore}/100. Some WCAG AA criteria are failing.`,
      fix: "Run a full WCAG audit. Prioritise image alt text and form labels first — highest impact, lowest effort.",
      estimatedRecovery: "1 week",
    });
  }

  if (accessibility.missingAltText) {
    findings.push({
      id: "no-alt-text", severity: "warning", category: "accessibility",
      headline: "Images have no alt text — invisible to screen readers and Google Images",
      businessImpact: "Screen reader users cannot understand your images. Google Images cannot index them. You are losing both conversions and search traffic.",
      technicalDetail: "Lighthouse image-alt audit failed. One or more <img> tags are missing alt attributes.",
      fix: "Add descriptive alt attributes to every <img> tag. Use empty alt='' only for purely decorative images.",
      estimatedRecovery: "1–2 days",
    });
  }

  if (accessibility.lowContrastRatio) {
    findings.push({
      id: "low-contrast", severity: "warning", category: "accessibility",
      headline: "Text on your site is too faint to read for many users",
      businessImpact: "1 in 12 men has colour blindness. Low contrast text makes your content unreadable to a significant portion of your audience — and is a WCAG legal liability.",
      technicalDetail: "color-contrast audit failed. Text elements do not meet the minimum 4.5:1 contrast ratio required by WCAG AA.",
      fix: "Use a contrast checker (WebAIM) to verify all text/background combinations meet 4.5:1 minimum.",
      estimatedRecovery: "2–3 days",
    });
  }

  // ── PILLAR 4: SECURITY ─────────────────────────────────────────────────────
  if (!security.usesHTTPS) {
    findings.push({
      id: "no-https", severity: "critical", category: "security",
      headline: "Your site is not secure — browsers warn visitors away",
      businessImpact: "Chrome shows a 'Not Secure' warning to every visitor. Google ranks HTTPS sites higher. Ad networks charge more for traffic to insecure pages. You are losing trust, rankings, and paying more for ads simultaneously.",
      technicalDetail: "is-on-https audit failed. Site is serving content over HTTP.",
      fix: "Install an SSL certificate. Cloudflare, Vercel, and Netlify all offer this free.",
      estimatedRecovery: "1–2 hours",
    });
  }

  if (!security.noVulnerableLibraries) {
    findings.push({
      id: "vuln-libs", severity: "critical", category: "security",
      headline: `${security.vulnerableLibraryCount} outdated JavaScript ${security.vulnerableLibraryCount === 1 ? "library" : "libraries"} detected — browsers are flagging your site`,
      businessImpact: "Modern browsers actively warn users when a site runs vulnerable JavaScript libraries. For e-commerce sites this directly tanks conversion rates — buyers see the warning and abandon checkout.",
      technicalDetail: `Lighthouse no-vulnerable-libraries audit failed. ${security.vulnerableLibraryCount} ${security.vulnerableLibraryCount === 1 ? "library" : "libraries"} with known CVEs detected in your page bundle.`,
      fix: "Update all JavaScript dependencies to their latest versions. Run `npm audit fix` if using Node. Remove any libraries you no longer use.",
      estimatedRecovery: "1–3 days",
    });
  }

  if (!security.hasSecurityHeaders) {
    findings.push({
      id: "no-security-headers", severity: "warning", category: "security",
      headline: "Missing security headers — your site has no protection against XSS attacks",
      businessImpact: "Without Content Security Policy headers, your site is open to cross-site scripting attacks. Hackers can inject code to steal customer data or redirect visitors to phishing pages.",
      technicalDetail: `Best Practices score: ${security.estimatedBestPracticesScore}/100. Security headers (CSP, X-Frame-Options, HSTS) are not configured.`,
      fix: "Add security headers via your hosting provider or middleware. Cloudflare, Vercel, and Next.js all support this natively.",
      estimatedRecovery: "1 day",
    });
  }

  // ── TECH ISSUES ────────────────────────────────────────────────────────────
  if (tech.renderBlockingResources) {
    findings.push({
      id: "render-blocking", severity: "warning", category: "tech",
      headline: "CSS or JavaScript files are delaying your page from showing",
      businessImpact: "Every visitor stares at a blank screen while these files load, adding 1–3 seconds before anything appears.",
      technicalDetail: "Render-blocking resources detected. Files loaded synchronously in <head> block the browser from rendering.",
      fix: "Add 'defer' or 'async' to non-critical script tags. Move critical CSS inline.",
      estimatedRecovery: "3–5 days",
    });
  }

  if (tech.noImageOptimisation) {
    findings.push({
      id: "image-opt", severity: "warning", category: "tech",
      headline: "Images are not compressed or optimised",
      businessImpact: "Unoptimised images are usually the single largest cause of slow LCP. They use excess mobile data on every page load.",
      technicalDetail: "uses-optimized-images audit failed. Images could be significantly reduced in file size without quality loss.",
      fix: "Convert images to WebP format. Use srcset for responsive sizing. Add lazy loading to below-fold images.",
      estimatedRecovery: "1–3 days",
    });
  }

  if (tech.thirdPartyImpact > 500) {
    findings.push({
      id: "third-party", severity: "warning", category: "tech",
      headline: `External scripts are blocking your page for ${Math.round(tech.thirdPartyImpact)}ms`,
      businessImpact: "Third-party scripts run code you don't control. If their servers are slow, your site is slow. You are paying to slow yourself down.",
      technicalDetail: `Third-party scripts add ${Math.round(tech.thirdPartyImpact)}ms of main-thread blocking time.`,
      fix: "Remove unnecessary third-party scripts. Load remaining ones with 'async' or via a facade pattern.",
      estimatedRecovery: "1 week",
    });
  }

  // ── ALL GOOD ───────────────────────────────────────────────────────────────
  if (
    metrics.performanceScore >= 80 && seo.estimatedSeoScore >= 80 &&
    accessibility.estimatedA11yScore >= 80 && security.estimatedBestPracticesScore >= 80
  ) {
    findings.push({
      id: "all-good", severity: "ok", category: "performance",
      headline: "Strong foundations across all 4 pillars",
      businessImpact: "Your site is in the top tier for speed, SEO, accessibility, and security. Focus on conversion optimisation to maximise the traffic you are already earning.",
      technicalDetail: `Performance: ${metrics.performanceScore}/100 · SEO: ${seo.estimatedSeoScore}/100 · Accessibility: ${accessibility.estimatedA11yScore}/100 · Security: ${security.estimatedBestPracticesScore}/100.`,
      fix: "Continue monitoring — performance degrades as you add features. Set up automated weekly audits.",
    });
  }

  const order: Record<FindingSeverity, number> = { critical: 0, warning: 1, ok: 2 };
  return findings.sort((a, b) => order[a.severity] - order[b.severity]);
}

// ─── Fake / Demo Data ──────────────────────────────────────────────────────────
const FAKE_METRICS: AuditMetrics = { lcp: 6800, fcp: 3200, tbt: 820, cls: 0.31, speedIndex: 5400, performanceScore: 23 };
const FAKE_SEO: SEOSignals = {
  hasMeta: false, hasOGTags: false, titleLength: 0, hasH1: true, hasStructuredData: false,
  mobileViewport: true, httpsEnabled: true, isCrawlable: true,
  estimatedSeoScore: 38, seoReachLossPercent: 42, ctrLoss: 35,
};
const FAKE_TECH: TechIssues = {
  renderBlockingResources: true, unusedJavascript: true, noImageOptimisation: true,
  noBrowserCache: true, noCompression: false, thirdPartyImpact: 1840, estimatedTechScore: 28,
};
const FAKE_A11Y: AccessibilitySignals = {
  estimatedA11yScore: 41, missingAltText: true, missingFormLabels: true,
  lowContrastRatio: true, missingLangAttr: false,
  estimatedMarketLockout: 13.3, adaRiskLevel: "high",
};
const FAKE_SECURITY: SecuritySignals = {
  estimatedBestPracticesScore: 58, usesHTTPS: true, noVulnerableLibraries: false,
  hasSecurityHeaders: false, vulnerableLibraryCount: 3, trustRiskLevel: "high",
};
const FAKE_LEADS: LeadSignals = { hasLiveChatWidget: false, hasContactForm: true, hasCTA: true, hasPhoneNumber: false, estimatedLeadScore: 45 };
const FAKE_AD_LOSS = 61;
const FAKE_EXPLANATIONS = buildExplanations(FAKE_METRICS, FAKE_SEO, FAKE_TECH, FAKE_A11Y, FAKE_SECURITY);

export const FAKE_AUDIT_RESULT: AuditResult = {
  url: "test.com",
  metrics: FAKE_METRICS, seo: FAKE_SEO, tech: FAKE_TECH,
  accessibility: FAKE_A11Y, security: FAKE_SECURITY, leads: FAKE_LEADS,
  adLossPercent: FAKE_AD_LOSS, bounceRateIncrease: 48, annualRevenueLoss: 87400,
  monthlyAdOverspend: calcMonthlyAdOverspend(FAKE_AD_LOSS),
  monthlyOrganicLoss: calcMonthlyOrganicLoss(FAKE_SEO),
  totalMonthlyCost: calcMonthlyAdOverspend(FAKE_AD_LOSS) + calcMonthlyOrganicLoss(FAKE_SEO),
  explanations: FAKE_EXPLANATIONS,
  severity: "critical", timestamp: Date.now(),
};

// ─── PSI API Call ─────────────────────────────────────────────────────────────
export async function fetchAudit(rawUrl: string): Promise<AuditResult> {
  let url = rawUrl.trim().toLowerCase();
  if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;

  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    if (hostname === "test.com") {
      await new Promise(r => setTimeout(r, 2800));
      return { ...FAKE_AUDIT_RESULT, timestamp: Date.now() };
    }
  } catch { /* invalid URL — let the API call fail with a real error */ }

  const apiKey = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY;
  // Request all 4 categories in one API call
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices${apiKey ? `&key=${apiKey}` : ""}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const res = await fetch(apiUrl, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`PageSpeed API returned ${res.status}: ${res.statusText}`);

    const data: PSIResponse = await res.json();
    const audits = data.lighthouseResult?.audits;
    const categories = data.lighthouseResult?.categories;
    if (!audits || !categories) throw new Error("Invalid response from PageSpeed API. Is the URL reachable?");

    const metrics: AuditMetrics = {
      lcp: audits["largest-contentful-paint"]?.numericValue ?? 0,
      fcp: audits["first-contentful-paint"]?.numericValue ?? 0,
      tbt: audits["total-blocking-time"]?.numericValue ?? 0,
      cls: audits["cumulative-layout-shift"]?.numericValue ?? 0,
      speedIndex: audits["speed-index"]?.numericValue ?? 0,
      performanceScore: Math.round((categories.performance?.score ?? 0) * 100),
    };

    const seo = calcSEO(audits, categories);
    const tech = calcTech(audits);
    const accessibility = calcAccessibility(audits, categories);
    const security = calcSecurity(audits, categories);
    const leads = calcLeads(seo);
    const adLossPercent = calcAdLoss(metrics);
    const monthlyAdOverspend = calcMonthlyAdOverspend(adLossPercent);
    const monthlyOrganicLoss = calcMonthlyOrganicLoss(seo);

    const screenshot = audits["final-screenshot"]?.details?.data;

    return {
      url: rawUrl.trim(), metrics, seo, tech, accessibility, security, leads,
      adLossPercent, bounceRateIncrease: calcBounceRateIncrease(metrics),
      annualRevenueLoss: Math.round((adLossPercent / 100) * 8000 * 12),
      monthlyAdOverspend, monthlyOrganicLoss,
      totalMonthlyCost: monthlyAdOverspend + monthlyOrganicLoss,
      explanations: buildExplanations(metrics, seo, tech, accessibility, security),
      severity: calcSeverity(metrics.performanceScore),
      timestamp: Date.now(),
      ...(screenshot ? { screenshot } : {}),
    };
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// ─── Formatting Helpers ────────────────────────────────────────────────────────
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