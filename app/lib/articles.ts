export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  isoDate: string;
  readTime: string;
  category: string;
  categoryColor: string;
  keywords: string[];
}

export interface Article extends ArticleMeta {
  html: string;
}

const ARTICLES: Article[] = [
  {
    slug: "slow-website-google-ads-cost",
    title: "How a Slow Website Is Inflating Your Google Ads Costs",
    description: "Most business owners running Google Ads don't know that page speed directly affects how much they pay per click. Here's the mechanism — and how to fix it.",
    date: "March 2026",
    isoDate: "2026-03-01",
    readTime: "4 min read",
    category: "Performance",
    categoryColor: "#e8341a",
    keywords: ["slow website google ads", "website quality score", "core web vitals ad spend", "page speed google ads cost", "website performance revenue"],
    html: `
<h2>Why Google Rewards Faster Sites in the Ad Auction</h2>
<p>When you run Google Ads, you're entering an auction with every search query. The winning bid isn't just about money — Google calculates a <strong>Quality Score</strong> (1–10) for every ad, and that score multiplies your bid to determine your actual placement and cost. One of its core components is <em>Expected Landing Page Experience</em>, which includes page speed as a direct input.</p>
<p>A site loading in 1.5 seconds and one loading in 5 seconds can bid the same amount — but the faster site pays significantly less per placement. The slower site is penalised, meaning you either pay more per click or receive fewer impressions for the same budget.</p>

<h2>The Three Speed Metrics Google Measures</h2>
<ul>
  <li><strong>Largest Contentful Paint (LCP)</strong> — how fast the main content loads. Google's threshold is under 2.5 seconds.</li>
  <li><strong>Total Blocking Time (TBT)</strong> — how long JavaScript is blocking interactivity. Every third-party script adds to this.</li>
  <li><strong>Cumulative Layout Shift (CLS)</strong> — whether elements jump around as the page loads. High CLS signals an unstable page.</li>
</ul>
<p>These three metrics combine into a Performance Score (0–100). Below 50 is considered poor. Below 70 means you're paying a meaningful penalty in the ad auction every day.</p>

<h2>What the Numbers Look Like in Practice</h2>
<p>A site scoring 45/100 on performance typically pays 40–90% more per click than a comparable site scoring above 80. For a business spending £2,000/month on Google Ads, that's £800–£1,800 in avoidable spend every single month.</p>
<p>The problem is invisible inside the Google Ads dashboard — it only shows your average CPC rising gradually as competitors improve their sites. The gap compounds over time.</p>

<h2>The Four Most Common Causes</h2>
<ul>
  <li><strong>Unoptimised images</strong> — large JPEGs not converted to WebP or AVIF account for the majority of LCP failures.</li>
  <li><strong>Too many third-party scripts</strong> — chat widgets, analytics pixels, and ad tags compete for main thread time.</li>
  <li><strong>No CDN</strong> — serving assets from a single server increases latency for every visitor outside your region.</li>
  <li><strong>No browser caching</strong> — returning visitors re-download assets on every page load.</li>
</ul>

<h2>How Much Is It Costing You Right Now?</h2>
<p>The fastest way to find out is a free performance audit. You'll see your current score, which Core Web Vitals are failing, and a monthly estimate of the ad spend those failures are generating. Most fixes take a developer a day or two — and the return shows up in the first month's ad bill.</p>
    `,
  },

  {
    slug: "ada-website-compliance-small-business",
    title: "ADA Website Compliance for Small Businesses: What You Need to Know",
    description: "Website accessibility lawsuits against small businesses are rising sharply. Here's what ADA compliance means for your site, what's at risk, and how to check your exposure.",
    date: "March 2026",
    isoDate: "2026-03-03",
    readTime: "5 min read",
    category: "Accessibility",
    categoryColor: "#a78bfa",
    keywords: ["ada website compliance small business", "website accessibility lawsuit", "wcag checklist", "ada compliance checker", "website accessibility requirements"],
    html: `
<h2>Why Small Businesses Are the Main Target</h2>
<p>Over 4,000 ADA-related website lawsuits are filed in the United States every year — and the majority target small and mid-size businesses, not large corporations. Smaller businesses are less likely to have legal teams monitoring compliance, making them easier targets for demand letters and quick settlements.</p>
<p>Courts have consistently ruled that websites fall under Title III of the Americans with Disabilities Act. If your site isn't accessible to users who rely on screen readers, keyboard navigation, or visual aids, you're exposed to legal risk.</p>

<h2>What "Accessible" Actually Means</h2>
<p>Web accessibility follows <strong>WCAG 2.1 Level AA</strong> — the standard courts apply in ADA cases. It breaks into four areas:</p>
<ul>
  <li><strong>Perceivable</strong> — images have alt text, text has sufficient colour contrast, videos have captions.</li>
  <li><strong>Operable</strong> — the site works without a mouse. Full keyboard navigation is required.</li>
  <li><strong>Understandable</strong> — form fields have labels, error messages are descriptive.</li>
  <li><strong>Robust</strong> — the site works with screen readers like JAWS and VoiceOver.</li>
</ul>
<p>Most small business websites fail on contrast ratios and missing form labels — two of the most common issues cited in demand letters, and among the cheapest to fix.</p>

<h2>What Happens When You Receive a Demand Letter</h2>
<p>A typical ADA demand letter requests a settlement of $5,000–$20,000 plus a commitment to fix the issues within 90 days. Most businesses settle because litigation costs more. Cases that go to trial have resulted in significantly higher awards.</p>
<p>The irony: fixing the issues usually takes a developer one or two days. The expensive part is finding out from a lawyer rather than an audit.</p>

<h2>Industries at Highest Risk</h2>
<ul>
  <li>E-commerce stores and retail</li>
  <li>Restaurants with online menus or bookings</li>
  <li>Healthcare practices and appointment scheduling</li>
  <li>Hotels and accommodation</li>
  <li>Financial services and insurance</li>
</ul>

<h2>How to Check Your Current Risk Level</h2>
<p>An automated accessibility audit surfaces the most common WCAG failures in under a minute — alt text gaps, contrast failures, missing form labels, and absent ARIA roles. Running a free audit shows your current ADA risk level alongside the specific issues that need fixing — before someone else finds them for you.</p>
    `,
  },

  {
    slug: "website-visibility-ai-search-chatgpt",
    title: "Is Your Website Invisible to ChatGPT? How AI Search Is Changing Everything",
    description: "ChatGPT, Perplexity, and Gemini answer questions directly — and they cite specific websites. Here's what makes a site get referenced, and what keeps it invisible.",
    date: "March 2026",
    isoDate: "2026-03-05",
    readTime: "4 min read",
    category: "AI Visibility",
    categoryColor: "#10b981",
    keywords: ["website visible chatgpt", "generative engine optimization", "ai search seo", "perplexity seo", "geo optimization website", "chatgpt website citation"],
    html: `
<h2>The Search Shift That's Already Happening</h2>
<p>When someone asks ChatGPT "what's the best project management tool for small teams?" or Perplexity "who are the leading web design agencies in London?", they get a direct answer with citations — not ten blue links. The businesses cited in those answers get the traffic. Everyone else is invisible to that channel entirely.</p>
<p>This is Generative Engine Optimisation (GEO) — the discipline of making your website readable and citable by AI systems. It's early enough that most businesses haven't heard of it, but late enough that it already affects how businesses get discovered.</p>

<h2>How AI Models Decide What to Reference</h2>
<ul>
  <li><strong>Schema markup (JSON-LD)</strong> — tells AI systems exactly what your page is about, who you are, and what you offer. Without it, the model has to guess — and often skips pages it can't clearly categorise.</li>
  <li><strong>Statistical and factual content</strong> — AI systems prefer citing pages with specific numbers and verifiable claims. Vague marketing copy rarely gets referenced.</li>
  <li><strong>Question-format headings</strong> — H2s written as questions ("How much does X cost?") directly match how people query AI systems.</li>
  <li><strong>Structured content hierarchy</strong> — clear H1 → H2 → H3, lists, and tables are easier for models to parse accurately.</li>
</ul>

<h2>Why Most Business Sites Score Poorly</h2>
<p>Most small business websites were built for visual appeal — hero image, tagline, three benefit sections, contact form. That format is nearly invisible to AI systems looking for structured, factual, citable content. The good news: the same changes that improve AI citability also improve traditional SEO. Schema markup helps Google too.</p>

<h2>Four Changes You Can Make This Week</h2>
<ul>
  <li><strong>Add JSON-LD Organisation schema</strong> — your name, URL, description, contact details. 10 minutes, invisible to visitors, immediately readable by AI.</li>
  <li><strong>Rewrite 2–3 headings as questions</strong> — identify your most common customer questions and reformat a heading accordingly.</li>
  <li><strong>Add specific data points</strong> — "founded in X", "Y clients served", "average result of Z%" — concrete facts AI models can cite confidently.</li>
  <li><strong>Add an FAQ section</strong> — explicit Q&A structure is one of the highest-performing formats for both AI citation and Google featured snippets.</li>
</ul>

<h2>Measuring Where You Stand</h2>
<p>Most website audit tools don't measure AI citation readiness yet. A 5-pillar audit that includes GEO signals will show your current readiness score, which structural signals are missing, and which fixes have the highest impact.</p>
    `,
  },

  {
    slug: "core-web-vitals-explained-business",
    title: "Core Web Vitals Explained: What LCP, CLS and TBT Mean for Your Revenue",
    description: "Google's Core Web Vitals are more than a developer concern — they directly affect your search rankings and ad costs. Here's what each metric measures and why it matters.",
    date: "March 2026",
    isoDate: "2026-03-07",
    readTime: "5 min read",
    category: "Performance",
    categoryColor: "#e8341a",
    keywords: ["core web vitals explained", "lcp cls tbt business", "core web vitals revenue", "page speed revenue impact", "website performance score"],
    html: `
<h2>What Core Web Vitals Actually Are</h2>
<p>Core Web Vitals are three specific measurements Google uses to capture the real-world experience of loading and using a webpage. Unlike older metrics (like total page load time), they measure what visitors actually perceive — the speed of your main content appearing, how responsive the page feels, and whether the layout shifts unexpectedly.</p>
<p>Since 2021, they've been official Google ranking signals. Since 2022, they've been factored into Google's ad Quality Score. They're a direct lever on your search visibility and ad costs.</p>

<h2>The Three Metrics Explained</h2>
<h3>Largest Contentful Paint (LCP)</h3>
<p>LCP measures how long until the largest visible element on the page — usually your hero image or main heading — fully loads. Google's threshold is <strong>under 2.5 seconds</strong>. Above 4 seconds is rated poor. The most common causes: unoptimised images and slow server response times.</p>

<h3>Total Blocking Time (TBT)</h3>
<p>TBT measures the total time the browser is blocked by JavaScript during page load — the window when the page looks loaded but doesn't respond to clicks. <strong>Under 200ms</strong> is good. Third-party scripts are the primary culprit: analytics tags, chat widgets, and ad pixels all compete for main thread time.</p>

<h3>Cumulative Layout Shift (CLS)</h3>
<p>CLS measures visual instability — how much elements move around as the page loads. <strong>Under 0.1</strong> is good. CLS is most damaging on mobile, where a layout shift can cause a visitor to tap the wrong element. It's also frequently cited in accessibility audits.</p>

<h2>The Direct Revenue Connection</h2>
<p>Google's research shows that as page load time increases from 1 to 3 seconds, the probability of a visitor leaving before interacting increases by 32%. At 5 seconds, it reaches 90%. Every percentage point of visitors who leave before the page loads is lost revenue — leads that never filled your form, products never added to a basket.</p>
<p>For businesses running Google Ads: poor Core Web Vitals reduce your Quality Score, meaning you pay more per click than a competitor with a faster site bidding the same amount.</p>

<h2>How to Find Your Scores</h2>
<p>Google's PageSpeed Insights will show your scores for any URL. A score of 90+ is good, 50–89 needs improvement, and below 50 is considered poor. A full 5-pillar audit combines your scores with a monthly ad spend overspend estimate — useful for prioritising the work with your developer or agency.</p>
    `,
  },

  {
    slug: "website-audit-checklist-2026",
    title: "The 2026 Website Audit Checklist: 5 Areas Every Business Must Review",
    description: "A practical website audit covers more than just speed. Here's the complete 5-pillar framework used by performance agencies — and how to run it free on your own site.",
    date: "March 2026",
    isoDate: "2026-03-09",
    readTime: "6 min read",
    category: "SEO",
    categoryColor: "#f59e0b",
    keywords: ["website audit checklist 2026", "website audit free", "5 pillar website audit", "website performance checklist", "seo audit checklist", "website revenue audit"],
    html: `
<h2>Why Websites Need Regular Audits</h2>
<p>Most business websites are audited at launch and then left alone for years. But websites exist in a changing environment: Google's algorithms update, accessibility standards evolve, JavaScript vulnerabilities emerge, and new channels like AI search create entirely new requirements. An annual 5-pillar audit is the minimum cadence for any site generating business.</p>

<h2>Pillar 1: Performance</h2>
<p>Performance is measured through Google's Core Web Vitals — LCP, TBT, and CLS — summarised as a score out of 100. This affects your Google organic rankings and your Google Ads cost per click.</p>
<p><strong>What to check:</strong> LCP under 2.5s, TBT under 200ms, CLS under 0.1. Any score below 80 warrants investigation, especially for ad landing pages.</p>

<h2>Pillar 2: SEO</h2>
<p>SEO in an audit context means technical foundations — whether Google can find, crawl, and rank your pages correctly. The checklist:</p>
<ul>
  <li>Unique title tag and meta description on every indexed page</li>
  <li>Open Graph tags for social sharing previews</li>
  <li>Mobile-responsive design</li>
  <li>Sitemap submitted to Google Search Console</li>
  <li>Robots.txt not blocking key pages</li>
  <li>Structured data (JSON-LD) on service and product pages</li>
</ul>

<h2>Pillar 3: Accessibility</h2>
<p>Accessibility covers legal risk (ADA/WCAG 2.1 AA) and the experience of the 15–20% of users with some form of disability. Issues most commonly cited in demand letters:</p>
<ul>
  <li>Images missing alt text</li>
  <li>Form fields without labels</li>
  <li>Colour contrast below 4.5:1 for body text</li>
  <li>Interactive elements unreachable by keyboard</li>
</ul>

<h2>Pillar 4: Security</h2>
<p>Most website security issues aren't sophisticated attacks — they're outdated JavaScript libraries and missing HTTP headers any attacker can check in seconds:</p>
<ul>
  <li>JavaScript dependencies up to date (no known CVEs)</li>
  <li>HTTPS with no mixed-content warnings</li>
  <li>Security headers: Content-Security-Policy, HSTS, X-Frame-Options</li>
</ul>

<h2>Pillar 5: AI Search Visibility</h2>
<p>As AI-powered search (ChatGPT, Perplexity, Google AI Overviews) becomes a meaningful discovery channel, structured sites gain a growing advantage:</p>
<ul>
  <li>JSON-LD Organisation schema with name, URL, and contact details</li>
  <li>Factual, statistical content — not just marketing copy</li>
  <li>At least 2–3 headings written as direct questions</li>
  <li>FAQ section on key landing pages</li>
</ul>

<h2>How to Run the Audit</h2>
<p>You can check each pillar manually using free tools, or run an automated 5-pillar audit that checks all of them simultaneously and outputs a prioritised fix list with revenue impact estimates — significantly faster than the manual approach.</p>
    `,
  },

  {
    slug: "reduce-google-ads-cost-per-click",
    title: "How to Reduce Your Google Ads Cost Per Click Without Spending More",
    description: "Most businesses try to lower CPCs by adjusting bids. The more effective lever is your landing page quality score — here's exactly how to move it.",
    date: "March 2026",
    isoDate: "2026-03-11",
    readTime: "5 min read",
    category: "Performance",
    categoryColor: "#e8341a",
    keywords: ["reduce google ads cost per click", "lower cpc google ads", "quality score website", "google ads landing page", "ad spend optimisation"],
    html: `
<h2>Why Bid Adjustments Have a Ceiling</h2>
<p>Most businesses attacking high CPCs focus on bidding strategy — manual bids, target CPA, portfolio strategies. These all help at the margins, but they compete against other advertisers doing the same thing. The real leverage is in your Quality Score, specifically the landing page component that most advertisers ignore.</p>
<p>Google's Quality Score is a 1–10 rating that multiplies your bid to determine your ad rank. A Quality Score of 8 with a £1 bid outranks a Quality Score of 4 with a £1.80 bid — and pays less. The landing page experience component accounts for roughly a third of that score.</p>

<h2>The Three Landing Page Signals Google Measures</h2>
<ul>
  <li><strong>Page speed</strong> — Google measures your Core Web Vitals (LCP, TBT, CLS) on the actual landing page your ad points to. A slow page directly reduces your Quality Score.</li>
  <li><strong>Mobile experience</strong> — since most searches happen on mobile, a poor mobile experience is heavily penalised. Pinch-to-zoom layouts, tiny tap targets, and horizontal scrolling all hurt.</li>
  <li><strong>Relevance</strong> — Google's crawlers check whether the landing page content matches the ad's promise and keywords. Bait-and-switch pages (ad promises X, page delivers Y) get penalised quickly.</li>
</ul>

<h2>What Moving from 45 to 80 Actually Saves</h2>
<p>A Quality Score improvement from 4 to 8 on a keyword with a £2 average CPC can reduce your effective cost to around £1.10–£1.30 — roughly a 35–45% saving with no change to your bid. For a campaign spending £3,000/month, that's £1,000–£1,350 back per month from a one-time technical fix.</p>

<h2>The Fastest Wins on Landing Page Speed</h2>
<ul>
  <li><strong>Convert hero images to WebP</strong> — the single highest-impact change for most sites. LCP drops dramatically with properly compressed, modern format images.</li>
  <li><strong>Defer non-critical JavaScript</strong> — chat widgets, analytics, and social pixels don't need to load before the page is interactive. Add <code>defer</code> or load them after user interaction.</li>
  <li><strong>Remove unused CSS</strong> — large CSS files loaded upfront block rendering. Tools like PurgeCSS can eliminate unused styles automatically.</li>
  <li><strong>Preconnect to external domains</strong> — adding preconnect hints for Google Fonts, CDNs, and API domains reduces DNS lookup time.</li>
</ul>

<h2>How to Measure the Before and After</h2>
<p>Run a free audit on your landing page URL before making any changes. Note your current performance score and estimated ad overspend. After implementing the fixes, run it again — the difference in the monthly estimate is your projected monthly saving from the work.</p>
    `,
  },

  {
    slug: "website-security-headers-guide",
    title: "Website Security Headers: What They Are and Why You Probably Don't Have Them",
    description: "Security headers are invisible to visitors but critical for protection. Here's what each one does, which ones every business website needs, and how to check yours.",
    date: "March 2026",
    isoDate: "2026-03-13",
    readTime: "5 min read",
    category: "Security",
    categoryColor: "#22d3ee",
    keywords: ["website security headers", "content security policy", "hsts website", "security headers guide", "website security checklist"],
    html: `
<h2>What Security Headers Actually Do</h2>
<p>When your web server sends a page to a browser, it includes HTTP response headers — instructions that tell the browser how to handle the page. Security headers are a specific set of these instructions that protect visitors from common attacks: clickjacking, cross-site scripting (XSS), protocol downgrade attacks, and more.</p>
<p>They're invisible to visitors and take no more than 30 minutes for a developer to implement — but the majority of small business websites are missing most or all of them. Attackers check for missing headers as standard reconnaissance before attempting other exploits.</p>

<h2>The Six Headers Every Business Website Should Have</h2>
<h3>Content-Security-Policy (CSP)</h3>
<p>Tells browsers which sources of scripts, styles, images, and other content are allowed to load on your pages. Blocks cross-site scripting (XSS) attacks where malicious code is injected into your pages through third-party content.</p>

<h3>Strict-Transport-Security (HSTS)</h3>
<p>Instructs browsers to always connect to your site over HTTPS, even if someone types <code>http://</code>. Prevents protocol downgrade attacks where a connection is intercepted and downgraded to unencrypted HTTP.</p>

<h3>X-Frame-Options</h3>
<p>Prevents your site from being embedded inside an iframe on another website — a technique used in clickjacking attacks, where visitors think they're interacting with your site but are actually clicking on invisible overlaid elements.</p>

<h3>X-Content-Type-Options</h3>
<p>Stops browsers from guessing (MIME sniffing) what type of content a file is. Prevents attacks where a malicious file is disguised as a benign one.</p>

<h3>Referrer-Policy</h3>
<p>Controls what URL information is sent to other sites when visitors follow links from your pages. Prevents leaking sensitive URL parameters (like session tokens or user IDs) to third parties.</p>

<h3>Permissions-Policy</h3>
<p>Controls which browser features your site can access — camera, microphone, geolocation. Prevents third-party scripts embedded on your site from accessing these without your knowledge.</p>

<h2>How to Check Which Headers You Have</h2>
<p>Visit <strong>securityheaders.com</strong> and enter your URL for a free header scan. It'll grade you A–F and show exactly which headers are missing. A full website audit will also surface missing security headers alongside your performance, SEO, and accessibility issues in a single report.</p>

<h2>How to Add Them</h2>
<p>Security headers are added at the server or CDN layer — in your Nginx or Apache configuration, your Vercel/Netlify configuration file, or your CDN's header rules. A developer familiar with your hosting setup can add all six headers in under an hour. Once set, they apply to every page automatically.</p>
    `,
  },

  {
    slug: "website-speed-optimisation-guide",
    title: "Website Speed Optimisation: A Plain-English Guide for Business Owners",
    description: "Your website speed affects your rankings, your ad costs, and your conversion rate. Here's what actually slows sites down — and what fixes make the biggest difference.",
    date: "March 2026",
    isoDate: "2026-03-15",
    readTime: "6 min read",
    category: "Performance",
    categoryColor: "#e8341a",
    keywords: ["website speed optimisation", "how to speed up website", "website slow fix", "improve website performance", "page speed optimisation"],
    html: `
<h2>Why Website Speed Matters More Than Ever</h2>
<p>In 2026, page speed affects four things simultaneously: your Google organic rankings (Core Web Vitals are a ranking signal), your Google Ads cost per click (Quality Score), your conversion rate (slow sites have higher bounce rates), and your AI search visibility (faster, well-structured sites are cited more often).</p>
<p>The average small business website loads in 6–8 seconds on mobile. The threshold where Google starts penalising is 2.5 seconds for your main content. There's nearly always a significant gap to close.</p>

<h2>What Actually Makes Websites Slow</h2>
<h3>Images — the biggest culprit</h3>
<p>Unoptimised images account for 60–70% of the total page weight on most small business websites. A hero image saved as a 3MB JPEG when it should be a 180KB WebP is the single most common speed problem — and the single biggest opportunity for improvement.</p>
<p>The fix: convert images to WebP or AVIF format, compress them appropriately, and add explicit width/height attributes so the browser reserves space while they load (preventing layout shift).</p>

<h3>JavaScript — the second biggest issue</h3>
<p>Every script you add to a page adds to the time before a visitor can interact with it. The usual suspects: Google Tag Manager loading 8 different marketing pixels, a chat widget that loads on every page even if no one ever uses it, a social proof plugin, a cookie consent manager, and a heatmap tool — all loading simultaneously before the page responds to a tap.</p>
<p>The fix: audit which scripts are actually used, load non-critical ones after interaction, and set them to defer or async.</p>

<h3>Fonts</h3>
<p>Custom fonts from Google Fonts or Adobe Fonts block rendering until downloaded. The fix: preconnect to the font domain in your HTML head, use font-display: swap so text shows immediately in a system font while the custom font loads, and only load the specific font weights you actually use.</p>

<h3>Hosting and server response time</h3>
<p>A slow server (Time to First Byte above 600ms) adds a baseline delay to everything else. Shared hosting is common culprit. Moving to a CDN-backed hosting solution or a faster tier often has the second-highest impact after image optimisation.</p>

<h2>The Fixes in Order of Impact</h2>
<ol>
  <li>Compress and convert images to WebP</li>
  <li>Add lazy loading to below-the-fold images</li>
  <li>Defer non-critical JavaScript</li>
  <li>Preconnect to external domains (fonts, analytics, CDNs)</li>
  <li>Enable browser caching headers</li>
  <li>Consider upgrading hosting or adding a CDN</li>
</ol>

<h2>How to Measure Your Starting Point</h2>
<p>Run a free performance audit on your site to see your current Core Web Vitals scores (LCP, TBT, CLS) and a breakdown of what's causing each issue. The report will show which fixes are available and their estimated impact — useful for briefing a developer or prioritising your own time.</p>
    `,
  },

  {
    slug: "get-business-in-google-ai-overviews",
    title: "How to Get Your Business Featured in Google's AI Overviews",
    description: "Google's AI Overviews now appear above organic results for millions of queries. Here's what determines which businesses get cited — and how to improve your chances.",
    date: "March 2026",
    isoDate: "2026-03-17",
    readTime: "4 min read",
    category: "AI Visibility",
    categoryColor: "#10b981",
    keywords: ["google ai overviews", "ai overviews seo", "get featured ai overview", "google sgе optimization", "ai search visibility 2026"],
    html: `
<h2>What Google AI Overviews Are</h2>
<p>Google's AI Overviews (formerly Search Generative Experience) appear at the top of search results for a growing range of queries — particularly informational and comparative searches. Instead of showing ten links, Google generates a direct answer and cites 3–5 sources. Those cited sources get a significant visibility advantage.</p>
<p>In 2026, AI Overviews now appear in a meaningful percentage of searches globally. For businesses in service industries, healthcare, finance, and technology, many of your most valuable query types are already generating AI Overviews rather than traditional organic results.</p>

<h2>What Determines Who Gets Cited</h2>
<p>Google's AI overview citations aren't random — they follow identifiable patterns:</p>
<ul>
  <li><strong>Structured data</strong> — pages with complete JSON-LD schema markup are significantly more likely to be cited. Google's systems can more easily understand and verify what the page is about.</li>
  <li><strong>Direct, factual answers</strong> — pages that answer the query in the first 100 words, before adding context, perform better. "How much does X cost? The typical range is Y–Z" outperforms pages that build to the answer slowly.</li>
  <li><strong>Authoritativeness signals</strong> — cited pages tend to have clear author information, organisational credentials, and supporting evidence. Pages that look like they know what they're talking about.</li>
  <li><strong>Content freshness</strong> — AI Overviews favour recently updated content. Old pages with outdated information are cited less frequently.</li>
</ul>

<h2>The Content Structure That Gets Cited</h2>
<p>Based on analysis of AI Overview citations, the highest-performing content structure is:</p>
<ul>
  <li>A direct answer to the query within the first paragraph</li>
  <li>H2 or H3 headings written as questions, each followed by a specific answer</li>
  <li>At least one statistic or data point per section</li>
  <li>A clear FAQ section at the end of the page</li>
  <li>JSON-LD FAQ schema marking up the Q&A structure</li>
</ul>

<h2>Technical Requirements That Matter</h2>
<p>Beyond content, technical factors affect AI Overview inclusion:</p>
<ul>
  <li>Page must be indexable (not blocked by robots.txt, not noindexed)</li>
  <li>HTTPS required</li>
  <li>Core Web Vitals in "good" range — very slow pages are excluded more often</li>
  <li>Mobile-friendly layout</li>
</ul>

<h2>How to Audit Your Current AI Visibility</h2>
<p>A 5-pillar website audit that includes AI visibility signals will show your current GEO score, which specific signals are missing (schema, content structure, question headings), and what changes are likely to have the most impact. Most businesses can meaningfully improve their AI citation readiness within a week of targeted fixes.</p>
    `,
  },

  {
    slug: "what-is-structured-data-website",
    title: "What Is Structured Data and Why Does Your Website Need It?",
    description: "Structured data (JSON-LD) helps Google and AI systems understand what your website is about. Here's what it is, what it does, and how to add it without a developer.",
    date: "March 2026",
    isoDate: "2026-03-19",
    readTime: "5 min read",
    category: "SEO",
    categoryColor: "#f59e0b",
    keywords: ["structured data website", "json ld schema", "schema markup guide", "what is structured data", "schema.org for business"],
    html: `
<h2>What Structured Data Actually Is</h2>
<p>Structured data is a standardised way of providing explicit information about your webpage to search engines and AI systems — information that isn't visible to visitors but is read by machines. The most common format is <strong>JSON-LD</strong> (JavaScript Object Notation for Linked Data), a small block of code added to your page's HTML that describes its content in a structured way.</p>
<p>Think of it as a label on a box. The box (your webpage) might contain useful things, but without a label, a machine has to open it and guess what's inside. Structured data is the label.</p>

<h2>What Structured Data Enables</h2>
<h3>Google Rich Results</h3>
<p>Pages with structured data become eligible for rich results in Google Search — star ratings, FAQ dropdowns, product information, event dates, and more appearing directly in the search result. These results have significantly higher click-through rates than standard blue links.</p>

<h3>AI System Citations</h3>
<p>ChatGPT, Perplexity, and Google's AI Overviews all use structured data signals to identify and categorise content. Pages with Organisation, Service, Product, or FAQ schema are more reliably cited by AI systems than pages without it — because the AI can read the label rather than having to guess.</p>

<h3>Knowledge Panel Information</h3>
<p>When someone searches your business name, the information panel on the right side of Google's results draws heavily from structured data. Business name, logo, website, social profiles, and description all flow from Organisation schema when implemented correctly.</p>

<h2>The Most Valuable Schema Types for Small Businesses</h2>
<ul>
  <li><strong>Organization</strong> — your business name, URL, logo, contact info, social profiles. Should be on every page.</li>
  <li><strong>LocalBusiness</strong> — for businesses with a physical location: address, opening hours, geo coordinates.</li>
  <li><strong>Service</strong> — describes your service offerings, pricing, and target audience.</li>
  <li><strong>FAQ</strong> — marks up question and answer content for both rich results and AI citation.</li>
  <li><strong>BreadcrumbList</strong> — helps search engines understand your site structure.</li>
</ul>

<h2>How to Add JSON-LD Without a Developer</h2>
<p>JSON-LD is added inside a <code>&lt;script type="application/ld+json"&gt;</code> tag in your page's HTML. Most CMS platforms (WordPress, Squarespace, Wix) have plugins or settings that add basic schema automatically. For custom-built sites, it's a one-time task for a developer.</p>
<p>Google's Rich Results Test (search.google.com/test/rich-results) lets you check any URL to see what structured data it currently has and whether it's valid. Running a free website audit will also surface missing schema as part of the AI visibility and SEO sections.</p>
    `,
  },
];

export const articleList: ArticleMeta[] = ARTICLES.map(({ html: _html, ...meta }) => meta);

export function getArticle(slug: string): Article | null {
  return ARTICLES.find(a => a.slug === slug) ?? null;
}
